'use client';

import { MoonIcon, SunIcon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { useHydrated } from '@/hooks/use-hydrated';

export function ThemeToggle() {
  const hydrated = useHydrated();
  const { resolvedTheme, setTheme } = useTheme();
  const dark = resolvedTheme === 'dark';

  return (
    <Button
      variant="outline"
      size="icon-lg"
      aria-label="Dark mode"
      aria-pressed={hydrated ? dark : undefined}
      disabled={!hydrated}
      onClick={() => setTheme(dark ? 'light' : 'dark')}
      className="ml-auto"
    >
      <MoonIcon aria-hidden className="dark:hidden" />
      <SunIcon aria-hidden className="hidden dark:block" />
    </Button>
  );
}
