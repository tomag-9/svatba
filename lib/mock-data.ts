export const taskSeed = [
  {
    title: 'Vybrať dátum svadby',
    category: 'Organizácia',
    phase: 'High',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    deadlineLabel: 'TBD'
  },
  {
    title: 'Rezervovať sálu a overiť ceny',
    category: 'Miesto',
    phase: 'High',
    priority: 'HIGH',
    status: 'TODO',
    deadlineLabel: 'TBD'
  },
  {
    title: 'Kostol a kňaz',
    category: 'Ceremónia',
    phase: 'High',
    priority: 'HIGH',
    status: 'TODO',
    deadlineLabel: 'TBD'
  },
  {
    title: 'Zoznam ľudí',
    category: 'Hostia',
    phase: 'High',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    deadlineLabel: 'TBD'
  },
  {
    title: 'Šaty, oblek, topánky',
    category: 'Outfity',
    phase: 'Medium',
    priority: 'MEDIUM',
    status: 'TODO',
    deadlineLabel: 'TBD'
  },
  {
    title: 'Kytica a výzdoba',
    category: 'Dekor',
    phase: 'Low',
    priority: 'LOW',
    status: 'TODO',
    deadlineLabel: 'TBD'
  }
];

export const guestSeed = [
  { name: 'Mama', group: 'Angelika', attendance: 'YES', dinner: true, party: true },
  { name: 'Veronika', group: 'Angelika', attendance: 'YES', dinner: true, party: true },
  { name: 'Rasťa', group: 'Angelika', attendance: 'MAYBE', dinner: true, party: true },
  { name: 'Peťo', group: 'Angelika', attendance: 'YES', dinner: true, party: true },
  { name: 'Babka', group: 'Angelika', attendance: 'YES', dinner: true, party: false },
  { name: 'Niki', group: 'Angelika', attendance: 'YES', dinner: true, party: true },
  { name: 'Mamina', group: 'Tomáš', attendance: 'YES', dinner: true, party: true },
  { name: 'Tato', group: 'Tomáš', attendance: 'YES', dinner: true, party: true },
  { name: 'Marek', group: 'Tomáš', attendance: 'YES', dinner: true, party: true },
  { name: 'Riťka', group: 'Tomáš', attendance: 'MAYBE', dinner: false, party: true }
];

export const expenseSeed = [
  { title: 'Sála deposit', category: 'Venue', amount: 1050, currency: 'EUR', paid: true },
  { title: 'Flowers', category: 'Decor', amount: 320, currency: 'EUR', paid: false },
  { title: 'Church music', category: 'Ceremony', amount: 180, currency: 'EUR', paid: false },
  { title: 'Photography', category: 'Photo', amount: 700, currency: 'EUR', paid: false }
];
