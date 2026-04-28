/**
 * FCM (Firebase Cloud Messaging) helpers for push notifications with EN/AR translations.
 * When firebase-admin is not installed or env is not set, all functions no-op.
 *
 * Setup:
 * 1. npm install firebase-admin
 * 2. Set GOOGLE_APPLICATION_CREDENTIALS to path to service account JSON,
 *    or set FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY (base64 or raw).
 */

import pool from './db';

/** Arabic script (basic range) — used when EN text is actually Arabic-only payloads. */
const ARABIC_SCRIPT = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

/**
 * Text shown in the system tray / APNs: prefer Arabic fields; if empty, use EN when it looks Arabic;
 * otherwise fall back to EN.
 */
function pickPushDisplayText(ar: string, en: string): string {
  const arT = (ar || '').trim();
  if (arT) return arT;
  const enT = (en || '').trim();
  if (enT && ARABIC_SCRIPT.test(enT)) return enT;
  return enT || arT;
}

// Firebase Admin is optional; type as any so build works without firebase-admin installed
let fcmAdmin: any = null;

function getAdmin(): any {
  if (fcmAdmin !== null) return fcmAdmin;
  try {
    // eslint-disable-next-line -- optional require('firebase-admin')
    const admin = require('firebase-admin');
    const hasCreds =
      process.env.GOOGLE_APPLICATION_CREDENTIALS ||
      (process.env.FIREBASE_PROJECT_ID &&
        process.env.FIREBASE_CLIENT_EMAIL &&
        process.env.FIREBASE_PRIVATE_KEY);
    if (!hasCreds) return null;
    if (!admin.apps?.length) {
      const credential = process.env.GOOGLE_APPLICATION_CREDENTIALS
        ? admin.credential.applicationDefault()
        : admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
          });
      admin.initializeApp({ credential });
    }
    fcmAdmin = admin;
    return admin;
  } catch {
    return null;
  }
}

/**
 * Get all FCM tokens for a user.
 */
export async function getFcmTokensForUser(userId: string): Promise<string[]> {
  const [rows] = await pool.query(
    `SELECT token FROM user_fcm_tokens WHERE user_id = ?`,
    [userId]
  ) as any[];
  return (rows || []).map((r: { token: string }) => r.token);
}

/**
 * Send a push notification with EN/AR content to a user.
 * Payload includes title_en, title_ar, body_en, body_ar so the client can show the right locale.
 * No-ops if Firebase is not configured or user has no tokens.
 */
export async function sendPushNotification(
  userId: string,
  titleEn: string,
  titleAr: string,
  messageEn: string,
  messageAr: string
): Promise<void> {
  console.log('[FCM] sendPushNotification called:', { userId, titleEn, titleAr, messageEn: messageEn.substring(0, 50), messageAr: messageAr.substring(0, 50) });
  
  const tokens = await getFcmTokensForUser(userId);
  console.log('[FCM] Found tokens for user:', { userId, tokenCount: tokens.length, tokens: tokens.map(t => t.substring(0, 20) + '...') });
  
  if (tokens.length === 0) {
    console.warn('[FCM] No tokens found for user:', userId);
    return;
  }

  const admin = getAdmin();
  if (!admin?.messaging) {
    console.warn('[FCM] Firebase Admin not initialized or messaging unavailable');
    console.log('[FCM] Admin check:', { 
      hasAdmin: !!admin, 
      hasMessaging: !!admin?.messaging,
      hasCreds: !!(process.env.GOOGLE_APPLICATION_CREDENTIALS || (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY))
    });
    return;
  }

  // FCM `data` map values must be strings (Android / delivery rules).
  const dataPayload: Record<string, string> = {
    title_en: String(titleEn),
    title_ar: String(titleAr),
    body_en: String(messageEn),
    body_ar: String(messageAr),
  };

  const displayTitle = pickPushDisplayText(titleAr, titleEn);
  const displayBody = pickPushDisplayText(messageAr, messageEn);

  const invalidTokenCodes = new Set([
    'messaging/registration-token-not-registered',
    'messaging/invalid-registration-token',
    'messaging/unregistered',
  ]);

  try {
    console.log('[FCM] Sending push notification to', tokens.length, 'token(s)');
    const result = await admin.messaging().sendEachForMulticast({
      tokens,
      notification: {
        title: displayTitle,
        body: displayBody,
      },
      data: dataPayload,
      webpush: {
        notification: {
          title: displayTitle,
          body: displayBody,
          icon: '/icon.png',
        },
        data: dataPayload,
      },
      android: {
        notification: {
          title: displayTitle,
          body: displayBody,
          channelId: 'high_importance_channel',
          sound: 'default',
        },
        data: dataPayload,
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title: displayTitle,
              body: displayBody,
            },
            sound: 'default',
          },
        },
      },
    });
    console.log('[FCM] Push notification sent:', { 
      successCount: result.successCount, 
      failureCount: result.failureCount,
      responses: result.responses?.map((r: any, i: number) => ({ 
        index: i, 
        success: r.success, 
        error: r.success ? undefined : r.error?.code || r.error?.message
      }))
    });

    for (let i = 0; i < result.responses.length; i++) {
      const r = result.responses[i];
      if (r.success) continue;
      const code = r.error?.code || r.error?.errorInfo?.code;
      if (code && invalidTokenCodes.has(code)) {
        const token = tokens[i];
        try {
          await pool.query('DELETE FROM user_fcm_tokens WHERE user_id = ? AND token = ?', [userId, token]);
          console.log('[FCM] Removed invalid token for user', userId, code);
        } catch (e) {
          console.warn('[FCM] Failed to delete invalid token:', e);
        }
      }
    }
  } catch (err) {
    console.error('[FCM] Send failed for user', userId, err);
  }
}
