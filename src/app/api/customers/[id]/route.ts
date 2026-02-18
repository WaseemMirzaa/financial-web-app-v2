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
        ut_ar.name as name_ar,
        c.phone,
        c.address,
        c.assigned_employee_id
      FROM users u
      INNER JOIN customers c ON u.id = c.id
      LEFT JOIN user_translations ut_en ON u.id = ut_en.user_id AND ut_en.locale = 'en'
      LEFT JOIN user_translations ut_ar ON u.id = ut_ar.user_id AND ut_ar.locale = 'ar'
      WHERE u.id = ? AND u.role = 'customer'`,
      [params.id]
    ) as any[];

    if (rows.length === 0) {
      return notFoundError('Customer');
    }

    const customer = rows[0];
    const customerData = {
      id: customer.id,
      email: customer.email,
      name: customer.name_en || customer.email,
      role: customer.role,
      avatar: customer.avatar,
      isActive: customer.is_active,
      createdAt: customer.created_at,
      phone: customer.phone,
      address: customer.address,
      assignedEmployeeId: customer.assigned_employee_id || '',
    };

    return successResponse(customerData);
  } catch (error: any) {
    console.error('Get customer error:', error);
    return serverError();
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, email, phone, address, password } = body;

    // Check if customer exists
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE id = ? AND role = ?',
      [params.id, 'customer']
    ) as any[];

    if (existing.length === 0) {
      return notFoundError('Customer');
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

      // Update customer
      await connection.query(
        'UPDATE customers SET phone = ?, address = ? WHERE id = ?',
        [phone || null, address || null, params.id]
      );

      await connection.commit();

      // Return updated customer
      const [rows] = await pool.query(
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
        [params.id]
      ) as any[];

      const customer = rows[0];
      const customerData = {
        id: customer.id,
        email: customer.email,
        name: customer.name_en || customer.email,
        nameKey: customer.name_en ? `user.name.${customer.id}` : undefined,
        role: customer.role,
        avatar: customer.avatar,
        isActive: customer.is_active,
        createdAt: customer.created_at,
        phone: customer.phone,
        address: customer.address,
        assignedEmployeeId: customer.assigned_employee_id || '',
      };

      return successResponse(customerData, 'Customer updated successfully', 'error.customerUpdatedSuccessfully');
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('Update customer error:', error);
    return serverError();
  }
}
