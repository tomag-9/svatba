import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseBoolean, parseGuestAttendance, parseString, readJsonBody } from '@/lib/request';

type RouteParams = Promise<{ id: string }>;

export async function PATCH(request: Request, context: { params: RouteParams }) {
  const { id } = await context.params;
  const body = await readJsonBody<{
    name?: unknown;
    familyGroup?: unknown;
    attendance?: unknown;
    dinner?: unknown;
    party?: unknown;
    notes?: unknown;
  }>(request);

  const guest = await prisma.guest.update({
    where: { id },
    data: {
      name: parseString(body?.name) ?? undefined,
      familyGroup: body?.familyGroup === null ? null : parseString(body?.familyGroup) ?? undefined,
      attendance: parseGuestAttendance(body?.attendance),
      dinner: typeof body?.dinner === 'undefined' ? undefined : parseBoolean(body?.dinner),
      party: typeof body?.party === 'undefined' ? undefined : parseBoolean(body?.party),
      notes: body?.notes === null ? null : parseString(body?.notes) ?? undefined
    }
  });

  return NextResponse.json({ guest });
}

export async function DELETE(_request: Request, context: { params: RouteParams }) {
  const { id } = await context.params;
  await prisma.guest.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
