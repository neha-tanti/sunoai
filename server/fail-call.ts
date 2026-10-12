import 'server-only';
import type { Enums } from '@/lib/database.types';
import { createAdminClient } from './supabase';

export type Failure = { code: Enums<'call_error_code'>; reason: string };

export async function failCall(
  callId: string,
  from: 'transcribing' | 'analyzing',
  failure: Failure,
) {
  const updated = await createAdminClient()
    .from('calls')
    .update({
      status: 'failed',
      error_code: failure.code,
      error: failure.reason,
    })
    .eq('id', callId)
    .eq('status', from)
    .select('id');
  if (updated.error) throw updated.error;
  return updated.data.length > 0 ? ('failed' as const) : ('lost_race' as const);
}
