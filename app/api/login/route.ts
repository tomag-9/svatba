import { NextResponse } from 'next/server';
import { createSessionToken, getSessionCookieName, isValidPassword } from '@/lib/auth';
import { WEDDING_ROLE_COOKIE } from '@/lib/wedding-role';

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

  if (!request.headers.get('cookie')?.includes(`${WEDDING_ROLE_COOKIE}=`)) {
    response.cookies.set(WEDDING_ROLE_COOKIE, 'ANGIE', {
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 365
    });
  }

  return response;
}
