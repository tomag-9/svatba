import type { WeddingRole } from '@prisma/client';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

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

type CountdownCycleState = {
  decks: Record<string, CountdownDeckState>;
};

const angieCountdownLinesPath = path.join(process.cwd(), 'data', 'angie-countdown-lines.txt');
const countdownCycleStatePath = path.join(process.cwd(), 'data', 'countdown-cycle-state.json');

const fallbackAngieCountdownLines = [
  'A potom už budeš slobodne neslobodná.',
  'A potom už budeš celá moja.',
  'A potom už som ja tvoj domov.',
  'A potom mi už budeš môcť stále variť.',
  'A potom bude moja peňaženka naša peňaženka.',
  'A potom sa budeš zobúdzať vedľa mňa.',
  'A potom budeme žiť našu slobodu.',
  'A potom sa začne raj na zemi.',
  'A potom budeš mať doživotný subscription na mňa.',
  'A potom ti budem prdieť pod perinu.'
];

function readAngieCountdownLines() {
  try {
    const lines = parseCountdownLines(readFileSync(angieCountdownLinesPath, 'utf8'));

    return lines.length > 0 ? lines : fallbackAngieCountdownLines;
  } catch {
    return fallbackAngieCountdownLines;
  }
}

function parseCountdownLines(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'));
}

function getLocalDayKey(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Bratislava',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
}

function hashString(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function seededRandom(seed: number) {
  let value = seed || 1;

  return () => {
    value = Math.imul(value ^ (value >>> 15), 1 | value);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);

    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleLines(lines: string[], seed: number) {
  const shuffled = [...lines];
  const random = seededRandom(seed);

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

function readCountdownCycleState(): CountdownCycleState {
  if (!existsSync(countdownCycleStatePath)) {
    return { decks: {} };
  }

  try {
    const state = JSON.parse(readFileSync(countdownCycleStatePath, 'utf8')) as CountdownCycleState;
    return state?.decks && typeof state.decks === 'object' ? state : { decks: {} };
  } catch {
    return { decks: {} };
  }
}

function writeCountdownCycleState(state: CountdownCycleState) {
  writeFileSync(countdownCycleStatePath, `${JSON.stringify(state, null, 2)}\n`);
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

function pickLine(lines: string[]) {
  const deckKey = 'SHARED';
  const dayKey = getLocalDayKey();
  const state = readCountdownCycleState();
  const deck = state.decks[deckKey] ?? {
    knownLines: [...lines],
    order: shuffleLines(lines, hashString(`${deckKey}:0`)),
    index: 0,
    cycle: 0,
    currentDayKey: null,
    currentLine: null
  };

  syncDeckWithLines(deck, lines);

  if (deck.currentDayKey === dayKey && deck.currentLine) {
    state.decks[deckKey] = deck;
    writeCountdownCycleState(state);
    return deck.currentLine;
  }

  if (deck.index >= deck.order.length) {
    deck.cycle += 1;
    deck.order = shuffleLines(lines, hashString(`${deckKey}:${deck.cycle}`));
    deck.index = 0;
  }

  const line = deck.order[deck.index] ?? lines[0];
  deck.index += 1;
  deck.currentDayKey = dayKey;
  deck.currentLine = line;
  deck.knownLines = [...lines];
  state.decks[deckKey] = deck;
  writeCountdownCycleState(state);

  return line;
}

function selectLines() {
  return readAngieCountdownLines();
}

export function getWeddingCountdownCopy({ daysUntilWedding, role, slot = 'morning', isApproximate = false }: WeddingCopyInput) {
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
  const line = pickLine(selectLines());
  const notification = getWeddingNotificationCopy(daysUntilWedding, isApproximate);

  return {
    title: label,
    subtitle: isApproximate ? 'Orientačný countdown beží.' : daysUntilWedding === 0 ? 'Je to tu.' : slot === 'evening' ? 'Večerný countdown beží.' : 'Countdown beží.',
    dailyLine: line,
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

export function appendAngieCountdownLine(line: string) {
  const cleanedLine = line.trim().replace(/\s+/g, ' ');

  if (!cleanedLine) {
    throw new Error('Citát nemôže byť prázdny.');
  }

  if (cleanedLine.length > 240) {
    throw new Error('Citát môže mať najviac 240 znakov.');
  }

  const existingText = existsSync(angieCountdownLinesPath) ? readFileSync(angieCountdownLinesPath, 'utf8') : '';
  const existingLines = parseCountdownLines(existingText);

  if (existingLines.includes(cleanedLine)) {
    throw new Error('Tento citát už existuje.');
  }

  const separator = existingText.length > 0 && !existingText.endsWith('\n') ? '\n' : '';
  writeFileSync(angieCountdownLinesPath, `${existingText}${separator}${cleanedLine}\n`);

  const nextLines = [...existingLines, cleanedLine];
  const state = readCountdownCycleState();

  for (const [deckKey, deck] of Object.entries(state.decks)) {
    if (deckKey !== 'SHARED' && !deckKey.startsWith('ANGIE')) {
      continue;
    }

    syncDeckWithLines(deck, nextLines);
  }

  writeCountdownCycleState(state);

  return cleanedLine;
}
