import { CALL_ERROR_MESSAGES } from '@/lib/call-errors';
import type { Enums } from '@/lib/database.types';

const STATUS_TEXT: Record<Enums<'call_status'>, string> = {
  uploaded: 'Uploaded. The check hasn’t started yet.',
  transcribing: 'Transcribing the call…',
  analyzing: 'Analysing the transcript…',
  ready: 'Ready.',
  failed: 'Failed.',
};

type CallStatusProps = {
  status: Enums<'call_status'>;
  errorCode: Enums<'call_error_code'> | null;
};

export function statusText({ status, errorCode }: CallStatusProps) {
  if (status === 'failed' && errorCode) return CALL_ERROR_MESSAGES[errorCode];
  return STATUS_TEXT[status];
}

export function CallStatus({ status, errorCode }: CallStatusProps) {
  return (
    <p
      role="status"
      className={
        status === 'failed' ? 'text-destructive' : 'text-muted-foreground'
      }
    >
      {statusText({ status, errorCode })}
    </p>
  );
}
