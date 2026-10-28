import 'server-only';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { after } from 'next/server';
import { secretMatches } from './env';
import { DEADLINE_MS, finishCall } from './pipeline';
import { createAdminClient } from './supabase';
import { TRANSCRIBING_CALL_COLUMNS } from './transcription';

const STUCK_AFTER_MS = 10_000;
const STOPPED_ANALYSIS_MS = 5 * 60_000;

async function failStoppedAnalyses() {
  const failed = await createAdminClient()
    .from('calls')
    .update({
      status: 'failed',
      error_code: 'analysis_failed',
      error: 'The analysis stopped before it finished',
    })
    .eq('status', 'analyzing')
    .lt('status_at', new Date(Date.now() - STOPPED_ANALYSIS_MS).toISOString())
    .select('id');
  if (failed.error) throw failed.error;
  if (failed.data.length === 0) return;

  const ids = failed.data.map((call) => call.id).join(', ');
  console.warn(`Failed stopped analyses for calls ${ids}`);
}

async function claimPoll(callId: string) {
  const claimed = await createAdminClient().rpc('claim_gnani_poll', {
    p_call_id: callId,
  });
  if (claimed.error) throw claimed.error;
  return claimed.data;
}

async function pollTranscribingCalls(signal: AbortSignal) {
  const due = await createAdminClient()
    .from('calls')
    .select(TRANSCRIBING_CALL_COLUMNS)
    .eq('status', 'transcribing')
    .not('gnani_job_id', 'is', null)
    .lt('status_at', new Date(Date.now() - STUCK_AFTER_MS).toISOString())
    .order('polled_at', { nullsFirst: true })
    .order('status_at');
  if (due.error) throw due.error;

  const outcomes: {
    callId: string;
    outcome: Awaited<ReturnType<typeof finishCall>>;
  }[] = [];
  for (const call of due.data) {
    if (signal.aborted) break;
    if (!(await claimPoll(call.id))) continue;
    const outcome = await finishCall(call, signal);
    outcomes.push({ callId: call.id, outcome });
    if (outcome !== 'pending') break;
  }
  return outcomes;
}

export const jobs = new Hono().post('/poll', (c) => {
  if (!secretMatches('CRON_SECRET', c.req.header('x-cron-secret'))) {
    throw new HTTPException(401);
  }

  const signal = AbortSignal.timeout(DEADLINE_MS);
  after(async () => {
    await failStoppedAnalyses();
    return pollTranscribingCalls(signal);
  });
  return c.json({ status: 'polling' as const }, 202);
});
