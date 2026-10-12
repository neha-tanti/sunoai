import 'server-only';
import { z } from 'zod';
import { requireEnv } from './env';

const GNANI_URL = 'https://api.vachana.ai';
const JOBS = '/stt/v3/batch/jobs';

export class GnaniError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'GnaniError';
  }
}

async function gnani(
  path: string,
  signal: AbortSignal,
  init: { method?: 'GET' | 'POST'; body?: unknown } = {},
): Promise<unknown> {
  const method = init.method ?? 'GET';
  const res = await fetch(`${GNANI_URL}${path}`, {
    method,
    headers: {
      'X-API-Key-ID': requireEnv('GNANI_API_KEY'),
      ...(init.body === undefined
        ? {}
        : { 'Content-Type': 'application/json' }),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    signal,
  });
  if (!res.ok) {
    throw new GnaniError(
      res.status,
      `Gnani ${method} ${path} answered ${res.status}`,
    );
  }
  return res.json();
}

export async function createJob(
  options: {
    callLangs: string[];
    denoise: boolean;
    fileUrl: string;
    callbackUrl: string;
  },
  signal: AbortSignal,
): Promise<string> {
  const body = await gnani(JOBS, signal, {
    method: 'POST',
    body: {
      config: {
        model: 'gnani-prisma-v2.5',
        language_code: options.callLangs.join(','),
        mode: 'transcribe',
        with_diarization: true,
        num_speakers: 3,
        is_multi_channel: false,
        with_denoise: options.denoise,
      },
      source: {
        type: 'cloud_storage',
        auth: { mode: 'public' },
        paths: [options.fileUrl],
      },
      callback_url: options.callbackUrl,
    },
  });
  return z.object({ job_id: z.string() }).parse(body).job_id;
}

export async function startJob(jobId: string, signal: AbortSignal) {
  await gnani(`${JOBS}/${jobId}/start`, signal, { method: 'POST' });
}

export async function cancelJob(jobId: string, signal: AbortSignal) {
  try {
    await gnani(`${JOBS}/${jobId}/cancel`, signal, { method: 'POST' });
  } catch (err) {
    const alreadyGone =
      err instanceof GnaniError && (err.status === 404 || err.status === 409);
    if (!alreadyGone) throw err;
  }
}

export const FINAL_JOB_STATUSES = [
  'COMPLETED',
  'PARTIAL_FAILURE',
  'FAILED',
  'START_FAILED',
  'CANCELLED',
];

const jobSchema = z.object({
  status: z.string(),
  cancel_reason: z.string().nullish(),
});

export async function getJob(jobId: string, signal: AbortSignal) {
  return jobSchema.parse(await gnani(`${JOBS}/${jobId}`, signal));
}

const filesSchema = z.object({
  data: z.array(
    z.object({
      status: z.string(),
      transcript_url: z.string().nullish(),
      error_message: z.string().nullish(),
    }),
  ),
});

export async function listFiles(jobId: string, signal: AbortSignal) {
  return filesSchema.parse(await gnani(`${JOBS}/${jobId}/files`, signal)).data;
}

const transcriptSchema = z.object({
  language_code: z.string(),
  duration_seconds: z.coerce.number(),
  segments: z.array(
    z.object({
      start_time: z.number(),
      end_time: z.number(),
      speaker_id: z.number().int(),
      text: z.string(),
    }),
  ),
});

export type TranscriptSegment = {
  segment_id: number;
  start_time: number;
  end_time: number;
  speaker_id: number;
  text: string;
};

export function parseGnaniTranscript(json: unknown) {
  const transcript = transcriptSchema.parse(json);
  const segments: TranscriptSegment[] = transcript.segments
    .map((segment) => ({ ...segment, text: segment.text.trim() }))
    .filter((segment) => segment.text !== '')
    .sort((a, b) => a.start_time - b.start_time)
    .map((segment, index) => ({ ...segment, segment_id: index }));

  return {
    language: transcript.language_code,
    durationSeconds: transcript.duration_seconds,
    segments,
  };
}

export async function downloadTranscript(url: string, signal: AbortSignal) {
  const res = await fetch(url, { signal });
  if (!res.ok) {
    throw new GnaniError(
      res.status,
      `Transcript download answered ${res.status}`,
    );
  }
  return parseGnaniTranscript(await res.json());
}
