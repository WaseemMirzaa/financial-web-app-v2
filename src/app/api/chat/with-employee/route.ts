import { NextRequest } from 'next/server';
import pool from '@/lib/db';
import { successResponse, validationError, errorResponse, serverError } from '@/lib/api';

/**
 * POST /api/chat/with-employee
 * DEPRECATED: Admin should not create 1-to-1 chats with employees.
 * Admin only participates in group internal rooms (Contracts, Follow-Up, Receipts).
 * This endpoint is disabled - returns 403.
 */
export async function POST(request: NextRequest) {
  return errorResponse(
    'Admin cannot create private chats with employees. Admin only participates in group internal rooms.',
    403,
    'chat.adminNoPrivateChats'
  );
}
