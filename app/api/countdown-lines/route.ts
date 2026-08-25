import { NextResponse } from 'next/server';

import { readJsonBody } from '@/lib/request';
import { appendAngieCountdownLine } from '@/lib/wedding-copy';
import { getWeddingRole, getWeddingRoleFromCookieHeader } from '@/lib/wedding-role';
import { prisma } from '@/lib/prisma';
import fs from 'node:fs';
import path from 'node:path';

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

function parseFileLines(text: string) {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#'));
}

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'angie-countdown-lines.txt');
    let fileLines: string[] = [];

    try {
      const txt = fs.readFileSync(filePath, 'utf8');
      fileLines = parseFileLines(txt);
    } catch {
      fileLines = [];
    }
    // Ensure all file lines exist in DB (append-only import, deduplicated)
    if (fileLines.length > 0) {
      try {
        await prisma.countdownLine.createMany({ data: fileLines.map((text) => ({ text })), skipDuplicates: true });
      } catch {
        // fallback to individual upserts if createMany unsupported or fails
        for (const text of fileLines) {
          try {
            // create if not exists
            await prisma.countdownLine.upsert({ where: { text }, create: { text }, update: {} });
          } catch {}
        }
      }
    }

    const dbLines = await prisma.countdownLine.findMany({ orderBy: { createdAt: 'asc' }, select: { id: true, text: true } });

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

  // check duplicates in file
  try {
    const filePath = path.join(process.cwd(), 'data', 'angie-countdown-lines.txt');
    const txt = fs.readFileSync(filePath, 'utf8');
    const fileLines = parseFileLines(txt);
    if (fileLines.includes(text)) {
      return NextResponse.json({ error: 'Takýto citát už existuje v txt súbore.' }, { status: 400 });
    }
  } catch {}

  // check duplicates in db (other records)
  const existing = await prisma.countdownLine.findUnique({ where: { text } });
  if (existing && existing.id !== id) {
    return NextResponse.json({ error: 'Takýto citát už existuje v DB.' }, { status: 400 });
  }

  try {
    await prisma.countdownLine.update({ where: { id }, data: { text } });
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
    await prisma.countdownLine.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: 'Mazanie zlyhalo.' }, { status: 500 });
  }
}
