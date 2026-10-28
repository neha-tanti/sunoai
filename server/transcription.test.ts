import { randomUUID } from 'node:crypto';
import { testClient } from 'hono/testing';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import type { TablesInsert } from '@/lib/database.types';
import { app } from './app';
import { createAdminClient } from './supabase';
import { flushAfter } from './test/after';
import {
  deleteCalls,
  insertAnalyzingCall,
  insertCall,
  readCall,
  readReport,
  uploadRecording,
} from './test/calls';
import {
  hinglishTranscript,
  stubGnani,
  type FakeJob,
  type GnaniStub,
} from './test/gnani-stub';
import {
  ANSWERING_MODEL,
  stubOpenRouter,
  type OpenRouterStub,
} from './test/openrouter-stub';
import { signInTeamLeader } from './test/session';

vi.mock('next/server', async (importOriginal) => {
  const { collectAfter } = await import('./test/after');
  return {
    ...(await importOriginal<typeof import('next/server')>()),
    after: collectAfter,
  };
});

const WEBHOOK_TOKEN = 'test-webhook-token';
const CRON_SECRET = 'test-cron-secret';

const completedJob = (transcript: unknown = hinglishTranscript()): FakeJob => ({
  status: 'COMPLETED',
  files: [{ status: 'COMPLETED', transcript }],
});

let gnani: GnaniStub;
let openRouter: OpenRouterStub;
const createdIds: string[] = [];

beforeEach(() => {
  vi.stubEnv('GNANI_API_KEY', 'test-gnani-key');
  vi.stubEnv('GNANI_WEBHOOK_TOKEN', WEBHOOK_TOKEN);
  vi.stubEnv('CRON_SECRET', CRON_SECRET);
  vi.stubEnv('APP_URL', 'https://sunoai.test');
  vi.stubEnv('OPENROUTER_API_KEY', 'test-openrouter-key');
  vi.stubEnv('LLM_MODELS', ANSWERING_MODEL);
  vi.spyOn(console, 'info').mockImplementation(() => {});
  gnani = stubGnani();
  openRouter = stubOpenRouter();
});

afterEach(async () => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  await flushAfter();
  await deleteCalls(createdIds.splice(0));
});

async function transcribingCall(
  job: FakeJob,
  overrides: Partial<TablesInsert<'calls'>> = {},
) {
  const jobId = randomUUID();
  gnani.jobs.set(jobId, job);
  const call = await insertCall({
    status: 'transcribing',
    gnani_job_id: jobId,
    checked_at: new Date().toISOString(),
    ...overrides,
  });
  createdIds.push(call.id);
  return { ...call, jobId };
}

async function backdate(callId: string, minutes: number) {
  const updated = await createAdminClient()
    .from('calls')
    .update({
      status_at: new Date(Date.now() - minutes * 60_000).toISOString(),
    })
    .eq('id', callId);
  if (updated.error) throw updated.error;
}

function sendWebhook(jobId: string, token: string | null = WEBHOOK_TOKEN) {
  const query = token === null ? '' : `?token=${encodeURIComponent(token)}`;
  return app.request(`/api/webhooks/gnani${query}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event: 'job.completed',
      job_id: jobId,
      status: 'COMPLETED',
      transcripts: [],
    }),
  });
}

function sendPoll(secret: string | null = CRON_SECRET) {
  return app.request('/api/jobs/poll', {
    method: 'POST',
    headers: secret === null ? {} : { 'x-cron-secret': secret },
  });
}

async function finishByWebhook(jobId: string) {
  const res = await sendWebhook(jobId);
  expect(res.status).toBe(200);
  return flushAfter();
}

describe('a call from upload to Ready', () => {
  let session: Awaited<ReturnType<typeof signInTeamLeader>>;

  beforeAll(async () => {
    session = await signInTeamLeader();
  });

  afterAll(async () => {
    await session?.deleteTeamLeader();
  });

  it('goes Uploaded, then Transcribing, then Ready with its segments and report saved', async () => {
    const api = testClient(app).api;
    const headers = { Cookie: session.cookie };
    const created = await api.calls.$post(
      {
        json: {
          title: 'Cold biryani, customer wants a refund',
          file_name: 'cold-biryani.wav',
          file_size: 2_400_000,
          call_langs: ['hi-IN', 'en-IN'],
          coaching_lang: 'hi-IN',
        },
      },
      { headers },
    );
    const { id, path } = (await created.json()) as { id: string; path: string };
    createdIds.push(id);
    expect((await readCall(id)).call?.status).toBe('uploaded');

    await uploadRecording(path);
    const checked = await api.calls[':id'].check.$post(
      { param: { id } },
      { headers },
    );
    expect(checked.status).toBe(200);
    const { call: transcribing } = await readCall(id);
    expect(transcribing?.status).toBe('transcribing');

    gnani.jobs.set(transcribing!.gnani_job_id!, completedJob());
    const outcomes = await finishByWebhook(transcribing!.gnani_job_id!);

    expect(outcomes).toEqual(['ready']);
    const { call, segments } = await readCall(id);
    expect(call).toMatchObject({
      status: 'ready',
      error_code: null,
      duration_seconds: 42.5,
    });
    expect(segments.map((segment) => segment.segment_id)).toEqual([0, 1, 2, 3]);
    expect(segments[3]).toMatchObject({
      speaker_id: 2,
      text: 'Mujhe kisi insaan se baat karni hai, please.',
    });
    expect(await readReport(id)).toMatchObject({ llm_model: ANSWERING_MODEL });
  });
});

describe('the webhook and the poll arriving together', () => {
  it('finish the call exactly once', async () => {
    const call = await transcribingCall(completedJob());
    await backdate(call.id, 2);
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    const responses = await Promise.all([sendWebhook(call.jobId), sendPoll()]);
    expect(responses.map((res) => res.status)).toEqual([200, 202]);
    const results = (await flushAfter()) as (
      string | { callId: string; outcome: string }[]
    )[];

    const outcomes = results.flatMap((result) =>
      typeof result === 'string'
        ? [result]
        : result
            .filter((entry) => entry.callId === call.id)
            .map((entry) => entry.outcome),
    );
    expect(outcomes.filter((outcome) => outcome === 'ready')).toHaveLength(1);
    expect(
      outcomes
        .filter((outcome) => outcome !== 'ready')
        .every((outcome) => outcome === 'lost_race'),
    ).toBe(true);
    expect(consoleError).not.toHaveBeenCalled();
    expect(openRouter.requests).toHaveLength(1);
    const { call: saved, segments } = await readCall(call.id);
    expect(saved).toMatchObject({ status: 'ready', error_code: null });
    expect(segments).toHaveLength(4);
    expect(await readReport(call.id)).not.toBeNull();
  });
});

describe('POST /api/webhooks/gnani', () => {
  it.each([
    ['a wrong token', 'not-the-token'],
    ['no token', null],
  ])('answers 401 to %s and does nothing', async (_, token) => {
    const call = await transcribingCall(completedJob());

    const res = await sendWebhook(call.jobId, token);

    expect(res.status).toBe(401);
    expect(await flushAfter()).toEqual([]);
    expect((await readCall(call.id)).call?.status).toBe('transcribing');
  });

  it('never accepts a webhook when no token is configured', async () => {
    vi.stubEnv('GNANI_WEBHOOK_TOKEN', '');
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const res = await sendWebhook('any-job', '');

    expect(res.status).toBe(500);
    expect(await flushAfter()).toEqual([]);
  });

  it('answers 400 to an event without a job id', async () => {
    const res = await app.request(
      `/api/webhooks/gnani?token=${WEBHOOK_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'job.completed' }),
      },
    );

    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({
      error: { code: 'invalid_request' },
    });
  });

  it('ignores a job that belongs to no call being transcribed', async () => {
    const res = await sendWebhook(randomUUID());

    expect(res.status).toBe(200);
    expect(await flushAfter()).toEqual([]);
    expect(gnani.requests).toHaveLength(0);
  });

  it('re-reads the job from Gnani instead of trusting the event', async () => {
    const call = await transcribingCall({ status: 'IN_PROGRESS', files: [] });

    const outcomes = await finishByWebhook(call.jobId);

    expect(outcomes).toEqual(['pending']);
    expect((await readCall(call.id)).call?.status).toBe('transcribing');
  });
});

describe('each failure in the TRD table', () => {
  it.each<[string, FakeJob, string]>([
    [
      'Gnani skips the file',
      {
        status: 'FAILED',
        files: [{ status: 'SKIPPED', error_message: 'Unsupported format' }],
      },
      'file_rejected',
    ],
    [
      'the job fails to start',
      {
        status: 'START_FAILED',
        cancel_reason: 'All provided paths were invalid',
        files: [],
      },
      'gnani_failed',
    ],
    [
      'the job fails',
      {
        status: 'FAILED',
        files: [{ status: 'FAILED', error_message: 'Decoder error' }],
      },
      'gnani_failed',
    ],
    [
      'the job partly fails',
      {
        status: 'PARTIAL_FAILURE',
        files: [{ status: 'FAILED', error_message: 'Decoder error' }],
      },
      'gnani_failed',
    ],
    [
      'the job is cancelled',
      { status: 'CANCELLED', files: [] },
      'gnani_failed',
    ],
    [
      'the file has no speech',
      {
        status: 'FAILED',
        files: [
          {
            status: 'FAILED',
            error_message: 'Empty transcript after 3 retries',
          },
        ],
      },
      'no_speech',
    ],
    [
      'the transcript has no segments',
      completedJob({ ...hinglishTranscript(), segments: [] }),
      'no_speech',
    ],
    [
      'the call is longer than 30 minutes',
      completedJob(hinglishTranscript({ duration_seconds: 1800.5 })),
      'too_long',
    ],
    [
      'the transcript link has expired',
      {
        status: 'COMPLETED',
        files: [
          {
            status: 'COMPLETED',
            transcript: hinglishTranscript(),
            transcriptStatus: 403,
          },
        ],
      },
      'gnani_failed',
    ],
    [
      'the transcript is not in the expected shape',
      completedJob({ language_code: 'hi-IN', duration_seconds: 40 }),
      'transcription_failed',
    ],
    [
      'saving the transcript fails',
      completedJob({
        ...hinglishTranscript(),
        // Postgres rejects a NUL character in jsonb, so save_transcript fails.
        segments: [
          {
            start_time: 0,
            end_time: 4.2,
            speaker_id: 1,
            text: 'Haan ji\u0000',
          },
        ],
      }),
      'transcription_failed',
    ],
    [
      'Gnani finishes without a transcript',
      { status: 'COMPLETED', files: [] },
      'gnani_failed',
    ],
    [
      'Gnani does not answer',
      { status: 'IN_PROGRESS', unreachable: true, files: [] },
      'gnani_failed',
    ],
    [
      "Gnani's job answer is not in the expected shape",
      { status: 'COMPLETED', malformed: true, files: [] },
      'gnani_failed',
    ],
  ])('%s → Failed (%s)', async (_, job, errorCode) => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const call = await transcribingCall(job);

    expect(await finishByWebhook(call.jobId)).toEqual(['failed']);

    const { call: saved, segments } = await readCall(call.id);
    expect(saved).toMatchObject({ status: 'failed', error_code: errorCode });
    expect(saved?.error).toMatch(/\S/);
    expect(segments).toHaveLength(0);
  });

  it('fails a transcript that is not JSON without logging or saving its text', async () => {
    // V8 quotes only the first 10 characters of invalid JSON in its error message.
    const transcriptText = 'Order late';
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const call = await transcribingCall(completedJob(transcriptText));

    expect(await finishByWebhook(call.jobId)).toEqual(['failed']);

    const { call: saved } = await readCall(call.id);
    expect(saved).toMatchObject({
      status: 'failed',
      error_code: 'gnani_failed',
    });
    expect(saved?.error).not.toContain(transcriptText);
    expect(consoleError).toHaveBeenCalled();
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain(
      transcriptText,
    );
  });

  it('accepts a call of exactly 30 minutes', async () => {
    const call = await transcribingCall(
      completedJob(hinglishTranscript({ duration_seconds: 1800 })),
    );

    expect(await finishByWebhook(call.jobId)).toEqual(['ready']);
  });

  it.each([429, 503])(
    'keeps the call Transcribing for the next run when Gnani answers %i',
    async (status) => {
      const call = await transcribingCall({
        status: 'IN_PROGRESS',
        statusAnswer: status,
        files: [],
      });

      expect(await finishByWebhook(call.jobId)).toEqual(['gnani_busy']);

      expect((await readCall(call.id)).call).toMatchObject({
        status: 'transcribing',
        gnani_attempts: 1,
      });
    },
  );

  it('finishes the call when Gnani answers 429 once and then answers', async () => {
    const call = await transcribingCall({ ...completedJob(), busyOnce: true });

    expect(await finishByWebhook(call.jobId)).toEqual(['ready']);

    expect((await readCall(call.id)).call).toMatchObject({
      status: 'ready',
      gnani_attempts: 0,
    });
  });

  it('keeps a finished call Transcribing when Gnani rate-limits its files', async () => {
    const call = await transcribingCall({
      ...completedJob(),
      filesAnswer: 429,
    });

    expect(await finishByWebhook(call.jobId)).toEqual(['gnani_busy']);

    expect((await readCall(call.id)).call).toMatchObject({
      status: 'transcribing',
      gnani_attempts: 1,
    });
  });

  it('fails the call on the 30th busy answer from Gnani, not the 29th', async () => {
    const job: FakeJob = {
      status: 'IN_PROGRESS',
      statusAnswer: 503,
      files: [],
    };
    const twentyNinth = await transcribingCall(job, { gnani_attempts: 28 });
    const thirtieth = await transcribingCall(
      { ...job },
      { gnani_attempts: 29 },
    );

    expect(await finishByWebhook(twentyNinth.jobId)).toEqual(['gnani_busy']);
    expect(await finishByWebhook(thirtieth.jobId)).toEqual(['failed']);

    expect((await readCall(twentyNinth.id)).call).toMatchObject({
      status: 'transcribing',
      gnani_attempts: 29,
    });
    expect((await readCall(thirtieth.id)).call).toMatchObject({
      status: 'failed',
      error_code: 'gnani_failed',
    });
  });

  it('fails a call whose Gnani job is still running 2 hours after the check', async () => {
    const call = await transcribingCall(
      { status: 'IN_PROGRESS', files: [] },
      { checked_at: new Date(Date.now() - 121 * 60_000).toISOString() },
    );

    expect(await finishByWebhook(call.jobId)).toEqual(['failed']);
    expect((await readCall(call.id)).call).toMatchObject({
      error_code: 'gnani_failed',
    });
  });
});

describe('POST /api/jobs/poll', () => {
  beforeEach(async () => {
    const stale = await createAdminClient()
      .from('calls')
      .update({
        status: 'failed',
        error_code: 'transcription_failed',
        error: 'Left over by an earlier test run',
      })
      .eq('status', 'transcribing')
      .lt('status_at', new Date(Date.now() - 60_000).toISOString());
    if (stale.error) throw stale.error;
  });

  async function poll() {
    const res = await sendPoll();
    expect(res.status).toBe(202);
    const [outcomes] = (await flushAfter()) as [
      { callId: string; outcome: string }[],
    ];
    return outcomes;
  }

  it.each([
    ['a wrong secret', 'not-the-secret'],
    ['no secret', null],
  ])('answers 401 to %s', async (_, secret) => {
    const res = await sendPoll(secret);

    expect(res.status).toBe(401);
    expect(await flushAfter()).toEqual([]);
  });

  it('finishes a call stuck in Transcribing for over a minute', async () => {
    const call = await transcribingCall(completedJob());
    await backdate(call.id, 2);

    expect(await poll()).toEqual([{ callId: call.id, outcome: 'ready' }]);
    expect((await readCall(call.id)).call?.status).toBe('ready');
  });

  it('leaves a call that started transcribing under a minute ago', async () => {
    const call = await transcribingCall(completedJob());

    expect(await poll()).toEqual([]);
    expect((await readCall(call.id)).call?.status).toBe('transcribing');
  });

  it('finishes only the oldest done call and moves past calls still running', async () => {
    const running = await transcribingCall({
      status: 'IN_PROGRESS',
      files: [],
    });
    const oldestDone = await transcribingCall(completedJob());
    const newerDone = await transcribingCall(completedJob());
    await backdate(running.id, 10);
    await backdate(oldestDone.id, 5);
    await backdate(newerDone.id, 3);

    expect(await poll()).toEqual([
      { callId: running.id, outcome: 'pending' },
      { callId: oldestDone.id, outcome: 'ready' },
    ]);
    expect((await readCall(newerDone.id)).call?.status).toBe('transcribing');
  });

  it('stops at the first busy answer so the other calls keep their attempts', async () => {
    const busy = await transcribingCall({
      status: 'IN_PROGRESS',
      statusAnswer: 429,
      files: [],
    });
    const done = await transcribingCall(completedJob());
    await backdate(busy.id, 5);
    await backdate(done.id, 3);

    expect(await poll()).toEqual([{ callId: busy.id, outcome: 'gnani_busy' }]);
    expect((await readCall(done.id)).call).toMatchObject({
      status: 'transcribing',
      gnani_attempts: 0,
    });
  });

  it('tries a call with fewer busy answers before an older one with more', async () => {
    const busy = await transcribingCall(
      { status: 'IN_PROGRESS', statusAnswer: 503, files: [] },
      { gnani_attempts: 1 },
    );
    const done = await transcribingCall(completedJob());
    await backdate(busy.id, 5);
    await backdate(done.id, 3);

    expect(await poll()).toEqual([{ callId: done.id, outcome: 'ready' }]);
  });

  it('fails calls left in Analysing for over 5 minutes, and only those', async () => {
    const stopped = await insertAnalyzingCall();
    const running = await insertAnalyzingCall();
    const ready = await insertCall({ status: 'ready' });
    createdIds.push(stopped.id, running.id, ready.id);
    await backdate(stopped.id, 10);
    await backdate(running.id, 1);
    await backdate(ready.id, 10);

    await poll();

    expect((await readCall(stopped.id)).call).toMatchObject({
      status: 'failed',
      error_code: 'analysis_failed',
    });
    expect((await readCall(running.id)).call?.status).toBe('analyzing');
    expect((await readCall(ready.id)).call?.status).toBe('ready');
    expect(openRouter.requests).toHaveLength(0);
  });
});
