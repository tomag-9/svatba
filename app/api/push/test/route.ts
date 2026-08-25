import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { broadcastPushNotification } from '@/lib/push';
import { getWeddingNotificationCopy } from '@/lib/wedding-copy';

const DAY_MS = 1000 * 60 * 60 * 24;

export async function POST() {
  const settings = await prisma.weddingSettings.findFirst({ orderBy: { createdAt: 'desc' } });
  const daysUntilWedding = settings?.weddingDate ? Math.ceil((settings.weddingDate.getTime() - Date.now()) / DAY_MS) : null;
  const notification = getWeddingNotificationCopy(daysUntilWedding, settings?.weddingDateApproximate ?? false);

  const payload = {
    title: notification.title,
    body: notification.body,
    url: '/dashboard#countdown'
  };

  try {
    const result = await broadcastPushNotification(payload);
    return NextResponse.json({ ok: true, ...result, payload });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Push send failed' }, { status: 500 });
  }
}
