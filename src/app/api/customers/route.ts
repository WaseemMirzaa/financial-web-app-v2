import { NextRequest } from 'next/server';
import pool from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { successResponse, errorResponse, validationError, isValidEmail, serverError } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    let rows: any[];
    try {
      [rows] = await pool.query(
        `SELECT u.*, 
          ut_en.name as name_en,
          ut_ar.name as name_ar,
          c.phone,
          c.address,
          c.assigned_employee_id,
          c.customer_id_number,
          c.nationality,
          c.system_entry_date
        FROM users u
        INNER JOIN customers c ON u.id = c.id
        LEFT JOIN user_translations ut_en ON u.id = ut_en.user_id AND ut_en.locale = 'en'
        LEFT JOIN user_translations ut_ar ON u.id = ut_ar.user_id AND ut_ar.locale = 'ar'
        WHERE u.role = 'customer' AND (u.is_deleted = FALSE OR u.is_deleted IS NULL)
        ORDER BY u.created_at DESC`
      ) as any[];
    } catch (e: any) {
      if (e?.code === 'ER_BAD_FIELD_ERROR' && e?.message?.includes('is_deleted')) {
        [rows] = await pool.query(
          `SELECT u.*, 
            ut_en.name as name_en,
            ut_ar.name as name_ar,
            c.phone,
            c.address,
            c.assigned_employee_id,
            c.customer_id_number,
            c.nationality,
            c.system_entry_date
          FROM users u
          INNER JOIN customers c ON u.id = c.id
          LEFT JOIN user_translations ut_en ON u.id = ut_en.user_id AND ut_en.locale = 'en'
          LEFT JOIN user_translations ut_ar ON u.id = ut_ar.user_id AND ut_ar.locale = 'ar'
          WHERE u.role = 'customer' AND u.is_active = TRUE
          ORDER BY u.created_at DESC`
        ) as any[];
      } else if (e?.code === 'ER_BAD_FIELD_ERROR') {
        [rows] = await pool.query(
          `SELECT u.*, 
            ut_en.name as name_en,
            ut_ar.name as name_ar,
            c.phone,
            c.address,
            c.assigned_employee_id
          FROM users u
          INNER JOIN customers c ON u.id = c.id
          LEFT JOIN user_translations ut_en ON u.id = ut_en.user_id AND ut_en.locale = 'en'
          LEFT JOIN user_translations ut_ar ON u.id = ut_ar.user_id AND ut_ar.locale = 'ar'
          WHERE u.role = 'customer' AND (u.is_deleted = FALSE OR u.is_deleted IS NULL)
          ORDER BY u.created_at DESC`
        ) as any[];
      } else {
        throw e;
      }
    }
    const hasNewCustomerCols = rows?.length && (rows[0].customer_id_number !== undefined || rows[0].nationality !== undefined || rows[0].system_entry_date !== undefined);
    if (!hasNewCustomerCols && rows?.length) {
      rows.forEach((r: any) => {
        r.customer_id_number = null;
        r.nationality = null;
        r.system_entry_date = null;
      });
    }

    const customerIds = rows.map((r: any) => r.id);
    let assignmentsMap: Record<string, string[]> = {};
    if (customerIds.length > 0) {
      const placeholders = customerIds.map(() => '?').join(',');
      const [assignments] = await pool.query(
        `SELECT customer_id, employee_id FROM employee_customer_assignments WHERE customer_id IN (${placeholders})`,
        customerIds
      ) as any[];
      for (const a of assignments || []) {
        if (!assignmentsMap[a.customer_id]) assignmentsMap[a.customer_id] = [];
        assignmentsMap[a.customer_id].push(a.employee_id);
      }
    }

    const customers = rows.map((row: any) => {
      const assignedIds = assignmentsMap[row.id] || [];
      const out: any = {
        id: row.id,
        email: row.email,
        name: row.name_en || row.email,
        role: row.role,
        avatar: row.avatar,
        isActive: Boolean(row.is_active),
        createdAt: row.created_at,
        phone: row.phone,
        address: row.address,
        assignedEmployeeId: row.assigned_employee_id || (assignedIds[0] || ''),
        assignedEmployeeIds: assignedIds.length > 0 ? assignedIds : (row.assigned_employee_id ? [row.assigned_employee_id] : []),
      };
      if (row.customer_id_number !== undefined) out.customerIdNumber = row.customer_id_number ?? null;
      if (row.nationality !== undefined) out.nationality = row.nationality ?? null;
      if (row.system_entry_date !== undefined) out.systemEntryDate = row.system_entry_date ?? null;
      return out;
    });

    return successResponse(customers);
  } catch (error: any) {
    console.error('Get customers error:', error?.message || error);
    return serverError(error?.message || 'Failed to fetch customers');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, phone, address, customerIdNumber, nationality, systemEntryDate } = body;

    if (!name || !email || !password) {
      return errorResponse('Name, email, and password are required', 400, 'error.nameEmailPasswordRequired');
    }

    if (password.length < 6) {
      return errorResponse('Password must be at least 6 characters', 400, 'error.passwordMinLength');
    }

    // Check if email exists
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    ) as any[];

    if (existing.length > 0) {
      return errorResponse('Email already exists', 409, 'error.emailAlreadyExists');
    }

    const custIdNum = typeof customerIdNumber === 'string' ? customerIdNumber.trim() || null : null;
    if (custIdNum) {
      try {
        const [dup] = await pool.query(
          'SELECT id FROM customers WHERE customer_id_number = ?',
          [custIdNum]
        ) as any[];
        if (dup?.length > 0) {
          return errorResponse('Customer ID Number already exists', 409, 'error.customerIdNumberExists');
        }
      } catch (colErr: any) {
        if (colErr?.code === 'ER_BAD_FIELD_ERROR') {
          // column not yet migrated, skip uniqueness check
        } else {
          throw colErr;
        }
      }
    }

    const sysEntryDate = systemEntryDate || new Date().toISOString().slice(0, 10);

    const userId = `customer-${Date.now()}`;
    const passwordHash = await hashPassword(password);

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Create user (try with is_deleted for compatibility; fallback if column missing)
      try {
        await connection.query(
          `INSERT INTO users (id, email, password_hash, role, is_active, is_deleted) VALUES (?, ?, ?, 'customer', TRUE, FALSE)`,
          [userId, email, passwordHash]
        );
      } catch (colErr: any) {
        if (colErr?.code === 'ER_BAD_FIELD_ERROR' && colErr?.message?.includes('is_deleted')) {
          await connection.query(
            `INSERT INTO users (id, email, password_hash, role, is_active) VALUES (?, ?, ?, 'customer', TRUE)`,
            [userId, email, passwordHash]
          );
        } else {
          throw colErr;
        }
      }

      // Save name translations in same transaction (must use connection, not pool)
      await connection.query(
        `INSERT INTO user_translations (user_id, locale, name) VALUES (?, 'en', ?), (?, 'ar', ?)`,
        [userId, name, userId, name]
      );

      // Create customer (with new columns if migrated)
      try {
        await connection.query(
          `INSERT INTO customers (id, phone, address, assigned_employee_id, customer_id_number, nationality, system_entry_date) VALUES (?, ?, ?, NULL, ?, ?, ?)`,
          [userId, phone || null, address || null, custIdNum, nationality || null, sysEntryDate]
        );
      } catch (colErr: any) {
        if (colErr?.code === 'ER_BAD_FIELD_ERROR') {
          await connection.query(
            `INSERT INTO customers (id, phone, address, assigned_employee_id) VALUES (?, ?, ?, NULL)`,
            [userId, phone || null, address || null]
          );
        } else {
          throw colErr;
        }
      }

      await connection.commit();

      // Return created customer (include new fields if columns exist)
      let selectCols = 'c.phone, c.address, c.assigned_employee_id';
      try {
        const [probe] = await pool.query('SELECT customer_id_number FROM customers LIMIT 1') as any[];
        if (probe?.length) selectCols += ', c.customer_id_number, c.nationality, c.system_entry_date';
      } catch {
        // ignore
      }
      const [users] = await pool.query(
        `SELECT u.*, 
          ut_en.name as name_en,
          ut_ar.name as name_ar,
          ${selectCols}
        FROM users u
        INNER JOIN customers c ON u.id = c.id
        LEFT JOIN user_translations ut_en ON u.id = ut_en.user_id AND ut_en.locale = 'en'
        LEFT JOIN user_translations ut_ar ON u.id = ut_ar.user_id AND ut_ar.locale = 'ar'
        WHERE u.id = ?`,
        [userId]
      ) as any[];

      const customer = users[0];
      const customerData: any = {
        id: customer.id,
        email: customer.email,
        name: customer.name_en || customer.email,
        role: customer.role,
        avatar: customer.avatar,
        isActive: Boolean(customer.is_active),
        createdAt: customer.created_at,
        phone: customer.phone,
        address: customer.address,
        assignedEmployeeId: customer.assigned_employee_id || '',
      };
      if (customer.customer_id_number !== undefined) customerData.customerIdNumber = customer.customer_id_number ?? null;
      if (customer.nationality !== undefined) customerData.nationality = customer.nationality ?? null;
      if (customer.system_entry_date !== undefined) customerData.systemEntryDate = customer.system_entry_date ?? null;

      return successResponse(customerData, 'Customer created successfully', 'error.customerCreatedSuccessfully');
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('Create customer error:', error?.message || error);
    return serverError(error?.message || 'Failed to create customer');
  }
}
