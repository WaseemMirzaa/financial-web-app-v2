import { NextRequest } from 'next/server';
import pool from '@/lib/db';
import { saveUserNameTranslations } from '@/lib/translations';
import { hashPassword } from '@/lib/auth';
import { successResponse, errorResponse, notFoundError, serverError } from '@/lib/api';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    let rows: any[];
    try {
      [rows] = await pool.query(
        `SELECT u.*, 
          ut_en.name as name_en,
          ut_ar.name as name_ar
        FROM users u
        INNER JOIN employees e ON u.id = e.id
        LEFT JOIN user_translations ut_en ON u.id = ut_en.user_id AND ut_en.locale = 'en'
        LEFT JOIN user_translations ut_ar ON u.id = ut_ar.user_id AND ut_ar.locale = 'ar'
        WHERE u.id = ? AND u.role = 'employee' AND (u.is_deleted = FALSE OR u.is_deleted IS NULL)`,
        [params.id]
      ) as any[];
    } catch (e: any) {
      if (e?.code === 'ER_BAD_FIELD_ERROR' && e?.message?.includes('is_deleted')) {
        [rows] = await pool.query(
          `SELECT u.*, 
            ut_en.name as name_en,
            ut_ar.name as name_ar
          FROM users u
          INNER JOIN employees e ON u.id = e.id
          LEFT JOIN user_translations ut_en ON u.id = ut_en.user_id AND ut_en.locale = 'en'
          LEFT JOIN user_translations ut_ar ON u.id = ut_ar.user_id AND ut_ar.locale = 'ar'
          WHERE u.id = ? AND u.role = 'employee'`,
          [params.id]
        ) as any[];
      } else {
        throw e;
      }
    }

    if (rows.length === 0) {
      return notFoundError('Employee');
    }

    // Get assigned customers
    const [assignments] = await pool.query(
      `SELECT customer_id FROM employee_customer_assignments WHERE employee_id = ?`,
      [params.id]
    ) as any[];

    const employee = rows[0];
    const employeeData = {
      id: employee.id,
      email: employee.email,
      name: employee.name_en || employee.email,
      role: employee.role,
      avatar: employee.avatar,
      isActive: employee.is_active,
      createdAt: employee.created_at,
      assignedCustomerIds: assignments.map((a: any) => a.customer_id),
    };

    return successResponse(employeeData);
  } catch (error: any) {
    console.error('Get employee error:', error);
    return serverError(error?.message);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, email, password, isActive } = body;

    // Check if employee exists
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE id = ? AND role = ?',
      [params.id, 'employee']
    ) as any[];

    if (existing.length === 0) {
      return notFoundError('Employee');
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Update user
      if (email) {
        await connection.query(
          'UPDATE users SET email = ? WHERE id = ?',
          [email, params.id]
        );
      }

      // Update password if provided (trim and require min length)
      const passwordStr = typeof password === 'string' ? password.trim() : '';
      if (passwordStr.length >= 6) {
        const passwordHash = await hashPassword(passwordStr);
        await connection.query(
          'UPDATE users SET password_hash = ? WHERE id = ?',
          [passwordHash, params.id]
        );
      }

      // Update is_active if provided
      if (typeof isActive === 'boolean') {
        await connection.query(
          'UPDATE users SET is_active = ? WHERE id = ?',
          [isActive, params.id]
        );
      }

      await connection.commit();

      // Update translations after commit so password/email/is_active persist even if this fails
      if (name) {
        await saveUserNameTranslations(params.id, name, name);
      }

      // Return updated employee (fallback if is_deleted column missing)
      let rows: any[];
      try {
        [rows] = await pool.query(
          `SELECT u.*, 
            ut_en.name as name_en,
            ut_ar.name as name_ar
          FROM users u
          INNER JOIN employees e ON u.id = e.id
          LEFT JOIN user_translations ut_en ON u.id = ut_en.user_id AND ut_en.locale = 'en'
          LEFT JOIN user_translations ut_ar ON u.id = ut_ar.user_id AND ut_ar.locale = 'ar'
          WHERE u.id = ? AND (u.is_deleted = FALSE OR u.is_deleted IS NULL)`,
          [params.id]
        ) as any[];
      } catch (e: any) {
        if (e?.code === 'ER_BAD_FIELD_ERROR' && e?.message?.includes('is_deleted')) {
          [rows] = await pool.query(
            `SELECT u.*, 
              ut_en.name as name_en,
              ut_ar.name as name_ar
            FROM users u
            INNER JOIN employees e ON u.id = e.id
            LEFT JOIN user_translations ut_en ON u.id = ut_en.user_id AND ut_en.locale = 'en'
            LEFT JOIN user_translations ut_ar ON u.id = ut_ar.user_id AND ut_ar.locale = 'ar'
            WHERE u.id = ?`,
            [params.id]
          ) as any[];
        } else {
          throw e;
        }
      }

      const [assignments] = await pool.query(
        `SELECT customer_id FROM employee_customer_assignments WHERE employee_id = ?`,
        [params.id]
      ) as any[];

      const employee = rows[0];
      const employeeData = {
        id: employee.id,
        email: employee.email,
        name: employee.name_en || employee.email,
        nameKey: employee.name_en ? `user.name.${employee.id}` : undefined,
        role: employee.role,
        avatar: employee.avatar,
        isActive: employee.is_active,
        createdAt: employee.created_at,
        assignedCustomerIds: assignments.map((a: any) => a.customer_id),
      };

      return successResponse(employeeData, 'Employee updated successfully', 'error.employeeUpdatedSuccessfully');
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('Update employee error:', error);
    return serverError(error?.message);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE id = ? AND role = ?',
      [params.id, 'employee']
    ) as any[];

    if (existing.length === 0) {
      return notFoundError('Employee');
    }

    const [assignments] = await pool.query(
      'SELECT customer_id FROM employee_customer_assignments WHERE employee_id = ?',
      [params.id]
    ) as any[];

    if (assignments.length > 0) {
      return errorResponse(
        `Cannot delete employee. Please unassign all ${assignments.length} customer(s) first.`,
        400,
        'error.cannotDeleteEmployeeWithAssignments'
      );
    }

    try {
      await pool.query(
        'UPDATE users SET is_deleted = TRUE, deleted_at = NOW(), is_active = FALSE WHERE id = ?',
        [params.id]
      );
    } catch (e: any) {
      if (e?.code === 'ER_BAD_FIELD_ERROR' && e?.message?.includes('is_deleted')) {
        await pool.query('UPDATE users SET is_active = FALSE WHERE id = ?', [params.id]);
      } else {
        throw e;
      }
    }

    return successResponse({}, 'Employee deleted successfully', 'error.employeeDeletedSuccessfully');
  } catch (error: any) {
    console.error('Delete employee error:', error);
    return serverError(error?.message);
  }
}
