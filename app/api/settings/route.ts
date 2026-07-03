import { NextResponse } from 'next/server';
import { WeddingRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { parseString, readJsonBody } from '@/lib/request';

export async function GET() {
  const settings = await prisma.weddingSettings.findFirst({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json({ settings });
}

export async function PATCH(request: Request) {
  const body = await readJsonBody<{
    weddingDate?: unknown;
    budgetTarget?: unknown;
    currency?: unknown;
    venueName?: unknown;
    role?: unknown;
    deadlineAlertsEnabled?: unknown;
    alertLeadDays?: unknown;
  }>(request);

  const existing = await prisma.weddingSettings.findFirst({ orderBy: { createdAt: 'desc' } });
  const data = {
    weddingDate: body?.weddingDate === null ? null : body?.weddingDate ? new Date(String(body.weddingDate)) : undefined,
    budgetTarget: typeof body?.budgetTarget === 'undefined' || body?.budgetTarget === '' ? undefined : Number(body.budgetTarget),
    currency: parseString(body?.currency) ?? undefined,
    venueName: body?.venueName === null ? null : parseString(body?.venueName) ?? undefined,
    role: body?.role === 'ANGIE' ? WeddingRole.ANGIE : body?.role === 'TOMI' ? WeddingRole.TOMI : undefined,
    deadlineAlertsEnabled: typeof body?.deadlineAlertsEnabled === 'undefined' ? undefined : body?.deadlineAlertsEnabled === true,
    alertLeadDays: typeof body?.alertLeadDays === 'undefined' || body?.alertLeadDays === '' ? undefined : Number(body.alertLeadDays)
  };

  const settings = existing
    ? await prisma.weddingSettings.update({ where: { id: existing.id }, data })
    : await prisma.weddingSettings.create({ data: { ...data, currency: data.currency ?? 'EUR' } });

  return NextResponse.json({ settings });
}
