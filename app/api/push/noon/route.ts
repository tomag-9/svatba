import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { broadcastPushNotification } from '@/lib/push';
import { getWeddingNotificationCopy, resetCountdownForToday } from '@/lib/wedding-copy';

const DAY_MS = 1000 * 60 * 60 * 24;

function getLocalDateKey(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Bratislava',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
}

function isAuthorized(request: Request) {
  const secret = process.env.INTERNAL_PUSH_SECRET;
  if (!secret) {
    return true;
  }

  return request.headers.get('authorization') === `Bearer ${secret}`;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const deliveryKey = `angie-noon:${getLocalDateKey()}`;

  try {
    await prisma.pushDeliveryLog.create({ data: { key: deliveryKey } });
  } catch {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const reset = await resetCountdownForToday();
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
    return NextResponse.json({ ok: true, nextLine: reset.nextLine, ...result });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Push send failed' }, { status: 500 });
  }
}
