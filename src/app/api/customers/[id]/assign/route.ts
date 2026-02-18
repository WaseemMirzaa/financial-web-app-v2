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
  try {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Remove assignment
      await connection.query(
        'UPDATE customers SET assigned_employee_id = ? WHERE id = ?',
        ['', params.id]
      );

      // Remove from employee_customer_assignments
      await connection.query(
        'DELETE FROM employee_customer_assignments WHERE customer_id = ?',
        [params.id]
      );

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
    return serverError();
  }
}
