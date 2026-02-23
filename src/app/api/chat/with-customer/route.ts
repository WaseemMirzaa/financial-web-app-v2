import { NextRequest } from 'next/server';
import pool from '@/lib/db';
import { successResponse, validationError, errorResponse, serverError } from '@/lib/api';

/**
 * POST /api/chat/with-customer
 * Employee initiates: get the unified customer chat (customer + admins + assigned employees).
 * Chat is only created when customer has at least one employee assigned.
 * Body: { employeeId: string, customerId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employeeId, customerId } = body;

    if (!employeeId || !customerId) {
      return validationError('employeeId and customerId are required', 'error.missingRequiredFields');
    }

    const [assign] = await pool.query(
      `SELECT 1 FROM employee_customer_assignments WHERE employee_id = ? AND customer_id = ?`,
      [employeeId, customerId]
    ) as any[];

    if (assign.length === 0) {
      return errorResponse('Customer is not assigned to this employee', 403, 'chat.customerNotAssigned');
    }

    const [existing] = await pool.query(
      `SELECT c.id
       FROM chats c
       INNER JOIN chat_participants cp1 ON c.id = cp1.chat_id AND cp1.user_id = ?
       INNER JOIN chat_participants cp2 ON c.id = cp2.chat_id AND cp2.user_id = ?
       WHERE c.type = 'customer_employee' AND (c.loan_id IS NULL OR c.loan_id = '')`,
      [employeeId, customerId]
    ) as any[];

    if (existing.length === 0) {
      return errorResponse('No chat available for this customer yet.', 404, 'chat.noChatAvailableForCustomer');
    }

    const chatId = existing[0].id;
    const [chatRow] = await pool.query(
      `SELECT id, type, room_name, created_at, updated_at FROM chats WHERE id = ?`,
      [chatId]
    ) as any[];
    const c = chatRow[0];

    return successResponse({
      id: c.id,
      type: c.type,
      roomName: c.room_name,
      lastMessage: undefined,
      unreadCount: 0,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    });
  } catch (error: any) {
    console.error('Chat with customer error:', error);
    return serverError();
  }
}
