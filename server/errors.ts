import 'server-only';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { HTTPException } from 'hono/http-exception';

export type ErrorCode =
  | 'invalid_request'
  | 'unauthorized'
  | 'not_found'
  | 'too_large'
  | 'request_failed'
  | 'not_uploaded'
  | 'file_missing'
  | 'gnani_unavailable'
  | 'internal_error';

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
