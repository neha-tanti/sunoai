import 'server-only';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { randomUUID } from 'node:crypto';
import { createCallSchema, mimeTypeFor } from '@/lib/call-upload';
import type { SignedInEnv } from './auth';
import { cancelJob } from './gnani';
import { createAdminClient } from './supabase';
import { callIdParam, rejectInvalid } from './validate';

const CALL_COLUMNS =
  'id, title, status, error_code, call_langs, coaching_lang, denoise, detected_lang, duration_seconds, file_size_bytes, mime_type, created_at, checked_at';

export const calls = new Hono<SignedInEnv>()
  .post('/', zValidator('json', createCallSchema, rejectInvalid), async (c) => {
    const body = c.req.valid('json');
    const id = randomUUID();
    const extension = body.file_name.split('.').pop()!.toLowerCase();
    const filePath = `${id}/recording.${extension}`;
    const supabase = createAdminClient();

    const inserted = await supabase.from('calls').insert({
      id,
      title: body.title,
      file_path: filePath,
      file_size_bytes: body.file_size,
      mime_type: mimeTypeFor(body.file_name)!,
      call_langs: body.call_langs,
      coaching_lang: body.coaching_lang,
      denoise: body.denoise,
      created_by: c.get('userId'),
    });
    if (inserted.error) throw inserted.error;

    const signed = await supabase.storage
      .from('calls')
      .createSignedUploadUrl(filePath, { upsert: true });
    if (signed.error) throw signed.error;

    return c.json(
      { id, path: signed.data.path, token: signed.data.token },
      201,
    );
  })
  .get('/:id', zValidator('param', callIdParam, rejectInvalid), async (c) => {
    const { id } = c.req.valid('param');
    const supabase = createAdminClient();
    const [call, segments] = await Promise.all([
      supabase.from('calls').select(CALL_COLUMNS).eq('id', id).maybeSingle(),
      supabase
        .from('transcript_segments')
        .select('segment_id, start_time, end_time, speaker_id, text')
        .eq('call_id', id)
        .order('start_time'),
    ]);
    if (call.error) throw call.error;
    if (segments.error) throw segments.error;
    if (!call.data) throw new HTTPException(404);

    return c.json({ call: call.data, segments: segments.data, report: null });
  })
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
      if (status === 'transcribing' && jobId) {
        await cancelJob(jobId, AbortSignal.timeout(10_000)).catch((err) =>
          console.error(
            `Cancelling Gnani job ${jobId} for call ${id} failed`,
            err,
          ),
        );
      }

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
