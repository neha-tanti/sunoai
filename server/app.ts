import 'server-only';
import { Hono } from 'hono';
import { except } from 'hono/combine';
import { HTTPException } from 'hono/http-exception';
import type { ErrorCode } from '@/lib/api-errors';
import { requireUser } from './auth';
import { calls } from './calls';
import { checklist, checklistMarkdown } from './checklist';
import { ApiError, apiError, loggableError } from './errors';
import { jobs } from './jobs';
import { webhooks } from './webhooks';

type ErrorDetail = { code: ErrorCode; message: string };

export const app = new Hono()
  .basePath('/api')
  .use(
    except(
      [
        '/api/health',
        '/api/checklist.md',
        '/api/webhooks/gnani',
        '/api/jobs/poll',
      ],
      requireUser,
    ),
  )
  .get('/health', (c) => c.json({ status: 'ok' as const }))
  .get('/checklist.md', async (c) => {
    c.header('Content-Type', 'text/markdown; charset=utf-8');
    c.header('Cache-Control', 'public, s-maxage=300');
    return c.body(await checklistMarkdown());
  })
  .route('/calls', calls)
  .route('/checklist', checklist)
  .route('/webhooks', webhooks)
  .route('/jobs', jobs);

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
  if (err instanceof ApiError) {
    return c.json(apiError(err.code, err.message), err.status);
  }

  if (err instanceof HTTPException && err.status < 500) {
    const known = clientErrors[err.status] ?? otherClientError;
    return c.json(
      apiError(known.code, err.message || known.message),
      err.status,
    );
  }

  console.error(`${c.req.method} ${c.req.path} failed: ${loggableError(err)}`);
  return c.json(
    apiError(
      'internal_error',
      'Something went wrong on our side. Try again in a minute.',
    ),
    500,
  );
});

export type AppType = typeof app;
