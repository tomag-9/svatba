const { PrismaClient, TaskPriority, GuestAttendance } = require('@prisma/client');

const prisma = new PrismaClient();

const tasks = [
  {
    priority: TaskPriority.HIGH,
    title: 'Kedy?',
    description: 'Vybrať finálny termín svadby.',
    notes: 'Vyhodnotiť piatok vs sobotu a potvrdiť dátum čo najskôr.',
    category: 'Planning',
    phase: 'High'
  },
  {
    priority: TaskPriority.HIGH,
    title: 'Sála',
    description: 'Doriešiť priestor na svadbu.',
    notes: 'Vodárenské múzeum - 1050 - 8hod + deň vopred chystanie. Alternatívy: Karlovka, Záhorská.',
    category: 'Venue',
    phase: 'High'
  },
  {
    priority: TaskPriority.HIGH,
    title: 'Klíma?',
    description: 'Overiť komfort miesta a klímu.',
    notes: 'Zistiť, či je priestor klimatizovaný a ako je to s teplotou v kostole.',
    category: 'Venue',
    phase: 'High'
  },
  {
    priority: TaskPriority.HIGH,
    title: 'Kostol & kňaz',
    description: 'Zabezpečiť kostol a farára.',
    notes: 'Br. Lukáš, Hobbit? Františkáni? Spýtať sa Niki.',
    category: 'Ceremony',
    phase: 'High'
  },
  {
    priority: TaskPriority.HIGH,
    title: 'Obed - Reštika',
    description: 'Rezervovať obed po obrade.',
    notes: 'Kde a rezervovať, aj kto to vybaví.',
    category: 'Food',
    phase: 'High'
  },
  {
    priority: TaskPriority.HIGH,
    title: 'Byt',
    description: 'Doriešiť bývanie a logistiku.',
    notes: 'Zoznam ľudí, magula.sk, svedkovia Ňiki & Paľo.',
    category: 'Home',
    phase: 'High'
  },
  {
    priority: TaskPriority.HIGH,
    title: 'Blba príprava snúbencov',
    description: 'Pripraviť snúbenecké veci.',
    notes: 'Spýtať sa Betky, Steva, Pala a Gaba, kde je rýchlokurz.',
    category: 'Preparation',
    phase: 'High'
  },
  {
    priority: TaskPriority.HIGH,
    title: 'Ange tatko',
    description: 'Skontrolovať rodinné veci okolo Angie.',
    notes: 'Dohodnúť dôležité rodinné pointy a podporu.',
    category: 'Family',
    phase: 'High'
  },
  {
    priority: TaskPriority.HIGH,
    title: 'Šaty & Oblek / Topánky & Lode',
    description: 'Doriešiť outfit a obuv.',
    notes: 'Zabezpečiť šaty, oblek, topánky a doplnky.',
    category: 'Style',
    phase: 'High'
  },
  {
    priority: TaskPriority.HIGH,
    title: 'Auto - Majo',
    description: 'Zabezpečiť dopravu.',
    notes: 'Dohodnúť auto s Majom.',
    category: 'Logistics',
    phase: 'High'
  },
  {
    priority: TaskPriority.HIGH,
    title: 'Info webpage',
    description: 'Pripraviť web s info pre hostí.',
    notes: 'Základné info stránka pre svadbu.',
    category: 'Communication',
    phase: 'High'
  },
  {
    priority: TaskPriority.HIGH,
    title: 'Oznamko',
    description: 'Pripraviť a poslať oznámenia.',
    notes: 'Finalizovať text a odoslanie.',
    category: 'Communication',
    phase: 'High'
  },
  {
    priority: TaskPriority.HIGH,
    title: 'Foto:',
    description: 'Zladiť fotografický plán.',
    notes: 'Obrad Áno, večera Nie, párty tance na začiatok, analógy a sranda foto porozmiestňovať. Kossey deal: fotenie - obrad - prvé tance.',
    category: 'Photo',
    phase: 'High'
  },
  {
    priority: TaskPriority.HIGH,
    title: 'Obrúčky',
    description: 'Zabezpečiť obrúčky.',
    notes: 'Teta Žanet. Nenápadne zapojiť zlato.',
    category: 'Jewelry',
    phase: 'High'
  },
  {
    priority: TaskPriority.HIGH,
    title: 'Jedlo',
    description: 'Premyslieť jedlo na svadbe.',
    notes: 'Zmrzka ako alternatíva k tradičnému koláču.',
    category: 'Food',
    phase: 'High'
  },
  {
    priority: TaskPriority.HIGH,
    title: 'Program',
    description: 'Skladať program dňa.',
    notes: 'Low level planning pre svadobný deň.',
    category: 'Program',
    phase: 'High'
  },
  {
    priority: TaskPriority.HIGH,
    title: 'Kytica',
    description: 'Doriešiť kyticu.',
    notes: 'Vybrať a objednať svadobnú kyticu.',
    category: 'Flowers',
    phase: 'High'
  },
  {
    priority: TaskPriority.HIGH,
    title: 'Outsource výzdoba',
    description: 'Zabezpečiť výzdobu.',
    notes: 'Zadať dekorácie externe, ak to dáva zmysel.',
    category: 'Decor',
    phase: 'High'
  },
  {
    priority: TaskPriority.HIGH,
    title: 'Vlasy a Mejkap',
    description: 'Rezervovať vlasy a mejkap.',
    notes: 'Ladiť termín a človeka, ktorý to urobí.',
    category: 'Beauty',
    phase: 'High'
  },
  {
    priority: TaskPriority.HIGH,
    title: 'Namiesto kolaca zmrzka',
    description: 'Potvrdiť dezertný koncept.',
    notes: 'Zmrzka namiesto klasického koláča.',
    category: 'Food',
    phase: 'High'
  },
  {
    priority: TaskPriority.HIGH,
    title: 'čítania',
    description: 'Vybrať čítania na obrad.',
    notes: 'Doladiť texty a kto ich prečíta.',
    category: 'Ceremony',
    phase: 'High'
  },
  {
    priority: TaskPriority.HIGH,
    title: 'Hranie v kostole a pesničky',
    description: 'Hudba na obrade.',
    notes: 'Zabezpečiť hranie v kostole a piesne.',
    category: 'Ceremony',
    phase: 'High'
  },
  {
    priority: TaskPriority.HIGH,
    title: 'Úrad',
    description: 'Zabezpečiť matriku a úrady.',
    notes: 'Skontrolovať úradné povinnosti.',
    category: 'Paperwork',
    phase: 'High'
  },
  {
    priority: TaskPriority.HIGH,
    title: 'Rozhodnutia',
    description: 'Doriešiť otvorené rozhodnutia.',
    notes: 'Nebude zoznam darov.',
    category: 'Decisions',
    phase: 'High'
  },
  {
    priority: TaskPriority.MEDIUM,
    title: 'Kostol & kňaz - doplnenie',
    description: 'Dohodnúť finálne detaily obradnej časti.',
    notes: 'Klimatizovaný kostol? Zima v kostole? ',
    category: 'Ceremony',
    phase: 'Medium'
  },
  {
    priority: TaskPriority.MEDIUM,
    title: 'Oznamko - texty',
    description: 'Skontrolovať wording oznámení.',
    notes: 'Info webpage, oznamko a texty na web.',
    category: 'Communication',
    phase: 'Medium'
  },
  {
    priority: TaskPriority.MEDIUM,
    title: 'Párty - tance na začiatok',
    description: 'Nastaviť prvé party momenty.',
    notes: 'Párty, analógy, sranda foto a prvé tance.',
    category: 'Party',
    phase: 'Medium'
  },
  {
    priority: TaskPriority.MEDIUM,
    title: 'Sála - alternate options',
    description: 'Preveriť ďalšie sály.',
    notes: 'Karlovka, Záhorská, Vodárenské múzeum.',
    category: 'Venue',
    phase: 'Medium'
  },
  {
    priority: TaskPriority.MEDIUM,
    title: 'Zistiť ceny',
    description: 'Preveriť rozpočtové ceny priestorov.',
    notes: 'Zistiť aké sú asi ceny.',
    category: 'Budget',
    phase: 'Medium'
  },
  {
    priority: TaskPriority.MEDIUM,
    title: 'Byt - zoznam ľudí',
    description: 'Doplniť zoznam ľudí okolo bytu.',
    notes: 'magula.sk',
    category: 'Home',
    phase: 'Medium'
  },
  {
    priority: TaskPriority.MEDIUM,
    title: 'Svedkovia',
    description: 'Potvrdiť svedkov.',
    notes: 'Ňiki & Paľo.',
    category: 'Ceremony',
    phase: 'Medium'
  },
  {
    priority: TaskPriority.MEDIUM,
    title: 'Info pre hostí',
    description: 'Pripraviť info stránku pre hostí.',
    notes: 'Ubytovanie, obrad, obed, večera, párty.',
    category: 'Communication',
    phase: 'Medium'
  },
  {
    priority: TaskPriority.MEDIUM,
    title: 'Program - low',
    description: 'Doplniť program a časovanie.',
    notes: 'Obrad - áno, večera - nie, párty - tance na začiatok.',
    category: 'Program',
    phase: 'Medium'
  },
  {
    priority: TaskPriority.MEDIUM,
    title: 'Foto - rozmiestnenie',
    description: 'Rozmiestniť foto pointy.',
    notes: 'Analógy a sranda foto porozmiestňovať.',
    category: 'Photo',
    phase: 'Medium'
  },
  {
    priority: TaskPriority.MEDIUM,
    title: 'Auto - potvrdenie',
    description: 'Dotiahnuť logistiku auta.',
    notes: 'Majo.',
    category: 'Logistics',
    phase: 'Medium'
  },
  {
    priority: TaskPriority.MEDIUM,
    title: 'Obed - reštika - rezervácia',
    description: 'Rezervovať obedové miesto.',
    notes: 'Kde a rezervovať aj že kto.',
    category: 'Food',
    phase: 'Medium'
  },
  {
    priority: TaskPriority.MEDIUM,
    title: 'Večera - nie',
    description: 'Potvrdiť, že večera nebude samostatná položka.',
    notes: 'Párty tance na začiatok.',
    category: 'Food',
    phase: 'Medium'
  },
  {
    priority: TaskPriority.MEDIUM,
    title: 'Šaty & Oblek - fitting',
    description: 'Dokončiť skúšky oblečenia.',
    notes: 'Topánky & lode.',
    category: 'Style',
    phase: 'Medium'
  },
  {
    priority: TaskPriority.MEDIUM,
    title: 'Byt - logistika',
    description: 'Doladiť byt a presuny.',
    notes: 'Magula.sk.',
    category: 'Home',
    phase: 'Medium'
  },
  {
    priority: TaskPriority.MEDIUM,
    title: 'Program - rozhodnutia',
    description: 'Zavrieť otvorené rozhodnutia.',
    notes: 'Nebude zoznam darov.',
    category: 'Decisions',
    phase: 'Medium'
  },
  {
    priority: TaskPriority.LOW,
    title: 'Zmrzka',
    description: 'Doriešiť dezertný nápad.',
    notes: 'Namiesto koláča zmrzka.',
    category: 'Food',
    phase: 'Low'
  },
  {
    priority: TaskPriority.LOW,
    title: 'Vlasy a mejkap - doplnky',
    description: 'Doladiť beauty detaily.',
    notes: 'Outsource výzdoba.',
    category: 'Beauty',
    phase: 'Low'
  },
  {
    priority: TaskPriority.LOW,
    title: 'Foto - analógy',
    description: 'Umiestniť analógové foťáky.',
    notes: 'Sranda foto porozmiestňovať.',
    category: 'Photo',
    phase: 'Low'
  },
  {
    priority: TaskPriority.LOW,
    title: 'Čítania',
    description: 'Finalizovať čítania.',
    notes: 'Hranie v kostole a pesničky.',
    category: 'Ceremony',
    phase: 'Low'
  },
  {
    priority: TaskPriority.LOW,
    title: 'Úrad - final',
    description: 'Dotiahnuť úradné veci.',
    notes: 'Rozhodnutia.',
    category: 'Paperwork',
    phase: 'Low'
  },
  {
    priority: TaskPriority.LOW,
    title: 'Darčeky',
    description: 'Potvrdiť, že nebude zoznam darov.',
    notes: 'Rozhodnuté.',
    category: 'Decisions',
    phase: 'Low'
  }
];

const guests = [
  { name: 'Mama', familyGroup: 'Angelika', attendance: GuestAttendance.YES, dinner: false, party: true, notes: 'Z obedovej tabuľky.' },
  { name: 'Veronika', familyGroup: 'Angelika', attendance: GuestAttendance.YES, dinner: false, party: true, notes: 'Z obedovej tabuľky.' },
  { name: 'Veronika +1?', familyGroup: 'Angelika', attendance: GuestAttendance.MAYBE, dinner: false, party: true, notes: 'Z obedovej tabuľky.' },
  { name: 'Rasťa', familyGroup: 'Angelika', attendance: GuestAttendance.YES, dinner: false, party: true, notes: 'Z obedovej tabuľky.' },
  { name: 'Peťo', familyGroup: 'Angelika', attendance: GuestAttendance.YES, dinner: false, party: true, notes: 'Z obedovej tabuľky.' },
  { name: 'Babka', familyGroup: 'Angelika', attendance: GuestAttendance.YES, dinner: false, party: true, notes: 'Z obedovej tabuľky.' },
  { name: 'Niki', familyGroup: 'Angelika', attendance: GuestAttendance.YES, dinner: false, party: true, notes: 'Z obedovej tabuľky.' },
  { name: 'Tato', familyGroup: 'Tomáš', attendance: GuestAttendance.YES, dinner: false, party: true, notes: 'Z obedovej tabuľky.' },
  { name: 'Mamina', familyGroup: 'Tomáš', attendance: GuestAttendance.YES, dinner: false, party: true, notes: 'Z obedovej tabuľky.' },
  { name: 'Marek', familyGroup: 'Tomáš', attendance: GuestAttendance.YES, dinner: false, party: true, notes: 'Z obedovej tabuľky.' },
  { name: 'Riťka', familyGroup: 'Tomáš', attendance: GuestAttendance.YES, dinner: false, party: true, notes: 'Z obedovej tabuľky.' },
  { name: 'Babka', familyGroup: 'Tomáš', attendance: GuestAttendance.YES, dinner: false, party: true, notes: 'Z obedovej tabuľky.' },
  { name: 'Dedo', familyGroup: 'Tomáš', attendance: GuestAttendance.YES, dinner: false, party: true, notes: 'Z obedovej tabuľky.' },
  { name: 'Stará Mama', familyGroup: 'Tomáš', attendance: GuestAttendance.YES, dinner: false, party: true, notes: 'Z obedovej tabuľky.' },
  { name: 'Starý tato', familyGroup: 'Tomáš', attendance: GuestAttendance.YES, dinner: false, party: true, notes: 'Z obedovej tabuľky.' },
  { name: 'Ďuro', familyGroup: 'Tomáš', attendance: GuestAttendance.YES, dinner: false, party: true, notes: 'Z obedovej tabuľky.' },
  { name: 'Danka', familyGroup: 'Tomáš', attendance: GuestAttendance.YES, dinner: false, party: true, notes: 'Z obedovej tabuľky.' },
  { name: 'Matúš', familyGroup: 'Tomáš', attendance: GuestAttendance.YES, dinner: false, party: true, notes: 'Z obedovej tabuľky.' },
  { name: 'Katka', familyGroup: 'Tomáš', attendance: GuestAttendance.YES, dinner: false, party: true, notes: 'Z obedovej tabuľky.' },
  { name: 'Samo', familyGroup: 'Tomáš', attendance: GuestAttendance.YES, dinner: false, party: true, notes: 'Z obedovej tabuľky.' },
  { name: 'Lukáš', familyGroup: 'Tomáš', attendance: GuestAttendance.YES, dinner: false, party: true, notes: 'Z obedovej tabuľky.' },
  { name: 'Palo', familyGroup: 'Tomáš', attendance: GuestAttendance.YES, dinner: false, party: true, notes: 'Z obedovej tabuľky.' },
  { name: 'Domča', familyGroup: 'Tomáš', attendance: GuestAttendance.YES, dinner: false, party: true, notes: 'Z obedovej tabuľky.' },
  { name: 'My A', familyGroup: 'Party', attendance: GuestAttendance.YES, dinner: false, party: true, notes: 'Party sheet.' },
  { name: 'My T', familyGroup: 'Party', attendance: GuestAttendance.YES, dinner: false, party: true, notes: 'Party sheet.' },
  { name: 'Mamina', familyGroup: 'Party', attendance: GuestAttendance.YES, dinner: false, party: true, notes: 'Party sheet.' },
  { name: 'Tato', familyGroup: 'Party', attendance: GuestAttendance.YES, dinner: false, party: true, notes: 'Party sheet.' },
  { name: 'Marek', familyGroup: 'Party', attendance: GuestAttendance.YES, dinner: false, party: true, notes: 'Party sheet.' },
  { name: 'Riťka', familyGroup: 'Party', attendance: GuestAttendance.YES, dinner: false, party: true, notes: 'Party sheet.' },
  { name: 'Babka', familyGroup: 'Party', attendance: GuestAttendance.YES, dinner: false, party: true, notes: 'Party sheet.' },
  { name: 'Dedo', familyGroup: 'Party', attendance: GuestAttendance.YES, dinner: false, party: true, notes: 'Party sheet.' },
  { name: 'Stará Mama', familyGroup: 'Party', attendance: GuestAttendance.YES, dinner: false, party: true, notes: 'Party sheet.' },
  { name: 'Starý tato', familyGroup: 'Party', attendance: GuestAttendance.YES, dinner: false, party: true, notes: 'Party sheet.' },
  { name: 'Ďuro', familyGroup: 'Party', attendance: GuestAttendance.YES, dinner: false, party: true, notes: 'Party sheet.' },
  { name: 'Danka', familyGroup: 'Party', attendance: GuestAttendance.YES, dinner: false, party: true, notes: 'Party sheet.' },
  { name: 'Matúš', familyGroup: 'Party', attendance: GuestAttendance.YES, dinner: false, party: true, notes: 'Party sheet.' },
  { name: 'Katka', familyGroup: 'Party', attendance: GuestAttendance.YES, dinner: false, party: true, notes: 'Party sheet.' },
  { name: 'Samo', familyGroup: 'Party', attendance: GuestAttendance.YES, dinner: false, party: true, notes: 'Party sheet.' },
  { name: 'Lukáš', familyGroup: 'Party', attendance: GuestAttendance.YES, dinner: false, party: true, notes: 'Party sheet.' },
  { name: 'Palo', familyGroup: 'Party', attendance: GuestAttendance.YES, dinner: false, party: true, notes: 'Party sheet.' },
  { name: 'Domča', familyGroup: 'Party', attendance: GuestAttendance.YES, dinner: false, party: true, notes: 'Party sheet.' },
  { name: 'Mama', familyGroup: 'Party', attendance: GuestAttendance.YES, dinner: false, party: true, notes: 'Party sheet.' },
  { name: 'Veronika', familyGroup: 'Party', attendance: GuestAttendance.YES, dinner: false, party: true, notes: 'Party sheet.' },
  { name: 'Veronika +1?', familyGroup: 'Party', attendance: GuestAttendance.MAYBE, dinner: false, party: true, notes: 'Party sheet.' },
  { name: 'Rasťa', familyGroup: 'Party', attendance: GuestAttendance.YES, dinner: false, party: true, notes: 'Party sheet.' },
  { name: 'Peťo', familyGroup: 'Party', attendance: GuestAttendance.YES, dinner: false, party: true, notes: 'Party sheet.' },
  { name: 'Babka', familyGroup: 'Party', attendance: GuestAttendance.YES, dinner: false, party: true, notes: 'Party sheet.' },
  { name: 'Niki', familyGroup: 'Party', attendance: GuestAttendance.YES, dinner: false, party: true, notes: 'Party sheet.' },
  { name: 'Hanka', familyGroup: 'Party', attendance: GuestAttendance.MAYBE, dinner: false, party: true, notes: 'Spolužiačky?' },
  { name: 'Hanka +1', familyGroup: 'Party', attendance: GuestAttendance.MAYBE, dinner: false, party: true, notes: 'Spolužiačky?' },
  { name: 'Agáta', familyGroup: 'Party', attendance: GuestAttendance.MAYBE, dinner: false, party: true, notes: 'MIMA START.' },
  { name: 'Agáta +1', familyGroup: 'Party', attendance: GuestAttendance.MAYBE, dinner: false, party: true, notes: 'MIMA START.' },
  { name: 'Anička', familyGroup: 'Party', attendance: GuestAttendance.MAYBE, dinner: false, party: true, notes: 'MIMA START.' },
  { name: 'Klára', familyGroup: 'Party', attendance: GuestAttendance.MAYBE, dinner: false, party: true, notes: 'MIMA START.' },
  { name: 'Husci', familyGroup: 'Party', attendance: GuestAttendance.MAYBE, dinner: false, party: true, notes: 'MIMA START.' },
  { name: 'Linda', familyGroup: 'Party', attendance: GuestAttendance.MAYBE, dinner: false, party: true, notes: 'MIMA START.' },
  { name: 'Breci', familyGroup: 'Party', attendance: GuestAttendance.MAYBE, dinner: false, party: true, notes: 'MIMA START.' },
  { name: 'Kossey', familyGroup: 'Party', attendance: GuestAttendance.YES, dinner: false, party: true, notes: 'FRANTISEK.' },
  { name: 'Šmalec', familyGroup: 'Party', attendance: GuestAttendance.MAYBE, dinner: false, party: true, notes: 'MIMA START.' },
  { name: 'Nagy P', familyGroup: 'Party', attendance: GuestAttendance.MAYBE, dinner: false, party: true, notes: 'MIMA START.' },
  { name: 'Terezka', familyGroup: 'Party', attendance: GuestAttendance.MAYBE, dinner: false, party: true, notes: 'MIMA START.' },
  { name: 'Novak', familyGroup: 'Party', attendance: GuestAttendance.MAYBE, dinner: false, party: true, notes: 'MIMA START.' },
  { name: 'Zuzka S', familyGroup: 'Party', attendance: GuestAttendance.MAYBE, dinner: false, party: true, notes: 'MIMA START.' },
  { name: 'Zuzka D', familyGroup: 'Party', attendance: GuestAttendance.MAYBE, dinner: false, party: true, notes: 'MIMA START.' },
  { name: 'Adam', familyGroup: 'Party', attendance: GuestAttendance.MAYBE, dinner: false, party: true, notes: 'MIMA END.' },
  { name: 'Lukas', familyGroup: 'Party', attendance: GuestAttendance.MAYBE, dinner: false, party: true, notes: 'MIMA END.' },
  { name: 'Lukasova Sofia', familyGroup: 'Party', attendance: GuestAttendance.MAYBE, dinner: false, party: true, notes: 'MIMA END.' },
  { name: 'Matúš', familyGroup: 'Party', attendance: GuestAttendance.YES, dinner: false, party: true, notes: 'FRANTISEK.' },
  { name: 'Filip', familyGroup: 'Party', attendance: GuestAttendance.MAYBE, dinner: false, party: true, notes: 'FRANTISEK.' },
  { name: 'Katka', familyGroup: 'Party', attendance: GuestAttendance.MAYBE, dinner: false, party: true, notes: 'FRANTISEK.' },
  { name: 'Filip?', familyGroup: 'Party', attendance: GuestAttendance.MAYBE, dinner: false, party: true, notes: 'MATFYZ.' },
  { name: 'Sani', familyGroup: 'Party', attendance: GuestAttendance.MAYBE, dinner: false, party: true, notes: 'Party sheet.' },
  { name: 'Macka', familyGroup: 'Party', attendance: GuestAttendance.MAYBE, dinner: false, party: true, notes: 'Party sheet.' },
  { name: 'Kláťo', familyGroup: 'Party', attendance: GuestAttendance.MAYBE, dinner: false, party: true, notes: 'Party sheet.' },
  { name: 'Števo', familyGroup: 'Party', attendance: GuestAttendance.MAYBE, dinner: false, party: true, notes: 'Party sheet.' },
  { name: 'Dieťa', familyGroup: 'Party', attendance: GuestAttendance.MAYBE, dinner: false, party: true, notes: 'Nealko prípitok.' },
  { name: 'Sima?', familyGroup: 'Party', attendance: GuestAttendance.MAYBE, dinner: false, party: true, notes: 'TABLETKY.' },
  { name: 'Terka?', familyGroup: 'Party', attendance: GuestAttendance.MAYBE, dinner: false, party: true, notes: 'TABLETKY.' },
  { name: 'Vanesa?', familyGroup: 'Party', attendance: GuestAttendance.MAYBE, dinner: false, party: true, notes: 'TABLETKY.' },
  { name: 'Monika', familyGroup: 'Party', attendance: GuestAttendance.MAYBE, dinner: false, party: true, notes: 'Vanekfamily.' },
  { name: 'Tomas', familyGroup: 'Party', attendance: GuestAttendance.MAYBE, dinner: false, party: true, notes: 'Vanekfamily.' },
  { name: 'Krsny', familyGroup: 'Party', attendance: GuestAttendance.MAYBE, dinner: false, party: true, notes: 'Z party sheet.' },
  { name: 'Pauli', familyGroup: 'Party', attendance: GuestAttendance.MAYBE, dinner: false, party: true, notes: 'Nevieme.' },
  { name: 'Sveta', familyGroup: 'Party', attendance: GuestAttendance.MAYBE, dinner: false, party: true, notes: 'Party sheet.' },
  { name: 'Joihanka', familyGroup: 'Party', attendance: GuestAttendance.MAYBE, dinner: false, party: true, notes: 'Party sheet.' },
  { name: 'Dorotka', familyGroup: 'Party', attendance: GuestAttendance.MAYBE, dinner: false, party: true, notes: 'Party sheet.' }
];

const normalizedGuests = guests.map((guest) => ({
  ...guest,
  attendance: GuestAttendance.YES,
  dinner: guest.notes?.includes('Z obedovej tabuľky.') ? true : guest.dinner,
  party: guest.notes?.includes('Z obedovej tabuľky.') ? false : guest.party
}));

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

  await prisma.task.createMany({
    data: tasks.map((task, index) => ({
      ...task,
      sortOrder: index + 1,
      phase: task.phase,
      status: 'TODO'
    }))
  });

  const seenGuests = new Map();
  for (const guest of normalizedGuests) {
    const key = `${guest.familyGroup ?? ''}::${guest.name}`;
    const existing = seenGuests.get(key);
    if (!existing) {
      seenGuests.set(key, guest);
      continue;
    }

    seenGuests.set(key, {
      ...existing,
      attendance: GuestAttendance.YES,
      dinner: existing.dinner || guest.dinner,
      party: existing.party || guest.party,
      notes: existing.notes ?? guest.notes
    });
  }

  await prisma.guest.createMany({
    data: Array.from(seenGuests.values())
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });