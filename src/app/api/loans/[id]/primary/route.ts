import { NextRequest } from 'next/server';
import pool from '@/lib/db';
import { successResponse, errorResponse, notFoundError, serverError, validationError, unauthorizedError } from '@/lib/api';

export const dynamic = 'force-dynamic';

/** POST: set the primary employee for this loan (only one primary). Employee must be on the loan. */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    if (!userId) return unauthorizedError();
    const [users] = await pool.query(
      'SELECT role FROM users WHERE id = ?',
      [userId]
    ) as any[];
    if (users.length === 0 || users[0].role !== 'admin') return unauthorizedError();

    const body = await request.json().catch(() => ({}));
    const { employeeId } = body;
    if (!employeeId) return validationError('employeeId is required', 'error.missingRequiredFields');

    const [loan] = await pool.query(
      'SELECT id, employee_id FROM loans WHERE id = ?',
      [params.id]
    ) as any[];
    if (loan.length === 0) return notFoundError('Loan');

    const [loanWithCust] = await pool.query(
      'SELECT customer_id FROM loans WHERE id = ?',
      [params.id]
    ) as any[];
    const customerId = loanWithCust[0]?.customer_id;
    const [assigned] = await pool.query(
      'SELECT 1 FROM employee_customer_assignments WHERE employee_id = ? AND customer_id = ?',
      [employeeId, customerId]
    ) as any[];
    if (assigned.length === 0) {
      return errorResponse('Employee must be assigned to this customer to be set as primary', 400, 'error.employeeNotAssigned');
    }

    await pool.query(
      'UPDATE loans SET employee_id = ? WHERE id = ?',
      [employeeId, params.id]
    );
    return successResponse({ primaryEmployeeId: employeeId });
  } catch (error: any) {
    console.error('Set primary employee error:', error);
    return serverError();
  }
}
