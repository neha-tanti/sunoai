'use client';

import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useTryIt } from '@/hooks/use-auth';
import { useHydrated } from '@/hooks/use-hydrated';
import { isSharedReport } from '@/lib/site';

export function TryItButton({ reportPath }: { reportPath?: string }) {
  const hydrated = useHydrated();
  const tryIt = useTryIt(reportPath);
  const busy = tryIt.isPending || tryIt.isSuccess;

  return (
    <div className="flex flex-col gap-3">
      {reportPath && (
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
            : reportPath
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
  return <TryItButton reportPath={isSharedReport(next) ? next : undefined} />;
}
