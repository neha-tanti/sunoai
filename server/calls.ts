import 'server-only';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { after } from 'next/server';
import { randomUUID } from 'node:crypto';
import { createCallSchema } from '@/lib/call-upload';
import { HANDOVER_CHECK_ID } from '@/lib/checklist';
import { checkExampleSchema, exampleCall } from '@/lib/examples';
import { analyzeCall } from './analysis';
import type { SignedInEnv } from './auth';
import type { Checklist } from './checklist';
import { coachingAudioPath, coachingAudioUrl } from './coaching';
import { requireEnv } from './env';
import { ApiError, loggableError } from './errors';
import { GNANI_REQUEST_MS, cancelJob, createJob, startJob } from './gnani';
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
type SavedReport = Pick<Report, ReportJsonColumn> & {
  checklist_snapshot: Checklist;
};

const RECENT_CALLS = 10;
const RECORDING_URL_SECONDS = 2 * 60 * 60;
const DAY_MS = 24 * 60 * 60 * 1000;
export const DAILY_CALL_LIMIT = 30;

const alreadyChecked = () =>
  new ApiError(409, 'already_checked', 'This call has already been checked.');

async function refuseOverDailyLimit() {
  const checked = await createAdminClient()
    .from('calls')
    .select('id', { count: 'exact', head: true })
    .gte('checked_at', new Date(Date.now() - DAY_MS).toISOString());
  if (checked.error) throw checked.error;
  if ((checked.count ?? 0) < DAILY_CALL_LIMIT) return;

  throw new ApiError(
    429,
    'daily_limit',
    `SunoAI has checked its ${DAILY_CALL_LIMIT} calls for today. Try again tomorrow.`,
  );
}

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

async function readReport(
  supabase: ReturnType<typeof createAdminClient>,
  callId: string,
) {
  const saved = await supabase
    .from('reports')
    .select(REPORT_COLUMNS)
    .eq('call_id', callId)
    .maybeSingle()
    .overrideTypes<SavedReport>();
  if (saved.error) throw saved.error;
  if (!saved.data) return null;

  const { checklist_snapshot: snapshot, ...report } = saved.data;
  const checkById = new Map(snapshot.checks.map((check) => [check.id, check]));
  const flagById = new Map(snapshot.red_flags.map((flag) => [flag.id, flag]));

  const checks = report.checks.map((check) => {
    const known = checkById.get(check.check_id);
    if (!known)
      throw new Error(`Check ${check.check_id} is not in the snapshot`);
    return { ...check, name: known.name, rule: known.rule };
  });
  const redFlags = report.red_flags.map((flag) => {
    const known = flagById.get(flag.flag_id);
    if (!known) throw new Error(`Flag ${flag.flag_id} is not in the snapshot`);
    return { ...flag, name: known.name };
  });

  return {
    ...report,
    checks,
    red_flags: redFlags,
    handover_check:
      checks.find((check) => check.check_id === HANDOVER_CHECK_ID) ?? null,
  };
}

async function recentCalls() {
  const recent = await createAdminClient()
    .from('calls')
    .select(
      'id, title, status, error_code, created_at, report:reports(score_passed, score_total, needs_review, frustration_peak)',
    )
    .not('checked_at', 'is', null)
    .order('created_at', { ascending: false })
    .limit(RECENT_CALLS);
  if (recent.error) throw recent.error;

  return { calls: recent.data, average: teamAverage(recent.data) };
}

type ScoredCall = {
  report: { score_passed: number; score_total: number } | null;
};

function teamAverage(calls: ScoredCall[]) {
  const ratios = calls.flatMap(({ report }) =>
    report && report.score_total > 0
      ? [report.score_passed / report.score_total]
      : [],
  );
  if (ratios.length === 0) return null;

  const mean = ratios.reduce((sum, ratio) => sum + ratio, 0) / ratios.length;
  return { percent: Math.round(mean * 100), calls: ratios.length };
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
    await refuseOverDailyLimit();
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
  .post(
    '/examples',
    zValidator('json', checkExampleSchema, rejectInvalid),
    async (c) => {
      await refuseOverDailyLimit();
      const example = exampleCall(c.req.valid('json').example);
      const id = randomUUID();
      const filePath = `${id}/recording.wav`;
      const supabase = createAdminClient();
      const examples = supabase.storage.from('examples');

      const file = await examples.info(`${example.id}.wav`);
      if (file.error) throw file.error;
      const copied = await examples.copy(`${example.id}.wav`, filePath, {
        destinationBucket: 'calls',
      });
      if (copied.error) throw copied.error;

      const inserted = await supabase.from('calls').insert({
        id,
        title: example.title,
        file_path: filePath,
        file_size_bytes: file.data.size ?? 0,
        mime_type: 'audio/wav',
        call_langs: ['hi-IN', 'en-IN'],
        coaching_lang: 'hi-IN',
        created_by: c.get('userId'),
      });
      if (inserted.error) throw inserted.error;

      await startCheck(id);
      return c.json({ id }, 201);
    },
  )
  .get('/', async (c) => c.json(await recentCalls()))
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
      readReport(supabase, id),
    ]);
    if (segments.error) throw segments.error;

    return c.json({
      call: call.data,
      segments: segments.data,
      report,
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
  .post(
    '/:id/coaching-audio',
    zValidator('param', callIdParam, rejectInvalid),
    async (c) => {
      const url = await coachingAudioUrl(c.req.valid('param').id);
      return c.json({ url });
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

      const recording = await supabase.storage.from('calls').remove([filePath]);
      if (recording.error) throw recording.error;

      const deleted = await supabase.from('calls').delete().eq('id', id);
      if (deleted.error) throw deleted.error;

      const coaching = await supabase.storage
        .from('coaching')
        .remove([coachingAudioPath(id)]);
      if (coaching.error) {
        console.error(
          `Removing the coaching audio of deleted call ${id} failed: ${loggableError(coaching.error)}`,
        );
      }

      return c.body(null, 204);
    },
  );
