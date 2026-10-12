'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CallStatus } from '@/components/call-status';
import { CheckAgainButton } from '@/components/check-again-button';
import { useCall } from '@/hooks/use-call';

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

  const { title, status, error_code: errorCode } = call.data.call;
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <CallStatus status={status} errorCode={errorCode} />
      {errorCode === 'analysis_failed' && <CheckAgainButton callId={id} />}
      {call.isError && (
        <p className="text-muted-foreground text-sm">
          Couldn&apos;t refresh this call. Retrying…
        </p>
      )}
    </div>
  );
}
