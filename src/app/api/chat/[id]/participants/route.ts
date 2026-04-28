import { NextRequest } from 'next/server';
import pool from '@/lib/db';
import { successResponse, errorResponse, serverError, validationError, unauthorizedError } from '@/lib/api';

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
    const actorUserId = body.actorUserId || body.adminId || body.requesterId;
    const targetUserId = body.participantId || body.targetUserId || body.userId;
    if (!actorUserId || !targetUserId) {
      return validationError('actorUserId and participantId are required', 'error.missingRequiredFields');
    }

    const [adminRows] = await pool.query(
      'SELECT id FROM users WHERE id = ? AND role = ?',
      [actorUserId, 'admin']
    ) as any[];
    if (adminRows.length === 0) return unauthorizedError();

    const [chatRows] = await pool.query('SELECT id, type FROM chats WHERE id = ?', [chatId]) as any[];
    if (chatRows.length === 0) return errorResponse('Chat not found', 404, 'error.chatNotFound');
    if (chatRows[0].type !== 'internal_room') {
      return errorResponse('Only internal rooms can be managed', 400, 'chat.onlyInternalRoomManage');
    }

    const [userRows] = await pool.query(
      'SELECT id, role FROM users WHERE id = ?',
      [targetUserId]
    ) as any[];
    if (userRows.length === 0) return errorResponse('User not found', 404, 'error.userNotFound');
    if (userRows[0].role !== 'employee') {
      return errorResponse('Only employees can be added to rooms', 400, 'chat.onlyEmployeesInRoom');
    }

    await pool.query(
      'INSERT IGNORE INTO chat_participants (chat_id, user_id) VALUES (?, ?)',
      [chatId, targetUserId]
    );
    await pool.query('UPDATE chats SET updated_at = NOW() WHERE id = ?', [chatId]);

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

/**
 * DELETE /api/chat/[id]/participants
 * Remove an employee participant from an internal room (admin only).
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const chatId = params.id;
    if (!chatId) return errorResponse('Chat ID is required', 400, 'error.chatIdRequired');

    const body = await request.json().catch(() => ({}));
    const actorUserId = body.actorUserId || body.adminId || body.requesterId;
    const targetUserId = body.participantId || body.targetUserId || body.userId;
    if (!actorUserId || !targetUserId) {
      return validationError('actorUserId and participantId are required', 'error.missingRequiredFields');
    }

    const [adminRows] = await pool.query(
      'SELECT id FROM users WHERE id = ? AND role = ?',
      [actorUserId, 'admin']
    ) as any[];
    if (adminRows.length === 0) return unauthorizedError();

    const [chatRows] = await pool.query('SELECT id, type FROM chats WHERE id = ?', [chatId]) as any[];
    if (chatRows.length === 0) return errorResponse('Chat not found', 404, 'error.chatNotFound');
    if (chatRows[0].type !== 'internal_room') {
      return errorResponse('Only internal rooms can be managed', 400, 'chat.onlyInternalRoomManage');
    }

    const [userRows] = await pool.query(
      'SELECT id, role FROM users WHERE id = ?',
      [targetUserId]
    ) as any[];
    if (userRows.length === 0) return errorResponse('User not found', 404, 'error.userNotFound');
    if (userRows[0].role !== 'employee') {
      return errorResponse('Only employees can be removed from rooms', 400, 'chat.onlyEmployeesInRoom');
    }

    const [result] = await pool.query(
      'DELETE FROM chat_participants WHERE chat_id = ? AND user_id = ?',
      [chatId, targetUserId]
    ) as any[];
    await pool.query('UPDATE chats SET updated_at = NOW() WHERE id = ?', [chatId]);

    return successResponse({ removed: result?.affectedRows > 0 });
  } catch (error: any) {
    console.error('Remove participant error:', error);
    return serverError();
  }
}
