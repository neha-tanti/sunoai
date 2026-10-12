'use client';

import { Button } from '@/components/ui/button';
import { useCheckAgain } from '@/hooks/use-check-again';

export function CheckAgainButton({ callId }: { callId: string }) {
  const checkAgain = useCheckAgain(callId);

  return (
    <div className="flex flex-col items-start gap-2">
      <Button
        onClick={() => checkAgain.mutate()}
        disabled={checkAgain.isPending}
      >
        {checkAgain.isPending ? 'Checking again…' : 'Check again'}
      </Button>
      {checkAgain.isError && (
        <p role="alert" className="text-destructive text-sm">
          {checkAgain.error.message}
        </p>
      )}
    </div>
  );
}
