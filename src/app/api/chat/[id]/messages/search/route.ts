import { NextRequest } from 'next/server';
import pool from '@/lib/db';
import { successResponse, errorResponse, serverError, validationError } from '@/lib/api';

export const dynamic = 'force-dynamic';

/** Check if userId can read chatId. Returns null if allowed, or error response. */
async function checkCanReadChat(chatId: string, userId: string): Promise<ReturnType<typeof errorResponse> | null> {
  const [chatRows] = await pool.query(
    `SELECT id, type FROM chats WHERE id = ?`,
    [chatId]
  ) as any[];
  if (chatRows.length === 0) return errorResponse('Chat not found', 404, 'error.chatNotFound');

  const [userRows] = await pool.query(`SELECT role FROM users WHERE id = ?`, [userId]) as any[];
  if (userRows.length === 0) return errorResponse('User not found', 404, 'error.userNotFound');
  const role = userRows[0].role;
  const chatType = chatRows[0].type;

  const [participants] = await pool.query(
    `SELECT user_id FROM chat_participants WHERE chat_id = ?`,
    [chatId]
  ) as any[];
  const participantIds = participants.map((p: any) => p.user_id);
  const isParticipant = participantIds.includes(userId);

  if (role === 'admin') return null; // Admin can read any chat (monitor)
  if (role === 'customer') {
    if (!isParticipant || chatType !== 'customer_employee') return errorResponse('Access denied', 403, 'error.accessDenied');
    return null;
  }
  if (role === 'employee') {
    if (!isParticipant) return errorResponse('Access denied', 403, 'error.accessDenied');
    if (chatType === 'customer_employee') {
      const [customerInChat] = await pool.query(
        `SELECT cp.user_id FROM chat_participants cp
         INNER JOIN users u ON u.id = cp.user_id AND u.role = 'customer'
         WHERE cp.chat_id = ? LIMIT 1`,
        [chatId]
      ) as any[];
      const customerId = customerInChat?.[0]?.user_id;
      if (customerId) {
        const [assign] = await pool.query(
          `SELECT 1 FROM employee_customer_assignments WHERE employee_id = ? AND customer_id = ?`,
          [userId, customerId]
        ) as any[];
        if (assign.length === 0) return errorResponse('Access denied', 403, 'error.accessDenied');
      }
    }
    return null;
  }
  return errorResponse('Access denied', 403, 'error.accessDenied');
}

/**
 * GET /api/chat/[id]/messages/search
 * Search messages within a chat by keyword. Requires userId for access control.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const chatId = params.id;
    const searchParams = request.nextUrl.searchParams;
    const locale = searchParams.get('locale') || 'en';
    const userId = searchParams.get('userId');
    const query = (searchParams.get('query') || searchParams.get('q') || '').trim();
    const limitParam = searchParams.get('limit');

    if (!chatId) {
      return validationError('Chat ID is required', 'error.chatIdRequired');
    }
    if (!userId) {
      return validationError('userId is required for access control', 'error.userIdRequired');
    }
    if (!query || query.length < 2) {
      return validationError('Search query is too short', 'error.searchQueryTooShort');
    }

    const accessErr = await checkCanReadChat(chatId, userId);
    if (accessErr) return accessErr;

    const like = `%${query}%`;
    const limit = Math.min(Math.max(parseInt(limitParam || '50', 10) || 50, 1), 200);

    const [messages] = await pool.query(
      `SELECT cm.*,
        cmt_en.content as content_en,
        cmt_ar.content as content_ar,
        cmt_en.sender_name as sender_name_en,
        cmt_ar.sender_name as sender_name_ar
      FROM chat_messages cm
      LEFT JOIN chat_message_translations cmt_en ON cm.id = cmt_en.message_id AND cmt_en.locale = 'en'
      LEFT JOIN chat_message_translations cmt_ar ON cm.id = cmt_ar.message_id AND cmt_ar.locale = 'ar'
      WHERE cm.chat_id = ?
        AND cm.is_deleted = FALSE
        AND (
          (cmt_en.content IS NOT NULL AND cmt_en.content LIKE ?)
          OR (cmt_ar.content IS NOT NULL AND cmt_ar.content LIKE ?)
        )
      ORDER BY cm.timestamp ASC
      LIMIT ?`,
      [chatId, like, like, limit]
    ) as any[];

    const formattedMessages = messages.map((msg: any) => {
      const content = locale === 'ar'
        ? (msg.content_ar || msg.content_en || '')
        : (msg.content_en || msg.content_ar || '');

      const senderName = msg.sender_name ||
        msg.sender_name_en ||
        msg.sender_name_ar ||
        'Unknown';

      return {
        id: msg.id,
        chatId: msg.chat_id,
        senderId: msg.sender_id,
        senderName,
        senderRole: msg.sender_role,
        content,
        fileUrl: msg.file_url,
        fileName: msg.file_name,
        fileType: msg.file_type,
        isEdited: !!(msg.is_edited),
        editedAt: msg.edited_at || null,
        isDeleted: false,
        deletedAt: null,
        timestamp: msg.timestamp,
      };
    });

    return successResponse(formattedMessages);
  } catch (error: any) {
    console.error('Search messages error:', error);
    return serverError();
  }
}

