import { NextRequest } from 'next/server';
import pool from '@/lib/db';
import { successResponse, errorResponse, serverError, validationError } from '@/lib/api';
import { saveChatMessageTranslations } from '@/lib/translations';
import { translateToBothLanguages } from '@/lib/translate';

export const dynamic = 'force-dynamic';

async function checkCanReadChat(chatId: string, userId: string): Promise<boolean> {
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
 * POST /api/chat/[id]/messages/[messageId]/forward
 * Forward or move a message to another chat
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; messageId: string } }
) {
  try {
    const sourceChatId = params.id;
    const messageId = params.messageId;
    const body = await request.json();
    const { targetChatId, mode, userId } = body;

    if (!sourceChatId || !messageId || !targetChatId || !userId) {
      return validationError('sourceChatId, messageId, targetChatId, and userId are required', 'error.missingRequiredFields');
    }

    if (mode !== 'copy' && mode !== 'move') {
      return validationError('mode must be "copy" or "move"', 'error.invalidMode');
    }

    const canReadSource = await checkCanReadChat(sourceChatId, userId);
    const canReadTarget = await checkCanReadChat(targetChatId, userId);

    if (!canReadSource) {
      return errorResponse('Access denied to source chat', 403, 'error.accessDenied');
    }
    if (!canReadTarget) {
      return errorResponse('Access denied to target chat', 403, 'error.accessDenied');
    }

    const [sourceMessages] = await pool.query(
      `SELECT cm.*,
        cmt_en.content as content_en,
        cmt_ar.content as content_ar,
        cmt_en.sender_name as sender_name_en,
        cmt_ar.sender_name as sender_name_ar
      FROM chat_messages cm
      LEFT JOIN chat_message_translations cmt_en ON cm.id = cmt_en.message_id AND cmt_en.locale = 'en'
      LEFT JOIN chat_message_translations cmt_ar ON cm.id = cmt_ar.message_id AND cmt_ar.locale = 'ar'
      WHERE cm.id = ? AND cm.chat_id = ?`,
      [messageId, sourceChatId]
    ) as any[];

    if (sourceMessages.length === 0) {
      return errorResponse('Message not found', 404, 'error.messageNotFound');
    }

    const sourceMsg = sourceMessages[0];

    if (sourceMsg.is_deleted) {
      return errorResponse('Cannot forward deleted message', 400, 'error.cannotForwardDeleted');
    }

    const newMessageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    await pool.query(
      `INSERT INTO chat_messages (id, chat_id, sender_id, sender_name, sender_role, file_url, file_name, file_type, forwarded_from_message_id, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        newMessageId,
        targetChatId,
        sourceMsg.sender_id,
        sourceMsg.sender_name,
        sourceMsg.sender_role,
        sourceMsg.file_url || null,
        sourceMsg.file_name || null,
        sourceMsg.file_type || null,
        sourceMsg.id,
      ]
    );

    await saveChatMessageTranslations(
      newMessageId,
      sourceMsg.content_en || '',
      sourceMsg.content_ar || '',
      sourceMsg.sender_name_en || 'Unknown',
      sourceMsg.sender_name_ar || 'Unknown'
    );

    await pool.query(`UPDATE chats SET updated_at = NOW() WHERE id = ?`, [targetChatId]);

    if (mode === 'move') {
      await pool.query(
        `UPDATE chat_messages SET is_deleted = TRUE, deleted_at = NOW() WHERE id = ?`,
        [messageId]
      );
      await pool.query(`UPDATE chats SET updated_at = NOW() WHERE id = ?`, [sourceChatId]);
    }

    return successResponse(
      { messageId: newMessageId, mode },
      mode === 'move' ? 'Message moved successfully' : 'Message forwarded successfully',
      mode === 'move' ? 'chat.messageMoved' : 'chat.messageForwarded'
    );
  } catch (error: any) {
    console.error('Forward message error:', error);
    return serverError();
  }
}
