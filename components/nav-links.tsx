'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/check', label: 'Check a call' },
  { href: '/calls', label: 'Recent calls' },
  { href: '/checklist', label: 'Checklist' },
];

export function NavLinks({ current }: { current?: string }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
      {LINKS.map((link) => (
        <li key={link.href}>
          <Link
            href={link.href}
            aria-current={current === link.href ? 'page' : undefined}
            className="text-muted-foreground hover:text-foreground aria-[current=page]:font-medium aria-[current=page]:text-foreground"
          >
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function CurrentNavLinks() {
  return <NavLinks current={usePathname()} />;
}
