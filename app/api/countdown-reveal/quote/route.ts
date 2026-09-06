import { NextResponse } from 'next/server';

import { readJsonBody } from '@/lib/request';
import { getWeddingRole, getWeddingRoleFromCookieHeader } from '@/lib/wedding-role';
import { selectCountdownLineForMood } from '@/lib/wedding-copy';

export async function POST(request: Request) {
  const role = getWeddingRole(getWeddingRoleFromCookieHeader(request.headers.get('cookie')), 'ANGIE');

  if (role !== 'ANGIE') {
    return NextResponse.json({ error: 'Citát podľa nálady môže vybrať iba Angie.' }, { status: 403 });
  }

  const body = await readJsonBody<{ mood?: unknown }>(request);
  const mood = typeof body?.mood === 'string' ? body.mood : '';

  if (!mood) {
    return NextResponse.json({ error: 'Chýba nálada.' }, { status: 400 });
  }

  try {
    const result = await selectCountdownLineForMood(mood);

    if (!result.line) {
      return NextResponse.json({ error: 'V tejto kategórii zatiaľ nie je žiadny citát.' }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      category: result.category,
      line: {
        id: result.line.id ?? null,
        text: result.line.text,
        mediaDataUrl: result.line.mediaDataUrl ?? null,
        mediaAlt: result.line.mediaAlt ?? null,
        mediaDescription: result.line.mediaDescription ?? null,
        mediaType: result.line.mediaType ?? 'image'
      }
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Citát sa nepodarilo vybrať.' }, { status: 500 });
  }
}
