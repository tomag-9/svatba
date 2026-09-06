import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { readJsonBody } from '@/lib/request';
import { broadcastPushNotification } from '@/lib/push';
import { getWeddingRole, getWeddingRoleFromCookieHeader } from '@/lib/wedding-role';

function moodToCategory(mood: string) {
  switch (mood) {
    case 'LUBENE':
    case 'LOYAL':
      return 'ROMANTIC';
    case 'HORNY':
    case 'SEXY':
      return 'EROTIC';
    case 'FUNNY':
      return 'FUNNY';
    case 'COMFORT':
    case 'CALM':
    default:
      return 'BASIC';
  }
}

function getTodayStart() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  return todayStart;
}

export async function GET(request: Request) {
  const role = getWeddingRole(getWeddingRoleFromCookieHeader(request.headers.get('cookie')), 'ANGIE');

  if (role !== 'TOMI') {
    return NextResponse.json({ error: 'Nevyhovujúce oprávnenie.' }, { status: 403 });
  }

  const items = await prisma.countdownRevealResponse.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: {
      id: true,
      quoteId: true,
      quoteText: true,
      mood: true,
      category: true,
      method: true,
      bodyPart: true,
      moment: true,
      funnyLength: true,
      loyalty: true,
      answers: true,
      createdAt: true
    }
  });

  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const role = getWeddingRole(getWeddingRoleFromCookieHeader(request.headers.get('cookie')), 'ANGIE');

  if (role !== 'ANGIE') {
    return NextResponse.json({ error: 'Reveal odpoveď môže ukladať iba Angie.' }, { status: 403 });
  }

  const body = await readJsonBody<{
    quoteId?: unknown;
    quoteText?: unknown;
    mood?: unknown;
    method?: unknown;
    bodyPart?: unknown;
    moment?: unknown;
    funnyLength?: unknown;
    loyalty?: unknown;
    answers?: unknown;
  }>(request);

  const quoteId = typeof body?.quoteId === 'string' ? body.quoteId : null;
  const quoteText = typeof body?.quoteText === 'string' ? body.quoteText.trim() : '';
  const mood = typeof body?.mood === 'string' ? body.mood : '';
  const method = typeof body?.method === 'string' ? body.method : null;
  const bodyPart = typeof body?.bodyPart === 'string' ? body.bodyPart : null;
  const moment = typeof body?.moment === 'string' ? body.moment.trim() : null;
  const funnyLength = typeof body?.funnyLength === 'string' ? body.funnyLength : null;
  const loyalty = typeof body?.loyalty === 'string' ? body.loyalty : null;
  const answers = body && typeof body.answers === 'object' && body.answers !== null ? body.answers : {};
  const category = moodToCategory(mood);

  if (!mood) {
    return NextResponse.json({ error: 'Chýba nálada.' }, { status: 400 });
  }

  try {
    const alreadyAnswered = await prisma.countdownRevealResponse.findFirst({
      where: {
        createdAt: {
          gte: getTodayStart()
        }
      },
      select: { id: true }
    });

    if (alreadyAnswered) {
      return NextResponse.json({ error: 'Dnešná odpoveď je už zamknutá.' }, { status: 409 });
    }

    await prisma.countdownRevealResponse.create({
      data: {
        quoteId: quoteId ?? undefined,
        quoteText: quoteText || 'Bez textu',
        mood,
        category,
        method,
        bodyPart,
        moment,
        funnyLength,
        loyalty,
        answers
      }
    });

    await broadcastPushNotification({
      title: 'Reakcia na citát je pripravená',
      body: 'Našla sa nová odpoveď z dashboardu.',
      url: '/dashboard#countdown'
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Nepodarilo sa uložiť odpoveď.' }, { status: 500 });
  }
}
