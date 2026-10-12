import { randomUUID } from 'node:crypto';
import type { TablesInsert } from '@/lib/database.types';
import { coachingAudioPath } from '../coaching';
import { parseGnaniTranscript } from '../gnani';
import { createAdminClient } from '../supabase';
import { hinglishTranscript } from './gnani-stub';

export async function insertCall(
  overrides: Partial<TablesInsert<'calls'>> = {},
) {
  const id = overrides.id ?? randomUUID();
  const inserted = await createAdminClient()
    .from('calls')
    .insert({
      id,
      title: 'Late biryani order, customer asks for a person',
      file_path: `${id}/recording.mp3`,
      file_size_bytes: 480_000,
      mime_type: 'audio/mpeg',
      call_langs: ['hi-IN', 'en-IN'],
      coaching_lang: 'hi-IN',
      ...overrides,
    })
    .select()
    .single();
  if (inserted.error) throw inserted.error;
  return inserted.data;
}

export async function insertAnalyzingCall(
  overrides: Partial<TablesInsert<'calls'>> = {},
) {
  const transcript = parseGnaniTranscript(hinglishTranscript());
  const call = await insertCall({
    status: 'analyzing',
    detected_lang: transcript.language,
    duration_seconds: transcript.durationSeconds,
    ...overrides,
  });
  const inserted = await createAdminClient()
    .from('transcript_segments')
    .insert(
      transcript.segments.map((segment) => ({ ...segment, call_id: call.id })),
    );
  if (inserted.error) throw inserted.error;
  return call;
}

export async function readReport(callId: string) {
  const report = await createAdminClient()
    .from('reports')
    .select()
    .eq('call_id', callId)
    .maybeSingle();
  if (report.error) throw report.error;
  return report.data;
}

export async function uploadRecording(filePath: string) {
  const uploaded = await createAdminClient()
    .storage.from('calls')
    .upload(filePath, new Blob(['not really audio'], { type: 'audio/mpeg' }));
  if (uploaded.error) throw uploaded.error;
}

export async function readCall(id: string) {
  const supabase = createAdminClient();
  const [call, segments] = await Promise.all([
    supabase.from('calls').select().eq('id', id).maybeSingle(),
    supabase
      .from('transcript_segments')
      .select()
      .eq('call_id', id)
      .order('segment_id'),
  ]);
  if (call.error) throw call.error;
  if (segments.error) throw segments.error;
  return { call: call.data, segments: segments.data };
}

export async function deleteCalls(ids: string[]) {
  if (ids.length === 0) return;
  const supabase = createAdminClient();
  const rows = await supabase.from('calls').select('file_path').in('id', ids);
  if (rows.error) throw rows.error;
  if (rows.data.length === 0) return;

  const [recordings, coaching] = await Promise.all([
    supabase.storage
      .from('calls')
      .remove(rows.data.map((row) => row.file_path)),
    supabase.storage.from('coaching').remove(ids.map(coachingAudioPath)),
  ]);
  if (recordings.error) throw recordings.error;
  if (coaching.error) throw coaching.error;
  const deleted = await supabase.from('calls').delete().in('id', ids);
  if (deleted.error) throw deleted.error;
}
