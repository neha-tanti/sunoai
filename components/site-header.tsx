import Link from 'next/link';
import { Logo } from '@/components/logo';
import { ThemeToggle } from '@/components/theme-toggle';

export function SiteHeader({ children }: { children?: React.ReactNode }) {
  return (
    <header>
      <nav
        aria-label="Main"
        className="mx-auto flex min-h-16 w-full max-w-6xl flex-wrap items-center gap-x-6 px-4 sm:px-6"
      >
        <Link href="/" className="inline-flex min-h-12 items-center">
          <Logo />
        </Link>
        {children}
        <ThemeToggle />
      </nav>
    </header>
  );
}
