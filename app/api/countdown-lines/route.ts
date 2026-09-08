import { NextResponse } from 'next/server';

import { readJsonBody } from '@/lib/request';
import { appendAngieCountdownLine, applyCountdownCategoryRotationOrder, syncFileLinesIntoDb } from '@/lib/wedding-copy';
import { getWeddingRole, getWeddingRoleFromCookieHeader } from '@/lib/wedding-role';
import { prisma } from '@/lib/prisma';

function normalizeCategory(value?: unknown) {
  const candidate = typeof value === 'string' ? value.trim().toUpperCase() : 'BASIC';
  if (candidate === 'EROTIC' || candidate === 'FUNNY' || candidate === 'ROMANTIC' || candidate === 'BASIC') {
    return candidate;
  }
  return 'BASIC';
}

export async function POST(request: Request) {
  const role = getWeddingRole(getWeddingRoleFromCookieHeader(request.headers.get('cookie')), 'ANGIE');

  if (role !== 'TOMI') {
    return NextResponse.json({ error: 'Nové citáty môže pridávať iba Tomi.' }, { status: 403 });
  }

  const body = await readJsonBody<{ line?: unknown; mediaDataUrl?: unknown; mediaAlt?: unknown; mediaDescription?: unknown; mediaType?: unknown; category?: unknown }>(request);
  const line = typeof body?.line === 'string' ? body.line : '';
  const mediaDataUrl = typeof body?.mediaDataUrl === 'string' ? body.mediaDataUrl.trim() : '';
  const mediaAlt = typeof body?.mediaAlt === 'string' ? body.mediaAlt.trim() : '';
  const mediaDescription = typeof body?.mediaDescription === 'string' ? body.mediaDescription.trim() : '';
  const mediaType = typeof body?.mediaType === 'string' ? body.mediaType.trim() : 'image';
  const category = normalizeCategory(body?.category);

  try {
    const savedLine = await appendAngieCountdownLine(line, {
      mediaDataUrl: mediaDataUrl || null,
      mediaAlt: mediaAlt || null,
      mediaDescription: mediaDescription || null,
      mediaType: mediaType || 'image',
      category
    });
    return NextResponse.json({ ok: true, line: savedLine });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Citát sa nepodarilo uložiť.' }, { status: 400 });
  }
}

export async function GET() {
  try {
    // Ensure all file lines exist in DB (append-only import, deduplicated, respects `blocked`)
    await syncFileLinesIntoDb();

    const dbLines = await prisma.countdownLine.findMany({
      where: { blocked: false },
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        text: true,
        sortOrder: true,
        category: true,
        mediaDataUrl: true,
        mediaAlt: true,
        mediaDescription: true,
        mediaType: true
      }
    });

    const categoryOrder = ['BASIC', 'FUNNY', 'ROMANTIC', 'EROTIC'];
    const sortedLines = dbLines.sort((a, b) => {
      const categoryDiff = categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category);
      if (categoryDiff !== 0) return categoryDiff;
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return a.text.localeCompare(b.text, 'sk');
    });

    return NextResponse.json({ lines: sortedLines });
  } catch (err) {
    return NextResponse.json({ error: 'Nepodarilo sa načítať citáty.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const role = getWeddingRole(getWeddingRoleFromCookieHeader(request.headers.get('cookie')), 'ANGIE');

  if (role !== 'TOMI') {
    return NextResponse.json({ error: 'Nevyhovujúce oprávnenie.' }, { status: 403 });
  }

  const body = await readJsonBody<{ id?: unknown; text?: unknown; order?: unknown; mediaDataUrl?: unknown; mediaAlt?: unknown; mediaDescription?: unknown; mediaType?: unknown; category?: unknown }>(request);
  const id = typeof body?.id === 'string' ? body.id : '';
  const text = typeof body?.text === 'string' ? body.text.trim().replace(/\s+/g, ' ') : '';
  const mediaDataUrl = typeof body?.mediaDataUrl === 'string' ? body.mediaDataUrl.trim() : undefined;
  const mediaAlt = typeof body?.mediaAlt === 'string' ? body.mediaAlt.trim() : undefined;
  const mediaDescription = typeof body?.mediaDescription === 'string' ? body.mediaDescription.trim() : undefined;
  const mediaType = typeof body?.mediaType === 'string' ? body.mediaType.trim() : undefined;
  const category = normalizeCategory(body?.category);
  const order = Array.isArray(body?.order) ? body.order.filter((value): value is string => typeof value === 'string') : null;

  if (order && order.length > 0) {
    try {
      const uniqueOrder = [...new Set(order)];
      const reorderCategory = normalizeCategory(body?.category);
      const records = await prisma.countdownLine.findMany({
        where: { id: { in: uniqueOrder }, blocked: false, category: reorderCategory as any },
        select: { id: true, text: true }
      });

      if (records.length !== uniqueOrder.length) {
        return NextResponse.json({ error: 'Niektoré citáty neexistujú v tejto kategórii.' }, { status: 400 });
      }

      await prisma.$transaction(
        uniqueOrder.map((quoteId, index) =>
          prisma.countdownLine.update({
            where: { id: quoteId },
            data: { sortOrder: index + 1 }
          })
        )
      );
      const recordsById = new Map(records.map((record) => [record.id, record.text]));
      await applyCountdownCategoryRotationOrder(reorderCategory, uniqueOrder.map((quoteId) => recordsById.get(quoteId) ?? ''));

      return NextResponse.json({ ok: true });
    } catch (err) {
      return NextResponse.json({ error: err instanceof Error ? err.message : 'Zmena poradia zlyhala.' }, { status: 500 });
    }
  }

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
    const mediaUpdate = {
      mediaDataUrl: typeof mediaDataUrl === 'string' ? (mediaDataUrl || null) : undefined,
      mediaAlt: typeof mediaAlt === 'string' ? (mediaAlt || null) : undefined,
      mediaDescription: typeof mediaDescription === 'string' ? (mediaDescription || null) : undefined,
      mediaType: typeof mediaType === 'string' ? (mediaType || 'image') : undefined,
      category: category as any
    };

    const categoryChanged = existingRecord.category !== category;
    const lastInCategory = categoryChanged
      ? await prisma.countdownLine.findFirst({
          where: { blocked: false, category: category as any },
          orderBy: { sortOrder: 'desc' },
          select: { sortOrder: true }
        })
      : null;

    await prisma.countdownLine.update({
      where: { id },
      data: {
        text,
        source: 'settings',
        blocked: false,
        ...mediaUpdate,
        sortOrder: categoryChanged ? (lastInCategory?.sortOrder ?? 0) + 1 : undefined
      }
    });

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
  const role = getWeddingRole(getWeddingRoleFromCookieHeader(request.headers.get('cookie')), 'ANGIE');

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
