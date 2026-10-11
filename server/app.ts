import 'server-only';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { checklist } from './checklist';

export type ErrorCode =
  | 'invalid_request'
  | 'unauthorized'
  | 'not_found'
  | 'too_large'
  | 'request_failed'
  | 'internal_error';

type ErrorDetail = { code: ErrorCode; message: string };

const apiError = (code: ErrorCode, message: string) => ({
  error: { code, message },
});

export const app = new Hono()
  .basePath('/api')
  .get('/health', (c) => c.json({ status: 'ok' as const }))
  .route('/checklist', checklist);

app.notFound((c) =>
  c.json(apiError('not_found', 'This API route does not exist.'), 404),
);

const clientErrors: Record<number, ErrorDetail> = {
  400: {
    code: 'invalid_request',
    message: 'The request is not valid. Check it and try again.',
  },
  401: { code: 'unauthorized', message: 'Sign in to continue.' },
  404: { code: 'not_found', message: 'What you asked for does not exist.' },
  413: {
    code: 'too_large',
    message: 'The request is too large. Send a smaller file.',
  },
};

const otherClientError: ErrorDetail = {
  code: 'request_failed',
  message: 'The request could not be completed. Check it and try again.',
};

app.onError((err, c) => {
  if (err instanceof HTTPException && err.status < 500) {
    const known = clientErrors[err.status] ?? otherClientError;
    return c.json(
      apiError(known.code, err.message || known.message),
      err.status,
    );
  }

  console.error(`${c.req.method} ${c.req.path} failed`, err);
  return c.json(
    apiError(
      'internal_error',
      'Something went wrong on our side. Try again in a minute.',
    ),
    500,
  );
});

export type AppType = typeof app;
