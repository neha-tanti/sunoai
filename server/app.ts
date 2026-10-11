import 'server-only';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

export const app = new Hono()
  .basePath('/api')
  .get('/health', (c) => c.json({ status: 'ok' as const }));

app.notFound((c) =>
  c.json(
    { error: { code: 'not_found', message: 'This API route does not exist.' } },
    404,
  ),
);

const clientErrors: Record<number, { code: string; message: string }> = {
  400: {
    code: 'invalid_request',
    message: 'The request is not valid. Check it and try again.',
  },
  401: { code: 'unauthorized', message: 'Sign in to continue.' },
  413: {
    code: 'too_large',
    message: 'The request is too large. Send a smaller file.',
  },
};

const otherClientError = {
  code: 'request_failed',
  message: 'The request could not be completed. Check it and try again.',
};

app.onError((err, c) => {
  if (err instanceof HTTPException && err.status < 500) {
    const known = clientErrors[err.status] ?? otherClientError;
    return c.json(
      { error: { code: known.code, message: err.message || known.message } },
      err.status,
    );
  }

  console.error(`${c.req.method} ${c.req.path} failed`, err);
  return c.json(
    {
      error: {
        code: 'internal_error',
        message: 'Something went wrong on our side. Try again in a minute.',
      },
    },
    500,
  );
});

export type AppType = typeof app;
