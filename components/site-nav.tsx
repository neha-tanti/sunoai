import { Suspense } from 'react';
import { CurrentNavLinks, NavLinks } from '@/components/nav-links';

export function SiteNav() {
  return (
    <header className="border-b">
      <nav
        aria-label="Main"
        className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-6 py-3"
      >
        <span className="font-semibold">SunoAI</span>
        <Suspense fallback={<NavLinks />}>
          <CurrentNavLinks />
        </Suspense>
      </nav>
    </header>
  );
}
