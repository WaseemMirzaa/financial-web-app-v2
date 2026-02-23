import { NextRequest } from 'next/server';
import pool from '@/lib/db';
import { successResponse, errorResponse, notFoundError, serverError, validationError } from '@/lib/api';
import { syncCustomerUnifiedChat } from '@/lib/customer-chat';

export const dynamic = 'force-dynamic';

/** GET: list employees assigned to this loan's customer (customer assignment = loan access) */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const loanId = params.id;
    const [loanRows] = await pool.query(
      'SELECT customer_id FROM loans WHERE id = ?',
      [loanId]
    ) as any[];
    if (loanRows.length === 0) return notFoundError('Loan');
    const customerId = loanRows[0].customer_id;

    const [rows] = await pool.query(
      'SELECT employee_id FROM employee_customer_assignments WHERE customer_id = ? ORDER BY employee_id',
      [customerId]
    ) as any[];
    const employeeIds = rows.map((r: any) => r.employee_id);

    return successResponse(employeeIds);
  } catch (error: any) {
    console.error('Get loan employees error:', error);
    return serverError();
  }
}

/** POST: add an employee to this loan's customer (customer assignment; they get access to all customer loans) */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const loanId = params.id;
    const body = await request.json();
    const { employeeId } = body;
    if (!employeeId) return validationError('employeeId is required', 'error.missingRequiredFields');

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [loan] = await connection.query(
        'SELECT id, customer_id FROM loans WHERE id = ?',
        [loanId]
      ) as any[];
      if (loan.length === 0) {
        await connection.rollback();
        return notFoundError('Loan');
      }
      const customerId = loan[0].customer_id;

      const [emp] = await connection.query(
        'SELECT id FROM users WHERE id = ? AND role = ?',
        [employeeId, 'employee']
      ) as any[];
      if (emp.length === 0) {
        await connection.rollback();
        return notFoundError('Employee');
      }

      await connection.query(
        'INSERT IGNORE INTO employee_customer_assignments (employee_id, customer_id) VALUES (?, ?)',
        [employeeId, customerId]
      );

      await connection.commit();
    } catch (e) {
      await connection.rollback();
      throw e;
    } finally {
      connection.release();
    }
    await syncCustomerUnifiedChat(customerId);
    return successResponse({ added: true });
  } catch (error: any) {
    console.error('Add loan employee error:', error);
    return serverError();
  }
}

/** PUT: set full list of employees assigned to this customer (customer assignment; syncs unified chat) */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const loanId = params.id;
    const body = await request.json();
    const rawIds = body.employeeIds;
    const employeeIds = Array.isArray(rawIds) ? rawIds.filter((id: string) => id && typeof id === 'string') : [];
    if (employeeIds.length === 0) return validationError('employeeIds array with at least one id is required', 'error.missingRequiredFields');

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [loan] = await connection.query(
        'SELECT id, customer_id FROM loans WHERE id = ?',
        [loanId]
      ) as any[];
      if (loan.length === 0) {
        await connection.rollback();
        return notFoundError('Loan');
      }
      const customerId = loan[0].customer_id;

      for (const eid of employeeIds) {
        const [emp] = await connection.query(
          'SELECT id FROM users WHERE id = ? AND role = ?',
          [eid, 'employee']
        ) as any[];
        if (emp.length === 0) {
          await connection.rollback();
          return notFoundError('Employee');
        }
      }

      const primaryId = employeeIds[0];
      await connection.query('UPDATE loans SET employee_id = ? WHERE id = ?', [primaryId, loanId]);
      await connection.query('DELETE FROM employee_customer_assignments WHERE customer_id = ?', [customerId]);
      for (const eid of employeeIds) {
        await connection.query(
          'INSERT INTO employee_customer_assignments (employee_id, customer_id) VALUES (?, ?)',
          [eid, customerId]
        );
      }

      await connection.commit();
    } catch (e) {
      await connection.rollback();
      throw e;
    } finally {
      connection.release();
    }
    await syncCustomerUnifiedChat(customerId);
    return successResponse({ updated: true });
  } catch (error: any) {
    console.error('Set loan employees error:', error);
    return serverError();
  }
}

/** DELETE: remove an employee from this customer (loses access to all customer loans and chat) */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const loanId = params.id;
    const employeeId = request.nextUrl.searchParams.get('employeeId');
    if (!employeeId) return validationError('employeeId query is required', 'error.missingRequiredFields');

    let customerId: string = '';
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [loan] = await connection.query('SELECT id, customer_id FROM loans WHERE id = ?', [loanId]) as any[];
      if (loan.length === 0) {
        await connection.rollback();
        return notFoundError('Loan');
      }
      customerId = loan[0].customer_id;

      await connection.query(
        'DELETE FROM employee_customer_assignments WHERE customer_id = ? AND employee_id = ?',
        [customerId, employeeId]
      );

      const [loanRow] = await connection.query(
        'SELECT employee_id FROM loans WHERE id = ?',
        [loanId]
      ) as any[];
      const currentPrimary = loanRow?.[0]?.employee_id;
      if (currentPrimary === employeeId) {
        const [remaining] = await connection.query(
          'SELECT employee_id FROM employee_customer_assignments WHERE customer_id = ? ORDER BY employee_id LIMIT 1',
          [customerId]
        ) as any[];
        const newPrimary = remaining?.[0]?.employee_id ?? null;
        await connection.query(
          'UPDATE loans SET employee_id = ? WHERE id = ?',
          [newPrimary, loanId]
        );
      }

      await connection.commit();
    } catch (e) {
      await connection.rollback();
      throw e;
    } finally {
      connection.release();
    }
    await syncCustomerUnifiedChat(customerId);
    return successResponse({ removed: true });
  } catch (error: any) {
    console.error('Remove loan employee error:', error);
    return serverError();
  }
}
