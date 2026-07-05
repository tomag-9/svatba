const path = require('path');
const AdmZip = require('adm-zip');
const { PrismaClient, TaskPriority, GuestAttendance } = require('@prisma/client');

const prisma = new PrismaClient();
const rootDir = path.join(__dirname, '..');
const docxPath = path.join(rootDir, 'data', 'Svadba.docx');
const workbookPath = path.join(rootDir, 'data', 'Svadba.xlsx');

function stripXml(value) {
  return value
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .trim();
}

function decodeXml(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function normalizeText(value) {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value).replace(/\s+/g, ' ').trim();
}

function normalizeName(value) {
  const text = normalizeText(value);
  if (!/\p{L}/u.test(text)) {
    return '';
  }

  return text;
}

function taskCategory(title) {
  const lower = title.toLowerCase();

  if (lower.includes('kostol') || lower.includes('kňaz') || lower.includes('svedkov') || lower.includes('čítania') || lower.includes('úrad')) {
    return 'Ceremony';
  }

  if (lower.includes('sála') || lower.includes('klíma')) {
    return 'Venue';
  }

  if (lower.includes('obed') || lower.includes('jedlo') || lower.includes('zmrzka') || lower.includes('kolac')) {
    return 'Food';
  }

  if (lower.includes('web') || lower.includes('oznamko')) {
    return 'Communication';
  }

  if (lower.includes('foto') || lower.includes('kossey')) {
    return 'Photo';
  }

  if (lower.includes('šaty') || lower.includes('oblek') || lower.includes('vlasy') || lower.includes('mejkap')) {
    return 'Style';
  }

  if (lower.includes('auto') || lower.includes('byt')) {
    return 'Logistics';
  }

  if (lower.includes('obrúč')) {
    return 'Jewelry';
  }

  if (lower.includes('kytica') || lower.includes('výzdoba')) {
    return 'Decor';
  }

  return 'Planning';
}

function readDocxParagraphs() {
  const zip = new AdmZip(docxPath);
  const documentXml = zip.readAsText('word/document.xml');

  return documentXml
    .split('</w:p>')
    .map((paragraph) => {
      const text = [...paragraph.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g)].map((match) => stripXml(match[1])).join('').trim();
      if (!text) {
        return null;
      }

      return {
        text: normalizeText(text),
        isBullet: /<w:numPr>/.test(paragraph)
      };
    })
    .filter(Boolean);
}

function parseTasks() {
  const priorityByHeading = {
    High: TaskPriority.HIGH,
    Medium: TaskPriority.MEDIUM,
    Low: TaskPriority.LOW
  };
  const tasks = [];
  let currentPriority = TaskPriority.MEDIUM;
  let currentTask = null;

  for (const paragraph of readDocxParagraphs()) {
    if (priorityByHeading[paragraph.text]) {
      currentPriority = priorityByHeading[paragraph.text];
      currentTask = null;
      continue;
    }

    if (paragraph.isBullet) {
      currentTask = {
        title: paragraph.text,
        descriptionLines: [],
        priority: currentPriority,
        category: taskCategory(paragraph.text),
        phase: paragraph.text
      };
      tasks.push(currentTask);
      continue;
    }

    if (currentTask) {
      currentTask.descriptionLines.push(paragraph.text);
    }
  }

  return tasks.map((task, index) => ({
    title: task.title,
    description: task.descriptionLines.length > 0 ? task.descriptionLines.join('\n') : null,
    notes: null,
    resultInfo: null,
    priority: task.priority,
    category: task.category,
    phase: task.priority,
    sortOrder: index + 1,
    status: 'TODO'
  }));
}

function readSheetRows(sheetName) {
  const zip = new AdmZip(workbookPath);
  const workbookXml = zip.readAsText('xl/workbook.xml');
  const relsXml = zip.readAsText('xl/_rels/workbook.xml.rels');
  const sharedStringsXml = zip.getEntry('xl/sharedStrings.xml') ? zip.readAsText('xl/sharedStrings.xml') : '';
  const sharedStrings = [...sharedStringsXml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map((match) =>
    normalizeText([...match[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((textMatch) => decodeXml(textMatch[1])).join(''))
  );
  const sheetMatch = [...workbookXml.matchAll(/<sheet\b[^>]*>/g)].find((match) => {
    const nameMatch = match[0].match(/\bname="([^"]+)"/);
    return nameMatch && decodeXml(nameMatch[1]) === sheetName;
  });

  if (!sheetMatch) {
    return [];
  }

  const relId = sheetMatch[0].match(/r:id="([^"]+)"/)?.[1];
  const relMatch = relId ? relsXml.match(new RegExp(`<Relationship[^>]+Id="${relId}"[^>]+Target="([^"]+)"`)) : null;
  if (!relMatch) {
    return [];
  }

  const target = relMatch[1].startsWith('/') ? relMatch[1].slice(1) : path.posix.join('xl', relMatch[1]);
  const sheetXml = zip.readAsText(target);
  const rows = [];

  for (const rowMatch of sheetXml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
    const row = [];

    for (const cellMatch of rowMatch[1].matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)) {
      const attrs = cellMatch[1];
      const body = cellMatch[2];
      const ref = attrs.match(/\br="([A-Z]+)(\d+)"/)?.[1];
      if (!ref) {
        continue;
      }

      const columnIndex = ref.split('').reduce((sum, char) => sum * 26 + char.charCodeAt(0) - 64, 0) - 1;
      const rawValue = body.match(/<v>([\s\S]*?)<\/v>/)?.[1] ?? body.match(/<t[^>]*>([\s\S]*?)<\/t>/)?.[1] ?? null;
      if (rawValue === null) {
        continue;
      }

      row[columnIndex] = attrs.includes(' t="s"') ? sharedStrings[Number(rawValue)] ?? null : decodeXml(rawValue);
    }

    if (row.some((value) => value !== null && value !== undefined && value !== '')) {
      rows.push(row);
    }
  }

  return rows;
}

function makeGuest(name, familyGroup, dinner, notes) {
  return {
    name: normalizeText(name),
    familyGroup,
    attendance: GuestAttendance.YES,
    dinner,
    party: true,
    notes
  };
}

function parseLunchGuests() {
  const rows = readSheetRows('Obed');
  const guests = [];

  for (const row of rows.slice(2)) {
    const angelikaName = normalizeName(row[1]);
    const tomasName = normalizeName(row[6]);

    if (angelikaName && !['Angelika', 'Meno'].includes(angelikaName)) {
      guests.push(makeGuest(angelikaName, 'Angelika', true, 'Obed aj párty.'));
    }

    if (tomasName && !['Tomáš', 'Tomas', 'Meno'].includes(tomasName)) {
      guests.push(makeGuest(tomasName, 'Tomáš', true, 'Obed aj párty.'));
    }
  }

  return guests;
}

function parsePartyGuests() {
  const rows = readSheetRows('Party');
  return rows
    .map((row) => {
      const name = normalizeName(row[1]);
      if (!name) {
        return null;
      }

      const notes = [normalizeText(row[2]), normalizeText(row[3])].filter(Boolean).join(' · ') || null;
      return makeGuest(name, null, false, notes);
    })
    .filter(Boolean);
}

function parseGuests() {
  const seen = new Map();

  for (const guest of [...parseLunchGuests(), ...parsePartyGuests()]) {
    const key = `${guest.familyGroup ?? 'spolocni'}::${guest.name.toLowerCase()}`;
    const existing = seen.get(key);

    if (!existing) {
      seen.set(key, guest);
      continue;
    }

    seen.set(key, {
      ...existing,
      dinner: existing.dinner || guest.dinner,
      party: existing.party || guest.party,
      notes: [existing.notes, guest.notes].filter(Boolean).join(' · ') || null
    });
  }

  return Array.from(seen.values());
}

async function main() {
  await prisma.pushSubscription.deleteMany();
  await prisma.weddingSettings.deleteMany();
  await prisma.task.deleteMany();
  await prisma.guest.deleteMany();
  await prisma.expense.deleteMany();

  await prisma.weddingSettings.create({
    data: {
      venueName: 'Vodárenské múzeum',
      currency: 'EUR'
    }
  });

  await prisma.task.createMany({ data: parseTasks() });
  await prisma.guest.createMany({ data: parseGuests() });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
