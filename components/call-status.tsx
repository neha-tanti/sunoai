import { type CallStatusProps, statusText } from '@/lib/call-status';

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
