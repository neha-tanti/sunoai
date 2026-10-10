import { describe, expect, it } from 'vitest';
import { app } from './app';

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
