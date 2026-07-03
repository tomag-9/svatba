'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { navLabels } from '@/lib/labels';

const navItems = [
  { href: '/dashboard', label: navLabels.dashboard },
  { href: '/timeline', label: navLabels.timeline },
  { href: '/tasks', label: navLabels.tasks },
  { href: '/invitees', label: navLabels.invitees },
  { href: '/finance', label: navLabels.finance },
  { href: '/settings', label: navLabels.settings }
];

export function MobileNav() {
  const pathname = usePathname();

  if (pathname === '/') {
    return null;
  }

  return (
    <nav className="mobile-nav" aria-label="Mobilná navigácia">
      {navItems.map((item) => {
        const active = pathname === item.href;
        return (
          <Link key={item.href} href={item.href} className={`mobile-nav-link ${active ? 'active' : ''}`}>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
