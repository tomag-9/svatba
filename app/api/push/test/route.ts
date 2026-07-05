import { NextResponse } from 'next/server';

import { getWeddingAlertSlot } from '@/lib/alert-slot';
import { prisma } from '@/lib/prisma';
import { broadcastPushNotification } from '@/lib/push';
import { getWeddingCountdownCopy } from '@/lib/wedding-copy';

const DAY_MS = 1000 * 60 * 60 * 24;

export async function POST() {
  const settings = await prisma.weddingSettings.findFirst({ orderBy: { createdAt: 'desc' } });
  const daysUntilWedding = settings?.weddingDate ? Math.ceil((settings.weddingDate.getTime() - Date.now()) / DAY_MS) : null;
  const slot = getWeddingAlertSlot();
  const countdown = settings ? getWeddingCountdownCopy({ daysUntilWedding, role: settings.role, slot, isApproximate: settings.weddingDateApproximate }) : null;

  const payload = {
    title: countdown?.title ?? 'Svadba planner',
    body: countdown?.dailyLine ?? 'Test push notifikácie',
    url: '/dashboard'
  };

  try {
    const result = await broadcastPushNotification(payload);
    return NextResponse.json({ ok: true, ...result, payload });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Push send failed' }, { status: 500 });
  }
}
