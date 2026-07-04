import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookieName, verifySessionToken } from '@/lib/auth';

const protectedPrefixes = ['/dashboard', '/timeline', '/tasks', '/invitees', '/finance', '/settings'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));

  if (!isProtected) {
    return NextResponse.next();
  }

  const token = request.cookies.get(getSessionCookieName())?.value;
  const isValid = await verifySessionToken(token);
  if (isValid) {
    return NextResponse.next();
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = '/';
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/dashboard/:path*', '/timeline/:path*', '/tasks/:path*', '/invitees/:path*', '/finance/:path*', '/settings/:path*']
};
