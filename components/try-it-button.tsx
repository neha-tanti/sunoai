'use client';

import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useTryIt } from '@/hooks/use-auth';
import { useHydrated } from '@/hooks/use-hydrated';
import { isSharedReport } from '@/lib/site';

export function TryItButton({ report = null }: { report?: string | null }) {
  const hydrated = useHydrated();
  const tryIt = useTryIt(report ?? '/check');
  const busy = tryIt.isPending || tryIt.isSuccess;

  return (
    <div className="flex flex-col gap-3">
      {report && (
        <p className="font-medium">Someone shared a SunoAI report with you.</p>
      )}
      <div className="flex flex-wrap items-center gap-4">
        <Button
          size="lg"
          disabled={!hydrated || busy}
          onClick={() => tryIt.mutate()}
        >
          {busy
            ? 'Opening…'
            : report
              ? 'Open the report'
              : 'Try an example call'}
        </Button>
        <span className="text-muted-foreground text-sm">
          No sign-up, no recording needed
        </span>
      </div>
      {tryIt.error && (
        <p role="alert" className="text-destructive text-sm">
          {tryIt.error.message}
        </p>
      )}
    </div>
  );
}

export function TryItFromLink() {
  const next = useSearchParams().get('next');
  return <TryItButton report={isSharedReport(next) ? next : null} />;
}
