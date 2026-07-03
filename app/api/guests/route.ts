import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseBoolean, parseGuestAttendance, parseString, readJsonBody } from '@/lib/request';

export async function GET() {
  const guests = await prisma.guest.findMany({
    orderBy: [{ familyGroup: 'asc' }, { name: 'asc' }]
  });

  return NextResponse.json({ guests });
}

export async function POST(request: Request) {
  const body = await readJsonBody<{
    name?: unknown;
    familyGroup?: unknown;
    attendance?: unknown;
    dinner?: unknown;
    party?: unknown;
    notes?: unknown;
  }>(request);

  const name = parseString(body?.name);
  if (!name) {
    return NextResponse.json({ error: 'Meno hosťa je povinné' }, { status: 400 });
  }

  const guest = await prisma.guest.create({
    data: {
      name,
      familyGroup: parseString(body?.familyGroup),
      attendance: parseGuestAttendance(body?.attendance) ?? 'YES',
      dinner: parseBoolean(body?.dinner),
      party: parseBoolean(body?.party),
      notes: parseString(body?.notes)
    }
  });

  return NextResponse.json({ guest }, { status: 201 });
}
