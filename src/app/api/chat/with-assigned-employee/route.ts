import { NextRequest } from 'next/server';
import pool from '@/lib/db';
import { successResponse, validationError, errorResponse, serverError } from '@/lib/api';

/**
 * POST /api/chat/with-assigned-employee
 * Customer initiates: get the unified customer chat (customer + admins + assigned employees).
 * Chat is only created when customer has at least one employee assigned (via assign or create customer).
 * Body: { customerId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId } = body;

    if (!customerId) {
      return validationError('customerId is required', 'error.missingRequiredFields');
    }

    const [cust] = await pool.query(
      `SELECT assigned_employee_id FROM customers WHERE id = ?`,
      [customerId]
    ) as any[];

    if (cust.length === 0) {
      return errorResponse('Customer not found', 404, 'error.customerNotFound');
    }

    const [assignCount] = await pool.query(
      `SELECT COUNT(*) as c FROM employee_customer_assignments WHERE customer_id = ?`,
      [customerId]
    ) as any[];
    if (assignCount[0].c === 0) {
      return errorResponse('No employee assigned to this customer', 403, 'chat.noEmployeeAssigned');
    }

    const [existing] = await pool.query(
      `SELECT c.id
       FROM chats c
       INNER JOIN chat_participants cp ON c.id = cp.chat_id AND cp.user_id = ?
       WHERE c.type = 'customer_employee' AND (c.loan_id IS NULL OR c.loan_id = '')`,
      [customerId]
    ) as any[];

    if (existing.length === 0) {
      return errorResponse('No chat available yet. An employee must be assigned first.', 404, 'chat.noChatAvailable');
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
    console.error('Chat with assigned employee error:', error);
    return serverError();
  }
}
