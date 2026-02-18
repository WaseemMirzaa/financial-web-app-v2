/**
 * Server-side: create in-app notification (with EN/AR) and send FCM push.
 * Notifications are shown in the user's selected language via GET /api/notifications?locale=
 */

import pool from './db';
import { saveNotificationTranslations } from './translations';
import { sendPushNotification } from './fcm';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

/**
 * Create a notification for a user with EN/AR translations and send FCM push.
 * Does not throw; logs and continues on FCM failure.
 */
export async function createNotificationAndPush(
  userId: string,
  titleEn: string,
  titleAr: string,
  messageEn: string,
  messageAr: string,
  type: NotificationType = 'info'
): Promise<string | null> {
  const notificationId = `notification-${Date.now()}-${userId}-${Math.random().toString(36).substr(2, 6)}`;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query(
      `INSERT INTO notifications (id, user_id, type, is_read) VALUES (?, ?, ?, FALSE)`,
      [notificationId, userId, type]
    );
    await saveNotificationTranslations(
      notificationId,
      titleEn,
      messageEn,
      titleAr,
      messageAr
    );
    await connection.commit();
  } catch (err) {
    await connection.rollback();
    console.error('Create notification error:', err);
    return null;
  } finally {
    connection.release();
  }

  Promise.allSettled([
    sendPushNotification(userId, titleEn, titleAr, messageEn, messageAr),
  ]).catch((e) => console.warn('FCM send after notification:', e));
  return notificationId;
}
