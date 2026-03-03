import { NextRequest } from 'next/server';
import pool from '@/lib/db';
import { successResponse, errorResponse, serverError } from '@/lib/api';

export const dynamic = 'force-dynamic';

/** Get user role from DB */
async function getUserRole(userId: string): Promise<'admin' | 'employee' | 'customer' | null> {
  const [rows] = await pool.query(
    `SELECT role FROM users WHERE id = ?`,
    [userId]
  ) as any[];
  return rows.length > 0 ? rows[0].role : null;
}

export async function GET(request: NextRequest) {
  try {
    const startedAt = Date.now();
    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
      return errorResponse('User ID is required', 400, 'error.userIdRequired');
    }

    const role = await getUserRole(userId);
    if (!role) {
      return successResponse([]);
    }

    let rows: any[] = [];

    if (role === 'admin') {
      // Admin: see all chats (monitor everything)
      const [all] = await pool.query(
        `SELECT c.* FROM chats c ORDER BY COALESCE(c.is_pinned, 0) DESC, c.updated_at DESC`
      ) as any[];
      rows = all;
    } else if (role === 'customer') {
      // Customer: unified chat(s) where they are a participant (one per customer, type customer_employee, no loan_id)
      const [chats] = await pool.query(
        `SELECT DISTINCT c.*
         FROM chats c
         INNER JOIN chat_participants cp ON c.id = cp.chat_id AND cp.user_id = ?
         WHERE c.type = 'customer_employee' AND (c.loan_id IS NULL OR c.loan_id = '')
         ORDER BY COALESCE(c.is_pinned, 0) DESC, c.updated_at DESC`,
        [userId]
      ) as any[];
      rows = chats || [];
    } else {
      // Employee: customer_employee chats (assigned customers) + internal_room chats where they are a participant
      let customerChats: any[] = [];
      let internalChats: any[] = [];
      try {
        [customerChats] = await pool.query(
          `SELECT DISTINCT c.*
           FROM chats c
           INNER JOIN chat_participants cp ON c.id = cp.chat_id AND cp.user_id = ?
           INNER JOIN chat_participants cp2 ON c.id = cp2.chat_id AND cp2.user_id != ?
           INNER JOIN users cust_user ON cust_user.id = cp2.user_id AND cust_user.role = 'customer'
             AND (cust_user.is_deleted = FALSE OR cust_user.is_deleted IS NULL) AND cust_user.is_active = TRUE
           INNER JOIN employee_customer_assignments eca ON eca.employee_id = ? AND eca.customer_id = cp2.user_id
           WHERE c.type = 'customer_employee' AND (c.loan_id IS NULL OR c.loan_id = '')
           ORDER BY COALESCE(c.is_pinned, 0) DESC, c.updated_at DESC`,
          [userId, userId, userId]
        ) as any[];
      } catch (e: any) {
        if (e?.code === 'ER_BAD_FIELD_ERROR' && e?.message?.includes('is_deleted')) {
          [customerChats] = await pool.query(
            `SELECT DISTINCT c.*
             FROM chats c
             INNER JOIN chat_participants cp ON c.id = cp.chat_id AND cp.user_id = ?
             INNER JOIN chat_participants cp2 ON c.id = cp2.chat_id AND cp2.user_id != ?
             INNER JOIN users cust_user ON cust_user.id = cp2.user_id AND cust_user.role = 'customer' AND cust_user.is_active = TRUE
             INNER JOIN employee_customer_assignments eca ON eca.employee_id = ? AND eca.customer_id = cp2.user_id
             WHERE c.type = 'customer_employee' AND (c.loan_id IS NULL OR c.loan_id = '')
             ORDER BY COALESCE(c.is_pinned, 0) DESC, c.updated_at DESC`,
            [userId, userId, userId]
          ) as any[];
        } else {
          throw e;
        }
      }
      const [internalRooms] = await pool.query(
        `SELECT DISTINCT c.*
         FROM chats c
         INNER JOIN chat_participants cp ON c.id = cp.chat_id AND cp.user_id = ?
         WHERE c.type = 'internal_room'
         ORDER BY COALESCE(c.is_pinned, 0) DESC, c.updated_at DESC`,
        [userId]
      ) as any[];
      internalChats = internalRooms || [];
      // Merge and sort by pinned then updated_at
      const byKey: Record<string, any> = {};
      [...(customerChats || []), ...internalChats].forEach((r) => { byKey[r.id] = r; });
      rows = Object.values(byKey).sort((a, b) => {
        const pinA = a.is_pinned ? 1 : 0;
        const pinB = b.is_pinned ? 1 : 0;
        if (pinB !== pinA) return pinB - pinA;
        const tA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
        const tB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
        return tB - tA;
      });
    }

    if (rows.length === 0) {
      return successResponse([]);
    }

    const chatIds = rows.map((chat) => chat.id);

    // Get last message for all chats in a single query
    const [lastMessageRows] = await pool.query(
      `SELECT * FROM (
        SELECT
          cm.*,
          cmt_en.content AS content_en,
          cmt_ar.content AS content_ar,
          cmt_en.sender_name AS sender_name_en,
          cmt_ar.sender_name AS sender_name_ar,
          ROW_NUMBER() OVER (PARTITION BY cm.chat_id ORDER BY cm.timestamp DESC) AS rn
        FROM chat_messages cm
        LEFT JOIN chat_message_translations cmt_en ON cm.id = cmt_en.message_id AND cmt_en.locale = 'en'
        LEFT JOIN chat_message_translations cmt_ar ON cm.id = cmt_ar.message_id AND cmt_ar.locale = 'ar'
        WHERE cm.chat_id IN (?)
      ) t
      WHERE t.rn = 1`,
      [chatIds]
    ) as any[];

    const lastMessageByChatId = new Map<string, any>();
    (lastMessageRows || []).forEach((m: any) => {
      lastMessageByChatId.set(m.chat_id, {
        id: m.id,
        content: m.is_deleted
          ? 'Message deleted'
          : (m.content_en || m.content_ar || ''),
        senderName: m.sender_name_en || m.sender_name_ar || '',
        timestamp: m.timestamp,
        isDeleted: m.is_deleted || false,
      });
    });

    // Get participants for all chats in a single query
    const [participantRows] = await pool.query(
      `SELECT cp.chat_id, cp.user_id, u.role, u.email,
        ut_en.name AS name_en,
        ut_ar.name AS name_ar
      FROM chat_participants cp
      INNER JOIN users u ON cp.user_id = u.id
      LEFT JOIN user_translations ut_en ON u.id = ut_en.user_id AND ut_en.locale = 'en'
      LEFT JOIN user_translations ut_ar ON u.id = ut_ar.user_id AND ut_ar.locale = 'ar'
      WHERE cp.chat_id IN (?)`,
      [chatIds]
    ) as any[];

    const participantsByChatId = new Map<string, any[]>();
    (participantRows || []).forEach((p: any) => {
      const existing = participantsByChatId.get(p.chat_id) || [];
      existing.push(p);
      participantsByChatId.set(p.chat_id, existing);
    });

    // Get unread counts for all chats in batched queries
    const [readStatusRows] = await pool.query(
      `SELECT chat_id, last_read_at
      FROM chat_read_status
      WHERE user_id = ? AND chat_id IN (?)`,
      [userId, chatIds]
    ) as any[];

    const lastReadByChatId = new Map<string, any>();
    (readStatusRows || []).forEach((r: any) => {
      lastReadByChatId.set(r.chat_id, r.last_read_at);
    });

    const chatsWithLastRead: string[] = [];
    const chatsWithoutLastRead: string[] = [];
    chatIds.forEach((id) => {
      const lastReadAt = lastReadByChatId.get(id);
      if (lastReadAt) {
        chatsWithLastRead.push(id);
      } else {
        chatsWithoutLastRead.push(id);
      }
    });

    const unreadCountByChatId = new Map<string, number>();

    if (chatsWithLastRead.length > 0) {
      const [unreadRowsWithLastRead] = await pool.query(
        `SELECT cm.chat_id, COUNT(*) AS count
        FROM chat_messages cm
        INNER JOIN chat_read_status crs
          ON cm.chat_id = crs.chat_id
          AND crs.user_id = ?
        WHERE cm.chat_id IN (?)
          AND cm.sender_id != ?
          AND cm.is_deleted = FALSE
          AND cm.timestamp > crs.last_read_at
        GROUP BY cm.chat_id`,
        [userId, chatsWithLastRead, userId]
      ) as any[];

      (unreadRowsWithLastRead || []).forEach((r: any) => {
        unreadCountByChatId.set(r.chat_id, r.count || 0);
      });
    }

    if (chatsWithoutLastRead.length > 0) {
      const [unreadRowsWithoutLastRead] = await pool.query(
        `SELECT chat_id, COUNT(*) AS count
        FROM chat_messages
        WHERE chat_id IN (?)
          AND sender_id != ?
          AND is_deleted = FALSE
        GROUP BY chat_id`,
        [chatsWithoutLastRead, userId]
      ) as any[];

      (unreadRowsWithoutLastRead || []).forEach((r: any) => {
        unreadCountByChatId.set(r.chat_id, r.count || 0);
      });
    }

    const chats = rows.map((chat: any) => {
      const lastMessage = lastMessageByChatId.get(chat.id);
      const participants = participantsByChatId.get(chat.id) || [];

      let participantNames: string[] = [];
      let participantIds: string[] = [];
      let assignedEmployeeName: string | null = null;
      let assignedEmployeeId: string | null = null;

      if (chat.type === 'customer_employee') {
        const customers = (participants || []).filter((p: any) => p.role === 'customer');
        const employees = (participants || []).filter((p: any) => p.role === 'employee');
        participantNames = customers.map((p: any) => p.name_en || p.name_ar || p.user_id);
        participantIds = participants.map((p: any) => p.user_id);
        if (employees.length > 0) {
          const emp = employees[0];
          assignedEmployeeName = emp.name_en || emp.name_ar || emp.user_id;
          assignedEmployeeId = emp.user_id;
        }
      } else if (chat.type === 'internal_room') {
        participantNames = participants.map((p: any) => {
          if (p.role === 'admin') return 'Admin';
          return p.name_en || p.name_ar || p.user_id;
        });
        participantIds = participants.map((p: any) => p.user_id);
      }

      const unreadCount = unreadCountByChatId.get(chat.id) || 0;

      return {
        id: chat.id,
        type: chat.type,
        roomName: chat.room_name,
        participantNames,
        participantIds,
        assignedEmployeeName,
        assignedEmployeeId,
        isPinned: Boolean(chat.is_pinned),
        pinnedAt: chat.pinned_at || null,
        pinnedMessageId: chat.pinned_message_id || null,
        pinnedMessageAt: chat.pinned_message_at || null,
        createdBy: chat.created_by || null,
        lastMessage,
        unreadCount,
        createdAt: chat.created_at,
        updatedAt: chat.updated_at,
      };
    });

    const durationMs = Date.now() - startedAt;
    console.log('Chat list stats', {
      userId,
      role,
      chatCount: chats.length,
      durationMs,
    });

    return successResponse(chats);
  } catch (error: any) {
    console.error('Get chats error:', error?.message || error);
    return successResponse([]);
  }
}
