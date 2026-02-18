import { NextRequest } from 'next/server';
import pool from '@/lib/db';
import { saveLoanNotesTranslations } from '@/lib/translations';
import { successResponse, errorResponse, notFoundError, serverError } from '@/lib/api';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const [rows] = await pool.query(
      `SELECT l.*,
        lt_en.notes as notes_en,
        lt_ar.notes as notes_ar
      FROM loans l
      LEFT JOIN loan_translations lt_en ON l.id = lt_en.loan_id AND lt_en.locale = 'en'
      LEFT JOIN loan_translations lt_ar ON l.id = lt_ar.loan_id AND lt_ar.locale = 'ar'
      WHERE l.id = ?`,
      [params.id]
    ) as any[];

    if (rows.length === 0) {
      return notFoundError('Loan');
    }

    const loan = rows[0];
    const loanData = {
      id: loan.id,
      customerId: loan.customer_id,
      employeeId: loan.employee_id,
      amount: parseFloat(loan.amount),
      interestRate: parseFloat(loan.interest_rate),
      numberOfInstallments: loan.number_of_installments,
      installmentTotal: parseFloat(loan.installment_total),
      startDate: loan.start_date,
      status: loan.status,
      notes: loan.notes_en || loan.notes_ar || null,
      notesKey: loan.notes_en ? `loan.notes.${loan.id}` : undefined,
      createdAt: loan.created_at,
      updatedAt: loan.updated_at,
    };

    return successResponse(loanData);
  } catch (error: any) {
    console.error('Get loan error:', error);
    return serverError();
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const {
      amount,
      interestRate,
      numberOfInstallments,
      installmentTotal,
      startDate,
      status,
      notes,
    } = body;

    // Check if loan exists
    const [existing] = await pool.query(
      'SELECT id FROM loans WHERE id = ?',
      [params.id]
    ) as any[];

    if (existing.length === 0) {
      return notFoundError('Loan');
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Update loan
      const updateFields: string[] = [];
      const updateValues: any[] = [];

      if (amount !== undefined) {
        updateFields.push('amount = ?');
        updateValues.push(amount);
      }
      if (interestRate !== undefined) {
        updateFields.push('interest_rate = ?');
        updateValues.push(interestRate);
      }
      if (numberOfInstallments !== undefined) {
        updateFields.push('number_of_installments = ?');
        updateValues.push(numberOfInstallments);
      }
      if (installmentTotal !== undefined) {
        updateFields.push('installment_total = ?');
        updateValues.push(installmentTotal);
      }
      if (startDate !== undefined) {
        updateFields.push('start_date = ?');
        updateValues.push(startDate);
      }
      if (status !== undefined) {
        updateFields.push('status = ?');
        updateValues.push(status);
      }

      if (updateFields.length > 0) {
        updateValues.push(params.id);
        await connection.query(
          `UPDATE loans SET ${updateFields.join(', ')} WHERE id = ?`,
          updateValues
        );
      }

      // Update notes translations if provided
      if (notes !== undefined) {
        await saveLoanNotesTranslations(params.id, notes, notes);
      }

      await connection.commit();

      // Return updated loan
      const [rows] = await pool.query(
        `SELECT l.*,
          lt_en.notes as notes_en,
          lt_ar.notes as notes_ar
        FROM loans l
        LEFT JOIN loan_translations lt_en ON l.id = lt_en.loan_id AND lt_en.locale = 'en'
        LEFT JOIN loan_translations lt_ar ON l.id = lt_ar.loan_id AND lt_ar.locale = 'ar'
        WHERE l.id = ?`,
        [params.id]
      ) as any[];

      const loan = rows[0];
      const loanData = {
        id: loan.id,
        customerId: loan.customer_id,
        employeeId: loan.employee_id,
        amount: parseFloat(loan.amount),
        interestRate: parseFloat(loan.interest_rate),
        numberOfInstallments: loan.number_of_installments,
        installmentTotal: parseFloat(loan.installment_total),
        startDate: loan.start_date,
        status: loan.status,
        notes: loan.notes_en || loan.notes_ar || null,
        notesKey: loan.notes_en ? `loan.notes.${loan.id}` : undefined,
        createdAt: loan.created_at,
        updatedAt: loan.updated_at,
      };

      return successResponse(loanData, 'Loan updated successfully', 'error.loanUpdatedSuccessfully');
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('Update loan error:', error);
    return serverError();
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if loan exists
    const [existing] = await pool.query(
      'SELECT id FROM loans WHERE id = ?',
      [params.id]
    ) as any[];

    if (existing.length === 0) {
      return notFoundError('Loan');
    }

    await pool.query('DELETE FROM loans WHERE id = ?', [params.id]);

    return successResponse({}, 'Loan deleted successfully', 'error.loanDeletedSuccessfully');
  } catch (error: any) {
    console.error('Delete loan error:', error);
    return serverError();
  }
}
