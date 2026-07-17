import Link from 'next/link';
import type { ReactNode } from 'react';
import { Settings } from 'lucide-react';
import { cookies } from 'next/headers';
import { CountdownWidget } from '@/components/countdown-widget';
import { getWeddingAlertSlot } from '@/lib/alert-slot';
import { navLabels } from '@/lib/labels';
import { prisma } from '@/lib/prisma';
import { getWeddingCountdownCopy } from '@/lib/wedding-copy';
import { WEDDING_ROLE_COOKIE, getWeddingRole } from '@/lib/wedding-role';

const navItems = [
  { href: '/dashboard', label: navLabels.dashboard },
  { href: '/timeline', label: navLabels.timeline },
  { href: '/tasks', label: navLabels.tasks },
  { href: '/invitees', label: navLabels.invitees },
  { href: '/finance', label: navLabels.finance },
  { href: '/settings', label: navLabels.settings }
];

const DAY_MS = 1000 * 60 * 60 * 24;

async function getCountdownWidgetData() {
  const [settings, cookieStore] = await Promise.all([
    prisma.weddingSettings.findFirst({ orderBy: { createdAt: 'desc' } }),
    cookies()
  ]);
  const role = getWeddingRole(cookieStore.get(WEDDING_ROLE_COOKIE)?.value, settings?.role ?? 'TOMI');
  const daysUntilWedding = settings?.weddingDate ? Math.ceil((settings.weddingDate.getTime() - Date.now()) / DAY_MS) : null;
  const countdown = getWeddingCountdownCopy({
    daysUntilWedding: daysUntilWedding === null ? null : Math.max(daysUntilWedding, 0),
    role,
    slot: getWeddingAlertSlot(),
    isApproximate: settings?.weddingDateApproximate ?? false
  });

  return {
    daysUntilWedding,
    dailyLine: countdown.dailyLine
  };
}

export async function AppShell({
  title,
  eyebrow,
  description,
  children,
  compact = false
}: {
  title: string;
  eyebrow: string;
  description?: string;
  children: ReactNode;
  compact?: boolean;
}) {
  const countdownWidget = await getCountdownWidgetData();

  return (
    <div className={`page-frame ${compact ? 'page-frame-compact' : ''}`}>
      <div className="page-orb page-orb-a" aria-hidden="true" />
      <div className="page-orb page-orb-b" aria-hidden="true" />
      <header className="app-header">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <div className="app-title-row">
            <h1>{title}</h1>
            <Link className="settings-link" href="/settings" aria-label="Nastavenia">
              <Settings size={19} strokeWidth={2.2} aria-hidden="true" />
            </Link>
          </div>
          {description ? <p className="lede">{description}</p> : null}
        </div>
        <CountdownWidget daysUntilWedding={countdownWidget.daysUntilWedding} dailyLine={countdownWidget.dailyLine} />
        <nav className="nav-pills" aria-label="Primary">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="nav-pill">
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="content-grid">{children}</main>
    </div>
  );
}
