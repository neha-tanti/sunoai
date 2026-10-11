import { HTTPException } from 'hono/http-exception';
import { validator } from 'hono/validator';
import { describe, expect, it } from 'vitest';
import { app } from './app';

app.post(
  '/test/echo',
  validator('json', (body) => body),
  (c) => c.json(c.req.valid('json')),
);
app.get('/test/signed-out', () => {
  throw new HTTPException(401);
});

describe('GET /api/health', () => {
  it('answers ok', async () => {
    const res = await app.request('/api/health');

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ status: 'ok' });
  });
});

describe('an unknown /api route', () => {
  it('answers 404 with the error envelope', async () => {
    const res = await app.request('/api/calls-that-do-not-exist');

    expect(res.status).toBe(404);
    expect(await res.json()).toMatchObject({ error: { code: 'not_found' } });
  });
});

describe('a request the API rejects', () => {
  it('answers 400 invalid_request for malformed JSON', async () => {
    const res = await app.request('/api/test/echo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{',
    });

    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({
      error: { code: 'invalid_request' },
    });
  });

  it('answers 401 unauthorized with a message a person can act on', async () => {
    const res = await app.request('/api/test/signed-out');

    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({
      error: { code: 'unauthorized', message: expect.stringMatching(/\S/) },
    });
  });
});
