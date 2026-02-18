import { NextRequest } from 'next/server';
import pool from '@/lib/db';
import { saveLoanNotesTranslations } from '@/lib/translations';
import { translateToBothLanguages } from '@/lib/translate';
import { successResponse, errorResponse, validationError, notFoundError, serverError } from '@/lib/api';
import { createNotificationAndPush } from '@/lib/notify';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const customerId = searchParams.get('customerId');
    const employeeId = searchParams.get('employeeId');
    const status = searchParams.get('status');
    const locale = searchParams.get('locale') || 'en';

    let query = `
      SELECT l.*,
        lt_en.notes as notes_en,
        lt_ar.notes as notes_ar
      FROM loans l
      LEFT JOIN loan_translations lt_en ON l.id = lt_en.loan_id AND lt_en.locale = 'en'
      LEFT JOIN loan_translations lt_ar ON l.id = lt_ar.loan_id AND lt_ar.locale = 'ar'
      WHERE 1=1
    `;
    const params: any[] = [];

    if (customerId) {
      query += ' AND l.customer_id = ?';
      params.push(customerId);
    }

    if (employeeId) {
      query += ' AND l.employee_id = ?';
      params.push(employeeId);
    }

    if (status) {
      query += ' AND l.status = ?';
      params.push(status);
    }

    query += ' ORDER BY l.created_at DESC';

    const [rows] = await pool.query(query, params) as any[];

    const loans = rows.map((row: any) => {
      const notes = locale === 'ar' ? (row.notes_ar || row.notes_en || null) : (row.notes_en || row.notes_ar || null);
      return {
        id: row.id,
        customerId: row.customer_id,
        employeeId: row.employee_id,
        amount: parseFloat(row.amount),
        interestRate: parseFloat(row.interest_rate),
        numberOfInstallments: row.number_of_installments,
        installmentTotal: parseFloat(row.installment_total),
        startDate: row.start_date,
        status: row.status,
        notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    });

    return successResponse(loans);
  } catch (error: any) {
    console.error('Get loans error:', error);
    return serverError();
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[Loans API] POST request body:', body);
    
    const {
      customerId,
      employeeId,
      amount,
      interestRate,
      numberOfInstallments,
      installmentTotal,
      startDate,
      status,
      notes,
    } = body;

    // Validate required fields
    if (!customerId || !employeeId) {
      console.log('[Loans API] Missing customerId or employeeId');
      return validationError('Customer and employee are required', 'error.missingRequiredFields');
    }
    
    const amountNum = typeof amount === 'string' ? parseFloat(amount) : amount;
    const interestRateNum = typeof interestRate === 'string' ? parseFloat(interestRate) : interestRate;
    const numberOfInstallmentsNum = typeof numberOfInstallments === 'string' ? parseInt(numberOfInstallments, 10) : numberOfInstallments;
    
    if (!amountNum || isNaN(amountNum) || amountNum <= 0) {
      console.log('[Loans API] Invalid amount:', amount);
      return validationError('Valid amount is required', 'error.missingRequiredFields');
    }
    
    if (interestRateNum === undefined || interestRateNum === null || isNaN(interestRateNum) || interestRateNum < 0) {
      console.log('[Loans API] Invalid interestRate:', interestRate);
      return validationError('Valid interest rate is required', 'error.missingRequiredFields');
    }
    
    if (!numberOfInstallmentsNum || isNaN(numberOfInstallmentsNum) || numberOfInstallmentsNum <= 0) {
      console.log('[Loans API] Invalid numberOfInstallments:', numberOfInstallments);
      return validationError('Valid number of installments is required', 'error.missingRequiredFields');
    }
    
    if (!startDate) {
      console.log('[Loans API] Missing startDate');
      return validationError('Start date is required', 'error.missingRequiredFields');
    }

    // Check if customer exists
    const [customers] = await pool.query(
      'SELECT id FROM users WHERE id = ? AND role = ?',
      [customerId, 'customer']
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

    const loanId = `loan-${Date.now()}`;

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Create loan
      const finalInstallmentTotal = installmentTotal ? 
        (typeof installmentTotal === 'string' ? parseFloat(installmentTotal) : installmentTotal) :
        amountNum * (1 + interestRateNum / 100);
      
      console.log('[Loans API] Inserting loan:', {
        loanId,
        customerId,
        employeeId,
        amount: amountNum,
        interestRate: interestRateNum,
        numberOfInstallments: numberOfInstallmentsNum,
        installmentTotal: finalInstallmentTotal,
        startDate,
        status: status || 'under_review',
      });
      
      await connection.query(
        `INSERT INTO loans (
          id, customer_id, employee_id, amount, interest_rate,
          number_of_installments, installment_total, start_date, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          loanId,
          customerId,
          employeeId,
          amountNum,
          interestRateNum,
          numberOfInstallmentsNum,
          finalInstallmentTotal,
          startDate,
          status || 'under_review',
        ]
      );

      // Translate notes to EN/AR and save
      if (notes != null && String(notes).trim() !== '') {
        let notesEn = String(notes);
        let notesAr = String(notes);
        try {
          const translated = await translateToBothLanguages(notesEn);
          notesEn = translated.en;
          notesAr = translated.ar;
        } catch (e) {
          console.warn('Loan notes translation failed, using original:', e);
        }
        await saveLoanNotesTranslations(loanId, notesEn, notesAr);
      }

      await connection.commit();

      // Return created loan
      const [rows] = await pool.query(
        `SELECT l.*,
          lt_en.notes as notes_en,
          lt_ar.notes as notes_ar
        FROM loans l
        LEFT JOIN loan_translations lt_en ON l.id = lt_en.loan_id AND lt_en.locale = 'en'
        LEFT JOIN loan_translations lt_ar ON l.id = lt_ar.loan_id AND lt_ar.locale = 'ar'
        WHERE l.id = ?`,
        [loanId]
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
        createdAt: loan.created_at,
        updatedAt: loan.updated_at,
      };

      // Notify customer and employee with EN/AR so each sees in their language
      const amountStr = String(parseFloat(loan.amount));
      const [custRow] = await pool.query(
        `SELECT ut_en.name as name_en, ut_ar.name as name_ar FROM users u
         LEFT JOIN user_translations ut_en ON u.id = ut_en.user_id AND ut_en.locale = 'en'
         LEFT JOIN user_translations ut_ar ON u.id = ut_ar.user_id AND ut_ar.locale = 'ar'
         WHERE u.id = ?`,
        [customerId]
      ) as any[];
      const custNameEn = custRow?.[0]?.name_en || custRow?.[0]?.name_ar || 'Customer';
      const custNameAr = custRow?.[0]?.name_ar || custRow?.[0]?.name_en || 'عميل';

      await createNotificationAndPush(
        customerId,
        'New Loan Created',
        'تم إنشاء قرض جديد',
        `A loan of ${amountStr} has been created for you.`,
        `تم إنشاء قرض بمبلغ ${amountStr} لك.`,
        'info'
      );
      await createNotificationAndPush(
        employeeId,
        'New Loan Created',
        'تم إنشاء قرض جديد',
        `A loan for ${custNameEn} has been created (${amountStr}).`,
        `تم إنشاء قرض للعميل ${custNameAr} (${amountStr}).`,
        'info'
      );

      return successResponse(loanData, 'Loan created successfully', 'error.loanCreatedSuccessfully');
    } catch (error) {
      await connection.rollback();
      console.error('[Loans API] Transaction error:', error);
      throw error;
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('[Loans API] Create loan error:', error);
    console.error('[Loans API] Error stack:', error?.stack);
    return serverError(error?.message || 'Failed to create loan');
  }
}
