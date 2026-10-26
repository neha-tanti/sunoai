import { SpeakerChip } from '@/components/speaker-chip';
import { QuoteLink, TimeLink } from '@/components/time-link';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { ReportDetail, Segment } from '@/hooks/use-call';

type RedFlagsListProps = { report: ReportDetail; segments: Segment[] };

export function RedFlagsList({ report, segments }: RedFlagsListProps) {
  if (report.red_flags.length === 0) return null;

  return (
    <Card
      id="red-flags"
      role="region"
      aria-label="Red flags"
      className="scroll-mt-32 lg:scroll-mt-20"
    >
      <CardHeader>
        <CardTitle>
          <h2>Red flags</h2>
        </CardTitle>
        <CardAction>
          <Badge variant="destructive">{report.red_flags.length}</Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-3">
          {report.red_flags.map((flag, index) => {
            const speakerId = segments.find(
              (segment) => segment.segment_id === flag.segment_id,
            )?.speaker_id;
            return (
              <li
                key={`${flag.flag_id}-${index}`}
                className="flex flex-col gap-1 border-l-3 border-angry py-1 pl-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{flag.name}</span>
                  <TimeLink segmentId={flag.segment_id} time={flag.time} />
                  {speakerId !== undefined && (
                    <SpeakerChip
                      speakers={report.speakers}
                      speakerId={speakerId}
                    />
                  )}
                </div>
                <QuoteLink segmentId={flag.segment_id} quote={flag.quote} />
                <p className="text-muted-foreground">{flag.note}</p>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
