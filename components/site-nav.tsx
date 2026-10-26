import Link from 'next/link';
import { Suspense } from 'react';
import { Logo } from '@/components/logo';
import { CurrentNavLinks, NavLinks } from '@/components/nav-links';

export function SiteNav() {
  return (
    <header className="border-b">
      <nav
        aria-label="Main"
        className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-6 px-6"
      >
        <Link href="/" className="inline-flex min-h-12 items-center">
          <Logo />
        </Link>
        <Suspense fallback={<NavLinks />}>
          <CurrentNavLinks />
        </Suspense>
      </nav>
    </header>
  );
}
