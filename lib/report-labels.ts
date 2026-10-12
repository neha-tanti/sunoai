import type { ReportDetail } from '@/hooks/use-call';
import type { Enums } from '@/lib/database.types';
import type { ScoreBand } from '@/lib/score-band';

type Mood = Enums<'mood'>;
type Speaker = ReportDetail['speakers'][number];

export const MOOD_LABEL: Record<Mood, string> = {
  calm: 'Calm',
  annoyed: 'Annoyed',
  angry: 'Angry',
};

export const MOOD_CLASS: Record<Mood, string> = {
  calm: 'bg-calm text-calm-foreground',
  annoyed: 'bg-annoyed text-annoyed-foreground',
  angry: 'bg-angry text-angry-foreground',
};

export const SCORE_BAND_LABEL: Record<ScoreBand, string> = {
  good: 'Good',
  needs_work: 'Needs work',
  poor: 'Poor',
};

export const SCORE_BAND_CLASS: Record<ScoreBand, string> = {
  good: MOOD_CLASS.calm,
  needs_work: MOOD_CLASS.annoyed,
  poor: MOOD_CLASS.angry,
};

export const RESULT_LABEL = {
  pass: 'Passed',
  miss: 'Missed',
  na: 'Not needed',
} as const;

export const RESULT_CLASS = {
  pass: MOOD_CLASS.calm,
  miss: MOOD_CLASS.angry,
  na: 'bg-secondary text-secondary-foreground',
} as const;

export function formatTime(seconds: number) {
  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}

export function findSpeaker(speakers: Speaker[], speakerId: number) {
  return speakers.find((speaker) => speaker.speaker_id === speakerId);
}

export function speakerLabel(speakers: Speaker[], speakerId: number) {
  const speaker = findSpeaker(speakers, speakerId);
  if (speaker?.role === 'ai_agent') return 'AI agent';
  if (speaker?.role === 'customer') return 'Customer';
  if (speaker?.role === 'human_agent') {
    return speaker.name ? `${speaker.name} (human)` : 'Human agent';
  }
  return `Speaker ${speakerId}`;
}
