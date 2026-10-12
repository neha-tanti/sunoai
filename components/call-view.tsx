'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CallReport } from '@/components/call-report';
import { CallStatus } from '@/components/call-status';
import { CheckAgainButton } from '@/components/check-again-button';
import { type CallDetail, useCall } from '@/hooks/use-call';
import { COACHING_LANGUAGES } from '@/lib/call-upload';
import { formatTime } from '@/lib/report-labels';

export function CallView() {
  const { id } = useParams<{ id: string }>();
  const call = useCall(id);

  if (call.isPending) {
    return <p className="text-muted-foreground">Loading the call…</p>;
  }
  if (call.isError && !call.data) {
    return (
      <p role="alert" className="text-destructive">
        Couldn&apos;t load this call. Retrying…
      </p>
    );
  }
  if (!call.data) {
    return (
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Call not found
        </h1>
        <p className="text-muted-foreground">
          This call doesn&apos;t exist or was deleted.
        </p>
        <Link href="/" className="underline underline-offset-4">
          Check a call
        </Link>
      </div>
    );
  }

  const { call: detail, segments, report } = call.data;
  const { title, status, error_code: errorCode } = detail;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {report && <CallMeta call={detail} checkedAt={report.created_at} />}
        <CallStatus status={status} errorCode={errorCode} />
        {errorCode === 'analysis_failed' && <CheckAgainButton callId={id} />}
        {call.isError && (
          <p className="text-muted-foreground text-sm">
            Couldn&apos;t refresh this call. Retrying…
          </p>
        )}
      </div>
      {status === 'ready' && report && (
        <CallReport report={report} segments={segments} />
      )}
    </div>
  );
}

type CallMetaProps = { call: CallDetail['call']; checkedAt: string };

function CallMeta({ call, checkedAt }: CallMetaProps) {
  const language = COACHING_LANGUAGES.find(
    (lang) => lang.code === call.detected_lang,
  );
  const checked = new Date(checkedAt).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
      {call.duration_seconds !== null && (
        <span className="font-mono">{formatTime(call.duration_seconds)}</span>
      )}
      {call.detected_lang && (
        <span>{language?.label ?? call.detected_lang}</span>
      )}
      <span>Checked {checked}</span>
    </p>
  );
}
