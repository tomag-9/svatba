import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseBoolean, parseString, readJsonBody } from '@/lib/request';

export async function GET() {
  const expenses = await prisma.expense.findMany({
    orderBy: [{ createdAt: 'desc' }]
  });

  return NextResponse.json({ expenses });
}

export async function POST(request: Request) {
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

  const title = parseString(body?.title);
  if (!title) {
    return NextResponse.json({ error: 'Názov výdavku je povinný' }, { status: 400 });
  }

  const amount = Number(body?.amount);
  if (!Number.isFinite(amount)) {
    return NextResponse.json({ error: 'Suma musí byť platné číslo' }, { status: 400 });
  }

  const expense = await prisma.expense.create({
    data: {
      title,
      category: parseString(body?.category),
      amount,
      currency: parseString(body?.currency) ?? 'EUR',
      isPaid: parseBoolean(body?.isPaid),
      expectedPaidOn: body?.expectedPaidOn ? new Date(String(body.expectedPaidOn)) : null,
      vendor: parseString(body?.vendor),
      notes: parseString(body?.notes)
    }
  });

  return NextResponse.json({ expense }, { status: 201 });
}
