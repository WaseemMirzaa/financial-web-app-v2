import type { PoolConnection } from 'mysql2/promise';

/**
 * Same cleanup as admin DELETE /api/customers/[id] — used for self-service delete.
 */
export async function deleteCustomerAccountData(connection: PoolConnection, id: string): Promise<void> {
  await connection.query('DELETE FROM employee_customer_assignments WHERE customer_id = ?', [id]);
  await connection.query('UPDATE customers SET assigned_employee_id = NULL WHERE id = ?', [id]);

  const [loanRows] = await connection.query('SELECT id FROM loans WHERE customer_id = ?', [id]) as any[];
  const loanIds = (loanRows as { id: string }[]).map((r) => r.id);
  if (loanIds.length > 0) {
    const loanPlaceholders = loanIds.map(() => '?').join(',');
    await connection.query(
      `DELETE FROM notifications WHERE reference_id IN (${loanPlaceholders})`,
      loanIds,
    );
  }
  await connection.query('DELETE FROM notifications WHERE reference_id = ?', [`assignment-${id}`]);
  for (const loanId of loanIds) {
    await connection.query('DELETE FROM loan_translations WHERE loan_id = ?', [loanId]);
    try {
      await connection.query('DELETE FROM loan_employees WHERE loan_id = ?', [loanId]);
    } catch {
      // optional table
    }
  }
  await connection.query('DELETE FROM loans WHERE customer_id = ?', [id]);

  const [customerChats] = await connection.query(
    'SELECT chat_id FROM chat_participants WHERE user_id = ?',
    [id],
  ) as any[];
  const chatIds = (customerChats as { chat_id: string }[]).map((r) => r.chat_id);
  if (chatIds.length > 0) {
    const placeholders = chatIds.map(() => '?').join(',');
    await connection.query(
      `DELETE FROM notifications WHERE reference_id IN (${placeholders})`,
      chatIds,
    );
  }
  for (const chatId of chatIds) {
    try {
      await connection.query('DELETE FROM chat_read_status WHERE chat_id = ?', [chatId]);
    } catch {
      // optional
    }
    await connection.query('DELETE FROM chat_messages WHERE chat_id = ?', [chatId]);
    await connection.query('DELETE FROM chat_participants WHERE chat_id = ?', [chatId]);
    await connection.query('DELETE FROM chats WHERE id = ?', [chatId]);
  }

  await connection.query('DELETE FROM notifications WHERE user_id = ?', [id]);

  try {
    await connection.query('DELETE FROM user_fcm_tokens WHERE user_id = ?', [id]);
  } catch {
    // optional
  }
  try {
    await connection.query('DELETE FROM password_reset_tokens WHERE user_id = ?', [id]);
  } catch {
    // optional
  }

  await connection.query('DELETE FROM customers WHERE id = ?', [id]);
  await connection.query('DELETE FROM users WHERE id = ?', [id]);
}
