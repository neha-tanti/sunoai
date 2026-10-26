import { CheckIcon } from 'lucide-react';
import { type CallState, statusText } from '@/lib/call-status';
import { cn } from '@/lib/utils';

const STEPS = ['Upload', 'Transcribe', 'Analyse', 'Report'];

const CURRENT_STEP = {
  uploaded: 1,
  transcribing: 1,
  analyzing: 2,
} as const;

export function CallStatus({ status, errorCode }: CallState) {
  if (status === 'ready') {
    return (
      <p role="status" className="sr-only">
        {statusText({ status, errorCode })}
      </p>
    );
  }
  if (status === 'failed') {
    return (
      <p role="status" className="text-destructive">
        {statusText({ status, errorCode })}
      </p>
    );
  }

  const current = CURRENT_STEP[status];
  return (
    <div className="flex flex-col gap-3">
      <ol aria-label="Progress" className="flex flex-wrap items-center gap-2">
        {STEPS.map((step, index) => (
          <li
            key={step}
            aria-current={index === current ? 'step' : undefined}
            className={cn(
              'flex items-center gap-2 text-sm',
              index > current && 'text-muted-foreground',
              index === current && 'font-medium',
            )}
          >
            <span
              className={cn(
                'grid size-6 place-items-center rounded-full border font-mono text-xs',
                index < current &&
                  'border-foreground bg-foreground text-background',
                index === current &&
                  'border-foreground motion-safe:animate-pulse',
              )}
            >
              {index < current ? (
                <CheckIcon aria-hidden className="size-3.5" />
              ) : (
                index + 1
              )}
            </span>
            {step}
            {index < STEPS.length - 1 && (
              <span aria-hidden className="h-px w-6 bg-border" />
            )}
          </li>
        ))}
      </ol>
      <p role="status" className="text-muted-foreground">
        {statusText({ status, errorCode })}
      </p>
    </div>
  );
}
