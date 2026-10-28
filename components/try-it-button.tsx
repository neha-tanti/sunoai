'use client';

import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useTryIt } from '@/hooks/use-auth';
import { useHydrated } from '@/hooks/use-hydrated';
import { isSharedReport } from '@/lib/site';
import { cn } from '@/lib/utils';

const UPLOAD_PATH = '/check#upload';
const BUTTON_CLASS = 'h-12 w-full px-6 text-[15px] sm:w-auto';

type TryItButtonsProps = { reportPath?: string; className?: string };

export function TryItButtons({ reportPath, className }: TryItButtonsProps) {
  const hydrated = useHydrated();
  const tryIt = useTryIt();
  const busy = tryIt.isPending || tryIt.isSuccess;
  const opening = busy ? tryIt.variables : undefined;
  const examplePath = reportPath ?? '/check';

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {reportPath && (
        <p className="font-medium">Someone shared a SunoAI report with you.</p>
      )}
      <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        <Button
          size="lg"
          className={BUTTON_CLASS}
          disabled={!hydrated || busy}
          onClick={() => tryIt.mutate(examplePath)}
        >
          {opening === examplePath
            ? 'Opening…'
            : reportPath
              ? 'Open the report'
              : 'Try an example call'}
        </Button>
        {!reportPath && (
          <Button
            size="lg"
            variant="outline"
            className={BUTTON_CLASS}
            disabled={!hydrated || busy}
            onClick={() => tryIt.mutate(UPLOAD_PATH)}
          >
            {opening === UPLOAD_PATH ? 'Opening…' : 'Upload a call'}
          </Button>
        )}
      </div>
      <p className="text-muted-foreground text-sm">
        No sign-up. Example calls are made up.
      </p>
      {tryIt.error && (
        <p role="alert" className="text-destructive text-sm">
          {tryIt.error.message}
        </p>
      )}
    </div>
  );
}

export function TryItFromLink({ className }: { className?: string }) {
  const next = useSearchParams().get('next');
  return (
    <TryItButtons
      reportPath={isSharedReport(next) ? next : undefined}
      className={className}
    />
  );
}
