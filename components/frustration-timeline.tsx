import { SegmentLink } from '@/components/time-link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { ReportDetail, Segment } from '@/hooks/use-call';
import { formatTime } from '@/lib/format-time';
import { findSpeaker, MOOD_CLASS, MOOD_LABEL } from '@/lib/report-labels';
import { cn } from '@/lib/utils';

const TICK_STEPS = [10, 30, 60, 120, 300, 600];
const MAX_TICKS = 8;

type Marker = {
  time: number;
  segmentId: number;
  names: string[];
  hasFlag: boolean;
};

type TimelineProps = { report: ReportDetail; segments: Segment[] };

export function FrustrationTimeline({ report, segments }: TimelineProps) {
  const { ranges } = report.frustration;
  const length = Math.max(
    ranges.at(-1)?.end ?? 0,
    ...segments.map((segment) => segment.end_time),
  );
  if (length <= 0) return null;

  const percent = (time: number) =>
    Math.min(100, Math.max(0, (time / length) * 100));
  const description = ranges
    .map(
      (range) =>
        `${MOOD_LABEL[range.level]} from ${formatTime(range.start)} to ${formatTime(range.end)}`,
    )
    .join(', ');
  const markers = timelineMarkers(report, segments);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>How the customer felt during the call</h2>
        </CardTitle>
        <CardDescription>
          Pick a moment to hear it and read it in the transcript
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="sr-only">{description}.</p>
        <div className="relative pt-8 sm:pt-14">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-13 sm:h-19">
            {markers.map((marker, index) => (
              <MarkerPin
                key={marker.time}
                marker={marker}
                number={index + 1}
                left={percent(marker.time)}
                row={index % 2}
              />
            ))}
          </div>
          <div
            aria-hidden
            className="flex h-4.5 overflow-hidden rounded-full bg-muted"
          >
            {ranges.map((range) => (
              <span
                key={range.start}
                className={MOOD_CLASS[range.level]}
                style={{ width: `${percent(range.end - range.start)}%` }}
              />
            ))}
          </div>
          <TimeAxis length={length} percent={percent} />
        </div>
        <MarkerList markers={markers} />
        <Legend />
      </CardContent>
    </Card>
  );
}

function timelineMarkers(report: ReportDetail, segments: Segment[]) {
  const markers = new Map<number, Marker>();
  const add = (
    time: number,
    segmentId: number,
    name: string,
    isFlag: boolean,
  ) => {
    const marker = markers.get(time) ?? {
      time,
      segmentId,
      names: [],
      hasFlag: false,
    };
    marker.names.push(name);
    marker.hasFlag ||= isFlag;
    markers.set(time, marker);
  };

  for (const flag of report.red_flags) {
    add(flag.time, flag.segment_id, flag.name, true);
  }
  const handover = segments.find(
    (segment) => segment.segment_id === report.handover_segment_id,
  );
  if (handover) {
    const name = findSpeaker(report.speakers, handover.speaker_id)?.name;
    add(
      handover.start_time,
      handover.segment_id,
      `Handover to ${name ?? 'a human agent'}`,
      false,
    );
  }
  return [...markers.values()].sort((a, b) => a.time - b.time);
}

function markerLabel(marker: Marker) {
  const names = marker.names.join(', ');
  const time = formatTime(marker.time);
  const label = marker.hasFlag
    ? `Red flag at ${time}: ${names}`
    : `${names} at ${time}`;
  return `${label}. Show in the transcript`;
}

type MarkerPinProps = {
  marker: Marker;
  number: number;
  left: number;
  row: number;
};

function MarkerPin({ marker, number, left, row }: MarkerPinProps) {
  const names = marker.names.join(', ');

  return (
    <div
      className={cn(
        'absolute top-0 bottom-0 flex flex-col',
        row === 1 && 'sm:top-6.5',
        pinAlignment(left),
      )}
      style={{ left: `${left}%` }}
    >
      <span
        aria-hidden
        className={cn(
          'grid size-5 place-items-center rounded-full font-mono text-xs font-semibold sm:hidden',
          marker.hasFlag
            ? 'bg-angry text-angry-foreground'
            : 'bg-foreground text-background',
        )}
      >
        {number}
      </span>
      <SegmentLink
        segmentId={marker.segmentId}
        time={marker.time}
        aria-label={markerLabel(marker)}
        title={names}
        className={cn(
          'pointer-events-auto hidden max-w-48 gap-1 rounded-md border border-transparent px-1.5 text-xs font-semibold whitespace-nowrap hover:border-current sm:flex',
          marker.hasFlag
            ? 'bg-angry/15 text-destructive'
            : 'bg-secondary text-secondary-foreground',
        )}
      >
        <span className="truncate">{names}</span>· {formatTime(marker.time)}
      </SegmentLink>
      <span
        className={cn(
          'w-0.5 flex-1',
          marker.hasFlag ? 'bg-angry' : 'bg-foreground/60',
        )}
      />
    </div>
  );
}

function MarkerList({ markers }: { markers: Marker[] }) {
  if (markers.length === 0) return null;

  return (
    <ol className="flex flex-col text-sm sm:hidden">
      {markers.map((marker, index) => (
        <li key={marker.time}>
          <SegmentLink
            segmentId={marker.segmentId}
            time={marker.time}
            aria-label={markerLabel(marker)}
            className="flex min-h-11 items-center gap-2"
          >
            <span
              aria-hidden
              className={cn(
                'grid size-5 shrink-0 place-items-center rounded-full font-mono text-xs font-semibold',
                marker.hasFlag
                  ? 'bg-angry text-angry-foreground'
                  : 'bg-foreground text-background',
              )}
            >
              {index + 1}
            </span>
            <span className={cn(marker.hasFlag && 'text-destructive')}>
              {marker.names.join(', ')}
            </span>
            <span className="ml-auto font-mono text-xs text-muted-foreground">
              {formatTime(marker.time)}
            </span>
          </SegmentLink>
        </li>
      ))}
    </ol>
  );
}

function pinAlignment(left: number) {
  if (left < 12) return 'items-start';
  if (left > 88) return '-translate-x-full items-end';
  return '-translate-x-1/2 items-center';
}

type TimeAxisProps = { length: number; percent: (time: number) => number };

function TimeAxis({ length, percent }: TimeAxisProps) {
  const step = TICK_STEPS.find((s) => length / s <= MAX_TICKS) ?? 900;
  const ticks: number[] = [];
  for (let t = 0; t < length - step / 2; t += step) ticks.push(t);
  ticks.push(length);

  return (
    <div
      aria-hidden
      className="relative mt-1.5 h-4.5 font-mono text-xs text-muted-foreground"
    >
      {ticks.map((t, index) => (
        <span
          key={t}
          className={cn(
            'absolute',
            index === ticks.length - 1
              ? '-translate-x-full'
              : index > 0 && 'hidden -translate-x-1/2 sm:block',
          )}
          style={{ left: `${percent(t)}%` }}
        >
          {formatTime(t)}
        </span>
      ))}
    </div>
  );
}

function Legend() {
  return (
    <div
      aria-hidden
      className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground"
    >
      {(['calm', 'annoyed', 'angry'] as const).map((mood) => (
        <span key={mood} className="inline-flex items-center gap-1.5">
          <i className={cn('h-2.5 w-3.5 rounded-sm', MOOD_CLASS[mood])} />
          {MOOD_LABEL[mood]}
        </span>
      ))}
      <span className="inline-flex items-center gap-1.5">
        <i className="h-3 w-0.5 bg-angry" />
        Red flag
      </span>
      <span className="inline-flex items-center gap-1.5">
        <i className="h-3 w-0.5 bg-foreground/60" />
        Handover
      </span>
    </div>
  );
}
