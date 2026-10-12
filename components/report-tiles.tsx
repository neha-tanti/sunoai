import { TimeLink } from '@/components/time-link';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card';
import type { ReportDetail, Segment } from '@/hooks/use-call';
import {
  findSpeaker,
  formatTime,
  MOOD_CLASS,
  MOOD_LABEL,
  RESULT_CLASS,
  SCORE_BAND_CLASS,
  SCORE_BAND_LABEL,
} from '@/lib/report-labels';
import { scoreBand, scorePercent } from '@/lib/score-band';

const HANDOVER_LABEL = {
  pass: 'Smooth',
  miss: 'Problem',
  na: 'Not needed',
} as const;

type TilesProps = { report: ReportDetail; segments: Segment[] };

export function ReportTiles({ report, segments }: TilesProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <ScoreTile report={report} />
      <FrustrationTile report={report} segments={segments} />
      <HandoverTile report={report} segments={segments} />
    </div>
  );
}

function Tile({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Card role="region" aria-label={label}>
      <CardHeader>
        <CardDescription className="text-xs font-semibold tracking-wider uppercase">
          {label}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">{children}</CardContent>
    </Card>
  );
}

function ScoreTile({ report }: { report: ReportDetail }) {
  const { score_passed: passed, score_total: total } = report;
  const percent = scorePercent(passed, total);
  const notNeeded = report.checks.length - total;

  return (
    <Tile label="Score">
      <p className="text-3xl font-bold tabular-nums">
        {passed}
        <span className="text-base font-semibold text-muted-foreground">
          {' '}
          / {total}
        </span>
      </p>
      {percent !== null ? (
        <Badge className={SCORE_BAND_CLASS[scoreBand(percent)]}>
          {percent}% · {SCORE_BAND_LABEL[scoreBand(percent)]}
        </Badge>
      ) : (
        <Badge variant="secondary">No checks applied</Badge>
      )}
      <p className="text-sm text-muted-foreground">
        Passed checks out of the checks that apply
        {notNeeded > 0 && ` (${notNeeded} not needed)`}.
      </p>
    </Tile>
  );
}

function FrustrationTile({ report, segments }: TilesProps) {
  const peak = report.frustration_peak;
  const turn = report.frustration.turn;
  const turnText = turn
    ? segments.find((segment) => segment.segment_id === turn.segment_id)?.text
    : undefined;

  return (
    <Tile label="Customer frustration">
      <p className="text-3xl font-bold">{MOOD_LABEL[peak]}</p>
      <div className="flex flex-wrap items-center gap-2">
        <Badge className={MOOD_CLASS[peak]}>Peak</Badge>
        {turn && <TimeLink segmentId={turn.segment_id} time={turn.time} />}
      </div>
      <p className="text-sm text-muted-foreground">
        {turn ? (
          <>
            Turned here: <q className="italic">{turnText}</q>
          </>
        ) : (
          'The customer stayed calm for the whole call.'
        )}
      </p>
    </Tile>
  );
}

function HandoverTile({ report, segments }: TilesProps) {
  const handover = segments.find(
    (segment) => segment.segment_id === report.handover_segment_id,
  );
  const check = report.handover_check;

  return (
    <Tile label="Handover">
      <p className="text-xl font-bold">
        {handover ? handoverTitle(report, handover) : 'No handover'}
      </p>
      {check && (
        <Badge className={RESULT_CLASS[check.result]}>
          {HANDOVER_LABEL[check.result]}
        </Badge>
      )}
      {check && <p className="text-sm text-muted-foreground">{check.reason}</p>}
    </Tile>
  );
}

function handoverTitle(report: ReportDetail, handover: Segment) {
  const name = findSpeaker(report.speakers, handover.speaker_id)?.name;
  return `AI to ${name ?? 'human agent'} at ${formatTime(handover.start_time)}`;
}
