import { NextRequest } from 'next/server';
import pool from '@/lib/db';
import { successResponse, errorResponse, serverError } from '@/lib/api';

/**
 * GET /api/chat/[id]/participants
 * Get list of participant user IDs for a chat
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

    const [participants] = await pool.query(
      `SELECT user_id FROM chat_participants WHERE chat_id = ?`,
      [chatId]
    ) as any[];

    const participantIds = participants.map((p: any) => p.user_id);

    return successResponse(participantIds);
  } catch (error: any) {
    console.error('Get participants error:', error);
    return serverError();
  }
}
