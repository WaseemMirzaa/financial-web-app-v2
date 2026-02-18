import { NextResponse } from 'next/server';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errorKey?: string; // Translation key for error message
  message?: string;
  messageKey?: string; // Translation key for success message
}

export function successResponse<T>(data: T, message?: string, messageKey?: string): NextResponse<ApiResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    ...(message && { message }),
    ...(messageKey && { messageKey }),
  });
}

export function errorResponse(
  error: string,
  status: number = 400,
  errorKey?: string
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
      ...(errorKey && { errorKey }),
    },
    { status }
  );
}

export function validationError(message: string, errorKey?: string): NextResponse<ApiResponse> {
  return errorResponse(message, 400, errorKey);
}

export function unauthorizedError(): NextResponse<ApiResponse> {
  return errorResponse('Unauthorized', 401, 'error.unauthorized');
}

export function notFoundError(resource: string = 'Resource', errorKey?: string): NextResponse<ApiResponse> {
  const defaultKey = resource === 'Customer' ? 'error.customerNotFound' :
                     resource === 'Employee' ? 'error.employeeNotFound' :
                     resource === 'Loan' ? 'error.loanNotFound' :
                     resource === 'Notification' ? 'error.notificationNotFound' :
                     resource === 'User' ? 'error.userNotFound' :
                     undefined;
  return errorResponse(`${resource} not found`, 404, errorKey || defaultKey);
}

export function serverError(message: string = 'Internal server error'): NextResponse<ApiResponse> {
  return errorResponse(message, 500, 'error.internalServerError');
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate required fields
 */
export function validateRequired(
  data: Record<string, any>,
  fields: string[]
): { valid: boolean; missing: string[] } {
  const missing = fields.filter((field) => !data[field] || data[field] === '');
  return {
    valid: missing.length === 0,
    missing,
  };
}

export { validateRequired as default };
