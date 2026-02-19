import { NextRequest } from 'next/server';
import pool from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { successResponse, errorResponse, validationError, serverError } from '@/lib/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, newPassword } = body;

    if (!token || typeof token !== 'string') {
      return validationError('Reset token is required', 'auth.invalidOrExpiredToken');
    }

    if (!newPassword || newPassword.length < 6) {
      return validationError('Password must be at least 6 characters', 'auth.passwordMinLength');
    }

    const [rows] = await pool.query(
      'SELECT user_id FROM password_reset_tokens WHERE token = ? AND expires_at > NOW()',
      [token.trim()]
    ) as any[];

    if (rows.length === 0) {
      return errorResponse('Invalid or expired reset link. Please request a new one.', 400, 'auth.invalidOrExpiredToken');
    }

    const userId = rows[0].user_id;
    const passwordHash = await hashPassword(newPassword);

    const connection = await pool.getConnection();
    try {
      const [updateResult] = await connection.query(
        'UPDATE users SET password_hash = ? WHERE id = ? AND (is_deleted = FALSE OR is_deleted IS NULL)',
        [passwordHash, userId]
      ) as any;
      if (updateResult?.affectedRows === 0) {
        await connection.query('DELETE FROM password_reset_tokens WHERE token = ?', [token.trim()]);
        return errorResponse('Account is no longer active. Please contact support.', 403, 'auth.accountInactive');
      }
      await connection.query('DELETE FROM password_reset_tokens WHERE token = ?', [token.trim()]);
    } finally {
      connection.release();
    }

    return successResponse({ success: true }, 'Password reset successfully.', 'auth.passwordResetSuccess');
  } catch (error: any) {
    console.error('Reset password error:', error);
    return serverError();
  }
}
