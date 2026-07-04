'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Clock, LayoutDashboard, Plus, SquareCheck, Users, Wallet, type LucideIcon } from 'lucide-react';
import { navLabels } from '@/lib/labels';

const navItems = [
  { href: '/dashboard', label: navLabels.dashboard, icon: LayoutDashboard },
  { href: '/timeline', label: navLabels.timeline, icon: Clock },
  { href: '/tasks', label: navLabels.tasks, icon: SquareCheck },
  { href: '/invitees', label: navLabels.invitees, icon: Users },
  { href: '/finance', label: navLabels.finance, icon: Wallet }
] satisfies Array<{ href: string; label: string; icon: LucideIcon }>;

const quickAddTargets: Record<string, string> = {
  '/dashboard': '/tasks#add-task',
  '/timeline': '/tasks#add-task',
  '/tasks': '#add-task',
  '/invitees': '#add-guest',
  '/finance': '#add-expense'
};

export function MobileNav() {
  const pathname = usePathname();

  if (pathname === '/') {
    return null;
  }

  const quickAddHref = quickAddTargets[pathname] ?? '/tasks#add-task';
  const showQuickAdd = pathname !== '/settings';

  return (
    <>
      {showQuickAdd ? (
        <Link className="quick-add-fab" href={quickAddHref} aria-label="Pridať">
          <Plus size={24} strokeWidth={2.4} aria-hidden="true" />
        </Link>
      ) : null}
      <nav className="mobile-nav" aria-label="Mobilná navigácia">
        {navItems.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className={`mobile-nav-link ${active ? 'active' : ''}`}>
              <span className="mobile-nav-icon">
                <Icon size={18} strokeWidth={2.25} aria-hidden="true" />
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
