import { testClient } from 'hono/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { app } from './app';
import { createAdminClient } from './supabase';
import { sessionCookieName, signInTeamLeader } from './test/session';

const SEEDED_CHECKS = [
  'order_confirmed',
  'problem_understood',
  'frustration_acknowledged',
  'solution_or_next_step',
  'smooth_handover',
  'closing',
];
const SEEDED_RED_FLAGS = [
  'human_not_transferred',
  'agent_loop',
  'wrong_promise',
  'safety_not_escalated',
];

const api = testClient(app).api;

describe('GET /api/checklist signed out', () => {
  it('answers 401 without a session cookie', async () => {
    const res = await api.checklist.$get();

    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({
      error: { code: 'unauthorized' },
    });
  });

  it('answers 401 for a session cookie that is not a session', async () => {
    const res = await api.checklist.$get(undefined, {
      headers: { Cookie: `${sessionCookieName()}=base64-bm90LWEtc2Vzc2lvbg` },
    });

    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({
      error: { code: 'unauthorized' },
    });
  });
});

describe('GET /api/checklist signed in', () => {
  const retiredCheckId = `retired_check_${Date.now()}`;
  let session: Awaited<ReturnType<typeof signInTeamLeader>>;

  beforeAll(async () => {
    session = await signInTeamLeader();
    const inserted = await createAdminClient().from('checklist_checks').insert({
      id: retiredCheckId,
      name: 'Offers a festival coupon',
      rule: 'Mentions the Diwali coupon before ending',
      position: 0,
      active: false,
    });
    if (inserted.error) throw inserted.error;
  });

  afterAll(async () => {
    const deleted = await createAdminClient()
      .from('checklist_checks')
      .delete()
      .eq('id', retiredCheckId);
    if (deleted.error) throw deleted.error;
    await session?.deleteTeamLeader();
  });

  async function readChecklist() {
    const res = await api.checklist.$get(undefined, {
      headers: { Cookie: session.cookie },
    });
    expect(res.status).toBe(200);
    return res.json();
  }

  it('lists the active seeded checks in checklist order', async () => {
    const body = await readChecklist();
    const ids = body.checks.map((check) => check.id);

    expect(ids.filter((id) => SEEDED_CHECKS.includes(id))).toEqual(
      SEEDED_CHECKS,
    );
  });

  it('leaves out checks that were removed from the checklist', async () => {
    const body = await readChecklist();

    expect(body.checks).not.toContainEqual(
      expect.objectContaining({ id: retiredCheckId }),
    );
  });

  it('lists the seeded red flags and the refund rules', async () => {
    const body = await readChecklist();

    expect(body.red_flags.map((flag) => flag.id)).toEqual(
      expect.arrayContaining(SEEDED_RED_FLAGS),
    );
    expect(body.rules).toMatch(/refund/i);
  });
});
