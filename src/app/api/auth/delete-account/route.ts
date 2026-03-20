import { NextRequest } from 'next/server';
import pool from '@/lib/db';
import { comparePassword } from '@/lib/auth';
import { deleteCustomerAccountData } from '@/lib/deleteCustomerAccountData';
import {
  errorResponse,
  successResponse,
  validationError,
  isValidEmail,
  serverError,
} from '@/lib/api';

export const dynamic = 'force-dynamic';

async function isDeleteAccountEnabled(): Promise<boolean> {
  try {
    const [rows] = await pool.query(
      `SELECT setting_key, setting_value FROM mobile_app_settings LIMIT 20`,
    ) as any[];
    if (Array.isArray(rows) && rows.length > 0) {
      for (const row of rows) {
        if (row?.setting_key === 'deleteAccountEnabled') {
          return row.setting_value === '1' || row.setting_value === true;
        }
      }
    }
  } catch {
    // table missing or other
  }
  try {
    const [settings] = await pool.query(
      'SELECT delete_account_enabled FROM mobile_app_settings LIMIT 1',
    ) as any[];
    if (settings?.[0]) {
      return (
        settings[0].delete_account_enabled === 1 || settings[0].delete_account_enabled === true
      );
    }
  } catch {
    // column missing
  }
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    const cred = typeof email === 'string' ? email.trim() : '';
    if (!cred || !password) {
      return validationError('Email and password are required', 'error.emailPasswordRequired');
    }

    if (!isValidEmail(cred)) {
      return validationError('Invalid email format', 'error.invalidEmailFormat');
    }

    if (!(await isDeleteAccountEnabled())) {
      return errorResponse(
        'Account deletion is disabled. Please contact support.',
        403,
        'error.deleteAccountDisabled',
      );
    }

    const [users] = await pool.query(
      `SELECT id, email, password_hash, role FROM users WHERE email = ? AND is_active = TRUE AND (is_deleted = FALSE OR is_deleted IS NULL)`,
      [cred],
    ) as any[];

    if (!users?.length) {
      return errorResponse('Invalid email or password', 401, 'error.invalidEmailOrPassword');
    }

    const user = users[0];

    if (user.role === 'admin') {
      return errorResponse(
        'Administrator accounts cannot be deleted from this page.',
        403,
        'error.deleteAccountAdminNotAllowed',
      );
    }

    if (user.role !== 'customer' && user.role !== 'employee') {
      return errorResponse('This account cannot be deleted here.', 403, 'error.deleteAccountNotAllowed');
    }

    const passwordMatch = await comparePassword(password, user.password_hash);
    if (!passwordMatch) {
      return errorResponse('Invalid email or password', 401, 'error.invalidEmailOrPassword');
    }

    if (user.role === 'employee') {
      const [assignments] = await pool.query(
        'SELECT customer_id FROM employee_customer_assignments WHERE employee_id = ?',
        [user.id],
      ) as any[];
      if (assignments.length > 0) {
        return errorResponse(
          'You still have assigned customers. Please contact your administrator to remove assignments before deleting your account.',
          400,
          'error.deleteAccountEmployeeHasAssignments',
        );
      }

      const connection = await pool.getConnection();
      await connection.beginTransaction();
      try {
        try {
          await connection.query('DELETE FROM password_reset_tokens WHERE user_id = ?', [user.id]);
        } catch {
          /* optional */
        }
        try {
          await connection.query('DELETE FROM user_fcm_tokens WHERE user_id = ?', [user.id]);
        } catch {
          /* optional */
        }
        try {
          await connection.query(
            'UPDATE users SET is_deleted = TRUE, deleted_at = NOW(), is_active = FALSE WHERE id = ?',
            [user.id],
          );
        } catch (e: any) {
          if (e?.code === 'ER_BAD_FIELD_ERROR' && e?.message?.includes('is_deleted')) {
            await connection.query('UPDATE users SET is_active = FALSE WHERE id = ?', [user.id]);
          } else {
            throw e;
          }
        }
        await connection.commit();
      } catch (err) {
        await connection.rollback();
        throw err;
      } finally {
        connection.release();
      }

      return successResponse({}, 'Account deleted.', 'deleteAccount.success');
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();
    try {
      await deleteCustomerAccountData(connection, user.id);
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    return successResponse({}, 'Account deleted.', 'deleteAccount.success');
  } catch (error: unknown) {
    console.error('Delete account error:', error);
    return serverError(error instanceof Error ? error.message : 'Internal server error');
  }
}
