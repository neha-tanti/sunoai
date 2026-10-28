import 'server-only';
import { z } from 'zod';
import { type CoachingLanguage, HINGLISH } from '@/lib/call-upload';
import type { Checklist } from '../checklist';
import type { TranscriptSegment } from '../gnani';

export const PROMPT_VERSION = 'analyze-v7';

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
  coaching: z.object({
    segment_id: z.int(),
    quote: z.string(),
    text: z.string(),
    english: z.string(),
  }),
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
- Point at lines only through the segment_id fields. Written text (reasons, notes, titles, the summary and the coaching) describes a line by what was said in it and never gives a segment number or a time.
- Every quote (in checks, red flags and coaching) is the shortest phrase that proves the point, copied character for character from the one segment its segment_id names, never from another segment. Keep mixed Hindi and English exactly as written: never translate, transliterate or fix a word, even one that looks misheard. A quote uses the same letters as its segment: when English words are written in Latin letters inside a Devanagari line ("मैं आपका order देख सकता हूँ"), the quote keeps them in Latin letters.
- Checks apply to the whole call: a check passes when either the AI agent or the human agent does it, even if the other agent later breaks it. A customer repeating something makes a check "miss" only when no agent had said it back correctly before; when the AI agent named the order and the problem before the handover, a human agent who makes the customer repeat it is a matter for coaching, and the check passes on the AI agent's line.
- A check is "pass" only with a quote of an agent's own words doing what the check's rule says. Asking the customer for something, thanking them for it or acting on it does not do it: confirming something means an agent says it back, so the quote contains what was confirmed, such as the order ID. Without such a quote it is "miss". Use "na" only when the check does not apply.
- Give one entry in "checks" for every check id, and use only the check and red flag ids listed.
- "red_flags" lists only red flags that happened, each once, citing one line: for a flag about something the customer reported or asked for, the customer's first line that reports or asks for it; for a flag about something an agent said, the agent's line that says it. Leave out any flag that did not happen; never add an entry to say a flag does not apply. Judge promises against the company rules.
- "human_not_transferred" applies when the customer asks for a person and the AI agent's reply, its first line after that request, is not a transfer, even if it transfers later. It cites that request. When the AI agent's reply is a transfer ("connecting you to an agent"), it did not happen for that request, whatever the AI agent said or got wrong before it; earlier mistakes belong to other flags.
- "customer_mood" has one entry for every segment spoken by the customer, judged from that segment's own words:
  - "calm": gives details, answers a question, states the problem or how long they have waited as a plain fact, asks when the order will come, says they did what the agent asked (even in a short reply right after an angry line), agrees or says thanks ("pizza thanda aaya hai", "delivery kitne baje tak hogi?", "screenshot upload kar diya", "मेरा खाना 40 मिनट से नहीं आया").
  - "annoyed": complains about the problem or the service: says it is too late, too much or keeps happening, says they already said it or were already told the same thing before, says the same detail twice in one line, or asks for a person without saying it must be right now, even when asking again ("itna time kyun lag raha hai", "main pehle hi bata chuki hoon", "naam Riya hai. R I Y A, Riya.", "kisi aur se baat kara dijiye, please", "आपने पहले भी यही कहा था", "किसी agent से बात करवा दीजिए").
  - "angry": exclaims in shock, alarm or outrage at the problem or the agent, demands a person right now, or mocks or accuses the agent ("Ye kya bakwas hai!", "Daal mein kaanch ka tukda tha!", "Aap log sote ho kya?", "supervisor ko line pe lao, turant!"). An exclamation of pleasant surprise, thanks or relief is calm.
  - When a line fits two levels, use the higher one. Judge only the customer's words, never the topic of the call.
- "summary" is 2 or 3 sentences in English: why the customer called, what happened and how it ended.
- "fix_notes" are for the AI team: one per thing the AI agent got wrong.
- "coaching" is feedback for the human agent from a senior colleague who listened to the call. Whenever "speakers" has a human_agent, coaching points at one of their lines and its text and english are never empty, even when they made no mistake: then it points at their best line, says what they did well and gives one small tip for their next call. Only when "speakers" has no human_agent, give segment_id 0 and empty quote, text and english.
- Coaching is only about what the human agent said and did after the handover. Never mention the transfer or anything before it in coaching: the human agent did not choose when the call reached them, and the AI agent's mistakes belong in "fix_notes".
- Choose the coaching line first. "coaching.segment_id" and "coaching.quote" point at the human agent's own line with their biggest mistake: a check their lines missed (such as asking the customer to repeat what they already told the AI agent, brushing off the customer's frustration, or ending without checking the customer is happy), otherwise a line after which the customer got more upset. Start with the human agent's first line: if it asks for the problem or the order ID the customer already gave, that is the mistake. Only when they made no mistake, point at the line a small tip for their next call builds on.
- Something is a mistake only when the transcript and the company rules show it. Before calling something missing, check every human agent line, and before calling a promise wrong, check it against the company rules.
- "coaching.text" is 2 or 3 sentences in the coaching language, and "coaching.english" says the same in English. Say it the way the colleague would after the call: name what they said in that line, say plainly why it was the wrong thing to say to this customer, and give the exact sentence they should say instead. Add one short line on something they really did well. Never call it a great job when they made a mistake, and never suggest something they already did on this call.
- Coaching is only about words in the transcript. Never comment on speed, tone of voice, pauses or anything else a transcript cannot show.
- Coaching speaks to the human agent directly and respectfully ("aap" in Hindi and Hinglish). When the call gives their name, both "coaching.text" and "coaching.english" start with it ("Rahul, ..."); otherwise they start without a name. Use simple words a colleague would say out loud, not a word-for-word translation of the English version. Use only words from the coaching language and English.`;

const HINGLISH_COACHING =
  'Write the coaching text in Roman letters (a to z) only, never Devanagari, even when the transcript is in Devanagari: Hindi sentences with everyday English words such as customer, order, refund, coupon and delivery kept in English.';

function coachingLanguageLine(language: CoachingLanguage) {
  const line = `Coaching language: ${language.code} (${language.label})`;
  if (language.code !== HINGLISH) return line;
  return `${line}\n${HINGLISH_COACHING}`;
}

export function buildMessages(
  segments: TranscriptSegment[],
  checklist: Checklist,
  coachingLanguage: CoachingLanguage,
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

Transcript:
${lines}

${coachingLanguageLine(coachingLanguage)}`;

  return [
    { role: 'system' as const, content: SYSTEM },
    { role: 'user' as const, content: user },
  ];
}
