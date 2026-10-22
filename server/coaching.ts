import 'server-only';
import { HTTPException } from 'hono/http-exception';
import type { CoachingLanguageCode } from '@/lib/call-upload';
import { ApiError, loggableError } from './errors';
import { GNANI_REQUEST_MS, synthesizeSpeech } from './gnani';
import type { Report } from './report';
import { createAdminClient } from './supabase';

const COACHING_URL_SECONDS = 10 * 60;

const TIMBRE_VOICES = {
  'hi-IN': 'Nalini',
  'hi-en': 'Poorvi',
  'en-IN': 'Kaveri',
  'bn-IN': 'Kirra',
  'mr-IN': 'Zahira',
  'ta-IN': 'Asmita',
  'te-IN': 'Suhana',
  'kn-IN': 'Saanvi',
  'ml-IN': 'Reshma',
  'gu-IN': 'Falak',
  'pa-IN': 'Mehuli',
} satisfies Record<CoachingLanguageCode, string>;

const VOICE_BY_LANGUAGE = new Map<string, string>(
  Object.entries(TIMBRE_VOICES),
);

export const coachingAudioPath = (callId: string) => `${callId}.wav`;

type CoachingSource = {
  coaching_lang: string;
  reports: {
    coaching: Report['coaching'];
    handover_segment_id: number | null;
    coaching_audio_path: string | null;
  } | null;
};

export async function coachingAudioUrl(id: string) {
  const supabase = createAdminClient();
  const call = await supabase
    .from('calls')
    .select(
      'coaching_lang, reports(coaching, handover_segment_id, coaching_audio_path)',
    )
    .eq('id', id)
    .maybeSingle()
    .overrideTypes<CoachingSource>();
  if (call.error) throw call.error;
  if (!call.data) throw new HTTPException(404);

  const report = call.data.reports;
  if (!report) {
    throw new ApiError(
      409,
      'not_ready',
      "This call hasn't finished checking yet.",
    );
  }
  if (!report.coaching) {
    throw new ApiError(
      409,
      'no_coaching',
      report.handover_segment_id === null
        ? 'This call has no coaching because no human agent took part.'
        : "Coaching couldn't be written for this call.",
    );
  }

  const path =
    report.coaching_audio_path ??
    (await createCoachingAudio(
      id,
      report.coaching.text,
      call.data.coaching_lang,
    ));

  const signed = await supabase.storage
    .from('coaching')
    .createSignedUrl(path, COACHING_URL_SECONDS);
  if (signed.error) throw signed.error;
  return signed.data.signedUrl;
}

async function createCoachingAudio(
  id: string,
  text: string,
  coachingLang: string,
) {
  const voice = VOICE_BY_LANGUAGE.get(coachingLang);
  if (!voice) throw new Error(`No Timbre voice for ${coachingLang}`);

  const speaker = { language: coachingLang, voice };
  const reportExists = await saveCoachingAudio(id, text, speaker).catch(
    (err) => {
      console.error(
        `Creating the coaching audio for call ${id} failed: ${loggableError(err)}`,
      );
      throw new ApiError(
        503,
        'coaching_audio_failed',
        "Couldn't create the coaching audio. Try again.",
      );
    },
  );
  if (reportExists) return coachingAudioPath(id);

  const removed = await createAdminClient()
    .storage.from('coaching')
    .remove([coachingAudioPath(id)]);
  if (removed.error) throw removed.error;
  throw new HTTPException(404);
}

async function saveCoachingAudio(
  id: string,
  text: string,
  speaker: { language: string; voice: string },
) {
  const audio = await synthesizeSpeech(
    text,
    speaker,
    AbortSignal.timeout(GNANI_REQUEST_MS),
  );

  const supabase = createAdminClient();
  const path = coachingAudioPath(id);
  const uploaded = await supabase.storage
    .from('coaching')
    .upload(path, audio, { contentType: 'audio/wav', upsert: true });
  if (uploaded.error) throw uploaded.error;

  const updated = await supabase
    .from('reports')
    .update({ coaching_audio_path: path })
    .eq('call_id', id)
    .select('call_id');
  if (updated.error) throw updated.error;
  return updated.data.length > 0;
}
