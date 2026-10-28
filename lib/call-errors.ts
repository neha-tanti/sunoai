import type { Enums } from '@/lib/database.types';

export const CALL_ERROR_MESSAGES: Record<Enums<'call_error_code'>, string> = {
  file_rejected: "Gnani couldn't read this file. Try an MP3 or WAV.",
  gnani_failed:
    "Gnani couldn't transcribe this call. The problem is on Gnani's side, so try again in a few minutes.",
  transcription_failed: "Couldn't save the transcript. Try again.",
  no_speech: 'No speech found. Check the call language.',
  too_long:
    'This call is longer than 30 minutes. Split it and check each part.',
  analysis_failed: 'Analysis failed.',
};
