import { NextResponse } from 'next/server';

import { getWeddingNotificationCopy, resetCountdownForToday } from '@/lib/wedding-copy';
import { getWeddingRole, getWeddingRoleFromCookieHeader } from '@/lib/wedding-role';
import { prisma } from '@/lib/prisma';
import { broadcastPushNotification } from '@/lib/push';

export async function POST(request: Request) {
  const role = getWeddingRole(getWeddingRoleFromCookieHeader(request.headers.get('cookie')), 'ANGIE');

  if (role !== 'TOMI') {
    return NextResponse.json({ error: 'Nevyhovujúce oprávnenie.' }, { status: 403 });
  }

  try {
    await resetCountdownForToday();

    const settings = await prisma.weddingSettings.findFirst({ orderBy: { createdAt: 'desc' } });
    const daysUntilWedding = settings?.weddingDate ? Math.ceil((settings.weddingDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

    const copy = getWeddingNotificationCopy(daysUntilWedding, settings?.weddingDateApproximate ?? false);
    const notification = {
      title: copy.title,
      body: copy.body,
      url: '/dashboard#countdown'
    };

    await broadcastPushNotification(notification);

    return NextResponse.json({ ok: true, daysUntilWedding, notification });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Reset zlyhal.' }, { status: 500 });
  }
}
