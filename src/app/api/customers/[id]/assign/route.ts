import { NextRequest } from 'next/server';
import pool from '@/lib/db';
import { successResponse, errorResponse, notFoundError, serverError } from '@/lib/api';
import { createNotificationAndPush } from '@/lib/notify';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { employeeId } = body;

    if (!employeeId) {
      return errorResponse('Employee ID is required', 400, 'error.employeeIdRequired');
    }

    // Check if customer exists
    const [customers] = await pool.query(
      'SELECT id FROM customers WHERE id = ?',
      [params.id]
    ) as any[];

    if (customers.length === 0) {
      return notFoundError('Customer');
    }

    // Check if employee exists
    const [employees] = await pool.query(
      'SELECT id FROM users WHERE id = ? AND role = ?',
      [employeeId, 'employee']
    ) as any[];

    if (employees.length === 0) {
      return notFoundError('Employee');
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Update customer assignment
      await connection.query(
        'UPDATE customers SET assigned_employee_id = ? WHERE id = ?',
        [employeeId, params.id]
      );

      // Add to employee_customer_assignments if not exists
      await connection.query(
        `INSERT IGNORE INTO employee_customer_assignments (employee_id, customer_id) VALUES (?, ?)`,
        [employeeId, params.id]
      );

      // Create or get existing chat between customer and employee
      const [existingChats] = await connection.query(
        `SELECT c.id FROM chats c
         INNER JOIN chat_participants cp1 ON c.id = cp1.chat_id AND cp1.user_id = ?
         INNER JOIN chat_participants cp2 ON c.id = cp2.chat_id AND cp2.user_id = ?
         WHERE c.type = 'customer_employee'`,
        [params.id, employeeId]
      ) as any[];

      if (existingChats.length === 0) {
        // Create new chat
        const chatId = `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        await connection.query(
          `INSERT INTO chats (id, type) VALUES (?, 'customer_employee')`,
          [chatId]
        );
        // Add both participants
        await connection.query(
          `INSERT INTO chat_participants (chat_id, user_id) VALUES (?, ?), (?, ?)`,
          [chatId, params.id, chatId, employeeId]
        );
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    // Notify employee and customer with EN/AR (after commit so recipient sees in their language)
    const [custNames] = await pool.query(
      `SELECT ut_en.name as name_en, ut_ar.name as name_ar FROM users u
       LEFT JOIN user_translations ut_en ON u.id = ut_en.user_id AND ut_en.locale = 'en'
       LEFT JOIN user_translations ut_ar ON u.id = ut_ar.user_id AND ut_ar.locale = 'ar'
       WHERE u.id = ?`,
      [params.id]
    ) as any[];
    const [empNames] = await pool.query(
      `SELECT ut_en.name as name_en, ut_ar.name as name_ar FROM users u
       LEFT JOIN user_translations ut_en ON u.id = ut_en.user_id AND ut_en.locale = 'en'
       LEFT JOIN user_translations ut_ar ON u.id = ut_ar.user_id AND ut_ar.locale = 'ar'
       WHERE u.id = ?`,
      [employeeId]
    ) as any[];
    const customerNameEn = custNames?.[0]?.name_en || custNames?.[0]?.name_ar || 'Customer';
    const customerNameAr = custNames?.[0]?.name_ar || custNames?.[0]?.name_en || 'عميل';
    const employeeNameEn = empNames?.[0]?.name_en || empNames?.[0]?.name_ar || 'Employee';
    const employeeNameAr = empNames?.[0]?.name_ar || empNames?.[0]?.name_en || 'موظف';

    await createNotificationAndPush(
      employeeId,
      'New Customer Assigned',
      'تم تعيين عميل جديد',
      `${customerNameEn} has been assigned to you`,
      `تم تعيين ${customerNameAr} لك`,
      'info'
    );
    await createNotificationAndPush(
      params.id,
      'Employee Assigned to You',
      'تم تعيين موظف لك',
      `${employeeNameEn} has been assigned as your contact`,
      `تم تعيين ${employeeNameAr} كجهة اتصالك`,
      'info'
    );

    return successResponse({}, 'Employee assigned successfully');
  } catch (error: any) {
    console.error('Assign employee error:', error);
    return serverError();
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const customerId = params.id;
  if (!customerId) {
    return errorResponse('Customer ID is required', 400);
  }
  try {
    const [customers] = await pool.query(
      'SELECT id FROM customers WHERE id = ?',
      [customerId]
    ) as any[];
    if (customers.length === 0) {
      return notFoundError('Customer');
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.query(
        'UPDATE customers SET assigned_employee_id = NULL WHERE id = ?',
        [customerId]
      );
      try {
        await connection.query(
          'DELETE FROM employee_customer_assignments WHERE customer_id = ?',
          [customerId]
        );
      } catch (e: any) {
        if (e?.code !== 'ER_NO_SUCH_TABLE' && e?.code !== 'ER_BAD_FIELD_ERROR') {
          throw e;
        }
      }
      await connection.commit();
      return successResponse({}, 'Employee assignment removed successfully');
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('Remove assignment error:', error);
    return serverError(error?.message ?? 'Failed to remove assignment');
  }
}
