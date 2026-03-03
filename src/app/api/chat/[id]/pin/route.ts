import { NextRequest } from 'next/server';
import pool from '@/lib/db';
import { successResponse, errorResponse, serverError, validationError } from '@/lib/api';

export const dynamic = 'force-dynamic';

async function checkCanManageChat(chatId: string, userId: string): Promise<boolean> {
  const [chatRows] = await pool.query(`SELECT id, type FROM chats WHERE id = ?`, [chatId]) as any[];
  if (chatRows.length === 0) return false;
  
  const [userRows] = await pool.query(`SELECT role FROM users WHERE id = ?`, [userId]) as any[];
  if (userRows.length === 0) return false;
  const role = userRows[0].role;
  
  if (role === 'admin') return true;
  
  const [participants] = await pool.query(
    `SELECT user_id FROM chat_participants WHERE chat_id = ? AND user_id = ?`,
    [chatId, userId]
  ) as any[];
  
  return participants.length > 0;
}

/**
 * POST /api/chat/[id]/pin
 * Pin or unpin a message in a chat
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const chatId = params.id;
    const body = await request.json();
    const { messageId, userId } = body;

    if (!chatId || !userId) {
      return validationError('chatId and userId are required', 'error.missingRequiredFields');
    }

    const canManage = await checkCanManageChat(chatId, userId);
    if (!canManage) {
      return errorResponse('Access denied', 403, 'error.accessDenied');
    }

    // If messageId is null, unpin
    if (messageId === null) {
      await pool.query(
        `UPDATE chats SET pinned_message_id = NULL, pinned_message_at = NULL WHERE id = ?`,
        [chatId]
      );
      return successResponse({ pinned: false }, 'Message unpinned', 'chat.messageUnpinned');
    }

    // Verify message exists in this chat
    const [messages] = await pool.query(
      `SELECT id FROM chat_messages WHERE id = ? AND chat_id = ? AND is_deleted = FALSE`,
      [messageId, chatId]
    ) as any[];

    if (messages.length === 0) {
      return errorResponse('Message not found in this chat', 404, 'error.messageNotFound');
    }

    // Pin the message
    await pool.query(
      `UPDATE chats SET pinned_message_id = ?, pinned_message_at = NOW() WHERE id = ?`,
      [messageId, chatId]
    );

    return successResponse({ pinned: true, messageId }, 'Message pinned', 'chat.messagePinned');
  } catch (error: any) {
    console.error('Pin message error:', error);
    return serverError();
  }
}
