import { NextResponse } from 'next/server';
import { createSessionToken, getSessionCookieName, isValidPassword } from '@/lib/auth';

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { password?: string } | null;

  if (!body?.password) {
    return NextResponse.json({ error: 'Heslo je povinné' }, { status: 400 });
  }

  if (!(await isValidPassword(body.password))) {
    return NextResponse.json({ error: 'Nesprávne heslo' }, { status: 401 });
  }

  const { token, expiresAt } = await createSessionToken();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(getSessionCookieName(), token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: new Date(expiresAt)
  });

  return response;
}
