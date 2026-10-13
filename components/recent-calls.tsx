'use client';

import Link from 'next/link';
import { useState } from 'react';
import { STATUS_TEXT } from '@/components/call-status';
import { ScoreBadge } from '@/components/score-badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { type RecentCall, type RecentCalls, useCalls } from '@/hooks/use-calls';
import { useDeleteCall } from '@/hooks/use-delete-call';
import { CALL_ERROR_MESSAGES } from '@/lib/call-errors';
import { MOOD_CLASS, MOOD_LABEL } from '@/lib/report-labels';
import { scorePercent } from '@/lib/score-band';

export function RecentCalls() {
  const calls = useCalls();

  if (calls.isPending) {
    return <p className="text-muted-foreground">Loading recent calls…</p>;
  }
  if (calls.isError) {
    return (
      <p role="alert" className="text-destructive">
        {calls.error.message} Refresh the page to try again.
      </p>
    );
  }
  if (calls.data.calls.length === 0) {
    return (
      <p className="text-muted-foreground">
        No calls checked yet.{' '}
        <Link href="/" className="text-foreground underline underline-offset-4">
          Check a call
        </Link>
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <TeamAverage average={calls.data.average} />
      <Table aria-label="Recent calls">
        <TableHeader>
          <TableRow>
            <TableHead>Call</TableHead>
            <TableHead>Uploaded</TableHead>
            <TableHead>Score</TableHead>
            <TableHead>Peak frustration</TableHead>
            <TableHead>Review</TableHead>
            <TableHead>
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {calls.data.calls.map((call) => (
            <CallRow key={call.id} call={call} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function TeamAverage({ average }: { average: RecentCalls['average'] }) {
  return (
    <Card role="region" aria-label="Team average" className="max-w-sm">
      <CardHeader>
        <CardDescription className="text-xs font-semibold tracking-wider uppercase">
          Team average
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {average ? (
          <>
            <p className="text-3xl font-bold tabular-nums">
              {average.percent}%
            </p>
            <ScoreBadge percent={average.percent} />
            <p className="text-sm text-muted-foreground">
              Across{' '}
              {average.calls === 1
                ? '1 scored call'
                : `${average.calls} scored calls`}{' '}
              in this list.
            </p>
          </>
        ) : (
          <p className="text-muted-foreground">No scored calls yet.</p>
        )}
      </CardContent>
    </Card>
  );
}

function CallRow({ call }: { call: RecentCall }) {
  const { report } = call;
  const uploaded = new Date(call.created_at).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <TableRow>
      <TableCell className="max-w-xs whitespace-normal">
        <Link
          href={`/calls/${call.id}`}
          className="font-medium underline-offset-4 hover:underline"
        >
          {call.title}
        </Link>
        {call.status !== 'ready' && (
          <p
            className={
              call.status === 'failed'
                ? 'text-sm text-destructive'
                : 'text-sm text-muted-foreground'
            }
          >
            {call.error_code
              ? CALL_ERROR_MESSAGES[call.error_code]
              : STATUS_TEXT[call.status]}
          </p>
        )}
      </TableCell>
      <TableCell className="text-muted-foreground">{uploaded}</TableCell>
      <TableCell>{report && <ReportScore report={report} />}</TableCell>
      <TableCell>
        {report && (
          <Badge className={MOOD_CLASS[report.frustration_peak]}>
            {MOOD_LABEL[report.frustration_peak]}
          </Badge>
        )}
      </TableCell>
      <TableCell>
        {report?.needs_review && (
          <Badge variant="destructive">Needs review</Badge>
        )}
        {report && !report.needs_review && (
          <span className="text-sm text-muted-foreground">No red flags</span>
        )}
      </TableCell>
      <TableCell className="text-right">
        <DeleteCallButton id={call.id} title={call.title} />
      </TableCell>
    </TableRow>
  );
}

function ReportScore({
  report,
}: {
  report: NonNullable<RecentCall['report']>;
}) {
  const percent = scorePercent(report.score_passed, report.score_total);
  if (percent === null) {
    return <Badge variant="secondary">No checks applied</Badge>;
  }
  return <ScoreBadge percent={percent} />;
}

function DeleteCallButton({ id, title }: { id: string; title: string }) {
  const [open, setOpen] = useState(false);
  const deleteCall = useDeleteCall();

  function handleOpenChange(next: boolean) {
    if (deleteCall.isPending) return;
    setOpen(next);
    deleteCall.reset();
  }

  function handleDelete() {
    deleteCall.mutate(id, { onSuccess: () => setOpen(false) });
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger
        render={
          <Button variant="ghost" size="sm" aria-label={`Delete ${title}`} />
        }
      >
        Delete
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this call?</AlertDialogTitle>
          <AlertDialogDescription>
            “{title}” and its recording, transcript, report and coaching audio
            are removed for the whole team.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {deleteCall.isError && (
          <p role="alert" className="text-sm text-destructive">
            {deleteCall.error.message}
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteCall.isPending}>
            Keep it
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteCall.isPending}
          >
            {deleteCall.isPending ? 'Deleting…' : 'Delete call'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
