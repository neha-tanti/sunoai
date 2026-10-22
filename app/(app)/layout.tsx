import { SiteNav } from '@/components/site-nav';

export default function SignedInLayout({ children }: LayoutProps<'/'>) {
  return (
    <>
      <SiteNav />
      {children}
    </>
  );
}
