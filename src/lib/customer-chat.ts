/**
 * Unified customer chat: one chat per customer (customer_employee, no loan_id).
 * Participants = customer + all admins + all employees assigned to that customer.
 */
import pool from './db';

export async function syncCustomerUnifiedChat(customerId: string): Promise<void> {
  const [admins] = await pool.query(
    "SELECT id FROM users WHERE role = 'admin'",
    []
  ) as any[];
  const [assigned] = await pool.query(
    'SELECT employee_id FROM employee_customer_assignments WHERE customer_id = ? ORDER BY employee_id',
    [customerId]
  ) as any[];
  const assignedIds = (assigned || []).map((r: any) => r.employee_id);
  const adminIds = (admins || []).map((r: any) => r.id);

  const participantIds = [
    customerId,
    ...adminIds,
    ...assignedIds,
  ].filter((id, i, arr) => id && arr.indexOf(id) === i);

  const [existing] = await pool.query(
    `SELECT c.id FROM chats c
     INNER JOIN chat_participants cp ON cp.chat_id = c.id AND cp.user_id = ?
     WHERE c.type = 'customer_employee' AND (c.loan_id IS NULL OR c.loan_id = '')`,
    [customerId]
  ) as any[];

  let chatId: string;
  if (existing.length > 0) {
    chatId = existing[0].id;
  } else {
    chatId = `chat-ce-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    await pool.query(
      `INSERT INTO chats (id, type) VALUES (?, 'customer_employee')`,
      [chatId]
    );
  }

  await pool.query('DELETE FROM chat_participants WHERE chat_id = ?', [chatId]);
  for (const uid of participantIds) {
    await pool.query(
      'INSERT INTO chat_participants (chat_id, user_id) VALUES (?, ?)',
      [chatId, uid]
    );
  }
}

export async function removeEmployeeFromCustomerChat(customerId: string, employeeId: string): Promise<void> {
  const [chats] = await pool.query(
    `SELECT c.id FROM chats c
     INNER JOIN chat_participants cp ON cp.chat_id = c.id AND cp.user_id = ?
     WHERE c.type = 'customer_employee' AND (c.loan_id IS NULL OR c.loan_id = '')`,
    [customerId]
  ) as any[];
  if (chats.length > 0) {
    await pool.query(
      'DELETE FROM chat_participants WHERE chat_id = ? AND user_id = ?',
      [chats[0].id, employeeId]
    );
  }
}
