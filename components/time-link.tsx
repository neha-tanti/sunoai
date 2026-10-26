import { formatTime } from '@/lib/format-time';
import { langOf } from '@/lib/report-labels';

type TimeLinkProps = { segmentId: number; time: number };

export function TimeLink({ segmentId, time }: TimeLinkProps) {
  return (
    <a
      href={`#segment-${segmentId}`}
      aria-label={`Show ${formatTime(time)} in the transcript`}
      className="relative rounded-md border bg-muted px-1.5 font-mono text-xs leading-relaxed tabular-nums after:absolute after:-inset-x-1 after:-inset-y-3 hover:border-ring"
    >
      {formatTime(time)}
    </a>
  );
}

type QuoteLinkProps = { segmentId: number; quote: string; langs: string[] };

export function QuoteLink({ segmentId, quote, langs }: QuoteLinkProps) {
  return (
    <a
      href={`#segment-${segmentId}`}
      className="italic underline-offset-4 hover:underline"
    >
      <q lang={langOf(quote, langs)}>{quote}</q>
    </a>
  );
}
