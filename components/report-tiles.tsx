import { TriangleAlertIcon } from 'lucide-react';
import { ScoreBadge } from '@/components/score-badge';
import { TimeLink } from '@/components/time-link';
import { ToneBadge } from '@/components/tone-badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card';
import type { ReportDetail, Segment } from '@/hooks/use-call';
import { NOT_TRANSFERRED_FLAG_ID } from '@/lib/checklist';
import { formatTime } from '@/lib/format-time';
import {
  findSpeaker,
  langOf,
  MOOD_LABEL,
  RESULT_TONE,
} from '@/lib/report-labels';
import { scorePercent } from '@/lib/score-band';

const HANDOVER_LABEL = {
  pass: 'Well briefed',
  miss: 'Not briefed',
  na: 'Not needed',
} as const;

type TilesProps = { report: ReportDetail; segments: Segment[] };
type LangTilesProps = TilesProps & { langs: string[] };

export function ReportTiles({ report, segments, langs }: LangTilesProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <ScoreTile report={report} />
      <FrustrationTile report={report} segments={segments} langs={langs} />
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
  const notNeeded = report.checks.length - total;

  return (
    <Tile label="Checklist score">
      <p className="text-3xl font-bold tabular-nums">
        {passed}
        <span className="text-base font-semibold text-muted-foreground">
          {' '}
          / {total}
        </span>
      </p>
      <ScoreBadge percent={scorePercent(passed, total)} />
      <p className="text-sm text-muted-foreground">
        Passed checks out of the checks that apply
        {notNeeded > 0 && ` (${notNeeded} not needed)`}. Red flags are counted
        apart from the score.
      </p>
    </Tile>
  );
}

function FrustrationTile({ report, segments, langs }: LangTilesProps) {
  const peak = report.frustration_peak;
  const turn = report.frustration.turn;
  const turnText = turn
    ? segments.find((segment) => segment.segment_id === turn.segment_id)?.text
    : undefined;

  return (
    <Tile label="Customer frustration">
      <p className="text-3xl font-bold">{MOOD_LABEL[peak]}</p>
      <div className="flex flex-wrap items-center gap-2">
        <ToneBadge tone={peak}>Peak</ToneBadge>
        {turn && <TimeLink segmentId={turn.segment_id} time={turn.time} />}
      </div>
      <p className="text-sm text-muted-foreground">
        {turn ? (
          <>
            Turned here:{' '}
            <q lang={langOf(turnText, langs)} className="italic">
              {turnText}
            </q>
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
  const notTransferred = report.red_flags.find(
    (flag) => flag.flag_id === NOT_TRANSFERRED_FLAG_ID,
  );

  return (
    <Tile label="Handover">
      <p className="text-xl font-bold">
        {handover ? handoverTitle(report, handover) : 'No handover'}
      </p>
      {check && (
        <ToneBadge tone={RESULT_TONE[check.result]}>
          {HANDOVER_LABEL[check.result]}
        </ToneBadge>
      )}
      {check && <p className="text-sm text-muted-foreground">{check.reason}</p>}
      {handover && notTransferred && (
        <p className="flex gap-2 text-sm font-medium text-destructive">
          <TriangleAlertIcon aria-hidden className="mt-0.5 size-4 shrink-0" />
          <span>
            Late: the AI carried on after the first ask{' '}
            <TimeLink
              segmentId={notTransferred.segment_id}
              time={notTransferred.time}
            />
          </span>
        </p>
      )}
    </Tile>
  );
}

function handoverTitle(report: ReportDetail, handover: Segment) {
  const name = findSpeaker(report.speakers, handover.speaker_id)?.name;
  return `AI to ${name ?? 'human agent'} at ${formatTime(handover.start_time)}`;
}
