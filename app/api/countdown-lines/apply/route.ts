import { NextResponse } from 'next/server';

import { readJsonBody } from '@/lib/request';
import { getWeddingRole, getWeddingRoleFromCookieHeader } from '@/lib/wedding-role';
import { prisma } from '@/lib/prisma';
import { applyCountdownLineNowByText, getWeddingNotificationCopy } from '@/lib/wedding-copy';
import { broadcastPushNotification } from '@/lib/push';

export async function POST(request: Request) {
  const role = getWeddingRole(getWeddingRoleFromCookieHeader(request.headers.get('cookie')), 'TOMI');

  if (role !== 'TOMI') {
    return NextResponse.json({ error: 'Nevyhovajúce oprávnenie.' }, { status: 403 });
  }

  const body = await readJsonBody<{ id?: unknown }>(request);
  const id = typeof body?.id === 'string' ? body.id : '';

  if (!id) return NextResponse.json({ error: 'Chýba id.' }, { status: 400 });

  try {
    const record = await prisma.countdownLine.findUnique({ where: { id } });
    if (!record) return NextResponse.json({ error: 'Citát nenájdený.' }, { status: 404 });

    const line = await applyCountdownLineNowByText(record.text);

    const settings = await prisma.weddingSettings.findFirst({ orderBy: { createdAt: 'desc' } });
    const daysUntilWedding = settings?.weddingDate ? Math.ceil((settings.weddingDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
    const notification = getWeddingNotificationCopy(daysUntilWedding, settings?.weddingDateApproximate ?? false);

    const payload = {
      title: notification.title,
      body: notification.body,
      url: '/dashboard#countdown'
    };

    const result = await broadcastPushNotification(payload);

    return NextResponse.json({ ok: true, applied: line, push: result });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Zlyhalo' }, { status: 500 });
  }
}
