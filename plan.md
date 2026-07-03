# Plán svadobnej aplikácie

## Cieľ

Vytvoriť rýchlu a bezpečnú aplikáciu pre plánovanie svadby na `svatba.tomag.xyz`, ktorá bude:

- používaná hlavne ako PWA aplikácia na Androide
- pamätať si prihlásenie dlhodobo, aby sa heslo nemuselo zadávať stále znova
- mať tasky s CRUD, deadline, prioritou a statusom
- mať jednu časovú os pre plánované úlohy
- mať zoznam pozvaných ľudí s účasťou na obede / večeri / párty
- mať dashboard s rýchlym prehľadom
- mať finance sekciu pre výdavky a rozpočet
- bežať v Dockeri lokálne aj v produkcii

## Čo je už z dokumentov zrejmé

Z `data/Svadba.docx` a `data/Svadba.xlsx` už vieme, že aplikácia potrebuje riešiť hlavne tieto oblasti:

### Úlohy a plánovanie

V poznámkach sú tieto skupiny:

- dátum svadby
- sála / miesto
- kostol a kňaz
- obed / reštaurácia
- byt / ubytovanie
- zoznam ľudí
- svedkovia
- príprava snúbencov
- auto
- web stránka s informáciami
- oznámenia / pozvánky
- fotenie
- obrady, večera, párty
- obrúčky
- jedlo
- program

Ďalšie menované položky:

- kytica
- výzdoba
- vlasy a mejkap
- čítania
- hudba v kostole
- úradné veci
- rozhodnutia
- darčeky sa nebudú robiť ako zoznam

### Hostia

XLSX obsahuje základný zoznam ľudí a rozdelenie na Angelika / Tomáš. Z toho vyplýva:

- hostia majú mať status `yes / maybe / no`
- hostia majú mať príznak pre večeru
- hostia majú mať príznak pre párty
- časom sa môžu pridať poznámky a kontakty

## Odporúčaný stack

- Next.js App Router
- TypeScript
- Prisma
- PostgreSQL
- Docker Compose pre lokálny aj produkčný setup

Prečo tento stack:

- Next.js pokryje UI aj serverové route handlery v jednom projekte
- Prisma dá jednoduchý a čitateľný model pre tasky, hostí a financie
- PostgreSQL je vhodný pre štruktúrované plánovacie dáta
- Docker zníži rozdiel medzi lokálom a produkciou

## Auth model

- jeden zdieľaný prístupový password
- password musí byť uložený v env, nie v klientovi
- session má byť v HTTP-only cookie
- cookie má mať dlhú platnosť, aby sa appka na Androide držala prihlásená

## Dáta

### Task

Plánované polia:

- title
- description
- notes
- deadline
- priority
- status
- category
- phase
- assignee
- sortOrder
- createdAt / updatedAt

### Guest

Plánované polia:

- name
- familyGroup
- attendance
- dinner
- party
- notes

### Expense

Plánované polia:

- title
- category
- amount
- currency
- isPaid
- expectedPaidOn
- vendor
- notes

### Wedding settings

Plánované polia:

- weddingDate
- budgetTarget
- currency
- venueName

## Obrazovky

### Dashboard

Rýchly prehľad:

- koľko úloh je otvorených
- čo je po termíne
- koľko hostí povedalo áno / maybe
- koľko sa minulo z rozpočtu

### Timeline

Jedna časová os, kde sa úlohy zoradia podľa:

- deadline
- fázy prípravy
- priority

### Tasks

CRUD pre úlohy vrátane detailu, deadline, priority a statusu.

### Invitees

CRUD pre hostí s účasťou, večerou a párty.

### Finance

CRUD pre výdavky a prehľad rozpočtu.

## Implementation plan

1. založiť projektový skeleton a vizuálny základ
2. pridať PWA manifest, service worker a dlhé prihlásenie
3. vytvoriť Prisma schému a základné typy
4. spraviť login gate pre spoločné heslo
5. vytvoriť dashboard shell a navigáciu
6. pridať stránky tasks, timeline, invitees a finance
7. napojiť CRUD route handlery na databázu
8. pridať validáciu, loading states a permission checks
9. overiť Docker build aj štart aplikácie

## PWA a Android

Keďže appka má byť používaná hlavne na Androide ako PWA, treba mať:

- manifest s `standalone` režimom
- service worker pre základný offline / app-shell cache
- ikonu a základné meta nastavenia pre mobilné pridanie na plochu
- dlhú session cookie, aby sa používatelia nemuseli opakovane prihlasovať

## Definition of done

- appka sa otvorí v PWA režime
- login si drží stav dlhodobo
- tasky, hostia a financie pôjdu cez CRUD
- timeline bude prehľadná a zoradená
- dashboard bude ukazovať najdôležitejšie čísla
- appka sa spustí v Dockeri bez ručného skladania prostredia
