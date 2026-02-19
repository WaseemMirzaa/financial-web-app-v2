import { NextRequest } from 'next/server';
import pool from '@/lib/db';
import { comparePassword } from '@/lib/auth';
import { successResponse, errorResponse, validationError, isValidEmail, serverError } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return validationError('Email and password are required', 'error.emailPasswordRequired');
    }

    if (!isValidEmail(email)) {
      return validationError('Invalid email format', 'error.invalidEmailFormat');
    }

    // Get user from database (with optional is_deleted for pre-migration DBs)
    let users: any[];
    try {
      [users] = await pool.query(
        `SELECT u.*, 
          ut_en.name as name_en,
          ut_ar.name as name_ar
        FROM users u
        LEFT JOIN user_translations ut_en ON u.id = ut_en.user_id AND ut_en.locale = 'en'
        LEFT JOIN user_translations ut_ar ON u.id = ut_ar.user_id AND ut_ar.locale = 'ar'
        WHERE u.email = ? AND u.is_active = TRUE AND (u.is_deleted = FALSE OR u.is_deleted IS NULL)`,
        [email]
      ) as any[];
    } catch (e: any) {
      if (e?.code === 'ER_BAD_FIELD_ERROR' && e?.message?.includes('is_deleted')) {
        [users] = await pool.query(
          `SELECT u.*, 
            ut_en.name as name_en,
            ut_ar.name as name_ar
          FROM users u
          LEFT JOIN user_translations ut_en ON u.id = ut_en.user_id AND ut_en.locale = 'en'
          LEFT JOIN user_translations ut_ar ON u.id = ut_ar.user_id AND ut_ar.locale = 'ar'
          WHERE u.email = ? AND u.is_active = TRUE`,
          [email]
        ) as any[];
      } else {
        throw e;
      }
    }

    if (users.length === 0) {
      return errorResponse('Invalid email or password', 401, 'error.invalidEmailOrPassword');
    }

    const user = users[0];

    // Verify password
    const passwordMatch = await comparePassword(password, user.password_hash);
    if (!passwordMatch) {
      return errorResponse('Invalid email or password', 401, 'error.invalidEmailOrPassword');
    }

    // Get customer/employee specific data if applicable
    let additionalData: any = {};

    if (user.role === 'customer') {
      const [customers] = await pool.query(
        `SELECT phone, address, assigned_employee_id FROM customers WHERE id = ?`,
        [user.id]
      ) as any[];
      if (customers.length > 0) {
        additionalData = customers[0];
      }
    } else if (user.role === 'employee') {
      const [assignments] = await pool.query(
        `SELECT customer_id FROM employee_customer_assignments WHERE employee_id = ?`,
        [user.id]
      ) as any[];
      additionalData.assignedCustomerIds = assignments.map((a: any) => a.customer_id);
    }

    // Return user data (without password)
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name_en || user.email,
      role: user.role,
      avatar: user.avatar,
      isActive: user.is_active,
      createdAt: user.created_at,
      ...additionalData,
    };

    return successResponse(userData);
  } catch (error: any) {
    console.error('Login error:', error?.message || error);
    return serverError(error?.message);
  }
}
