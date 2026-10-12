import 'server-only';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { HTTPException } from 'hono/http-exception';
import type { ErrorCode } from '@/lib/api-errors';

export const apiError = (code: ErrorCode, message: string) => ({
  error: { code, message },
});

export class ApiError extends HTTPException {
  constructor(
    status: ContentfulStatusCode,
    readonly code: ErrorCode,
    message: string,
  ) {
    super(status, { message });
  }
}

export function loggableError(err: unknown): string {
  if (!(err instanceof Error)) return typeof err;

  const lines = [err.stack ?? `${err.name}: ${err.message}`];
  if ('code' in err && typeof err.code === 'string' && err.code) {
    lines.push(`code: ${err.code}`);
  }
  if (err.cause !== undefined) {
    lines.push(`cause: ${loggableError(err.cause)}`);
  }
  return lines.join('\n');
}
