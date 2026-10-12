import { QuoteLink, TimeLink } from '@/components/time-link';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { CallReport } from '@/hooks/use-call';
import { RESULT_CLASS, RESULT_LABEL } from '@/lib/report-labels';

type Check = CallReport['checks'][number];

export function ChecklistResults({ checks }: { checks: Check[] }) {
  return (
    <Card role="region" aria-label="Agent checklist">
      <CardHeader>
        <CardTitle>Agent checklist</CardTitle>
        <CardDescription>No quote, no pass</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col divide-y">
          {checks.map((check) => (
            <CheckRow key={check.check_id} check={check} />
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function CheckRow({ check }: { check: Check }) {
  return (
    <li className="grid gap-x-3 gap-y-1 py-2.5 first:pt-0 sm:grid-cols-[6rem_minmax(0,1fr)]">
      <div>
        <Badge className={RESULT_CLASS[check.result]}>
          {RESULT_LABEL[check.result]}
        </Badge>
      </div>
      <div className="flex flex-col gap-1">
        <p className="font-semibold">{check.name}</p>
        <p className="text-xs text-muted-foreground">{check.rule}</p>
        {check.segment_id !== null && check.time !== null && check.quote && (
          <p className="flex flex-wrap items-baseline gap-2">
            <TimeLink segmentId={check.segment_id} time={check.time} />
            <QuoteLink segmentId={check.segment_id} quote={check.quote} />
          </p>
        )}
        <p className="text-muted-foreground">{check.reason}</p>
      </div>
    </li>
  );
}
