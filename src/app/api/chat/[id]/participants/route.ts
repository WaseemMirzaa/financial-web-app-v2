import { NextRequest } from 'next/server';
import pool from '@/lib/db';
import { successResponse, errorResponse, serverError, validationError } from '@/lib/api';

/**
 * POST /api/chat/[id]/participants
 * Add a participant to a chat.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const chatId = params.id;
    if (!chatId) return errorResponse('Chat ID is required', 400, 'error.chatIdRequired');
    const body = await request.json().catch(() => ({}));
    const userId = body.userId || body.participantId;
    if (!userId) return validationError('userId or participantId is required', 'error.missingRequiredFields');

    const [chatRows] = await pool.query('SELECT id FROM chats WHERE id = ?', [chatId]) as any[];
    if (chatRows.length === 0) return errorResponse('Chat not found', 404, 'error.chatNotFound');

    const [userRows] = await pool.query(
      'SELECT id, role FROM users WHERE id = ?',
      [userId]
    ) as any[];
    if (userRows.length === 0) return errorResponse('User not found', 404, 'error.userNotFound');

    await pool.query(
      'INSERT IGNORE INTO chat_participants (chat_id, user_id) VALUES (?, ?)',
      [chatId, userId]
    );

    return successResponse({ added: true });
  } catch (error: any) {
    console.error('Add participant error:', error);
    return serverError();
  }
}

/**
 * GET /api/chat/[id]/participants
 * Get list of participant user IDs for a chat.
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

    const [chatRows] = await pool.query('SELECT id FROM chats WHERE id = ?', [chatId]) as any[];

    if (chatRows.length === 0) {
      return errorResponse('Chat not found', 404, 'error.chatNotFound');
    }

    const [participants] = await pool.query(
      'SELECT user_id FROM chat_participants WHERE chat_id = ?',
      [chatId]
    ) as any[];
    const participantIds = participants.map((p: any) => p.user_id);

    return successResponse(participantIds);
  } catch (error: any) {
    console.error('Get participants error:', error);
    return serverError();
  }
}
