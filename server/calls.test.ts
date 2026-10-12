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
import { MAX_FILE_BYTES, type CreateCall } from '@/lib/call-upload';
import { app } from './app';
import { createAdminClient } from './supabase';
import {
  deleteCalls,
  insertCall,
  readCall,
  uploadRecording,
} from './test/calls';
import { stubGnani, type GnaniStub } from './test/gnani-stub';
import { signInTeamLeader } from './test/session';

const api = testClient(app).api;

const LATE_ORDER_CALL: CreateCall = {
  title: 'Late paneer order, AI repeats itself',
  file_name: 'late-paneer-order.mp3',
  file_size: 1_200_000,
  call_langs: ['hi-IN', 'en-IN'],
  coaching_lang: 'hi-en',
  denoise: true,
};

let session: Awaited<ReturnType<typeof signInTeamLeader>>;
let gnani: GnaniStub;
const createdIds: string[] = [];

beforeAll(async () => {
  session = await signInTeamLeader();
});

afterAll(async () => {
  await session?.deleteTeamLeader();
});

beforeEach(() => {
  vi.stubEnv('GNANI_API_KEY', 'test-gnani-key');
  gnani = stubGnani();
});

afterEach(async () => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  await deleteCalls(createdIds.splice(0));
});

async function createCall(body: Record<string, unknown>) {
  const res = await api.calls.$post(
    { json: body as CreateCall },
    { headers: { Cookie: session.cookie } },
  );
  if (res.status === 201) {
    const created = (await res.clone().json()) as { id: string };
    createdIds.push(created.id);
  }
  return res;
}

async function seedCall(overrides: Parameters<typeof insertCall>[0] = {}) {
  const call = await insertCall(overrides);
  createdIds.push(call.id);
  return call;
}

describe('POST /api/calls', () => {
  it('creates an uploaded call and a signed upload that takes the recording', async () => {
    const res = await createCall(LATE_ORDER_CALL);
    expect(res.status).toBe(201);
    const { id, path, token } = (await res.json()) as {
      id: string;
      path: string;
      token: string;
    };

    const { call } = await readCall(id);
    expect(call).toMatchObject({
      status: 'uploaded',
      title: LATE_ORDER_CALL.title,
      mime_type: 'audio/mpeg',
      call_langs: ['hi-IN', 'en-IN'],
      coaching_lang: 'hi-en',
      file_path: path,
    });

    const uploaded = await session.supabase.storage
      .from('calls')
      .uploadToSignedUrl(
        path,
        token,
        new Blob(['not really audio'], { type: 'audio/mpeg' }),
      );
    expect(uploaded.error).toBeNull();
  });

  it('refuses an upload whose type the calls bucket does not accept', async () => {
    const res = await createCall(LATE_ORDER_CALL);
    const { path, token } = (await res.json()) as {
      path: string;
      token: string;
    };

    const uploaded = await session.supabase.storage
      .from('calls')
      .uploadToSignedUrl(
        path,
        token,
        new Blob(['a note'], { type: 'text/plain' }),
      );
    expect(uploaded.error).not.toBeNull();
  });

  it.each([
    ['a file of exactly 50 MB', { file_size: MAX_FILE_BYTES }],
    ['an upper-case extension', { file_name: 'WRONG-ITEM.MP3' }],
    ['Gujarati as the coaching language', { coaching_lang: 'gu-IN' }],
    ['three call languages', { call_langs: ['hi-IN', 'en-IN', 'mr-IN'] }],
  ])('accepts %s', async (_, override) => {
    const res = await createCall({ ...LATE_ORDER_CALL, ...override });

    expect(res.status).toBe(201);
  });

  it.each([
    ['a file over 50 MB', { file_size: MAX_FILE_BYTES + 1 }],
    ['an empty file', { file_size: 0 }],
    ['a title of only spaces', { title: '   ' }],
    ['a title over 120 characters', { title: 'a'.repeat(121) }],
    ['a text file', { file_name: 'call-notes.txt' }],
    ['a file with no extension', { file_name: 'recording' }],
    ['no call language', { call_langs: [] }],
    [
      'four call languages',
      { call_langs: ['hi-IN', 'en-IN', 'mr-IN', 'ta-IN'] },
    ],
    ['the same call language twice', { call_langs: ['hi-IN', 'hi-IN'] }],
    ['Gujarati as a call language', { call_langs: ['gu-IN'] }],
    ['an unknown coaching language', { coaching_lang: 'fr-FR' }],
  ])('refuses %s', async (_, override) => {
    const res = await createCall({ ...LATE_ORDER_CALL, ...override });

    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({
      error: { code: 'invalid_request' },
    });
  });

  it('turns noise removal on when the request leaves it out', async () => {
    const withoutDenoise: Record<string, unknown> = { ...LATE_ORDER_CALL };
    delete withoutDenoise.denoise;
    const res = await createCall(withoutDenoise);
    const { id } = (await res.json()) as { id: string };

    const { call } = await readCall(id);
    expect(call?.denoise).toBe(true);
  });

  it('stores the recording inside the call folder whatever the file is called', async () => {
    const res = await createCall({
      ...LATE_ORDER_CALL,
      file_name: '../../कॉल रिकॉर्डिंग.wav',
    });
    const { id, path } = (await res.json()) as { id: string; path: string };

    expect(path.startsWith(`${id}/`)).toBe(true);
    expect(path).not.toContain('..');
    expect(path).toMatch(/\.wav$/);
  });
});

describe('GET /api/calls/:id', () => {
  it('returns the call and its segments without internal columns', async () => {
    const call = await seedCall({
      status: 'analyzing',
      gnani_job_id: randomUUID(),
      detected_lang: 'hi-IN',
      duration_seconds: 19.4,
    });
    const inserted = await createAdminClient()
      .from('transcript_segments')
      .insert([
        {
          call_id: call.id,
          segment_id: 1,
          start_time: 4.2,
          end_time: 9.8,
          speaker_id: 2,
          text: 'Mera order chaalis minute late hai.',
        },
        {
          call_id: call.id,
          segment_id: 0,
          start_time: 0,
          end_time: 4.2,
          speaker_id: 1,
          text: 'Namaste, FreshDabba support.',
        },
      ]);
    if (inserted.error) throw inserted.error;

    const res = await api.calls[':id'].$get(
      { param: { id: call.id } },
      { headers: { Cookie: session.cookie } },
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.call).toMatchObject({ id: call.id, status: 'analyzing' });
    expect(body.call).not.toHaveProperty('error');
    expect(body.call).not.toHaveProperty('file_path');
    expect(body.call).not.toHaveProperty('gnani_job_id');
    expect(body.segments.map((segment) => segment.segment_id)).toEqual([0, 1]);
    expect(body.report).toBeNull();
  });

  it.each([
    ['an id that is not a call id', 'a-call-that-does-not-exist'],
    ['a call that does not exist', randomUUID()],
  ])('answers 404 for %s', async (_, id) => {
    const res = await api.calls[':id'].$get(
      { param: { id } },
      { headers: { Cookie: session.cookie } },
    );

    expect(res.status).toBe(404);
    expect(await res.json()).toMatchObject({ error: { code: 'not_found' } });
  });
});

describe('DELETE /api/calls/:id', () => {
  async function deleteCall(id: string) {
    return api.calls[':id'].$delete(
      { param: { id } },
      { headers: { Cookie: session.cookie } },
    );
  }

  it('deletes an uploaded call and its recording', async () => {
    const call = await seedCall();
    await uploadRecording(call.file_path);

    const res = await deleteCall(call.id);

    expect(res.status).toBe(204);
    expect((await readCall(call.id)).call).toBeNull();
    const exists = await createAdminClient()
      .storage.from('calls')
      .exists(call.file_path);
    expect(exists.data).toBe(false);
  });

  it('cancels the Gnani job of a call being transcribed, then deletes its segments', async () => {
    const jobId = randomUUID();
    gnani.jobs.set(jobId, { status: 'IN_PROGRESS', files: [] });
    const call = await seedCall({
      status: 'transcribing',
      gnani_job_id: jobId,
    });
    const inserted = await createAdminClient()
      .from('transcript_segments')
      .insert({
        call_id: call.id,
        segment_id: 0,
        start_time: 0,
        end_time: 3,
        speaker_id: 1,
        text: 'Namaste.',
      });
    if (inserted.error) throw inserted.error;

    const res = await deleteCall(call.id);

    expect(res.status).toBe(204);
    expect(gnani.requestsTo(`${jobId}/cancel`)).toHaveLength(1);
    expect(await readCall(call.id)).toMatchObject({ call: null, segments: [] });
  });

  it('still deletes the call when Gnani fails to cancel the job', async () => {
    const jobId = randomUUID();
    gnani.jobs.set(jobId, { status: 'IN_PROGRESS', files: [] });
    gnani.answers.cancel = 500;
    const call = await seedCall({
      status: 'transcribing',
      gnani_job_id: jobId,
    });
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    const res = await deleteCall(call.id);

    expect(res.status).toBe(204);
    expect((await readCall(call.id)).call).toBeNull();
    consoleError.mockRestore();
  });

  it('does not ask Gnani to cancel a call that is already transcribed', async () => {
    const call = await seedCall({
      status: 'analyzing',
      gnani_job_id: randomUUID(),
    });

    const res = await deleteCall(call.id);

    expect(res.status).toBe(204);
    expect(gnani.requestsTo('/cancel')).toHaveLength(0);
  });

  it('answers 404 for a call that does not exist', async () => {
    const res = await deleteCall(randomUUID());

    expect(res.status).toBe(404);
  });
});

describe('POST /api/calls/:id/check', () => {
  const WEBHOOK_TOKEN = 'test-webhook-token';

  beforeEach(() => {
    vi.stubEnv('APP_URL', 'https://sunoai.test');
    vi.stubEnv('GNANI_WEBHOOK_TOKEN', WEBHOOK_TOKEN);
  });

  async function checkCall(id: string) {
    return api.calls[':id'].check.$post(
      { param: { id } },
      { headers: { Cookie: session.cookie } },
    );
  }

  async function seedUploadedCall() {
    const call = await seedCall({ call_langs: ['hi-IN', 'en-IN'] });
    await uploadRecording(call.file_path);
    return call;
  }

  function silenceErrorLogs() {
    return vi.spyOn(console, 'error').mockImplementation(() => {});
  }

  it("starts a Gnani job with the TRD's settings and moves the call to Transcribing", async () => {
    const call = await seedUploadedCall();

    const res = await checkCall(call.id);

    expect(res.status).toBe(200);
    const [create] = gnani.requests.filter((request) =>
      request.url.endsWith('/stt/v3/batch/jobs'),
    );
    expect(create.body).toMatchObject({
      config: {
        model: 'gnani-prisma-v2.5',
        language_code: 'hi-IN,en-IN',
        with_diarization: true,
        num_speakers: 3,
        is_multi_channel: false,
        with_denoise: true,
      },
      source: { type: 'cloud_storage', auth: { mode: 'public' } },
      callback_url: `https://sunoai.test/api/webhooks/gnani?token=${WEBHOOK_TOKEN}`,
    });
    const [jobId] = [...gnani.jobs.keys()];
    expect(gnani.requestsTo(`${jobId}/start`)).toHaveLength(1);

    const { call: saved } = await readCall(call.id);
    expect(saved).toMatchObject({
      status: 'transcribing',
      gnani_job_id: jobId,
    });
    expect(saved?.checked_at).not.toBeNull();
  });

  it("gives Gnani a signed link to this call's recording", async () => {
    const call = await seedUploadedCall();

    await checkCall(call.id);

    const [create] = gnani.requests;
    const { source } = create.body as { source: { paths: string[] } };
    expect(source.paths).toHaveLength(1);
    expect(source.paths[0]).toContain(`/calls/${call.file_path}`);
    expect(source.paths[0]).toContain('token=');
  });

  it('starts only one job when the check is sent twice at once', async () => {
    const call = await seedUploadedCall();

    const responses = await Promise.all([
      checkCall(call.id),
      checkCall(call.id),
    ]);

    expect(responses.map((res) => res.status).sort()).toEqual([200, 409]);
    const loser = responses.find((res) => res.status === 409)!;
    expect(await loser.json()).toMatchObject({
      error: { code: 'not_uploaded' },
    });
    const { call: saved } = await readCall(call.id);
    const otherJobs = [...gnani.jobs.keys()].filter(
      (jobId) => jobId !== saved?.gnani_job_id,
    );
    for (const jobId of otherJobs) {
      expect(gnani.jobs.get(jobId)?.status).toBe('CANCELLED');
    }
    expect(gnani.jobs.get(saved!.gnani_job_id!)?.status).toBe('CREATED');
  });

  it('refuses a call that is already being transcribed', async () => {
    const call = await seedCall({
      status: 'transcribing',
      gnani_job_id: randomUUID(),
    });

    const res = await checkCall(call.id);

    expect(res.status).toBe(409);
    expect(await res.json()).toMatchObject({
      error: { code: 'not_uploaded', message: expect.stringMatching(/\S/) },
    });
    expect(gnani.requests).toHaveLength(0);
  });

  it('refuses a call whose recording never reached Storage', async () => {
    const call = await seedCall();

    const res = await checkCall(call.id);

    expect(res.status).toBe(409);
    expect(await res.json()).toMatchObject({
      error: {
        code: 'file_missing',
        message: "The recording didn't finish uploading. Upload it again.",
      },
    });
    expect(gnani.requests).toHaveLength(0);
  });

  it.each([
    ['creating', 'create'],
    ['starting', 'start'],
  ] as const)(
    'leaves the call Uploaded when Gnani fails while %s the job',
    async (_, step) => {
      const consoleError = silenceErrorLogs();
      gnani.answers[step] = 503;
      const call = await seedUploadedCall();

      const res = await checkCall(call.id);

      expect(res.status).toBe(503);
      expect(await res.json()).toMatchObject({
        error: {
          code: 'gnani_unavailable',
          message: "Couldn't start the check. Try again in a minute.",
        },
      });
      expect((await readCall(call.id)).call).toMatchObject({
        status: 'uploaded',
        gnani_job_id: null,
      });
      for (const job of gnani.jobs.values()) {
        expect(job.status).toBe('CANCELLED');
      }
      consoleError.mockRestore();
    },
  );

  it.each([
    ['an id that is not a call id', 'a-call-that-does-not-exist'],
    ['a call that does not exist', randomUUID()],
  ])('answers 404 for %s', async (_, id) => {
    const res = await checkCall(id);

    expect(res.status).toBe(404);
  });
});
