# Handoff: Mobile Refresh — Svadba bez chaosu

## Overview
This refreshes the mobile PWA views of the wedding-planning app (`tomag-9/svatba`,
Next.js + Prisma). The goals were: fix mobile-width density/hierarchy problems, replace
the text-only nav with a real icon nav, add category icons throughout, and add three new
dashboard features (countdown hero, budget progress bar, RSVP breakdown). Same brand
palette/fonts as the shipped app — this is a layout/hierarchy/component refresh, not a
rebrand.

## About the design files
The files in `reference/` are **HTML/React design references**, built as throwaway
prototypes to show the intended look and behavior — they are not production code to
copy-paste. The task is to **recreate these views inside the real Next.js app**
(`app/dashboard/page.tsx`, `app/timeline/page.tsx`, `app/tasks/page.tsx`,
`app/invitees/page.tsx`, `app/finance/page.tsx`, `app/page.tsx` + `components/*`),
reusing the app's existing Prisma data fetching, route handlers, and client components —
just with the new visual structure below. Do not introduce the React 18 dev CDN scripts
or the `AndroidDevice` phone-bezel wrapper into the app; those exist only so the
reference renders standalone in a browser.

## Fidelity
**High-fidelity.** Colors, spacing, radii, and typography below are final — implement
them as specified using the app's existing font variables (`--font-serif`,
`--font-sans`) and CSS custom properties in `app/globals.css`.

## What changed, screen by screen

### Global (all screens)
- **Bottom nav** (`components/mobile-nav.tsx` + its CSS): replace the current
  text-only pill row with an icon-over-label nav. Each item: 34×26px rounded-13px
  active-state background (`rgba(155,79,47,0.12)`) behind an 18px icon, 10px/700
  label below. Icons: `layout-dashboard` (Prehľad), `clock` (Časová os),
  `square-check` (Úlohy), `users` (Hostia), `wallet` (Rozpočet) — see Assets.
- **New: quick-add FAB.** 52×52px circle, `bottom: 90px; right: 16px`, gradient fill
  (`--accent` → lighter clay), white `plus` icon, `var(--shadow)`. Wire it to whatever
  the fastest "add" action is per screen (task on Tasks, guest on Invitees, etc.) —
  the reference leaves the click handler a no-op.
- **Category icons.** Every task/expense row gets a 32–34px rounded-12px tile,
  `var(--accent-tint)` background, category icon at ~50% of the tile size in
  `var(--accent)`. Category → icon map is in Assets below.
- Section headings tightened: eyebrow 11px/800, h1 down to `1.9rem` (from the current
  fluid `clamp(2.4rem,5vw,4.8rem)` — that scale reads fine on desktop but is too large
  and eats too much vertical space on a phone; keep the desktop clamp only for ≥900px
  layouts if you want to preserve both).

### Dashboard (`app/dashboard/page.tsx`)
- **New countdown hero**, first element on the page: `var(--gradient-hero)` fill,
  22px radius, `1px solid var(--card-border)`, `var(--shadow)`. Eyebrow "Do svadby ešte",
  giant serif number (`3.4rem`) + "dní" suffix at `1.4rem`, the existing
  `getWeddingCountdownCopy(...).dailyLine` beneath, then venue name + date in
  accent-colored 12.5px/700 text.
- **Open/Done split**: two 18px-radius cards side by side instead of the current
  6-card metric grid — reduces the "wall of numbers" feel. Keep the rest of the
  original metrics (guests, budget) but presented via the two items below instead.
- **New: budget progress bar** card — label row (`Rozpočet` / `{spent} / {target} €`),
  8px-tall rounded track, filled proportionally with the accent gradient.
- **New: RSVP breakdown** card — three inline stats (Áno / Možno / Spolu) with
  colored serif figures (`--good`, `--warn`, default).
- Quick-tasks list keeps the existing 3-item preview, now with category icon tiles.

### Timeline (`app/timeline/page.tsx`, `components/timeline-board.tsx`)
- **Replace the 3-column CSS grid with a segmented control** (Vysoká/Stredná/Nízka
  as three pill tabs, count in parenthesis) that shows **one priority list at a time**.
  The current `.timeline-columns` 3-up grid collapses to a cramped single column on
  phone widths — that's the single biggest mobile-fit problem in the app. Keep the
  existing `@dnd-kit` drag-and-drop *within* the active list if you still want
  cross-priority reassignment; the reference approximates it with a tap-to-cycle
  interaction, but real drag should still work fine now that only one column renders
  at a time (drag target = the segmented tabs themselves, or a "move to..." action
  sheet).
- Task cards gain the category icon tile (30px) alongside title/meta/notes.

### Tasks (`app/tasks/page.tsx`)
- Status filter chips become a **horizontally-scrollable single row**
  (`overflow-x: auto`, `flex-shrink: 0` chips) instead of wrapping — wrapping chips
  on a narrow phone push the list down awkwardly.
- List rows condensed: category icon tile (32px) + title/meta on the left, a single
  status tag on the right (drop the separate priority tag from the row — keep it in
  the detail view only) to cut text density.

### Invitees / Guests (`app/invitees/page.tsx`)
- **Group rows by `familyGroup`** (Angelika / Tomáš / Party) under small section
  labels instead of one flat list.
- **Replace the plain name row with an avatar-initials chip** — 36px circle, two-letter
  initials, colored by group (Angelika → accent tint, Tomáš → good tint, Party → warn
  tint).
- **Replace the two text tags (Obed/Párty) with compact 26px icon toggles**
  (`utensils` / `disc-3`), tinted good when on, muted gray when off — this alone
  removes ~2 lines of text per row.

### Finance (`app/finance/page.tsx`)
- **Budget hero card**: total spent as its own row in large serif type (`1.8rem`,
  `white-space: nowrap` — do not put it in the same flex row as the "z X € cieľa"
  label, that's what broke in the first draft of this refresh), sub-label below,
  then a 9px progress bar (turns `--danger` past 90% of target).
- Expense rows get the same category icon tile treatment as tasks.

### Login (`app/page.tsx`, `components/login-form.tsx`)
- Single-column mobile layout (the current two-up hero+form grid only makes sense
  ≥720px — on phone it should stack, rings mark centered above the eyebrow/title,
  password card below, matching what's already in the `@media (min-width: 720px)`
  breakpoint logic, just fix the base/mobile case to match the reference).

## Design tokens used (already exist in `app/globals.css` — no new colors)
- `--accent #9b4f2f`, `--accent-tint rgba(155,79,47,0.12)`, `--good #2e7d5b` /
  `--good-tint rgba(46,125,91,0.12)`, `--warn #b16c1d` / `--warn-tint
  rgba(177,108,29,0.12)`, `--danger #a03636`, `--card`, `--card-border`, `--shadow`,
  `--radius 26px` (hero cards), 18px (rows/metric cards), 16px (inputs), 999px (pills).
- Fonts: `--font-serif` (Cormorant Garamond) for headings/big numbers, `--font-sans`
  (Manrope) for everything else — unchanged from current app.
- New sizes introduced for mobile density: h1 `1.9rem`, hero figure `3.4rem`, row
  title `13.5–14px`, row meta `11.5–12px`, tag `11px`.

## Assets
- **Icons**: none exist in the current app (no icon font/SVG set). This refresh
  introduces **Lucide** icons (MIT license) via the `lucide-react` npm package —
  `npm install lucide-react`, then `import { LayoutDashboard, Clock, SquareCheck,
  Users, Wallet, Plus, ... } from 'lucide-react'`. Category → icon map:
  Planning→CalendarDays, Venue→Landmark, Ceremony→Church, Food→Utensils, Home→House,
  Jewelry→Gem, Flowers→Flower2, Beauty→Sparkles, Decisions→ListChecks, Photo→Camera,
  Program→List, Logistics→Car, Style→Shirt, Communication→Megaphone,
  Paperwork→FileText, Party→Disc3, Decor→Palette (fallback: CircleDashed).
  Nav icons: LayoutDashboard, Clock, SquareCheck, Users, Wallet, Plus.
- **rings-mark.svg** — already in the app as `app/icon.svg`; reused as-is on the
  login screen, no changes.

## Files in this bundle
- `reference/` — the full working HTML/JSX reference (open `reference/index.html`
  in a browser to click through all 6 screens end to end). Same files as the design
  system's `ui_kits/svatba-app/`.
- This README.

## Suggested implementation order
1. Add `lucide-react`, wire the new bottom nav + FAB (touches every page via layout).
2. Dashboard (highest-visibility screen, self-contained).
3. Finance + Tasks (similar row pattern, quick to do together).
4. Guests (grouping + avatar work).
5. Timeline (the segmented-tabs change touches the `@dnd-kit` wiring, do it last and
   test drag behavior carefully).
6. Login mobile-stack fix.
