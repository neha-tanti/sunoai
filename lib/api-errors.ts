export type ErrorCode =
  | 'invalid_request'
  | 'unauthorized'
  | 'not_found'
  | 'too_large'
  | 'request_failed'
  | 'already_checked'
  | 'file_missing'
  | 'gnani_unavailable'
  | 'not_retryable'
  | 'not_ready'
  | 'checklist_changed'
  | 'no_coaching'
  | 'coaching_audio_failed'
  | 'internal_error';

export async function apiError(res: { json(): Promise<unknown> }) {
  const body = (await res.json().catch(() => null)) as {
    error?: { code?: ErrorCode; message?: string };
  } | null;
  return {
    code: body?.error?.code,
    message:
      body?.error?.message ?? 'Something went wrong. Try again in a minute.',
  };
}
