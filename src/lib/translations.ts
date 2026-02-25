import pool from './db';

type Locale = 'en' | 'ar';

interface TranslationPair {
  en: string;
  ar: string;
}

/**
 * Save translations for a record (generic helper - use specific functions instead)
 */
async function saveTranslations(
  table: string,
  recordId: string,
  translations: TranslationPair
): Promise<void> {
  // This is a generic helper - use specific functions for each entity type
  throw new Error('Use specific translation functions instead of generic saveTranslations');
}

/**
 * Get user name translation
 */
export async function getUserNameTranslation(
  userId: string,
  locale: Locale
): Promise<string | null> {
  const [rows] = await pool.query(
    `SELECT name FROM user_translations WHERE user_id = ? AND locale = ? LIMIT 1`,
    [userId, locale]
  ) as any[];

  return rows.length > 0 ? rows[0].name : null;
}

/**
 * Get loan notes translation
 */
export async function getLoanNotesTranslation(
  loanId: string,
  locale: Locale
): Promise<string | null> {
  const [rows] = await pool.query(
    `SELECT notes FROM loan_translations WHERE loan_id = ? AND locale = ? LIMIT 1`,
    [loanId, locale]
  ) as any[];

  return rows.length > 0 ? rows[0].notes : null;
}


/**
 * Save user name translations
 */
export async function saveUserNameTranslations(
  userId: string,
  nameEn: string,
  nameAr: string
): Promise<void> {
  await pool.query(
    `INSERT INTO user_translations (user_id, locale, name) VALUES (?, 'en', ?)
     ON DUPLICATE KEY UPDATE name = VALUES(name)`,
    [userId, nameEn]
  );
  await pool.query(
    `INSERT INTO user_translations (user_id, locale, name) VALUES (?, 'ar', ?)
     ON DUPLICATE KEY UPDATE name = VALUES(name)`,
    [userId, nameAr]
  );
}

/**
 * Save loan notes translations
 */
export async function saveLoanNotesTranslations(
  loanId: string,
  notesEn: string,
  notesAr: string
): Promise<void> {
  // Delete existing translations
  await pool.query(
    `DELETE FROM loan_translations WHERE loan_id = ?`,
    [loanId]
  );

  // Insert English translation
  await pool.query(
    `INSERT INTO loan_translations (loan_id, locale, notes) VALUES (?, 'en', ?)`,
    [loanId, notesEn || '']
  );

  // Insert Arabic translation
  await pool.query(
    `INSERT INTO loan_translations (loan_id, locale, notes) VALUES (?, 'ar', ?)`,
    [loanId, notesAr || '']
  );
}

/**
 * Save chat message translations
 */
export async function saveChatMessageTranslations(
  messageId: string,
  contentEn: string,
  contentAr: string,
  senderNameEn: string,
  senderNameAr: string
): Promise<void> {
  // Delete existing translations
  await pool.query(
    `DELETE FROM chat_message_translations WHERE message_id = ?`,
    [messageId]
  );

  // Insert English translation
  await pool.query(
    `INSERT INTO chat_message_translations (message_id, locale, content, sender_name) VALUES (?, 'en', ?, ?)`,
    [messageId, contentEn, senderNameEn]
  );

  // Insert Arabic translation
  await pool.query(
    `INSERT INTO chat_message_translations (message_id, locale, content, sender_name) VALUES (?, 'ar', ?, ?)`,
    [messageId, contentAr, senderNameAr]
  );
}

/**
 * Save notification translations
 */
export async function saveNotificationTranslations(
  notificationId: string,
  titleEn: string,
  messageEn: string,
  titleAr: string,
  messageAr: string
): Promise<void> {
  // Delete existing translations
  await pool.query(
    `DELETE FROM notification_translations WHERE notification_id = ?`,
    [notificationId]
  );

  // Insert English translation
  await pool.query(
    `INSERT INTO notification_translations (notification_id, locale, title, message) VALUES (?, 'en', ?, ?)`,
    [notificationId, titleEn, messageEn]
  );

  // Insert Arabic translation
  await pool.query(
    `INSERT INTO notification_translations (notification_id, locale, title, message) VALUES (?, 'ar', ?, ?)`,
    [notificationId, titleAr, messageAr]
  );
}

/**
 * Save broadcast translations
 */
export async function saveBroadcastTranslations(
  broadcastId: string,
  titleEn: string,
  messageEn: string,
  titleAr: string,
  messageAr: string
): Promise<void> {
  // Delete existing translations
  await pool.query(
    `DELETE FROM broadcast_translations WHERE broadcast_id = ?`,
    [broadcastId]
  );

  // Insert English translation
  await pool.query(
    `INSERT INTO broadcast_translations (broadcast_id, locale, title, message) VALUES (?, 'en', ?, ?)`,
    [broadcastId, titleEn, messageEn]
  );

  // Insert Arabic translation
  await pool.query(
    `INSERT INTO broadcast_translations (broadcast_id, locale, title, message) VALUES (?, 'ar', ?, ?)`,
    [broadcastId, titleAr, messageAr]
  );
}
