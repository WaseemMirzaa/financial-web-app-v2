import { NextRequest } from 'next/server';
import pool from '@/lib/db';
import { successResponse, validationError, errorResponse, serverError } from '@/lib/api';

export const dynamic = 'force-dynamic';

/**
 * POST /api/chat/get-or-create-admin-employee
 * Admin only: get existing or create a 1:1 internal room with an employee.
 * Body: { adminId: string, employeeId: string }
 * Returns: { chatId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminId, employeeId } = body;

    if (!adminId || !employeeId) {
      return validationError('adminId and employeeId are required', 'error.missingRequiredFields');
    }

    const [adminRows] = await pool.query(
      `SELECT id FROM users WHERE id = ? AND role = 'admin'`,
      [adminId]
    ) as any[];
    if (adminRows.length === 0) {
      return errorResponse('Admin not found', 403, 'error.accessDenied');
    }

    const [empRows] = await pool.query(
      `SELECT u.id, u.email,
        ut_en.name AS name_en, ut_ar.name AS name_ar
       FROM users u
       LEFT JOIN user_translations ut_en ON u.id = ut_en.user_id AND ut_en.locale = 'en'
       LEFT JOIN user_translations ut_ar ON u.id = ut_ar.user_id AND ut_ar.locale = 'ar'
       WHERE u.id = ? AND u.role = 'employee'`,
      [employeeId]
    ) as any[];
    if (empRows.length === 0) {
      return errorResponse('Employee not found', 404, 'error.userNotFound');
    }
    const emp = empRows[0] as any;
    const employeeName = emp.name_en || emp.name_ar || emp.email || 'Employee';

    // Find existing internal_room with exactly these two participants
    const [existing] = await pool.query(
      `SELECT c.id FROM chats c
       INNER JOIN chat_participants cp1 ON c.id = cp1.chat_id AND cp1.user_id = ?
       INNER JOIN chat_participants cp2 ON c.id = cp2.chat_id AND cp2.user_id = ?
       WHERE c.type = 'internal_room'
       AND (SELECT COUNT(*) FROM chat_participants WHERE chat_id = c.id) = 2`,
      [adminId, employeeId]
    ) as any[];

    if (existing && existing.length > 0) {
      return successResponse({ chatId: existing[0].id });
    }

    const chatId = `chat-room-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const roomName = `Direct: ${employeeName}`;

    await pool.query(
      `INSERT INTO chats (id, type, room_name, created_by) VALUES (?, 'internal_room', ?, ?)`,
      [chatId, roomName, adminId]
    );
    await pool.query(
      `INSERT INTO chat_participants (chat_id, user_id) VALUES (?, ?), (?, ?)`,
      [chatId, adminId, chatId, employeeId]
    );

    return successResponse({ chatId });
  } catch (error: any) {
    console.error('Get-or-create admin-employee chat error:', error);
    return serverError();
  }
}
