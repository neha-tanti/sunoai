import 'server-only';
import { Hono } from 'hono';

export const app = new Hono()
  .basePath('/api')
  .get('/health', (c) => c.json({ status: 'ok' as const }));

app.notFound((c) =>
  c.json(
    { error: { code: 'not_found', message: 'This API route does not exist.' } },
    404,
  ),
);

app.onError((err, c) => {
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
