import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/api';

export async function POST(request: NextRequest) {
  // In a real app, this would invalidate the session/token
  // For now, just return success
  return successResponse({}, 'Logged out successfully');
}
