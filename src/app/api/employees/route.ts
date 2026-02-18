import { NextRequest } from 'next/server';
import pool from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { successResponse, errorResponse, validationError, isValidEmail, serverError } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const [rows] = await pool.query(
      `SELECT u.*, 
        ut_en.name as name_en,
        ut_ar.name as name_ar
      FROM users u
      INNER JOIN employees e ON u.id = e.id
      LEFT JOIN user_translations ut_en ON u.id = ut_en.user_id AND ut_en.locale = 'en'
      LEFT JOIN user_translations ut_ar ON u.id = ut_ar.user_id AND ut_ar.locale = 'ar'
      WHERE u.role = 'employee'
      ORDER BY u.created_at DESC`
    ) as any[];

    // Get assigned customers for each employee
    const employees = await Promise.all(
      rows.map(async (row: any) => {
        const [assignments] = await pool.query(
          `SELECT customer_id FROM employee_customer_assignments WHERE employee_id = ?`,
          [row.id]
        ) as any[];

        return {
          id: row.id,
          email: row.email,
          name: row.name_en || row.email,
          role: row.role,
          avatar: row.avatar,
          isActive: row.is_active,
          createdAt: row.created_at,
          assignedCustomerIds: assignments.map((a: any) => a.customer_id),
        };
      })
    );

    return successResponse(employees);
  } catch (error: any) {
    console.error('Get employees error:', error?.message || error);
    return serverError(error?.message || 'Failed to fetch employees');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return validationError('Name, email, and password are required', 'error.nameEmailPasswordRequired');
    }

    if (!isValidEmail(email)) {
      return validationError('Invalid email format', 'error.invalidEmailFormat');
    }

    if (password.length < 6) {
      return validationError('Password must be at least 6 characters', 'error.passwordMinLength');
    }

    // Check if email exists
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    ) as any[];

    if (existing.length > 0) {
      return errorResponse('Email already exists', 409, 'error.emailAlreadyExists');
    }

    const userId = `employee-${Date.now()}`;
    const passwordHash = await hashPassword(password);

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Create user
      await connection.query(
        `INSERT INTO users (id, email, password_hash, role, is_active) VALUES (?, ?, ?, 'employee', TRUE)`,
        [userId, email, passwordHash]
      );

      // Save name translations in same transaction (must use connection, not pool)
      await connection.query(
        `INSERT INTO user_translations (user_id, locale, name) VALUES (?, 'en', ?), (?, 'ar', ?)`,
        [userId, name, userId, name]
      );

      // Create employee
      await connection.query(
        `INSERT INTO employees (id) VALUES (?)`,
        [userId]
      );

      await connection.commit();

      // Return created employee
      const [users] = await pool.query(
        `SELECT u.*, 
          ut_en.name as name_en,
          ut_ar.name as name_ar
        FROM users u
        INNER JOIN employees e ON u.id = e.id
        LEFT JOIN user_translations ut_en ON u.id = ut_en.user_id AND ut_en.locale = 'en'
        LEFT JOIN user_translations ut_ar ON u.id = ut_ar.user_id AND ut_ar.locale = 'ar'
        WHERE u.id = ?`,
        [userId]
      ) as any[];

      const employee = users[0];
      const employeeData = {
        id: employee.id,
        email: employee.email,
        name: employee.name_en || employee.email,
        role: employee.role,
        avatar: employee.avatar,
        isActive: employee.is_active,
        createdAt: employee.created_at,
        assignedCustomerIds: [],
      };

      return successResponse(employeeData, 'Employee created successfully', 'error.employeeCreatedSuccessfully');
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('Create employee error:', error);
    return serverError();
  }
}
