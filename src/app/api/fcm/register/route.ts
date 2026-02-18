import { NextRequest } from 'next/server';
import pool from '@/lib/db';
import { successResponse, validationError, serverError } from '@/lib/api';

/**
 * POST /api/fcm/register
 * Register an FCM token for the current user (for push notifications).
 * Body: { userId: string, token: string, deviceLabel?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, token, deviceLabel } = body;

    if (!userId || !token || typeof token !== 'string') {
      return validationError('userId and token are required', 'error.missingRequiredFields');
    }

    // FCM tokens are typically ~152 chars; we store up to 255
    const trimmedToken = token.trim().slice(0, 255);
    if (!trimmedToken) {
      return validationError('Invalid token', 'error.invalidToken');
    }

    await pool.query(
      `INSERT INTO user_fcm_tokens (user_id, token, device_label)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE device_label = VALUES(device_label)`,
      [userId, trimmedToken, deviceLabel || null]
    );

    return successResponse(
      { registered: true },
      'Token registered for push notifications',
      'fcm.registered'
    );
  } catch (error: any) {
    console.error('FCM register error:', error);
    return serverError();
  }
}
