import type { WeddingRole } from '@prisma/client';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const DAY_MS = 1000 * 60 * 60 * 24;

export type WeddingAlertSlot = 'morning' | 'afternoon' | 'evening';

type WeddingCopyInput = {
  daysUntilWedding: number | null;
  role: WeddingRole;
  slot?: WeddingAlertSlot;
  isApproximate?: boolean;
};

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
    const text = readFileSync(path.join(process.cwd(), 'data', 'angie-countdown-lines.txt'), 'utf8');
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith('#'));

    return lines.length > 0 ? lines : fallbackAngieCountdownLines;
  } catch {
    return fallbackAngieCountdownLines;
  }
}

const tomiLines: Record<WeddingAlertSlot, string[]> = {
  morning: [
    'Dobré ráno, Tomi. Dnes sa svadba zase o čosi viac približuje.',
    'Ranný režim: jeden krok k manželskému módu navyše.',
    'Tomi, dnes je dobrý deň na to posunúť prípravy dopredu.'
  ],
  afternoon: [
    'Popoludní je čas doladiť veci, ktoré zajtra nechceš riešiť narýchlo.',
    'Svadba sa blíži a dnes môžeš spraviť jeden praktický krok navyše.',
    'Poobede platí jednoduché pravidlo: čo sa dá pripraviť dnes, je vyhrané.'
  ],
  evening: [
    'Večer už len krátky check a potom pokoj pred ďalším dňom.',
    'Tomi, dnešok je za tebou. Zajtra svadba čaká ďalší posun.',
    'Večerný reminder: je to bližšie než včera, takže plán stále funguje.'
  ]
};

function daySeed() {
  return Math.floor(Date.now() / DAY_MS);
}

function pickLine(lines: string[]) {
  const seed = daySeed();
  return lines[Math.abs(seed) % lines.length];
}

function selectLines(role: WeddingRole, slot: WeddingAlertSlot) {
  return role === 'ANGIE' ? readAngieCountdownLines() : tomiLines[slot];
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
  const line = pickLine(selectLines(role, slot));

  return {
    title: label,
    subtitle: isApproximate ? 'Orientačný countdown beží.' : daysUntilWedding === 0 ? 'Je to tu.' : slot === 'evening' ? 'Večerný countdown beží.' : 'Countdown beží.',
    dailyLine: line
  };
}

export function getDeadlineNotificationCopy(daysUntilWedding: number | null, role: WeddingRole, slot: WeddingAlertSlot = 'morning', isApproximate = false) {
  if (daysUntilWedding === null) {
    return 'Nastav dátum svadby, aby som vedel odpočítavať a upozorňovať na deadline.';
  }

  const intro = isApproximate
    ? daysUntilWedding === 0
      ? 'Približne dnes by mala byť svadba.'
      : `Približne o ${daysUntilWedding} dní bude svadba.`
    : daysUntilWedding === 0
      ? 'Dnes je svadba.'
      : `O ${daysUntilWedding} dní bude svadba.`;
  const extra = getWeddingCountdownCopy({ daysUntilWedding, role, slot, isApproximate }).dailyLine;

  return `${intro} ${extra}`;
}
