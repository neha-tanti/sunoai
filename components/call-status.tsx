import { type CallState, statusText } from '@/lib/call-status';

export function CallStatus({ status, errorCode }: CallState) {
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
