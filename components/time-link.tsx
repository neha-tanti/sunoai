'use client';

import { createContext, use } from 'react';
import { formatTime } from '@/lib/format-time';
import { langOf } from '@/lib/report-labels';

export const PlayFromContext = createContext<(time: number) => void>(() => {});

type SegmentLinkProps = Omit<React.ComponentProps<'a'>, 'href' | 'onClick'> & {
  segmentId: number;
  time: number;
};

export function SegmentLink({ segmentId, time, ...props }: SegmentLinkProps) {
  const playFrom = use(PlayFromContext);

  function handleClick(event: React.MouseEvent) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    playFrom(time);
  }

  return <a href={`#segment-${segmentId}`} onClick={handleClick} {...props} />;
}

type TimeLinkProps = { segmentId: number; time: number };

export function TimeLink({ segmentId, time }: TimeLinkProps) {
  return (
    <SegmentLink
      segmentId={segmentId}
      time={time}
      aria-label={`Show ${formatTime(time)} in the transcript`}
      className="relative rounded-md border bg-muted px-1.5 font-mono text-xs leading-relaxed tabular-nums after:absolute after:-inset-x-1 after:-inset-y-3 hover:border-ring"
    >
      {formatTime(time)}
    </SegmentLink>
  );
}

type QuoteLinkProps = {
  segmentId: number;
  time: number;
  quote: string;
  langs: string[];
};

export function QuoteLink({ segmentId, time, quote, langs }: QuoteLinkProps) {
  return (
    <SegmentLink
      segmentId={segmentId}
      time={time}
      className="italic underline-offset-4 hover:underline"
    >
      <q lang={langOf(quote, langs)}>{quote}</q>
    </SegmentLink>
  );
}
