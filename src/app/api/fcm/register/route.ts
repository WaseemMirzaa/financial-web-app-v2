import { NextRequest } from 'next/server';
import pool from '@/lib/db';
import { successResponse, validationError, serverError } from '@/lib/api';

/**
 * POST /api/fcm/register
 * Body: { userId, token, deviceLabel? }
 * Stores the device FCM token so the server can send pushes via createNotificationAndPush.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, token, deviceLabel } = body;

    if (!userId || !token || typeof token !== 'string') {
      return validationError('userId and token are required', 'error.missingRequiredFields');
    }

    const trimmedToken = token.trim();
    if (!trimmedToken || trimmedToken.length > 512) {
      return validationError('Invalid token', 'error.invalidToken');
    }

    const [users] = (await pool.query('SELECT id, role FROM users WHERE id = ? LIMIT 1', [userId])) as any[];
    if (!users?.length) {
      return validationError('Invalid user', 'error.userNotFound');
    }

    console.log('[FCM API] Token received:', {
      userId,
      role: users[0].role,
      deviceLabel: deviceLabel || null,
      tokenLength: trimmedToken.length,
      token: trimmedToken,
    });

    await pool.query(
      `INSERT INTO user_fcm_tokens (user_id, token, device_label)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE device_label = VALUES(device_label)`,
      [userId, trimmedToken, deviceLabel || null]
    );

    console.log('[FCM API] Token stored for user:', userId);

    return successResponse(
      { registered: true },
      'Token registered for push notifications',
      'fcm.registered'
    );
  } catch (error: unknown) {
    console.error('[FCM API] Register error:', error);
    return serverError();
  }
}
