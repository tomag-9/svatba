import Link from 'next/link';
import type { ReactNode } from 'react';
import { Settings } from 'lucide-react';
import { navLabels } from '@/lib/labels';

const navItems = [
  { href: '/dashboard', label: navLabels.dashboard },
  { href: '/timeline', label: navLabels.timeline },
  { href: '/tasks', label: navLabels.tasks },
  { href: '/invitees', label: navLabels.invitees },
  { href: '/finance', label: navLabels.finance },
  { href: '/settings', label: navLabels.settings }
];

export function AppShell({
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
