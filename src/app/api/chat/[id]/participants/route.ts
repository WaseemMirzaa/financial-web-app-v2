import { NextRequest } from 'next/server';
import pool from '@/lib/db';
import { successResponse, errorResponse, serverError } from '@/lib/api';

/**
 * GET /api/chat/[id]/participants
 * Get list of participant user IDs for a chat.
 * For loan chats: participants = customer + loan_employees (single source of truth); syncs to chat_participants.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const chatId = params.id;

    if (!chatId) {
      return errorResponse('Chat ID is required', 400, 'error.chatIdRequired');
    }

    const [chatRows] = await pool.query(
      'SELECT id, type, loan_id FROM chats WHERE id = ?',
      [chatId]
    ) as any[];

    if (chatRows.length === 0) {
      return errorResponse('Chat not found', 404, 'error.chatNotFound');
    }

    const chat = chatRows[0];
    let participantIds: string[];

    if (chat.loan_id) {
      const [loanRows] = await pool.query(
        'SELECT customer_id FROM loans WHERE id = ?',
        [chat.loan_id]
      ) as any[];
      if (loanRows.length === 0) {
        const [legacy] = await pool.query(
          'SELECT user_id FROM chat_participants WHERE chat_id = ?',
          [chatId]
        ) as any[];
        participantIds = legacy.map((p: any) => p.user_id);
      } else {
        const customerId = loanRows[0].customer_id;
        const [empRows] = await pool.query(
          'SELECT employee_id FROM loan_employees WHERE loan_id = ? ORDER BY employee_id',
          [chat.loan_id]
        ) as any[];
        const employeeIds = empRows.map((r: any) => r.employee_id);
        participantIds = [customerId, ...employeeIds];
        await pool.query('DELETE FROM chat_participants WHERE chat_id = ?', [chatId]);
        for (const uid of participantIds) {
          await pool.query(
            'INSERT INTO chat_participants (chat_id, user_id) VALUES (?, ?)',
            [chatId, uid]
          );
        }
      }
    } else {
      const [participants] = await pool.query(
        'SELECT user_id FROM chat_participants WHERE chat_id = ?',
        [chatId]
      ) as any[];
      participantIds = participants.map((p: any) => p.user_id);
    }

    return successResponse(participantIds);
  } catch (error: any) {
    console.error('Get participants error:', error);
    return serverError();
  }
}
