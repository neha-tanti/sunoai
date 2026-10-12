import 'server-only';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { after } from 'next/server';
import { secretMatches } from './env';
import { createAdminClient } from './supabase';
import {
  DEADLINE_MS,
  finishTranscription,
  type FinishOutcome,
  TRANSCRIBING_CALL_COLUMNS,
} from './transcription';

const STUCK_AFTER_MS = 60_000;

async function pollTranscribingCalls(signal: AbortSignal) {
  const due = await createAdminClient()
    .from('calls')
    .select(TRANSCRIBING_CALL_COLUMNS)
    .eq('status', 'transcribing')
    .not('gnani_job_id', 'is', null)
    .lt('status_at', new Date(Date.now() - STUCK_AFTER_MS).toISOString())
    .order('status_at');
  if (due.error) throw due.error;

  const outcomes: { callId: string; outcome: FinishOutcome }[] = [];
  for (const call of due.data) {
    if (signal.aborted) break;
    const outcome = await finishTranscription(call, signal);
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
  after(() => pollTranscribingCalls(signal));
  return c.json({ status: 'polling' as const }, 202);
});
