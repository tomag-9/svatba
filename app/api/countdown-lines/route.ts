import { NextResponse } from 'next/server';

import { readJsonBody } from '@/lib/request';
import { appendAngieCountdownLine, syncFileLinesIntoDb } from '@/lib/wedding-copy';
import { getWeddingRole, getWeddingRoleFromCookieHeader } from '@/lib/wedding-role';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const role = getWeddingRole(getWeddingRoleFromCookieHeader(request.headers.get('cookie')), 'TOMI');

  if (role !== 'TOMI') {
    return NextResponse.json({ error: 'Nové citáty môže pridávať iba Tomi.' }, { status: 403 });
  }

  const body = await readJsonBody<{ line?: unknown }>(request);
  const line = typeof body?.line === 'string' ? body.line : '';

  try {
    const savedLine = await appendAngieCountdownLine(line);
    return NextResponse.json({ ok: true, line: savedLine });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Citát sa nepodarilo uložiť.' }, { status: 400 });
  }
}

export async function GET() {
  try {
    // Ensure all file lines exist in DB (append-only import, deduplicated, respects `blocked`)
    await syncFileLinesIntoDb();

    const dbLines = await prisma.countdownLine.findMany({ where: { blocked: false }, orderBy: { createdAt: 'asc' }, select: { id: true, text: true } });

    return NextResponse.json({ lines: dbLines });
  } catch (err) {
    return NextResponse.json({ error: 'Nepodarilo sa načítať citáty.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const role = getWeddingRole(getWeddingRoleFromCookieHeader(request.headers.get('cookie')), 'TOMI');

  if (role !== 'TOMI') {
    return NextResponse.json({ error: 'Nevyhovujúce oprávnenie.' }, { status: 403 });
  }

  const body = await readJsonBody<{ id?: unknown; text?: unknown }>(request);
  const id = typeof body?.id === 'string' ? body.id : '';
  const text = typeof body?.text === 'string' ? body.text.trim().replace(/\s+/g, ' ') : '';

  if (!id) return NextResponse.json({ error: 'Chýba id.' }, { status: 400 });
  if (!text) return NextResponse.json({ error: 'Citát nemôže byť prázdny.' }, { status: 400 });
  if (text.length > 240) return NextResponse.json({ error: 'Citát môže mať najviac 240 znakov.' }, { status: 400 });

  // fetch existing record to decide suppression behavior
  const existingRecord = await prisma.countdownLine.findUnique({ where: { id } });
  if (!existingRecord) return NextResponse.json({ error: 'Citát nenájdený.' }, { status: 404 });

  // check duplicates in db (other records)
  const existing = await prisma.countdownLine.findUnique({ where: { text } });
  if (existing && existing.id !== id) {
    return NextResponse.json({ error: 'Takýto citát už existuje v DB.' }, { status: 400 });
  }

  try {
    // Update the record and mark as user-managed
    await prisma.countdownLine.update({ where: { id }, data: { text, source: 'settings', blocked: false } });

    // If the original was from file and text changed, ensure original text won't be re-imported
    if (existingRecord.source === 'file' && existingRecord.text !== text) {
      try {
        await prisma.countdownLine.upsert({ where: { text: existingRecord.text }, update: { blocked: true }, create: { text: existingRecord.text, source: 'file', blocked: true } });
      } catch {}
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: 'Úprava zlyhala.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const role = getWeddingRole(getWeddingRoleFromCookieHeader(request.headers.get('cookie')), 'TOMI');

  if (role !== 'TOMI') {
    return NextResponse.json({ error: 'Nevyhovujúce oprávnenie.' }, { status: 403 });
  }

  const body = await readJsonBody<{ id?: unknown }>(request);
  const id = typeof body?.id === 'string' ? body.id : '';

  if (!id) return NextResponse.json({ error: 'Chýba id.' }, { status: 400 });

  try {
    const record = await prisma.countdownLine.findUnique({ where: { id } });
    if (!record) return NextResponse.json({ error: 'Citát nenájdený.' }, { status: 404 });

    if (record.source === 'file') {
      // Mark as blocked instead of deleting the row: the source .txt file still
      // contains this line, so if we delete the row it re-imports on the next
      // sync and the "delete" silently undoes itself. Keeping a blocked row
      // (unique on text) is what actually prevents re-import.
      await prisma.countdownLine.update({ where: { id }, data: { blocked: true } });
    } else {
      await prisma.countdownLine.delete({ where: { id } });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: 'Mazanie zlyhalo.' }, { status: 500 });
  }
}
