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
  const tokens = await getFcmTokensForUser(userId);
  if (tokens.length === 0) return;

  const admin = getAdmin();
  if (!admin?.messaging) return;

  try {
    await admin.messaging().sendEachForMulticast({
      tokens,
      notification: {
        title: titleEn,
        body: messageEn,
      },
      data: {
        title_en: titleEn,
        title_ar: titleAr,
        body_en: messageEn,
        body_ar: messageAr,
      },
      android: {
        notification: {
          title: titleEn,
          body: messageEn,
        },
        data: {
          title_en: titleEn,
          title_ar: titleAr,
          body_en: messageEn,
          body_ar: messageAr,
        },
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title: titleEn,
              body: messageEn,
            },
            'mutable-content': 1,
            'content-available': 1,
          },
        },
        fcmOptions: {},
      },
    });
  } catch (err) {
    console.warn('FCM send failed for user', userId, err);
  }
}
