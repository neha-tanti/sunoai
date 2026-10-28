import { Suspense } from 'react';
import { CurrentNavLinks, NavLinks } from '@/components/nav-links';
import { SiteHeader } from '@/components/site-header';

export default function SignedInLayout({ children }: LayoutProps<'/'>) {
  return (
    <>
      <SiteHeader>
        <Suspense fallback={<NavLinks />}>
          <CurrentNavLinks />
        </Suspense>
      </SiteHeader>
      {children}
    </>
  );
}
