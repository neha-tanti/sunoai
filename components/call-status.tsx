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

export function CallStatus({ status, errorCode }: CallStatusProps) {
  if (status === 'failed' && errorCode) {
    return (
      <p role="status" className="text-destructive">
        {CALL_ERROR_MESSAGES[errorCode]}
      </p>
    );
  }

  return (
    <p role="status" className="text-muted-foreground">
      {STATUS_TEXT[status]}
    </p>
  );
}
