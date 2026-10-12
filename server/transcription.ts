import 'server-only';
import { MAX_CALL_SECONDS } from '@/lib/call-upload';
import type { Enums, Tables } from '@/lib/database.types';
import {
  downloadTranscript,
  FINAL_JOB_STATUSES,
  getJob,
  GnaniError,
  listFiles,
} from './gnani';
import { createAdminClient } from './supabase';

export const DEADLINE_MS = 280_000;
const MAX_GNANI_ATTEMPTS = 5;
const MAX_TRANSCRIBING_MS = 2 * 60 * 60 * 1000;

export const TRANSCRIBING_CALL_COLUMNS =
  'id, gnani_job_id, gnani_attempts, checked_at';

export type TranscribingCall = Pick<
  Tables<'calls'>,
  'id' | 'gnani_job_id' | 'gnani_attempts' | 'checked_at'
>;

export type FinishOutcome = 'pending' | 'analyzing' | 'failed' | 'lost_race';

type Failure = { code: Enums<'call_error_code'>; reason: string };

type JobFiles = Awaited<ReturnType<typeof listFiles>>;

export async function finishTranscription(
  call: TranscribingCall,
  signal: AbortSignal,
): Promise<FinishOutcome> {
  const startedAt = performance.now();
  const outcome = await finish(call, signal).catch((err: unknown) =>
    handleError(call, err),
  );
  const ms = Math.round(performance.now() - startedAt);
  console.info(
    `Transcription for call ${call.id}, Gnani job ${call.gnani_job_id}: ${outcome} in ${ms} ms`,
  );
  return outcome;
}

async function finish(
  call: TranscribingCall,
  signal: AbortSignal,
): Promise<FinishOutcome> {
  const jobId = call.gnani_job_id;
  if (!jobId) throw new Error(`Call ${call.id} has no Gnani job`);

  const job = await getJob(jobId, signal);
  if (!FINAL_JOB_STATUSES.includes(job.status)) {
    if (!isOverdue(call)) return 'pending';
    return fail(call.id, {
      code: 'transcription_failed',
      reason: `Gnani job still ${job.status} after 2 hours`,
    });
  }

  const files = await listFiles(jobId, signal);
  const failure = jobFailure(job, files);
  if (failure) return fail(call.id, failure);

  const transcriptUrl = files.find(
    (file) => file.status === 'COMPLETED',
  )?.transcript_url;
  if (!transcriptUrl) {
    return fail(call.id, {
      code: 'transcription_failed',
      reason: 'Gnani finished without a transcript',
    });
  }

  const transcript = await downloadTranscript(transcriptUrl, signal);
  if (transcript.durationSeconds > MAX_CALL_SECONDS) {
    return fail(call.id, {
      code: 'too_long',
      reason: `The call is ${transcript.durationSeconds} seconds long`,
    });
  }
  if (transcript.segments.length === 0) {
    return fail(call.id, {
      code: 'no_speech',
      reason: 'Gnani found no words',
    });
  }

  const saved = await createAdminClient().rpc('save_transcript', {
    p_call_id: call.id,
    p_detected_lang: transcript.language,
    p_duration_seconds: transcript.durationSeconds,
    p_segments: transcript.segments,
  });
  if (saved.error) throw saved.error;
  return saved.data ? 'analyzing' : 'lost_race';
}

function isOverdue(call: TranscribingCall) {
  if (!call.checked_at) return false;
  return Date.now() - Date.parse(call.checked_at) > MAX_TRANSCRIBING_MS;
}

function jobFailure(
  job: Awaited<ReturnType<typeof getJob>>,
  files: JobFiles,
): Failure | null {
  const skipped = files.find((file) => file.status === 'SKIPPED');
  if (skipped) {
    return {
      code: 'file_rejected',
      reason: skipped.error_message ?? 'Gnani skipped the file',
    };
  }

  const failed = files.find((file) => file.status === 'FAILED');
  if (/empty transcript/i.test(failed?.error_message ?? '')) {
    return { code: 'no_speech', reason: failed!.error_message! };
  }
  if (job.status === 'COMPLETED') return null;

  return {
    code: 'transcription_failed',
    reason:
      job.cancel_reason ??
      failed?.error_message ??
      `Gnani job ended ${job.status}`,
  };
}

async function fail(callId: string, failure: Failure): Promise<FinishOutcome> {
  const updated = await createAdminClient()
    .from('calls')
    .update({
      status: 'failed',
      error_code: failure.code,
      error: failure.reason,
    })
    .eq('id', callId)
    .eq('status', 'transcribing')
    .select('id');
  if (updated.error) throw updated.error;
  return updated.data.length > 0 ? 'failed' : 'lost_race';
}

async function handleError(
  call: TranscribingCall,
  err: unknown,
): Promise<FinishOutcome> {
  const gnaniBusy =
    err instanceof GnaniError && (err.status === 429 || err.status >= 500);
  if (!gnaniBusy) {
    console.error(`Finishing the transcription of call ${call.id} failed`, err);
    return fail(call.id, {
      code: 'transcription_failed',
      reason: 'Saving the transcript failed',
    });
  }

  const attempts = call.gnani_attempts + 1;
  if (attempts >= MAX_GNANI_ATTEMPTS) {
    return fail(call.id, {
      code: 'transcription_failed',
      reason: `Gnani answered ${err.status} ${attempts} times`,
    });
  }

  const updated = await createAdminClient()
    .from('calls')
    .update({ gnani_attempts: attempts })
    .eq('id', call.id)
    .eq('status', 'transcribing')
    .eq('gnani_attempts', call.gnani_attempts);
  if (updated.error) throw updated.error;
  return 'pending';
}
