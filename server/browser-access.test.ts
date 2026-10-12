import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createAdminClient } from './supabase';
import { signInTeamLeader } from './test/session';

describe('a signed-in browser going straight to Supabase', () => {
  const recordingPath = `${randomUUID()}/late-order-call.mp3`;
  const signedUploadPath = `${randomUUID()}/wrong-item-call.mp3`;
  let session: Awaited<ReturnType<typeof signInTeamLeader>>;

  beforeAll(async () => {
    session = await signInTeamLeader();
    const uploaded = await createAdminClient()
      .storage.from('calls')
      .upload(
        recordingPath,
        new Blob(['not really audio'], { type: 'audio/mpeg' }),
      );
    if (uploaded.error) throw uploaded.error;
  });

  afterAll(async () => {
    const removed = await createAdminClient()
      .storage.from('calls')
      .remove([recordingPath, signedUploadPath]);
    await session?.deleteTeamLeader();
    if (removed.error) throw removed.error;
  });

  it('cannot read the checklist', async () => {
    const { error } = await session.supabase
      .from('checklist_checks')
      .select('id');

    expect(error).toMatchObject({ code: '42501' });
  });

  it('cannot write a report', async () => {
    const { error } = await session.supabase.from('reports').insert({
      call_id: randomUUID(),
      score_passed: 6,
      score_total: 6,
    });

    expect(error).toMatchObject({ code: '42501' });
  });

  it('cannot save a transcript', async () => {
    const { error } = await session.supabase.rpc('save_transcript', {
      p_call_id: randomUUID(),
      p_detected_lang: 'hi-IN',
      p_duration_seconds: 42.5,
      p_segments: [],
    });

    expect(error).toMatchObject({ code: '42501' });
  });

  it('cannot download a recording', async () => {
    const { data, error } = await session.supabase.storage
      .from('calls')
      .download(recordingPath);

    expect(data).toBeNull();
    expect(error).not.toBeNull();
  });

  it('cannot upload a recording without a signed upload URL', async () => {
    const { data, error } = await session.supabase.storage
      .from('calls')
      .upload(
        `${randomUUID()}/refund-call.mp3`,
        new Blob(['not really audio'], { type: 'audio/mpeg' }),
      );

    expect(data).toBeNull();
    expect(error).not.toBeNull();
  });

  it('can upload a recording with a signed upload URL', async () => {
    const signed = await createAdminClient()
      .storage.from('calls')
      .createSignedUploadUrl(signedUploadPath);
    if (signed.error) throw signed.error;

    const { error } = await session.supabase.storage
      .from('calls')
      .uploadToSignedUrl(
        signedUploadPath,
        signed.data.token,
        new Blob(['not really audio'], { type: 'audio/mpeg' }),
      );

    expect(error).toBeNull();
  });
});
