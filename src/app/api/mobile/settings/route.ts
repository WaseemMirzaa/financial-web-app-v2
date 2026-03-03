import { NextRequest } from 'next/server';
import pool from '@/lib/db';
import { successResponse, serverError } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  try {
    let forgetPasswordEnabled = true;
    let signupEnabled = false;
    let deleteAccountEnabled = true;

    try {
      const [rows] = await pool.query(
        `SELECT setting_key, setting_value FROM mobile_app_settings LIMIT 10`
      ) as any[];
      if (Array.isArray(rows) && rows.length > 0) {
        for (const row of rows) {
          const k = row?.setting_key;
          const v = row?.setting_value;
          if (k === 'forgetPasswordEnabled') forgetPasswordEnabled = v === '1' || v === true;
          if (k === 'signupEnabled') signupEnabled = v === '1' || v === true;
          if (k === 'deleteAccountEnabled') deleteAccountEnabled = v === '1' || v === true;
        }
      }
    } catch {
      // Table may not exist; use defaults
    }

    return successResponse({
      forgetPasswordEnabled,
      signupEnabled,
      deleteAccountEnabled,
    });
  } catch (error: unknown) {
    console.error('Mobile settings error:', error);
    return serverError(error instanceof Error ? error.message : 'Failed to load settings');
  }
}
