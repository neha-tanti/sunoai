import { formatTime } from '@/lib/report-labels';

type TimeLinkProps = { segmentId: number; time: number };

export function TimeLink({ segmentId, time }: TimeLinkProps) {
  return (
    <a
      href={`#segment-${segmentId}`}
      aria-label={`Show ${formatTime(time)} in the transcript`}
      className="rounded-md border bg-muted px-1.5 font-mono text-xs leading-relaxed tabular-nums hover:border-ring"
    >
      {formatTime(time)}
    </a>
  );
}

type QuoteLinkProps = { segmentId: number; quote: string };

export function QuoteLink({ segmentId, quote }: QuoteLinkProps) {
  return (
    <a
      href={`#segment-${segmentId}`}
      className="italic underline-offset-4 hover:underline"
    >
      <q>{quote}</q>
    </a>
  );
}
