'use client';

import Link from 'next/link';
import { useState } from 'react';
import { statusText } from '@/lib/call-status';
import { ScoreBadge } from '@/components/score-badge';
import { ToneBadge } from '@/components/tone-badge';
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
import { formatTime } from '@/lib/format-time';
import { MOOD_LABEL, SCORE_BAND_LABEL } from '@/lib/report-labels';
import { scoreBand, scorePercent } from '@/lib/score-band';

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
        <Link
          href="/check"
          className="text-foreground underline underline-offset-4"
        >
          Check a call
        </Link>
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <TeamAverage average={calls.data.average} />
      <ul aria-label="Recent calls" className="flex flex-col gap-3 md:hidden">
        {calls.data.calls.map((call) => (
          <CallCard key={call.id} call={call} />
        ))}
      </ul>
      <div className="hidden md:block">
        <Table aria-label="Recent calls">
          <TableHeader>
            <TableRow>
              <TableHead>Call</TableHead>
              <TableHead>Uploaded</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>How it ended</TableHead>
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
      <CardContent className="flex flex-col gap-1">
        {average ? (
          <>
            <p className="flex items-baseline gap-3">
              <span className="text-3xl font-bold tabular-nums">
                {average.percent}%
              </span>
              <span className="font-medium">
                {SCORE_BAND_LABEL[scoreBand(average.percent)]}
              </span>
            </p>
            <p className="text-sm text-muted-foreground">
              Across{' '}
              {average.calls === 1
                ? '1 scored call'
                : `${average.calls} scored calls`}{' '}
              in this list. Example calls are left out.
            </p>
          </>
        ) : (
          <p className="text-muted-foreground">
            No scored calls yet. Example calls are left out.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

const uploadedAt = (call: RecentCall) =>
  new Date(call.created_at).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

function CallTitle({ call }: { call: RecentCall }) {
  return (
    <div className="flex flex-col gap-1">
      <Link
        href={`/calls/${call.id}`}
        className="font-medium underline-offset-4 after:absolute after:inset-0 hover:underline"
      >
        {call.title}
      </Link>
      <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        {call.example_id && <Badge variant="outline">Example</Badge>}
        {call.duration_seconds !== null && (
          <span className="font-mono">{formatTime(call.duration_seconds)}</span>
        )}
      </p>
      {call.status !== 'ready' && (
        <p
          className={
            call.status === 'failed'
              ? 'text-sm text-destructive'
              : 'text-sm text-muted-foreground'
          }
        >
          {statusText({ status: call.status, errorCode: call.error_code })}
        </p>
      )}
    </div>
  );
}

function ReviewResult({ report }: { report: RecentCall['report'] }) {
  if (!report) return null;
  if (report.needs_review) {
    return (
      <Badge className="bg-angry text-angry-foreground">Needs review</Badge>
    );
  }
  return <span className="text-sm text-muted-foreground">No red flags</span>;
}

function EndedMood({ report }: { report: RecentCall['report'] }) {
  if (!report?.ended_mood) return null;
  return (
    <ToneBadge tone={report.ended_mood}>
      Ended {MOOD_LABEL[report.ended_mood].toLowerCase()}
    </ToneBadge>
  );
}

function CallRow({ call }: { call: RecentCall }) {
  const { report } = call;

  return (
    <TableRow className="relative">
      <TableCell className="max-w-xs whitespace-normal">
        <CallTitle call={call} />
      </TableCell>
      <TableCell className="text-muted-foreground">
        {uploadedAt(call)}
      </TableCell>
      <TableCell>
        {report && (
          <ScoreBadge
            percent={scorePercent(report.score_passed, report.score_total)}
          />
        )}
      </TableCell>
      <TableCell>
        <EndedMood report={report} />
      </TableCell>
      <TableCell>
        <ReviewResult report={report} />
      </TableCell>
      <TableCell className="relative z-10 text-right">
        {call.can_delete && (
          <DeleteCallButton id={call.id} title={call.title} />
        )}
      </TableCell>
    </TableRow>
  );
}

function CallCard({ call }: { call: RecentCall }) {
  const { report } = call;

  return (
    <li className="relative flex flex-col gap-3 rounded-xl border p-4 hover:bg-muted/50">
      <div className="flex items-start justify-between gap-3">
        <CallTitle call={call} />
        <ReviewResult report={report} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {report && (
          <ScoreBadge
            percent={scorePercent(report.score_passed, report.score_total)}
          />
        )}
        <EndedMood report={report} />
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground">
          {uploadedAt(call)}
        </span>
        {call.can_delete && (
          <div className="relative z-10">
            <DeleteCallButton id={call.id} title={call.title} />
          </div>
        )}
      </div>
    </li>
  );
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
