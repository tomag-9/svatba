import { NextResponse } from 'next/server';
import { getSessionCookieName } from '@/lib/auth';

export async function GET() {
  const response = NextResponse.redirect(new URL('/', 'http://localhost'));
  response.cookies.set(getSessionCookieName(), '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: new Date(0)
  });
  return response;
}
