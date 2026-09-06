import type { WeddingRole } from '@prisma/client';
import { readFileSync, existsSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import { prisma } from '@/lib/prisma';

export type WeddingAlertSlot = 'morning' | 'afternoon' | 'evening';

type WeddingCopyInput = {
  daysUntilWedding: number | null;
  role: WeddingRole;
  slot?: WeddingAlertSlot;
  isApproximate?: boolean;
};

type WeddingNotificationCopy = {
  title: string;
  body: string;
};

type CountdownDeckState = {
  knownLines: string[];
  order: string[];
  index: number;
  cycle: number;
  currentDayKey: string | null;
  currentLine: string | null;
};

type CountdownLineEntry = {
  id?: string | null;
  text: string;
  category?: string | null;
  mediaDataUrl?: string | null;
  mediaAlt?: string | null;
  mediaDescription?: string | null;
  mediaType?: string | null;
};

type CountdownCycleState = {
  decks: Record<string, CountdownDeckState>;
};

const angieCountdownLinesPath = path.join(process.cwd(), 'data', 'angie-countdown-lines.txt');
const angieCountdownReloadMarker = path.join(process.cwd(), 'data', 'angie-countdown-lines.reload');
const countdownCycleStateKey = 'shared-countdown-lines';
const categoryOrder = ['BASIC', 'FUNNY', 'ROMANTIC', 'EROTIC'];

const fallbackAngieCountdownLines: CountdownLineEntry[] = [
  { text: 'A potom už budeš slobodne neslobodná.' },
  { text: 'A potom už budeš celá moja.' },
  { text: 'A potom už som ja tvoj domov.' },
  { text: 'A potom mi už budeš môcť stále variť.' },
  { text: 'A potom bude moja peňaženka naša peňaženka.' },
  { text: 'A potom sa budeš zobúdzať vedľa mňa.' },
  { text: 'A potom budeme žiť našu slobodu.' },
  { text: 'A potom sa začne raj na zemi.' },
  { text: 'A potom budeš mať doživotný subscription na mňa.' },
  { text: 'A potom ti budem prdieť pod perinu.' }
];

function readAngieCountdownLinesFromFile() {
  try {
    return parseCountdownLines(readFileSync(angieCountdownLinesPath, 'utf8'));
  } catch {
    return [];
  }
}

// Import any lines present in the source .txt file into the DB (append-only,
// deduplicated, respects `blocked` so a deleted/edited-away file line never
// resurfaces). Safe to call on every read - it's a cheap no-op once imported.
export async function syncFileLinesIntoDb() {
  const fileLines = readAngieCountdownLinesFromFile();
  if (fileLines.length === 0) return;

  for (const text of fileLines) {
    try {
      const existing = await prisma.countdownLine.findUnique({ where: { text }, select: { id: true } });
      if (existing) continue;

      const lastOrder = await prisma.countdownLine.findFirst({
        where: { blocked: false, category: 'BASIC' },
        orderBy: { sortOrder: 'desc' },
        select: { sortOrder: true }
      });

      await prisma.countdownLine.create({
        data: {
          text,
          source: 'file',
          blocked: false,
          category: 'BASIC',
          sortOrder: (lastOrder?.sortOrder ?? 0) + 1
        }
      });
    } catch {}
  }
}

async function readStoredCountdownLines(): Promise<CountdownLineEntry[]> {
  try {
    const lines = await prisma.countdownLine.findMany({
      where: { blocked: false },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        text: true,
        category: true,
        sortOrder: true,
        mediaDataUrl: true,
        mediaAlt: true,
        mediaDescription: true,
        mediaType: true
      }
    });

    return lines
      .sort((a, b) => {
        const categoryDiff = categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category);
        if (categoryDiff !== 0) return categoryDiff;
        if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
        return a.text.localeCompare(b.text, 'sk');
      })
      .map((line) => ({
        id: line.id,
        text: line.text,
        category: line.category,
        mediaDataUrl: line.mediaDataUrl ?? null,
        mediaAlt: line.mediaAlt ?? null,
        mediaDescription: line.mediaDescription ?? null,
        mediaType: line.mediaType ?? 'image'
      }));
  } catch {
    return [];
  }
}

async function readAllCountdownLines(): Promise<CountdownLineEntry[]> {
  await syncFileLinesIntoDb();
  const lines = await readStoredCountdownLines();
  return lines.length > 0 ? Array.from(new Map(lines.map((line) => [line.text, line])).values()) : fallbackAngieCountdownLines;
}

function parseCountdownLines(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'));
}

async function performOneTimeReloadIfRequested() {
  try {
    if (!existsSync(angieCountdownReloadMarker)) return;

    const fileText = readFileSync(angieCountdownLinesPath, 'utf8');
    const lines = Array.from(new Set(parseCountdownLines(fileText)));

    // Replace all stored countdown lines with the ones from the file.
    await prisma.$transaction(async (tx) => {
      await tx.countdownLine.deleteMany({});

      if (lines.length > 0) {
        // createMany with skipDuplicates if supported; fallback to multiple creates is fine too
        try {
          await tx.countdownLine.createMany({ data: lines.map((text) => ({ text })), skipDuplicates: true });
        } catch {
          for (const text of lines) {
            // best-effort insert
            // eslint-disable-next-line no-await-in-loop
            await tx.countdownLine.create({ data: { text } });
          }
        }
      }
    });

    try {
      unlinkSync(angieCountdownReloadMarker);
    } catch {}
  } catch (err) {
    // do not break runtime on failures here
    // eslint-disable-next-line no-console
    console.error('Countdown reload failed:', err);
  }
}

// Fire-and-forget: if repo deploy includes the marker file, perform a one-time reload
void performOneTimeReloadIfRequested();

function getLocalDayKey(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Bratislava',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
}

async function readCountdownCycleState(): Promise<CountdownCycleState> {
  try {
    const record = await prisma.countdownCycleState.findUnique({ where: { key: countdownCycleStateKey } });
    const state = record?.state as CountdownCycleState | null;
    return state?.decks && typeof state.decks === 'object' ? state : { decks: {} };
  } catch {
    return { decks: {} };
  }
}

async function writeCountdownCycleState(state: CountdownCycleState) {
  await prisma.countdownCycleState.upsert({
    where: { key: countdownCycleStateKey },
    update: { state },
    create: { key: countdownCycleStateKey, state }
  });
}

export async function resetCountdownForToday() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const lines = await readAllCountdownLines();
  const textLines = lines.map((line) => line.text);
  const dayKey = getLocalDayKey();
  const state = await readCountdownCycleState();
  const deckKey = 'SHARED';
  const deck = state.decks[deckKey] ?? {
    knownLines: [...textLines],
    order: [...textLines],
    index: 0,
    cycle: 0,
    currentDayKey: null,
    currentLine: null
  };

  syncDeckWithLines(deck, textLines);

  if (textLines.length > 0) {
    const currentIndex = deck.currentLine ? deck.order.indexOf(deck.currentLine) : -1;
    const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % deck.order.length : Math.min(deck.index, deck.order.length - 1);
    const selectedText = deck.order[nextIndex] ?? textLines[0];

    deck.index = nextIndex + 1;
    if (deck.index >= deck.order.length) {
      deck.cycle += 1;
      deck.index = 0;
    }

    deck.currentDayKey = dayKey;
    deck.currentLine = selectedText;
    deck.knownLines = [...textLines];
    state.decks[deckKey] = deck;
  }

  await prisma.$transaction(async (tx) => {
    await tx.countdownRevealResponse.deleteMany({
      where: {
        createdAt: {
          gte: startOfToday
        }
      }
    });

    await tx.countdownCycleState.upsert({
      where: { key: countdownCycleStateKey },
      update: { state },
      create: { key: countdownCycleStateKey, state }
    });
  });

  return { resetAt: startOfToday, nextLine: deck.currentLine };
}

function syncDeckWithLines(deck: CountdownDeckState, lines: string[]) {
  const nextKnownLines = [...lines];
  const addedLines = lines.filter((line) => !deck.knownLines.includes(line));
  const visibleLines = new Set(lines);

  deck.order = deck.order.filter((line) => visibleLines.has(line));
  deck.index = Math.min(deck.index, deck.order.length);
  deck.order.push(...addedLines);
  deck.knownLines = nextKnownLines;

  if (deck.currentLine && !visibleLines.has(deck.currentLine)) {
    deck.currentLine = null;
    deck.currentDayKey = null;
  }
}

async function pickLine(lines: CountdownLineEntry[]) {
  const deckKey = 'SHARED';
  const dayKey = getLocalDayKey();
  const state = await readCountdownCycleState();
  const deck = state.decks[deckKey] ?? {
    knownLines: [...lines.map((line) => line.text)],
    order: [...lines.map((line) => line.text)],
    index: 0,
    cycle: 0,
    currentDayKey: null,
    currentLine: null
  };

  syncDeckWithLines(deck, lines.map((line) => line.text));

  if (deck.currentDayKey === dayKey && deck.currentLine) {
    state.decks[deckKey] = deck;
    await writeCountdownCycleState(state);
    const currentText = deck.currentLine;
    return lines.find((line) => line.text === currentText) ?? lines[0];
  }

  if (deck.index >= deck.order.length) {
    deck.cycle += 1;
    deck.order = [...lines.map((line) => line.text)];
    deck.index = 0;
  }

  const selectedText = deck.order[deck.index] ?? lines[0]?.text ?? '';
  const selectedLine = lines.find((line) => line.text === selectedText) ?? lines[0] ?? { text: '' };
  deck.index += 1;
  deck.currentDayKey = dayKey;
  deck.currentLine = selectedText;
  deck.knownLines = [...lines.map((line) => line.text)];
  state.decks[deckKey] = deck;
  await writeCountdownCycleState(state);

  return selectedLine;
}

async function selectLines() {
  return readAllCountdownLines();
}

export async function getWeddingCountdownCopy({ daysUntilWedding, role, slot = 'morning', isApproximate = false }: WeddingCopyInput) {
  if (daysUntilWedding === null) {
    return {
      title: 'Nastav dátum svadby',
      subtitle: 'Keď uložíš dátum, zobrazím countdown a denné texty.',
      dailyLine: role === 'ANGIE'
        ? 'Zatiaľ bez dátumu, ale svadobná kapitola je pripravená.'
        : 'Zatiaľ bez dátumu, ale príprava ide ďalej.'
    };
  }

  const label = isApproximate
    ? daysUntilWedding === 0
      ? 'Približne dnes by mala byť svadba.'
      : daysUntilWedding === 1
        ? 'Približne zajtra by mala byť svadba.'
        : `Približne o ${daysUntilWedding} dní bude svadba.`
    : daysUntilWedding === 0
      ? 'Dnes je svadba.'
      : daysUntilWedding === 1
        ? 'Zajtra je svadba.'
        : `O ${daysUntilWedding} dní bude svadba.`;
  const line = await pickLine(await selectLines());
  const notification = getWeddingNotificationCopy(daysUntilWedding, isApproximate);

  return {
    title: label,
    subtitle: isApproximate ? 'Orientačný countdown beží.' : daysUntilWedding === 0 ? 'Je to tu.' : slot === 'evening' ? 'Večerný countdown beží.' : 'Countdown beží.',
    dailyLine: line.text,
    dailyQuoteId: line.id ?? null,
    dailyMedia: line.mediaDataUrl ? {
      mediaDataUrl: line.mediaDataUrl,
      mediaAlt: line.mediaAlt ?? line.text,
      mediaDescription: line.mediaDescription ?? null,
      mediaType: line.mediaType ?? 'image'
    } : null,
    notificationTitle: notification.title,
    notificationBody: notification.body
  };
}

export function getWeddingNotificationCopy(daysUntilWedding: number | null, isApproximate = false): WeddingNotificationCopy {
  if (daysUntilWedding === null) {
    return {
      title: 'Svadobný countdown',
      body: 'Pozri citát na dnes.'
    };
  }

  const days = Math.max(daysUntilWedding, 0);
  const dayLabel = days === 1 ? 'deň' : days >= 2 && days <= 4 ? 'dni' : 'dní';
  const title = isApproximate
    ? daysUntilWedding === 0
      ? 'Do svadby ostáva ešte približne 0 dní.'
      : `Do svadby ostáva ešte približne ${days} ${dayLabel}.`
    : daysUntilWedding === 0
      ? 'Do svadby ostáva ešte 0 dní.'
      : `Do svadby ostáva ešte ${days} ${dayLabel}.`;

  return {
    title,
    body: 'Pozri citát na dnes.'
  };
}

export function getDeadlineNotificationCopy(daysUntilWedding: number | null, _role: WeddingRole, _slot: WeddingAlertSlot = 'morning', isApproximate = false) {
  const notification = getWeddingNotificationCopy(daysUntilWedding, isApproximate);
  return `${notification.title} ${notification.body}`;
}

export async function appendAngieCountdownLine(
  line: string,
  options?: {
    mediaDataUrl?: string | null;
    mediaAlt?: string | null;
    mediaDescription?: string | null;
    mediaType?: string | null;
    category?: string | null;
  }
) {
  const cleanedLine = line.trim().replace(/\s+/g, ' ');

  if (!cleanedLine) {
    throw new Error('Citát nemôže byť prázdny.');
  }

  if (cleanedLine.length > 240) {
    throw new Error('Citát môže mať najviac 240 znakov.');
  }

  const existingLines = await readAllCountdownLines();
  const existingTexts = existingLines.map((line) => line.text);

  if (existingTexts.includes(cleanedLine)) {
    throw new Error('Tento citát už existuje.');
  }

  const categoryValue = options?.category && ['BASIC', 'FUNNY', 'ROMANTIC', 'EROTIC'].includes(options.category)
    ? options.category
    : 'BASIC';

  const lastOrder = await prisma.countdownLine.findFirst({
    where: { blocked: false, category: categoryValue as any },
    orderBy: { sortOrder: 'desc' },
    select: { sortOrder: true }
  });

  await prisma.countdownLine.create({
    data: {
      text: cleanedLine,
      sortOrder: (lastOrder?.sortOrder ?? 0) + 1,
      category: categoryValue as any,
      mediaDataUrl: options?.mediaDataUrl ?? null,
      mediaAlt: options?.mediaAlt ?? null,
      mediaDescription: options?.mediaDescription ?? null,
      mediaType: options?.mediaType ?? 'image'
    }
  });

  const nextTexts = [...existingTexts, cleanedLine];
  const state = await readCountdownCycleState();

  for (const [deckKey, deck] of Object.entries(state.decks)) {
    if (deckKey !== 'SHARED' && !deckKey.startsWith('ANGIE')) {
      continue;
    }

    syncDeckWithLines(deck, nextTexts);
  }

  await writeCountdownCycleState(state);

  return cleanedLine;
}

export async function applyCountdownLineNowByText(lineText: string) {
  const cleanedLine = lineText.trim().replace(/\s+/g, ' ');
  if (!cleanedLine) throw new Error('Citát nemôže byť prázdny.');

  const lines = await readAllCountdownLines();
  const textLines = lines.map((line) => line.text);

  const deckKey = 'SHARED';
  const dayKey = getLocalDayKey();
  const state = await readCountdownCycleState();
  const deck = state.decks[deckKey] ?? {
    knownLines: [...textLines],
    order: [...textLines],
    index: 0,
    cycle: 0,
    currentDayKey: null,
    currentLine: null
  };

  if (!deck.knownLines.includes(cleanedLine)) {
    deck.knownLines.push(cleanedLine);
    deck.order.push(cleanedLine);
  }

  syncDeckWithLines(deck, [...new Set([...deck.knownLines, ...textLines])]);

  deck.currentLine = cleanedLine;
  deck.currentDayKey = dayKey;
  state.decks[deckKey] = deck;
  await writeCountdownCycleState(state);

  return cleanedLine;
}
