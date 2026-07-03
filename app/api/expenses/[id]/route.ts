import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseBoolean, parseString, readJsonBody } from '@/lib/request';

type RouteParams = Promise<{ id: string }>;

export async function PATCH(request: Request, context: { params: RouteParams }) {
  const { id } = await context.params;
  const body = await readJsonBody<{
    title?: unknown;
    category?: unknown;
    amount?: unknown;
    currency?: unknown;
    isPaid?: unknown;
    expectedPaidOn?: unknown;
    vendor?: unknown;
    notes?: unknown;
  }>(request);

  const expense = await prisma.expense.update({
    where: { id },
    data: {
      title: parseString(body?.title) ?? undefined,
      category: body?.category === null ? null : parseString(body?.category) ?? undefined,
      amount: typeof body?.amount === 'undefined' ? undefined : Number(body.amount),
      currency: parseString(body?.currency) ?? undefined,
      isPaid: typeof body?.isPaid === 'undefined' ? undefined : parseBoolean(body?.isPaid),
      expectedPaidOn: body?.expectedPaidOn === null ? null : body?.expectedPaidOn ? new Date(String(body.expectedPaidOn)) : undefined,
      vendor: body?.vendor === null ? null : parseString(body?.vendor) ?? undefined,
      notes: body?.notes === null ? null : parseString(body?.notes) ?? undefined
    }
  });

  return NextResponse.json({ expense });
}

export async function DELETE(_request: Request, context: { params: RouteParams }) {
  const { id } = await context.params;
  await prisma.expense.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
