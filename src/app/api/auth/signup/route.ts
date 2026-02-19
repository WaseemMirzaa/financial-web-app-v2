import { NextRequest } from 'next/server';
import pool from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { successResponse, errorResponse, validationError, isValidEmail, validateRequired, serverError } from '@/lib/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, phone, address } = body;

    // Block customer self-registration - customers must be created by admin/employee
    return errorResponse(
      'Customer accounts must be created by administrators. Please contact your administrator.',
      403,
      'error.customerSignupDisabled'
    );

    // Validation
    const validation = validateRequired({ name, email, password }, ['name', 'email', 'password']);
    if (!validation.valid) {
      return validationError(
        `Missing required fields: ${validation.missing.join(', ')}`,
        'error.missingRequiredFieldsList'
      );
    }

    if (!isValidEmail(email)) {
      return validationError('Invalid email format', 'error.invalidEmailFormat');
    }

    if (password.length < 6) {
      return validationError('Password must be at least 6 characters', 'error.passwordMinLength');
    }

    // Check if email already exists
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    ) as any[];

    if (existing.length > 0) {
      return errorResponse('Email already exists', 409, 'error.emailAlreadyExists');
    }

    // Generate user ID
    const userId = `customer-${Date.now()}`;

    // Hash password
    const passwordHash = await hashPassword(password);

    // Start transaction
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

      // Create customer record (assigned_employee_id NULL until admin assigns)
      await connection.query(
        `INSERT INTO customers (id, phone, address, assigned_employee_id) VALUES (?, ?, ?, NULL)`,
        [userId, phone || null, address || null]
      );

      await connection.commit();

      // Get created user with translations
      const [users] = await pool.query(
        `SELECT u.*, 
          ut_en.name as name_en,
          ut_ar.name as name_ar
        FROM users u
        LEFT JOIN user_translations ut_en ON u.id = ut_en.user_id AND ut_en.locale = 'en'
        LEFT JOIN user_translations ut_ar ON u.id = ut_ar.user_id AND ut_ar.locale = 'ar'
        WHERE u.id = ?`,
        [userId]
      ) as any[];

      const user = users[0];
      const [customers] = await pool.query(
        `SELECT phone, address, assigned_employee_id FROM customers WHERE id = ?`,
        [userId]
      ) as any[];

      const userData = {
        id: user.id,
        email: user.email,
        name: user.name_en || user.email,
        role: user.role,
        avatar: user.avatar,
        isActive: user.is_active,
        createdAt: user.created_at,
        phone: customers[0]?.phone || null,
        address: customers[0]?.address || null,
        assignedEmployeeId: customers[0]?.assigned_employee_id || '',
      };

      return successResponse(userData, 'Account created successfully', 'error.accountCreatedSuccessfully');
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('Signup error:', error);
    return serverError();
  }
}
