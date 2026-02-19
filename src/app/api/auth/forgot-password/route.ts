import { NextRequest } from 'next/server';
import crypto from 'crypto';
import pool from '@/lib/db';
import { sendPasswordResetEmail } from '@/lib/email';
import { successResponse, validationError, isValidEmail, serverError } from '@/lib/api';

const TOKEN_EXPIRY_HOURS = 1;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return validationError('Email is required', 'validation.emailRequired');
    }

    if (!isValidEmail(email)) {
      return validationError('Invalid email format', 'validation.emailInvalid');
    }

    const [users] = await pool.query(
      'SELECT id FROM users WHERE email = ? AND is_active = TRUE AND (is_deleted = FALSE OR is_deleted IS NULL)',
      [email.trim().toLowerCase()]
    ) as any[];

    if (users.length > 0) {
      const userId = users[0].id;
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

      await pool.query(
        'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
        [userId, token, expiresAt]
      );

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
      const resetLink = `${baseUrl}/reset-password?token=${token}`;
      await sendPasswordResetEmail(email.trim(), resetLink);
    }

    return successResponse(
      { sent: true },
      'If an account exists with this email, you will receive a reset link.',
      'auth.resetLinkSent'
    );
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return serverError();
  }
}
