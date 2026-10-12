import 'server-only';
import { z } from 'zod';
import { COACHING_LANGUAGES } from '@/lib/call-upload';
import type { Checklist } from '../checklist';
import type { TranscriptSegment } from '../gnani';

export const PROMPT_VERSION = 'analyze-v1';

const MOODS = ['calm', 'annoyed', 'angry'] as const;
export const moodSchema = z.enum(MOODS);
export type Mood = z.infer<typeof moodSchema>;

export const llmAnswerSchema = z.object({
  speakers: z.array(
    z.object({
      speaker_id: z.int(),
      role: z.enum(['ai_agent', 'human_agent', 'customer', 'unknown']),
      name: z.string().nullable(),
    }),
  ),
  customer_mood: z.array(z.object({ segment_id: z.int(), level: moodSchema })),
  checks: z.array(
    z.object({
      check_id: z.string(),
      result: z.enum(['pass', 'miss', 'na']),
      segment_id: z.int().nullable(),
      quote: z.string().nullable(),
      reason: z.string(),
    }),
  ),
  red_flags: z.array(
    z.object({
      flag_id: z.string(),
      segment_id: z.int(),
      quote: z.string(),
      note: z.string(),
    }),
  ),
  summary: z.string(),
  fix_notes: z.array(
    z.object({
      segment_id: z.int(),
      title: z.string(),
      ai_said: z.string(),
      should_have: z.string(),
    }),
  ),
  coaching: z.object({ text: z.string(), english: z.string() }).nullable(),
});

export type LlmAnswer = z.infer<typeof llmAnswerSchema>;

export const ANSWER_JSON_SCHEMA: Record<string, unknown> = z.toJSONSchema(
  llmAnswerSchema,
  {
    target: 'draft-07',
    override: ({ jsonSchema }) => {
      delete jsonSchema.minimum;
      delete jsonSchema.maximum;
    },
  },
);
delete ANSWER_JSON_SCHEMA.$schema;

const SYSTEM = `You check recorded customer support calls for a food delivery app. On these calls an AI voice agent answers first and may hand over to a human agent. Lines can be in English, Hindi or Hinglish.

Return only a JSON object that matches this JSON schema:
${JSON.stringify(ANSWER_JSON_SCHEMA)}

Rules:
- Speaker ids come from automatic diarization and can be wrong. Decide each speaker's role from what they say.
- Refer to lines only by segment_id. Never give times.
- Every quote is the shortest phrase that proves the point, copied character for character from the segment it cites. Keep mixed Hindi and English exactly as written: never translate, transliterate or fix a word.
- Checks apply to the whole call: a check passes when either the AI agent or the human agent does it.
- A check is "pass" only with a quote that proves it. Without one it is "miss". Use "na" only when the check does not apply.
- Give one entry in "checks" for every check id, and use only the check and red flag ids listed.
- "red_flags" lists only red flags that happened, each citing the words that raised it. Leave out any flag that did not happen; never add an entry to say a flag does not apply. Judge promises against the company rules.
- "human_not_transferred" applies whenever the AI agent answers a request for a person with anything other than a transfer, even if it transfers later.
- "customer_mood" has one entry for every segment spoken by the customer, judged from that segment's own words.
- "summary" is 2 or 3 sentences in English: why the customer called, what happened and how it ended.
- "fix_notes" are for the AI team: one per thing the AI agent got wrong.
- "coaching" is for the human agent: one thing done well and one to improve, 2 or 3 friendly sentences in the coaching language, plus an English version. Use null when there is no human agent.`;

function languageName(code: string) {
  const label = COACHING_LANGUAGES.find((lang) => lang.code === code)?.label;
  return label ? `${code} (${label})` : code;
}

export function buildMessages(
  segments: TranscriptSegment[],
  checklist: Checklist,
  coachingLang: string,
) {
  const lines = segments
    .map(
      (s) =>
        `[${s.segment_id}] ${s.start_time.toFixed(1)}s speaker ${s.speaker_id}: ${s.text}`,
    )
    .join('\n');
  const user = `Checks:
${checklist.checks.map((c) => `- ${c.id} (${c.name}): ${c.rule}`).join('\n')}

Red flags:
${checklist.red_flags.map((f) => `- ${f.id} (${f.name}): ${f.example}`).join('\n')}

Company refund and compensation rules:
${checklist.rules}

Coaching language: ${languageName(coachingLang)}

Transcript:
${lines}`;

  return [
    { role: 'system' as const, content: SYSTEM },
    { role: 'user' as const, content: user },
  ];
}
