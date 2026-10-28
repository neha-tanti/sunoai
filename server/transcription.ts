import 'server-only';
import { MAX_CALL_SECONDS } from '@/lib/call-upload';
import type { Tables } from '@/lib/database.types';
import {
  downloadTranscript,
  FINAL_JOB_STATUSES,
  getJob,
  GnaniError,
  listFiles,
} from './gnani';
import { loggableError } from './errors';
import { failCall, type Failure } from './fail-call';
import { createAdminClient } from './supabase';

const MAX_BUSY_MS = 30 * 60 * 1000;
const MAX_TRANSCRIBING_MS = 2 * 60 * 60 * 1000;

export const TRANSCRIBING_CALL_COLUMNS = 'id, gnani_job_id, checked_at';

export type TranscribingCall = Pick<
  Tables<'calls'>,
  'id' | 'gnani_job_id' | 'checked_at'
>;

export type FinishOutcome =
  'pending' | 'gnani_busy' | 'analyzing' | 'failed' | 'lost_race';

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
    if (!checkedOver(call, MAX_TRANSCRIBING_MS)) return 'pending';
    return fail(call.id, {
      code: 'gnani_failed',
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
      code: 'gnani_failed',
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
    p_duration_seconds: transcript.durationSeconds,
    p_segments: transcript.segments,
  });
  if (saved.error) throw saved.error;
  return saved.data ? 'analyzing' : 'lost_race';
}

function checkedOver(call: TranscribingCall, ms: number) {
  if (!call.checked_at) return false;
  return Date.now() - Date.parse(call.checked_at) > ms;
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

  const failedMessage = files.find(
    (file) => file.status === 'FAILED',
  )?.error_message;
  if (failedMessage && /empty transcript/i.test(failedMessage)) {
    return { code: 'no_speech', reason: failedMessage };
  }
  if (job.status === 'COMPLETED') return null;

  return {
    code: 'gnani_failed',
    reason:
      job.cancel_reason ?? failedMessage ?? `Gnani job ended ${job.status}`,
  };
}

function fail(callId: string, failure: Failure) {
  return failCall(callId, 'transcribing', failure);
}

async function handleError(
  call: TranscribingCall,
  err: unknown,
): Promise<FinishOutcome> {
  if (!(err instanceof GnaniError)) {
    logFailure(call, err);
    return fail(call.id, {
      code: 'transcription_failed',
      reason:
        err instanceof Error ? err.message : 'Saving the transcript failed',
    });
  }

  const busy = err.status === null || err.status === 429 || err.status >= 500;
  if (!busy) {
    logFailure(call, err);
    return fail(call.id, { code: 'gnani_failed', reason: err.message });
  }

  if (!checkedOver(call, MAX_BUSY_MS)) return 'gnani_busy';
  return fail(call.id, {
    code: 'gnani_failed',
    reason: `Gnani answered ${err.status ?? 'nothing'} 30 minutes after the check`,
  });
}

function logFailure(call: TranscribingCall, err: unknown) {
  console.error(
    `Finishing the transcription of call ${call.id} failed: ${loggableError(err)}`,
  );
}
