import 'server-only';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { after } from 'next/server';
import { randomUUID } from 'node:crypto';
import { createCallSchema } from '@/lib/call-upload';
import type { Tables } from '@/lib/database.types';
import { analyzeCall } from './analysis';
import type { SignedInEnv } from './auth';
import type { Checklist } from './checklist';
import { requireEnv } from './env';
import { ApiError, loggableError } from './errors';
import { cancelJob, createJob, startJob } from './gnani';
import { DEADLINE_MS } from './pipeline';
import type { Report } from './report';
import { createAdminClient } from './supabase';
import { callIdParam, rejectInvalid } from './validate';

const CALL_COLUMNS =
  'id, title, status, error_code, call_langs, coaching_lang, denoise, detected_lang, duration_seconds, file_size_bytes, mime_type, created_at, checked_at';
const REPORT_COLUMNS =
  'score_passed, score_total, needs_review, frustration_peak, frustration, speakers, handover_segment_id, checks, red_flags, fix_notes, summary, coaching, llm_model, prompt_version, checklist_snapshot, created_at';

type ReportJsonColumn =
  | 'frustration'
  | 'speakers'
  | 'checks'
  | 'red_flags'
  | 'fix_notes'
  | 'coaching';
type SavedReport = Omit<
  Tables<'reports'>,
  ReportJsonColumn | 'checklist_snapshot' | 'call_id' | 'coaching_audio_path'
> &
  Pick<Report, ReportJsonColumn> & { checklist_snapshot: Checklist };

const GNANI_REQUEST_MS = 20_000;
const RECORDING_URL_SECONDS = 2 * 60 * 60;

const alreadyChecked = () =>
  new ApiError(409, 'already_checked', 'This call has already been checked.');

function webhookUrl() {
  const url = new URL('/api/webhooks/gnani', requireEnv('APP_URL'));
  url.searchParams.set('token', requireEnv('GNANI_WEBHOOK_TOKEN'));
  return url.toString();
}

async function createAndStartJob(
  callId: string,
  options: Parameters<typeof createJob>[0],
) {
  const signal = AbortSignal.timeout(GNANI_REQUEST_MS);
  let jobId: string | undefined;
  try {
    jobId = await createJob(options, signal);
    await startJob(jobId, signal);
    return jobId;
  } catch (err) {
    console.error(
      `Starting the Gnani job for call ${callId} failed: ${loggableError(err)}`,
    );
    if (jobId) await cancelOrLog(callId, jobId);
    throw new ApiError(
      503,
      'gnani_unavailable',
      "Couldn't start the check. Try again in a minute.",
    );
  }
}

async function cancelOrLog(callId: string, jobId: string) {
  await cancelJob(jobId, AbortSignal.timeout(GNANI_REQUEST_MS)).catch((err) =>
    console.error(
      `Cancelling Gnani job ${jobId} for call ${callId} failed: ${loggableError(err)}`,
    ),
  );
}

function namedReport(saved: SavedReport) {
  const { checklist_snapshot: snapshot, ...report } = saved;
  const checkById = new Map(snapshot.checks.map((check) => [check.id, check]));
  const flagById = new Map(snapshot.red_flags.map((flag) => [flag.id, flag]));

  return {
    ...report,
    checks: report.checks.map((check) => {
      const known = checkById.get(check.check_id);
      return {
        ...check,
        name: known?.name ?? check.check_id,
        rule: known?.rule ?? '',
      };
    }),
    red_flags: report.red_flags.map((flag) => ({
      ...flag,
      name: flagById.get(flag.flag_id)?.name ?? flag.flag_id,
    })),
  };
}

async function startCheck(id: string) {
  const supabase = createAdminClient();
  const call = await supabase
    .from('calls')
    .select('status, file_path, call_langs, denoise')
    .eq('id', id)
    .maybeSingle();
  if (call.error) throw call.error;
  if (!call.data) throw new HTTPException(404);
  if (call.data.status !== 'uploaded') throw alreadyChecked();

  const recordings = supabase.storage.from('calls');
  const exists = await recordings.exists(call.data.file_path);
  if (!exists.data) {
    throw new ApiError(
      409,
      'file_missing',
      "The recording didn't finish uploading. Upload it again.",
    );
  }
  const signed = await recordings.createSignedUrl(
    call.data.file_path,
    RECORDING_URL_SECONDS,
  );
  if (signed.error) throw signed.error;

  const jobId = await createAndStartJob(id, {
    callLangs: call.data.call_langs,
    denoise: call.data.denoise,
    fileUrl: signed.data.signedUrl,
    callbackUrl: webhookUrl(),
  });

  const updated = await supabase
    .from('calls')
    .update({
      status: 'transcribing',
      gnani_job_id: jobId,
      checked_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('status', 'uploaded')
    .select('id');
  if (updated.error) {
    await cancelOrLog(id, jobId);
    throw updated.error;
  }
  if (updated.data.length > 0) return;

  await cancelOrLog(id, jobId);
  const stillThere = await supabase
    .from('calls')
    .select('id')
    .eq('id', id)
    .maybeSingle();
  if (stillThere.error) throw stillThere.error;
  if (!stillThere.data) throw new HTTPException(404);
  throw alreadyChecked();
}

async function reopenFailedAnalysis(id: string) {
  const supabase = createAdminClient();
  const updated = await supabase
    .from('calls')
    .update({ status: 'analyzing', error_code: null, error: null })
    .eq('id', id)
    .eq('status', 'failed')
    .eq('error_code', 'analysis_failed')
    .select('id');
  if (updated.error) throw updated.error;
  if (updated.data.length > 0) return;

  const call = await supabase
    .from('calls')
    .select('id')
    .eq('id', id)
    .maybeSingle();
  if (call.error) throw call.error;
  if (!call.data) throw new HTTPException(404);
  throw new ApiError(
    409,
    'not_retryable',
    'Only a call whose analysis failed can be checked again.',
  );
}

export const calls = new Hono<SignedInEnv>()
  .post('/', zValidator('json', createCallSchema, rejectInvalid), async (c) => {
    const body = c.req.valid('json');
    const id = randomUUID();
    const filePath = `${id}/recording.${body.extension}`;
    const supabase = createAdminClient();

    const signed = await supabase.storage
      .from('calls')
      .createSignedUploadUrl(filePath, { upsert: true });
    if (signed.error) throw signed.error;

    const inserted = await supabase.from('calls').insert({
      id,
      title: body.title,
      file_path: filePath,
      file_size_bytes: body.file_size,
      mime_type: body.mime_type,
      call_langs: body.call_langs,
      coaching_lang: body.coaching_lang,
      denoise: body.denoise,
      created_by: c.get('userId'),
    });
    if (inserted.error) throw inserted.error;

    return c.json(
      { id, path: signed.data.path, token: signed.data.token },
      201,
    );
  })
  .get('/:id', zValidator('param', callIdParam, rejectInvalid), async (c) => {
    const { id } = c.req.valid('param');
    const supabase = createAdminClient();
    const call = await supabase
      .from('calls')
      .select(CALL_COLUMNS)
      .eq('id', id)
      .maybeSingle();
    if (call.error) throw call.error;
    if (!call.data) throw new HTTPException(404);

    const [segments, report] = await Promise.all([
      supabase
        .from('transcript_segments')
        .select('segment_id, start_time, end_time, speaker_id, text')
        .eq('call_id', id)
        .order('start_time'),
      supabase
        .from('reports')
        .select(REPORT_COLUMNS)
        .eq('call_id', id)
        .maybeSingle()
        .overrideTypes<SavedReport, { merge: false }>(),
    ]);
    if (segments.error) throw segments.error;
    if (report.error) throw report.error;

    return c.json({
      call: call.data,
      segments: segments.data,
      report: report.data && namedReport(report.data),
    });
  })
  .post(
    '/:id/check',
    zValidator('param', callIdParam, rejectInvalid),
    async (c) => {
      await startCheck(c.req.valid('param').id);
      return c.json({ status: 'transcribing' as const });
    },
  )
  .post(
    '/:id/analyze',
    zValidator('param', callIdParam, rejectInvalid),
    async (c) => {
      const { id } = c.req.valid('param');
      await reopenFailedAnalysis(id);

      const signal = AbortSignal.timeout(DEADLINE_MS);
      after(() => analyzeCall(id, signal));
      return c.json({ status: 'analyzing' as const }, 202);
    },
  )
  .delete(
    '/:id',
    zValidator('param', callIdParam, rejectInvalid),
    async (c) => {
      const { id } = c.req.valid('param');
      const supabase = createAdminClient();
      const call = await supabase
        .from('calls')
        .select('status, gnani_job_id, file_path')
        .eq('id', id)
        .maybeSingle();
      if (call.error) throw call.error;
      if (!call.data) throw new HTTPException(404);

      const { status, gnani_job_id: jobId, file_path: filePath } = call.data;
      if (status === 'transcribing' && jobId) await cancelOrLog(id, jobId);

      const [recording, coaching] = await Promise.all([
        supabase.storage.from('calls').remove([filePath]),
        supabase.storage.from('coaching').remove([`${id}.wav`]),
      ]);
      if (recording.error) throw recording.error;
      if (coaching.error) throw coaching.error;

      const deleted = await supabase.from('calls').delete().eq('id', id);
      if (deleted.error) throw deleted.error;

      return c.body(null, 204);
    },
  );
