import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const res = NextResponse.next();
  const origin = request.headers.get('origin');
  const allowed = process.env.CORS_ORIGIN;

  if (allowed && origin) {
    const list = allowed.split(',').map((o) => o.trim());
    if (list.includes('*') || list.includes(origin)) {
      res.headers.set('Access-Control-Allow-Origin', list.includes('*') ? '*' : origin);
    }
  }

  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.headers.set('Access-Control-Max-Age', '86400');

  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers: res.headers });
  }

  return res;
}
