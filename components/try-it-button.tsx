'use client';

import { Button } from '@/components/ui/button';
import { useTryIt } from '@/hooks/use-auth';
import { useHydrated } from '@/hooks/use-hydrated';

export function TryItButton() {
  const hydrated = useHydrated();
  const tryIt = useTryIt();
  const busy = tryIt.isPending || tryIt.isSuccess;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4">
        <Button
          size="lg"
          className="h-11 px-6 text-base"
          disabled={!hydrated || busy}
          onClick={() => tryIt.mutate()}
        >
          {busy ? 'Opening…' : 'Try it'}
        </Button>
        <span className="text-muted-foreground text-sm">No sign-up</span>
      </div>
      {tryIt.error && (
        <p role="alert" className="text-destructive text-sm">
          {tryIt.error.message}
        </p>
      )}
    </div>
  );
}
