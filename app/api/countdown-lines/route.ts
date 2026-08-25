import { NextResponse } from 'next/server';

import { readJsonBody } from '@/lib/request';
import { appendAngieCountdownLine } from '@/lib/wedding-copy';
import { getWeddingRole, getWeddingRoleFromCookieHeader } from '@/lib/wedding-role';

export async function POST(request: Request) {
  const role = getWeddingRole(getWeddingRoleFromCookieHeader(request.headers.get('cookie')), 'TOMI');

  if (role !== 'TOMI') {
    return NextResponse.json({ error: 'Nové citáty môže pridávať iba Tomi.' }, { status: 403 });
  }

  const body = await readJsonBody<{ line?: unknown }>(request);
  const line = typeof body?.line === 'string' ? body.line : '';

  try {
    const savedLine = await appendAngieCountdownLine(line);
    return NextResponse.json({ ok: true, line: savedLine });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Citát sa nepodarilo uložiť.' }, { status: 400 });
  }
}
