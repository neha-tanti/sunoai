import { CircleCheckIcon, TriangleAlertIcon } from 'lucide-react';
import { ChecklistResults } from '@/components/checklist-results';
import { FixNotesList } from '@/components/fix-notes-list';
import { FrustrationTimeline } from '@/components/frustration-timeline';
import { RedFlagsList } from '@/components/red-flags-list';
import { ReportTiles } from '@/components/report-tiles';
import { TranscriptView } from '@/components/transcript-view';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CallReport as Report, Segment } from '@/hooks/use-call';

type CallReportProps = { report: Report; segments: Segment[] };

export function CallReport({ report, segments }: CallReportProps) {
  return (
    <article className="flex flex-col gap-4" aria-label="Call report">
      <ReviewBanner redFlags={report.red_flags.length} />
      <ReportTiles report={report} segments={segments} />
      <FrustrationTimeline report={report} segments={segments} />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:items-start">
        <div className="flex min-w-0 flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{report.summary}</p>
            </CardContent>
          </Card>
          <RedFlagsList report={report} segments={segments} />
          <ChecklistResults checks={report.checks} />
          <FixNotesList notes={report.fix_notes} />
        </div>
        <TranscriptView report={report} segments={segments} />
      </div>
    </article>
  );
}

function ReviewBanner({ redFlags }: { redFlags: number }) {
  if (redFlags === 0) {
    return (
      <Alert>
        <CircleCheckIcon />
        <AlertTitle>No red flags</AlertTitle>
        <AlertDescription>
          Nothing on this call needs a person to look at it.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="destructive" className="bg-angry/10">
      <TriangleAlertIcon />
      <AlertTitle>Needs review</AlertTitle>
      <AlertDescription>
        {redFlags === 1 ? '1 red flag' : `${redFlags} red flags`}. A person
        should look at this call.
      </AlertDescription>
    </Alert>
  );
}
