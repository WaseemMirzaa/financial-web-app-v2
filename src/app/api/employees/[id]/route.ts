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
    const [rows] = await pool.query(
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
    return serverError();
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

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

      // Update password if provided
      if (password && password.length >= 6) {
        const passwordHash = await hashPassword(password);
        await connection.query(
          'UPDATE users SET password_hash = ? WHERE id = ?',
          [passwordHash, params.id]
        );
      }

      // Update translations if name provided
      if (name) {
        await saveUserNameTranslations(params.id, name, name);
      }

      await connection.commit();

      // Return updated employee
      const [rows] = await pool.query(
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
    return serverError();
  }
}
