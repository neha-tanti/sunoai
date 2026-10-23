import 'server-only';
import type { CoachingLanguage } from '@/lib/call-upload';
import { HANDOVER_CHECK_ID } from '@/lib/checklist';
import type { Checklist } from './checklist';
import type { TranscriptSegment } from './gnani';
import { type LlmAnswer, type Mood, moodSchema } from './prompts/analyze';

type AnswerCheck = LlmAnswer['checks'][number];
type Evidence = { segment_id: number; time: number; quote: string };
type EvidenceFor = (
  segmentId: number | null,
  quote: string | null,
) => Evidence | null;

const MOODS = moodSchema.options;

export type Report = ReturnType<typeof buildReport>['report'];

export function normalize(text: string) {
  return text
    .normalize('NFC')
    .toLowerCase()
    .replace(/\p{Cf}/gu, '')
    .replace(/[\p{P}\p{S}]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function quoteFound(segmentText: string, quote: string | null) {
  if (!quote) return false;
  const wanted = normalize(quote);
  if (wanted === '') return false;
  return ` ${normalize(segmentText)} `.includes(` ${wanted} `);
}

export function buildReport(input: {
  answer: LlmAnswer;
  segments: TranscriptSegment[];
  checklist: Checklist;
  durationSeconds: number;
  coachingLanguage: CoachingLanguage;
}) {
  const { answer, segments, checklist } = input;
  const segmentById = new Map(segments.map((s) => [s.segment_id, s]));
  const evidenceFor: EvidenceFor = (segmentId, quote) => {
    const segment = segmentId === null ? undefined : segmentById.get(segmentId);
    if (!segment || !quote || !quoteFound(segment.text, quote)) return null;
    return { segment_id: segment.segment_id, time: segment.start_time, quote };
  };

  const speakers = knownSpeakers(answer.speakers, segments);
  const roleOf = new Map(speakers.map((s) => [s.speaker_id, s.role]));
  const handover =
    segments.find((s) => roleOf.get(s.speaker_id) === 'human_agent') ?? null;

  const answers = new Map<string, AnswerCheck>();
  for (const check of answer.checks) {
    if (!answers.has(check.check_id)) answers.set(check.check_id, check);
  }
  const checks = checklist.checks.map((check) =>
    check.id === HANDOVER_CHECK_ID && !handover
      ? noHandoverCheck()
      : checkResult(check.id, answers.get(check.id), evidenceFor),
  );

  const flagIds = new Set(checklist.red_flags.map((flag) => flag.id));
  const knownFlags = answer.red_flags.filter((flag) =>
    flagIds.has(flag.flag_id),
  );
  const redFlags = knownFlags.flatMap((flag) => {
    const evidence = evidenceFor(flag.segment_id, flag.quote);
    if (!evidence) return [];
    return [{ flag_id: flag.flag_id, ...evidence, note: flag.note }];
  });

  const customerSegments = segments.filter(
    (s) => roleOf.get(s.speaker_id) === 'customer',
  );
  const callEnd = Math.max(
    input.durationSeconds,
    ...segments.map((s) => s.end_time),
  );
  const frustration = buildFrustration(
    customerSegments,
    answer.customer_mood,
    callEnd,
  );

  const fixNotes = answer.fix_notes.flatMap((note) => {
    const segment = segmentById.get(note.segment_id);
    if (!segment) return [];
    return [{ ...note, time: segment.start_time }];
  });

  const coaching = handover
    ? checkCoaching(
        answer.coaching,
        segmentById,
        roleOf,
        input.coachingLanguage.script,
      )
    : { kept: null, dropped: null };

  return {
    report: {
      score_passed: checks.filter((c) => c.result === 'pass').length,
      score_total: checks.filter((c) => c.result !== 'na').length,
      needs_review: redFlags.length > 0,
      frustration_peak: frustration.peak,
      frustration: { ranges: frustration.ranges, turn: frustration.turn },
      speakers,
      handover_segment_id: handover?.segment_id ?? null,
      checks,
      red_flags: redFlags,
      fix_notes: fixNotes,
      summary: answer.summary,
      coaching: coaching.kept,
    },
    rejected: {
      passes: checks.filter(
        (c) =>
          c.result === 'miss' && answers.get(c.check_id)?.result === 'pass',
      ).length,
      red_flags: knownFlags.length - redFlags.length,
      coaching: coaching.dropped,
    },
  };
}

function inCoachingScript(text: string, script: CoachingLanguage['script']) {
  const allowed = new RegExp(`[\\p{Script=Latin}\\p{Script=${script}}]`, 'u');
  return (text.match(/\p{L}/gu) ?? []).every((letter) => allowed.test(letter));
}

function checkCoaching(
  coaching: LlmAnswer['coaching'],
  segmentById: Map<number, TranscriptSegment>,
  roleOf: Map<number, LlmAnswer['speakers'][number]['role']>,
  script: CoachingLanguage['script'],
) {
  if (!coaching) return { kept: null, dropped: null };
  if (!inCoachingScript(coaching.text, script)) {
    return { kept: null, dropped: 'coaching in another script' };
  }

  const segment = segmentById.get(coaching.segment_id);
  const humanAgentLine =
    segment !== undefined &&
    roleOf.get(segment.speaker_id) === 'human_agent' &&
    quoteFound(segment.text, coaching.quote);
  if (!humanAgentLine) {
    return { kept: null, dropped: 'coaching without a human agent quote' };
  }

  return {
    kept: {
      text: coaching.text,
      english: coaching.english,
      segment_id: segment.segment_id,
      time: segment.start_time,
      quote: coaching.quote,
    },
    dropped: null,
  };
}

function noHandoverCheck() {
  return {
    check_id: HANDOVER_CHECK_ID,
    result: 'na' as const,
    segment_id: null,
    time: null,
    quote: null,
    reason: 'The call never reached a human agent.',
  };
}

function checkResult(
  checkId: string,
  answer: AnswerCheck | undefined,
  evidenceFor: EvidenceFor,
) {
  if (!answer) {
    return {
      check_id: checkId,
      result: 'miss' as const,
      segment_id: null,
      time: null,
      quote: null,
      reason: 'The analysis gave no result for this check.',
    };
  }

  const evidence = evidenceFor(answer.segment_id, answer.quote);
  const downgraded = answer.result === 'pass' && !evidence;
  return {
    check_id: checkId,
    result: downgraded ? ('miss' as const) : answer.result,
    segment_id: evidence?.segment_id ?? null,
    time: evidence?.time ?? null,
    quote: evidence?.quote ?? null,
    reason: downgraded
      ? 'Marked as passed, but its quote was not found in the transcript.'
      : answer.reason,
  };
}

function knownSpeakers(
  speakers: LlmAnswer['speakers'],
  segments: TranscriptSegment[],
) {
  const spoken = new Set(segments.map((s) => s.speaker_id));
  const seen = new Set<number>();
  return speakers.filter((speaker) => {
    if (!spoken.has(speaker.speaker_id) || seen.has(speaker.speaker_id)) {
      return false;
    }
    seen.add(speaker.speaker_id);
    return true;
  });
}

type MoodRange = { start: number; end: number; level: Mood };

function buildFrustration(
  customerSegments: TranscriptSegment[],
  moods: LlmAnswer['customer_mood'],
  callEnd: number,
) {
  const moodOf = new Map<number, Mood>();
  for (const mood of moods) {
    if (!moodOf.has(mood.segment_id)) moodOf.set(mood.segment_id, mood.level);
  }

  let level: Mood = 'calm';
  const points = customerSegments.map((segment) => {
    level = moodOf.get(segment.segment_id) ?? level;
    return { segment, level };
  });

  const ranges: MoodRange[] = [];
  const pushRange = (range: MoodRange) => {
    const last = ranges.at(-1);
    if (last && last.level === range.level) last.end = range.end;
    else if (range.end > range.start) ranges.push(range);
  };
  pushRange({
    start: 0,
    end: points[0]?.segment.start_time ?? callEnd,
    level: 'calm',
  });
  points.forEach((point, index) => {
    pushRange({
      start: point.segment.start_time,
      end: points[index + 1]?.segment.start_time ?? callEnd,
      level: point.level,
    });
  });

  const peakIndex = Math.max(0, ...points.map((p) => MOODS.indexOf(p.level)));
  const peak = MOODS[peakIndex];
  const turnPoint =
    peak === 'calm' ? undefined : points.find((p) => p.level === peak);

  return {
    peak,
    ranges,
    turn: turnPoint
      ? {
          segment_id: turnPoint.segment.segment_id,
          time: turnPoint.segment.start_time,
        }
      : null,
  };
}
