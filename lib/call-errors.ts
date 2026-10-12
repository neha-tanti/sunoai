import type { Enums } from '@/lib/database.types';

export const CALL_ERROR_MESSAGES: Record<Enums<'call_error_code'>, string> = {
  file_rejected: "Gnani couldn't read this file. Try an MP3 or WAV.",
  transcription_failed: 'Transcription failed.',
  no_speech: 'No speech found. Check the call language.',
  too_long:
    'This call is longer than 30 minutes. Split it and check each part.',
  analysis_failed: 'Analysis failed.',
  daily_limit: "Today's check limit is reached. Checking resumes at 5:30 am.",
};
