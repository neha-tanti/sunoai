import { QuoteLink, TimeLink } from '@/components/time-link';
import { ToneBadge } from '@/components/tone-badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { ReportDetail } from '@/hooks/use-call';
import { RESULT_LABEL, RESULT_TONE } from '@/lib/report-labels';

type Check = ReportDetail['checks'][number];

type ChecklistResultsProps = { checks: Check[]; langs: readonly string[] };

export function ChecklistResults({ checks, langs }: ChecklistResultsProps) {
  return (
    <Card
      id="checklist"
      role="region"
      aria-label="Agent checklist"
      className="scroll-below-jump-bar"
    >
      <CardHeader>
        <CardTitle>
          <h2>Agent checklist</h2>
        </CardTitle>
        <CardDescription>No quote, no pass</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col divide-y">
          {checks.map((check) => (
            <CheckRow key={check.check_id} check={check} langs={langs} />
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

type CheckRowProps = { check: Check; langs: readonly string[] };

function CheckRow({ check, langs }: CheckRowProps) {
  return (
    <li className="grid gap-x-3 gap-y-1 py-2.5 first:pt-0 sm:grid-cols-[6rem_minmax(0,1fr)]">
      <div>
        <ToneBadge tone={RESULT_TONE[check.result]}>
          {RESULT_LABEL[check.result]}
        </ToneBadge>
      </div>
      <div className="flex flex-col gap-1">
        <p className="font-semibold">{check.name}</p>
        <p className="text-xs text-muted-foreground">{check.rule}</p>
        {check.segment_id !== null && check.time !== null && check.quote && (
          <p className="flex flex-wrap items-baseline gap-2">
            <TimeLink segmentId={check.segment_id} time={check.time} />
            <QuoteLink
              segmentId={check.segment_id}
              time={check.time}
              quote={check.quote}
              langs={langs}
            />
          </p>
        )}
        <p className="text-muted-foreground">{check.reason}</p>
      </div>
    </li>
  );
}
