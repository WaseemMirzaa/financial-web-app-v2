import { NextRequest } from 'next/server';
import pool from '@/lib/db';
import { successResponse, errorResponse, unauthorizedError, serverError } from '@/lib/api';

export const dynamic = 'force-dynamic';

/** POST or GET: update last_seen_at for the current user. Call when tab is visible to keep presence fresh. */
export async function POST(request: NextRequest) {
  return runHeartbeat(request);
}

export async function GET(request: NextRequest) {
  return runHeartbeat(request);
}

async function runHeartbeat(request: NextRequest) {
  try {
    const userId =
      request.nextUrl.searchParams.get('userId') ||
      (request.method === 'POST' ? (await request.json().catch(() => ({}))).userId : null);

    if (!userId) {
      return unauthorizedError();
    }

    try {
      await pool.query(
        `UPDATE users SET last_seen_at = CURRENT_TIMESTAMP WHERE id = ? AND (is_deleted = FALSE OR is_deleted IS NULL)`,
        [userId]
      );
    } catch (e: any) {
      if (e?.code === 'ER_BAD_FIELD_ERROR' && e?.message?.includes('last_seen_at')) {
        return successResponse({ ok: true });
      }
      throw e;
    }

    return successResponse({ ok: true });
  } catch (error: any) {
    console.error('Heartbeat error:', error?.message || error);
    return serverError(error?.message);
  }
}
