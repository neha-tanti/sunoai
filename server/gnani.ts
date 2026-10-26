import 'server-only';
import { setTimeout as sleep } from 'node:timers/promises';
import { z } from 'zod';
import { requireEnv } from './env';

const GNANI_URL = 'https://api.vachana.ai';
const JOBS = '/stt/v3/batch/jobs';
const BURST_RETRY_MS = 1000;

export const GNANI_REQUEST_MS = 20_000;

type GnaniRequest = { method?: 'GET' | 'POST'; body?: unknown };

export class GnaniError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'GnaniError';
  }
}

async function readJson(res: Response, what: string): Promise<unknown> {
  const body = await res.text();
  try {
    return JSON.parse(body);
  } catch {
    throw new GnaniError(res.status, `${what} was not valid JSON`);
  }
}

async function send(
  path: string,
  signal: AbortSignal,
  { method = 'GET', body }: GnaniRequest = {},
): Promise<Response> {
  const request = () =>
    fetch(`${GNANI_URL}${path}`, {
      method,
      headers: {
        'X-API-Key-ID': requireEnv('GNANI_API_KEY'),
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  let res = await request();
  // Gnani answers 429 to a request sent within about a second of the previous one.
  if (res.status === 429) {
    await res.body?.cancel();
    await sleep(BURST_RETRY_MS, undefined, { signal });
    res = await request();
  }
  if (!res.ok) {
    throw new GnaniError(
      res.status,
      `Gnani ${method} ${path} answered ${res.status}`,
    );
  }
  return res;
}

async function gnani(
  path: string,
  signal: AbortSignal,
  request: GnaniRequest = {},
): Promise<unknown> {
  return readJson(await send(path, signal, request), `Gnani ${path}`);
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
  duration_seconds: z.number(),
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
  return parseGnaniTranscript(await readJson(res, 'The transcript'));
}

export async function synthesizeSpeech(
  text: string,
  speaker: { language: string; voice: string },
  signal: AbortSignal,
): Promise<ArrayBuffer> {
  const res = await send('/api/v1/tts/inference', signal, {
    method: 'POST',
    body: {
      text,
      voice: speaker.voice,
      model: 'timbre-v2.5',
      language: speaker.language,
      speed: 0.9,
      audio_config: {
        sample_rate: 16000,
        num_channels: 1,
        sample_width: 2,
        encoding: 'linear_pcm',
        container: 'wav',
      },
    },
  });
  return res.arrayBuffer();
}
