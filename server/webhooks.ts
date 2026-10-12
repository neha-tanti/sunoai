import 'server-only';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';
import { after } from 'next/server';
import { z } from 'zod';
import { secretMatches } from './env';
import { createAdminClient } from './supabase';
import {
  DEADLINE_MS,
  finishTranscription,
  TRANSCRIBING_CALL_COLUMNS,
} from './transcription';
import { rejectInvalid } from './validate';

const requireWebhookToken = createMiddleware(async (c, next) => {
  if (!secretMatches('GNANI_WEBHOOK_TOKEN', c.req.query('token'))) {
    throw new HTTPException(401);
  }
  await next();
});

const gnaniEvent = z.object({ job_id: z.string().min(1) });

export const webhooks = new Hono().post(
  '/gnani',
  requireWebhookToken,
  zValidator('json', gnaniEvent, rejectInvalid),
  async (c) => {
    const signal = AbortSignal.timeout(DEADLINE_MS);
    const call = await createAdminClient()
      .from('calls')
      .select(TRANSCRIBING_CALL_COLUMNS)
      .eq('gnani_job_id', c.req.valid('json').job_id)
      .eq('status', 'transcribing')
      .maybeSingle();
    if (call.error) throw call.error;

    const transcribing = call.data;
    if (transcribing) after(() => finishTranscription(transcribing, signal));
    return c.json({ received: true as const });
  },
);
