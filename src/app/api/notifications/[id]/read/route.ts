import { NextRequest } from 'next/server';
import pool from '@/lib/db';
import { successResponse, errorResponse, notFoundError, serverError } from '@/lib/api';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if notification exists
    const [existing] = await pool.query(
      'SELECT id FROM notifications WHERE id = ?',
      [params.id]
    ) as any[];

    if (existing.length === 0) {
      return notFoundError('Notification');
    }

    await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = ?',
      [params.id]
    );

    return successResponse({}, 'Notification marked as read');
  } catch (error: any) {
    console.error('Mark notification read error:', error);
    return serverError();
  }
}
