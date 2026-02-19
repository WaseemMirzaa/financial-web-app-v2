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
          c.assigned_employee_id
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
            c.assigned_employee_id
          FROM users u
          INNER JOIN customers c ON u.id = c.id
          LEFT JOIN user_translations ut_en ON u.id = ut_en.user_id AND ut_en.locale = 'en'
          LEFT JOIN user_translations ut_ar ON u.id = ut_ar.user_id AND ut_ar.locale = 'ar'
          WHERE u.role = 'customer' AND u.is_active = TRUE
          ORDER BY u.created_at DESC`
        ) as any[];
      } else {
        throw e;
      }
    }

    const customers = rows.map((row: any) => ({
      id: row.id,
      email: row.email,
      name: row.name_en || row.email,
      role: row.role,
      avatar: row.avatar,
      isActive: Boolean(row.is_active),
      createdAt: row.created_at,
      phone: row.phone,
      address: row.address,
      assignedEmployeeId: row.assigned_employee_id || '',
    }));

    return successResponse(customers);
  } catch (error: any) {
    console.error('Get customers error:', error?.message || error);
    return serverError(error?.message || 'Failed to fetch customers');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, phone, address } = body;

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

    const userId = `customer-${Date.now()}`;
    const passwordHash = await hashPassword(password);

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Create user
      await connection.query(
        `INSERT INTO users (id, email, password_hash, role, is_active) VALUES (?, ?, ?, 'customer', TRUE)`,
        [userId, email, passwordHash]
      );

      // Save name translations in same transaction (must use connection, not pool)
      await connection.query(
        `INSERT INTO user_translations (user_id, locale, name) VALUES (?, 'en', ?), (?, 'ar', ?)`,
        [userId, name, userId, name]
      );

      // Create customer (assigned_employee_id NULL until assigned)
      await connection.query(
        `INSERT INTO customers (id, phone, address, assigned_employee_id) VALUES (?, ?, ?, NULL)`,
        [userId, phone || null, address || null]
      );

      await connection.commit();

      // Return created customer
      const [users] = await pool.query(
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
        WHERE u.id = ?`,
        [userId]
      ) as any[];

      const customer = users[0];
      const customerData = {
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

      return successResponse(customerData, 'Customer created successfully', 'error.customerCreatedSuccessfully');
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('Create customer error:', error);
    return serverError();
  }
}
