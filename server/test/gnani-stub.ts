import { randomUUID } from 'node:crypto';
import { vi } from 'vitest';

const GNANI_URL = 'https://api.vachana.ai';
const JOBS = `${GNANI_URL}/stt/v3/batch/jobs`;
const TTS = `${GNANI_URL}/api/v1/tts/inference`;
const TRANSCRIPTS_URL = 'https://transcripts.gnani.test';
const FAKE_WAV = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0]);

export type FakeFile = {
  status: 'COMPLETED' | 'FAILED' | 'SKIPPED' | 'CANCELLED';
  error_message?: string;
  transcript?: unknown;
  transcriptStatus?: number;
  transcriptFailure?: 'unreachable' | 'cut_off';
  holdUntilRequests?: number;
};

export type FakeJob = {
  status: string;
  cancel_reason?: string;
  statusAnswer?: number;
  unreachable?: boolean;
  stalled?: boolean;
  malformed?: boolean;
  malformedFiles?: boolean;
  busyOnce?: boolean;
  filesAnswer?: number;
  files: FakeFile[];
};

export type GnaniRequest = { method: string; url: string; body: unknown };

export function stubGnani() {
  const realFetch = globalThis.fetch;
  const jobs = new Map<string, FakeJob>();
  const requests: GnaniRequest[] = [];
  const held = new Map<FakeFile, (() => void)[]>();
  const answers: {
    create?: number;
    start?: number;
    cancel?: number;
    tts?: number;
  } = {};

  function answer(step: keyof typeof answers, body: unknown, status = 200) {
    const failure = answers[step];
    if (failure)
      return Response.json({ error: 'STUBBED' }, { status: failure });
    return Response.json(body, { status });
  }

  function stall(signal: AbortSignal) {
    return new Promise<Response>((_, reject) => {
      signal.addEventListener('abort', () => reject(signal.reason));
    });
  }

  function jobResponse(jobId: string, rest: string, signal: AbortSignal) {
    const job = jobs.get(jobId);
    if (!job) return Response.json({ error: 'JOB_NOT_FOUND' }, { status: 404 });

    if (rest === '/start') return answer('start', { job_id: jobId }, 202);
    if (rest === '/cancel') {
      const response = answer('cancel', { job_id: jobId, status: 'CANCELLED' });
      if (response.ok) job.status = 'CANCELLED';
      return response;
    }
    if (rest === '/files') {
      if (job.filesAnswer) {
        return Response.json({ error: 'STUBBED' }, { status: job.filesAnswer });
      }
      if (job.malformedFiles) return Response.json({ job_id: jobId });
      return Response.json({
        job_id: jobId,
        data: job.files.map((file, index) => ({
          status: file.status,
          error_message: file.error_message ?? null,
          transcript_url:
            file.transcript === undefined
              ? null
              : `${TRANSCRIPTS_URL}/${jobId}/${index}.json`,
        })),
      });
    }
    if (job.busyOnce) {
      job.busyOnce = false;
      return Response.json({ error: 'STUBBED' }, { status: 429 });
    }
    if (job.statusAnswer) {
      return Response.json({ error: 'STUBBED' }, { status: job.statusAnswer });
    }
    if (job.unreachable) throw new TypeError('fetch failed');
    if (job.stalled) return stall(signal);
    if (job.malformed) return Response.json({ job_id: jobId });
    return Response.json({
      job_id: jobId,
      status: job.status,
      cancel_reason: job.cancel_reason ?? null,
    });
  }

  function holdUntilAllArrive(fake: FakeFile, count: number) {
    return new Promise<void>((resolve) => {
      const waiting = [...(held.get(fake) ?? []), resolve];
      held.set(fake, waiting);
      if (waiting.length === count) waiting.forEach((release) => release());
    });
  }

  async function transcriptResponse(url: string) {
    const [jobId, file] = url.slice(TRANSCRIPTS_URL.length + 1).split('/');
    const fake = jobs.get(jobId)?.files[Number.parseInt(file, 10)];
    if (!fake || fake.transcript === undefined) {
      return new Response('Not found', { status: 404 });
    }
    if (fake.holdUntilRequests) await holdUntilAllArrive(fake, fake.holdUntilRequests);
    if (fake.transcriptFailure === 'unreachable') {
      throw new TypeError('fetch failed');
    }
    if (fake.transcriptFailure === 'cut_off') {
      const stream = new ReadableStream({
        start: (controller) => controller.error(new TypeError('terminated')),
      });
      return new Response(stream);
    }
    const init = { status: fake.transcriptStatus ?? 200 };
    if (typeof fake.transcript === 'string') {
      return new Response(fake.transcript, init);
    }
    return Response.json(fake.transcript, init);
  }

  const fakeFetch: typeof fetch = async (input, init) => {
    const request = new Request(input, init);
    const { url, method } = request;
    if (url.startsWith(TRANSCRIPTS_URL)) {
      requests.push({ method, url, body: null });
      return transcriptResponse(url);
    }
    if (!url.startsWith(GNANI_URL)) return realFetch(input, init);

    const body =
      method === 'POST' ? await request.json().catch(() => null) : null;
    requests.push({ method, url, body });

    if (url === TTS && method === 'POST') {
      if (answers.tts) {
        return Response.json({ error: 'STUBBED' }, { status: answers.tts });
      }
      return new Response(FAKE_WAV, {
        headers: { 'Content-Type': 'audio/wav' },
      });
    }
    if (url === JOBS && method === 'POST') {
      const jobId = randomUUID();
      const response = answer(
        'create',
        { job_id: jobId, status: 'CREATED' },
        201,
      );
      if (response.ok) jobs.set(jobId, { status: 'CREATED', files: [] });
      return response;
    }
    const match = url.match(/\/stt\/v3\/batch\/jobs\/([^/?]+)(\/[a-z]+)?/);
    if (match) return jobResponse(match[1], match[2] ?? '', request.signal);

    return Response.json({ error: 'UNKNOWN_ROUTE' }, { status: 404 });
  };

  vi.stubGlobal('fetch', fakeFetch);

  return {
    jobs,
    requests,
    answers,
    finishJob(jobId: string, job: FakeJob) {
      jobs.set(jobId, job);
    },
    requestsTo(path: string) {
      return requests.filter((request) => request.url.includes(path));
    },
  };
}

export type GnaniStub = ReturnType<typeof stubGnani>;

export function hinglishTranscript(
  overrides: { duration_seconds?: number } = {},
) {
  return {
    language_code: 'hi-IN',
    duration_seconds: overrides.duration_seconds ?? 42.5,
    model: 'prisma-v3.0',
    segments: [
      {
        segment_id: 0,
        start_time: 0,
        end_time: 4.2,
        speaker_id: 1,
        text: 'Namaste, FreshDabba support mein aapka swagat hai.',
      },
      {
        segment_id: 0,
        start_time: 4.2,
        end_time: 9.8,
        speaker_id: 2,
        text: 'Mera order chaalis minute late hai, rider kahan hai?',
      },
      {
        segment_id: 0,
        start_time: 9.8,
        end_time: 15.1,
        speaker_id: 1,
        text: 'Sorry, main samjha nahi. Apna order ID bataiye.',
      },
      {
        segment_id: 0,
        start_time: 15.1,
        end_time: 19.4,
        speaker_id: 2,
        text: 'Mujhe kisi insaan se baat karni hai, please.',
      },
    ],
    full_transcript: 'Namaste, FreshDabba support mein aapka swagat hai. ...',
  };
}
