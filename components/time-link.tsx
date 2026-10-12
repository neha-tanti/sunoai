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
