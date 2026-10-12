import { testClient } from 'hono/testing';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { SaveChecklist } from '@/lib/checklist';
import { app } from './app';
import { createAdminClient } from './supabase';
import { keepChecklist } from './test/checklist';
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
    await session?.deleteTeamLeader();
    if (deleted.error) throw deleted.error;
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

describe('PUT /api/checklist', () => {
  let session: Awaited<ReturnType<typeof signInTeamLeader>>;
  let restoreChecklist: () => Promise<void>;

  beforeAll(async () => {
    session = await signInTeamLeader();
    restoreChecklist = await keepChecklist();
  });

  afterEach(async () => {
    await restoreChecklist();
  });

  afterAll(async () => {
    await session?.deleteTeamLeader();
  });

  async function readChecklist() {
    const res = await api.checklist.$get(undefined, {
      headers: { Cookie: session.cookie },
    });
    expect(res.status).toBe(200);
    return res.json();
  }

  function saveChecklist(checklist: SaveChecklist) {
    return api.checklist.$put(
      { json: checklist },
      { headers: { Cookie: session.cookie } },
    );
  }

  it('saves an edited check in place, with the rules', async () => {
    const before = await readChecklist();
    const [first, ...rest] = before.checks;

    const res = await saveChecklist({
      ...before,
      checks: [
        { ...first, rule: 'Reads the order number back to the customer' },
        ...rest,
      ],
      rules: 'Late delivery over 30 minutes: a coupon of up to ₹75.',
    });

    expect(res.status).toBe(204);
    const after = await readChecklist();
    expect(after.checks.map((check) => check.id)).toEqual(
      before.checks.map((check) => check.id),
    );
    expect(after.checks[0]).toMatchObject({
      id: first.id,
      rule: 'Reads the order number back to the customer',
    });
    expect(after.rules).toBe(
      'Late delivery over 30 minutes: a coupon of up to ₹75.',
    );
  });

  it('keeps the order it was sent in', async () => {
    const before = await readChecklist();

    await saveChecklist({ ...before, checks: before.checks.toReversed() });

    const after = await readChecklist();
    expect(after.checks.map((check) => check.id)).toEqual(
      before.checks.map((check) => check.id).toReversed(),
    );
  });

  it('retires a removed check instead of deleting it', async () => {
    const before = await readChecklist();

    await saveChecklist({
      ...before,
      checks: before.checks.filter((check) => check.id !== 'closing'),
    });

    const after = await readChecklist();
    expect(after.checks).not.toContainEqual(
      expect.objectContaining({ id: 'closing' }),
    );
    const row = await createAdminClient()
      .from('checklist_checks')
      .select('active')
      .eq('id', 'closing')
      .single();
    expect(row.data).toEqual({ active: false });
  });

  it('adds a new check and red flag at the end with ids from their names', async () => {
    const before = await readChecklist();

    await saveChecklist({
      ...before,
      checks: [
        ...before.checks,
        {
          name: 'Offers the Diwali coupon',
          rule: 'Mentions the festival coupon before ending the call',
        },
      ],
      red_flags: [
        ...before.red_flags,
        {
          name: 'Shares another customer’s order',
          example: '"Order 5521 bhi aapke area mein hai, Rohit ji ka"',
        },
      ],
    });

    const after = await readChecklist();
    expect(after.checks.at(-1)).toMatchObject({
      id: 'offers_the_diwali_coupon',
      name: 'Offers the Diwali coupon',
    });
    expect(after.red_flags.at(-1)).toMatchObject({
      id: 'shares_another_customer_s_order',
    });
  });

  it('gives checks named without English letters distinct ids', async () => {
    const before = await readChecklist();

    await saveChecklist({
      ...before,
      checks: [
        ...before.checks,
        { name: 'ऑर्डर पक्का किया', rule: 'ऑर्डर नंबर दोबारा बताता है' },
        { name: 'धन्यवाद कहा', rule: 'कॉल के अंत में धन्यवाद कहता है' },
      ],
    });

    const after = await readChecklist();
    expect(after.checks.slice(-2).map((check) => check.id)).toEqual([
      'check',
      'check_2',
    ]);
  });

  it('brings back a removed check that is added again by name', async () => {
    const before = await readChecklist();
    const withoutHandover = before.checks.filter(
      (check) => check.id !== 'smooth_handover',
    );
    await saveChecklist({ ...before, checks: withoutHandover });

    await saveChecklist({
      ...before,
      checks: [
        ...withoutHandover,
        {
          name: 'Smooth handover',
          rule: 'The human agent already knows the order and the problem',
        },
      ],
    });

    const after = await readChecklist();
    expect(after.checks.at(-1)).toMatchObject({
      id: 'smooth_handover',
      rule: 'The human agent already knows the order and the problem',
    });
  });

  it('accepts 20 checks with names of 80 characters', async () => {
    const before = await readChecklist();
    const checks = Array.from({ length: 20 }, (_, n) => ({
      name: `Check ${String(n).padStart(2, '0')} `.padEnd(80, 'x'),
      rule: 'Confirms the delivery address',
    }));

    const res = await saveChecklist({ ...before, checks });

    expect(res.status).toBe(204);
    expect((await readChecklist()).checks).toHaveLength(20);
  });

  const order = { name: 'Order confirmed', rule: 'Confirms the order' };
  it.each([
    ['no checks', { checks: [] }],
    ['21 checks', { checks: Array.from({ length: 21 }, () => order) }],
    ['a blank name', { checks: [{ ...order, name: '   ' }] }],
    ['an 81-character name', { checks: [{ ...order, name: 'x'.repeat(81) }] }],
    [
      'the same id twice',
      {
        checks: [
          { ...order, id: 'order_confirmed' },
          { ...order, id: 'order_confirmed' },
        ],
      },
    ],
  ])('rejects %s and changes nothing', async (_, change) => {
    const before = await readChecklist();

    const res = await saveChecklist({ ...before, ...change });

    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({
      error: { code: 'invalid_request' },
    });
    expect(await readChecklist()).toEqual(before);
  });

  it('answers 401 without a session cookie', async () => {
    const res = await api.checklist.$put({
      json: { checks: [order], red_flags: [], rules: '' },
    });

    expect(res.status).toBe(401);
  });

  it('changes nothing when the save fails part way', async () => {
    const before = await readChecklist();
    const [first, second] = before.checks;

    const saved = await createAdminClient().rpc('save_checklist', {
      p_checks: [
        { ...first, name: 'Order number read back' },
        { ...second, name: null },
      ],
      p_red_flags: [],
      p_rules: 'No refunds at all.',
    });

    expect(saved.error).not.toBeNull();
    expect(await readChecklist()).toEqual(before);
  });
});
