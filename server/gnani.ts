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
    readonly status: number | null,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'GnaniError';
  }
}

async function reach(
  url: string,
  init: RequestInit & { signal: AbortSignal },
  what: string,
) {
  const signal = AbortSignal.any([
    init.signal,
    AbortSignal.timeout(GNANI_REQUEST_MS),
  ]);
  try {
    return await fetch(url, { ...init, signal });
  } catch (err) {
    throw new GnaniError(null, `${what} got no answer`, { cause: err });
  }
}

async function readJson(res: Response, what: string): Promise<unknown> {
  const body = await res.text().catch((err: unknown) => {
    throw new GnaniError(null, `${what} was cut off`, { cause: err });
  });
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
    reach(
      `${GNANI_URL}${path}`,
      {
        method,
        headers: {
          'X-API-Key-ID': requireEnv('GNANI_API_KEY'),
          ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal,
      },
      `Gnani ${method} ${path}`,
    );
  let res = await request();
  // Gnani answers 429 to a request sent within about a second of the previous one.
  if (res.status === 429) {
    await res.body?.cancel();
    await sleep(BURST_RETRY_MS);
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

async function gnani<Schema extends z.ZodType>(
  path: string,
  signal: AbortSignal,
  schema: Schema,
  request: GnaniRequest = {},
): Promise<z.output<Schema>> {
  const res = await send(path, signal, request);
  const parsed = schema.safeParse(await readJson(res, `Gnani ${path}`));
  if (!parsed.success) {
    throw new GnaniError(
      res.status,
      `Gnani ${path} answered in an unexpected shape`,
      { cause: parsed.error },
    );
  }
  return parsed.data;
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
  const body = await gnani(JOBS, signal, z.object({ job_id: z.string() }), {
    method: 'POST',
    body: {
      config: {
        model: 'prisma-v3.0',
        language_code: options.callLangs.join(','),
        mode: 'transcribe',
        format: 'transcribe',
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
  return body.job_id;
}

export async function startJob(jobId: string, signal: AbortSignal) {
  await gnani(`${JOBS}/${jobId}/start`, signal, z.unknown(), {
    method: 'POST',
  });
}

export async function cancelJob(jobId: string, signal: AbortSignal) {
  try {
    await gnani(`${JOBS}/${jobId}/cancel`, signal, z.unknown(), {
      method: 'POST',
    });
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
  return gnani(`${JOBS}/${jobId}`, signal, jobSchema);
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
  return (await gnani(`${JOBS}/${jobId}/files`, signal, filesSchema)).data;
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
  const res = await reach(url, { signal }, 'Transcript download');
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
