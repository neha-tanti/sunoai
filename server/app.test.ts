import { validator } from 'hono/validator';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { app } from './app';
import { ApiError } from './errors';
import { signInTeamLeader } from './test/session';

app.post(
  '/test/echo',
  validator('json', (body) => body),
  (c) => c.json(c.req.valid('json')),
);

app.get('/test/gnani-down', () => {
  throw new ApiError(
    503,
    'gnani_unavailable',
    "Couldn't start the check. Try again in a minute.",
  );
});

describe('GET /api/health', () => {
  it('answers ok', async () => {
    const res = await app.request('/api/health');

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ status: 'ok' });
  });
});

describe('a route that is not the health check, signed out', () => {
  it('answers 401 with a message a person can act on, before reaching the route', async () => {
    const res = await app.request('/api/test/echo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });

    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({
      error: { code: 'unauthorized', message: expect.stringMatching(/\S/) },
    });
  });
});

describe('signed in', () => {
  let session: Awaited<ReturnType<typeof signInTeamLeader>>;

  beforeAll(async () => {
    session = await signInTeamLeader();
  });

  afterAll(async () => {
    await session?.deleteTeamLeader();
  });

  it('an unknown /api route answers 404 with the error envelope', async () => {
    const res = await app.request('/api/calls-that-do-not-exist', {
      headers: { Cookie: session.cookie },
    });

    expect(res.status).toBe(404);
    expect(await res.json()).toMatchObject({ error: { code: 'not_found' } });
  });

  it('a route error with its own code keeps its status, code and message', async () => {
    const res = await app.request('/api/test/gnani-down', {
      headers: { Cookie: session.cookie },
    });

    expect(res.status).toBe(503);
    expect(await res.json()).toMatchObject({
      error: {
        code: 'gnani_unavailable',
        message: "Couldn't start the check. Try again in a minute.",
      },
    });
  });

  it('malformed JSON answers 400 invalid_request', async () => {
    const res = await app.request('/api/test/echo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: session.cookie },
      body: '{',
    });

    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({
      error: { code: 'invalid_request' },
    });
  });
});
