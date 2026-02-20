import { NextRequest } from 'next/server';
import pool from '@/lib/db';
import { successResponse, validationError, serverError } from '@/lib/api';

/**
 * POST /api/fcm/register
 * DISABLED: Firebase FCM push notifications are disabled.
 * Using in-app notifications only (polled every 15s).
 */
export async function POST(request: NextRequest) {
  // Firebase FCM disabled - return success but don't register token
  return successResponse(
    { registered: false, message: 'FCM disabled - using in-app notifications only' },
    'FCM disabled',
    'fcm.disabled'
  );
  
  /* COMMENTED OUT - Firebase FCM registration
  try {
    const body = await request.json();
    const { userId, token, deviceLabel } = body;

    console.log('[FCM API] Register request received:', { userId, tokenLength: token?.length, hasDeviceLabel: !!deviceLabel });

    if (!userId || !token || typeof token !== 'string') {
      console.warn('[FCM API] Validation failed - missing userId or token');
      return validationError('userId and token are required', 'error.missingRequiredFields');
    }

    // FCM tokens are typically ~152 chars; we store up to 255
    const trimmedToken = token.trim().slice(0, 255);
    if (!trimmedToken) {
      console.warn('[FCM API] Token is empty after trimming');
      return validationError('Invalid token', 'error.invalidToken');
    }

    console.log('[FCM API] Saving token to database...');
    await pool.query(
      `INSERT INTO user_fcm_tokens (user_id, token, device_label)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE device_label = VALUES(device_label)`,
      [userId, trimmedToken, deviceLabel || null]
    );

    console.log('[FCM API] Token registered successfully for user:', userId);
    return successResponse(
      { registered: true },
      'Token registered for push notifications',
      'fcm.registered'
    );
  } catch (error: any) {
    console.error('[FCM API] Register error:', error);
    return serverError();
  }
  */
}
