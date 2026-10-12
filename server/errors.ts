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
