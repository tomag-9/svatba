import Link from 'next/link';
import type { ReactNode } from 'react';
import { navLabels } from '@/lib/labels';

const navItems = [
  { href: '/dashboard', label: navLabels.dashboard },
  { href: '/timeline', label: navLabels.timeline },
  { href: '/tasks', label: navLabels.tasks },
  { href: '/invitees', label: navLabels.invitees },
  { href: '/finance', label: navLabels.finance },
  { href: '/settings', label: navLabels.settings }
];

export function AppShell({ title, eyebrow, description, children }: { title: string; eyebrow: string; description: string; children: ReactNode; }) {
  return (
    <div className="page-frame">
      <div className="page-orb page-orb-a" aria-hidden="true" />
      <div className="page-orb page-orb-b" aria-hidden="true" />
      <header className="app-header">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="lede">{description}</p>
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
