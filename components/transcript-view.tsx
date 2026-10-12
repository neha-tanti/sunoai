import { SpeakerChip } from '@/components/speaker-chip';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { ReportDetail, Segment } from '@/hooks/use-call';
import { findSpeaker, formatTime } from '@/lib/report-labels';
import { cn } from '@/lib/utils';

type TranscriptViewProps = { report: ReportDetail; segments: Segment[] };

export function TranscriptView({ report, segments }: TranscriptViewProps) {
  const turnSegmentId = report.frustration.turn?.segment_id;

  return (
    <Card className="lg:sticky lg:top-4 lg:max-h-[calc(100dvh-2rem)]">
      <CardHeader>
        <CardTitle>Transcript</CardTitle>
        <CardDescription>Who said what is a best guess</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-1 lg:min-h-0 lg:overflow-y-auto">
        {segments.map((segment) => (
          <TranscriptLine
            key={segment.segment_id}
            report={report}
            segment={segment}
            isTurn={segment.segment_id === turnSegmentId}
          />
        ))}
      </CardContent>
    </Card>
  );
}

type TranscriptLineProps = {
  report: ReportDetail;
  segment: Segment;
  isTurn: boolean;
};

function TranscriptLine({ report, segment, isTurn }: TranscriptLineProps) {
  const flags = report.red_flags.filter(
    (flag) => flag.segment_id === segment.segment_id,
  );
  const isHandover = segment.segment_id === report.handover_segment_id;
  const humanName = findSpeaker(report.speakers, segment.speaker_id)?.name;

  return (
    <>
      {isHandover && (
        <p className="flex items-center gap-3 px-2 py-1 text-xs font-semibold text-muted-foreground before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border">
          Handed over to {humanName ?? 'a human agent'} ·{' '}
          {formatTime(segment.start_time)}
        </p>
      )}
      <div
        id={`segment-${segment.segment_id}`}
        className={cn(
          'grid scroll-mt-4 grid-cols-[2.5rem_minmax(0,1fr)] gap-x-2 rounded-lg p-2 target:outline-2 target:-outline-offset-2 target:outline-ring',
          flags.length > 0 && 'bg-angry/10',
          isTurn && 'shadow-[inset_3px_0_var(--annoyed)]',
        )}
      >
        <span className="pt-0.5 font-mono text-xs text-muted-foreground tabular-nums">
          {formatTime(segment.start_time)}
        </span>
        <div className="flex flex-col items-start gap-1">
          <SpeakerChip
            speakers={report.speakers}
            speakerId={segment.speaker_id}
          />
          <p>{segment.text}</p>
          {flags.map((flag, index) => (
            <span
              key={`${flag.flag_id}-${index}`}
              className="text-xs font-semibold text-destructive"
            >
              Red flag: {flag.name}
            </span>
          ))}
          {isTurn && (
            <span className="text-xs font-semibold">
              Frustration turned here
            </span>
          )}
        </div>
      </div>
    </>
  );
}
