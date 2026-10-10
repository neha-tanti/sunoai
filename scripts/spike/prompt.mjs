// First draft of the analysis prompt, using the PRD's default checklist.

export const CHECKS = [
  { id: 'order_confirmed', name: 'Order confirmed', rule: 'Confirms which order the call is about' },
  { id: 'problem_understood', name: 'Problem understood', rule: 'Gets the problem right without making the customer repeat it' },
  { id: 'frustration_acknowledged', name: 'Frustration acknowledged', rule: 'Recognises the customer\'s frustration, for example "I understand this is frustrating"' },
  { id: 'solution_or_next_step', name: 'Solution or next step', rule: "Offers a refund, replacement or clear delivery time within the company's rules" },
  { id: 'smooth_handover', name: 'Smooth handover', rule: 'Passes the call to a human who already knows the problem (na when there is no handover)' },
  { id: 'closing', name: 'Closing', rule: 'Checks the customer is happy with the outcome before ending' },
];

export const RED_FLAGS = [
  { id: 'human_not_transferred', name: "Customer asked for a human and wasn't transferred", example: '"Mujhe kisi insaan se baat karni hai", and the AI carries on' },
  { id: 'agent_loop', name: 'Agent stuck in a loop', example: '"Sorry, I didn\'t understand. Please tell me your order ID", three times in a row' },
  { id: 'wrong_promise', name: 'Wrong or made-up promise', example: '"You\'ll get a full refund and ₹500 extra", when the rules don\'t allow it' },
  { id: 'safety_not_escalated', name: 'Safety issue not escalated', example: '"There was an insect in my food", and the call isn\'t passed to a person' },
];

export const COMPANY_RULES =
  'Late delivery over 45 minutes: a coupon of up to ₹50. Refunds only for missing, wrong or damaged items, after the customer sends a photo. No cash compensation.';

const nullable = (schema) => ({ anyOf: [schema, { type: 'null' }] });
const object = (properties) => ({ type: 'object', properties, required: Object.keys(properties), additionalProperties: false });
const array = (items) => ({ type: 'array', items });
const integer = { type: 'integer' };
const string = { type: 'string' };

export const REPORT_SCHEMA = object({
  speakers: array(object({ speaker_id: integer, role: { enum: ['ai_agent', 'human_agent', 'customer', 'unknown'] }, name: nullable(string) })),
  customer_mood: array(object({ segment_id: integer, level: { enum: ['calm', 'annoyed', 'angry'] } })),
  checks: array(object({ check_id: string, result: { enum: ['pass', 'miss', 'na'] }, segment_id: nullable(integer), quote: nullable(string), reason: string })),
  red_flags: array(object({ flag_id: string, segment_id: integer, quote: string, note: string })),
  summary: string,
  fix_notes: array(object({ segment_id: integer, title: string, ai_said: string, should_have: string })),
  coaching: nullable(object({ text: string, english: string })),
});

const SYSTEM = `You check recorded customer support calls for a food delivery app. On these calls an AI voice agent answers first and may hand over to a human agent. Lines can be in English, Hindi or Hinglish.

Return only a JSON object that matches this JSON schema:
${JSON.stringify(REPORT_SCHEMA)}

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

export function buildMessages(segments, coachingLanguage) {
  const lines = segments.map((s) => `[${s.segment_id}] ${s.start_time.toFixed(1)}s speaker ${s.speaker_id}: ${s.text}`).join('\n');
  const user = `Checks:
${CHECKS.map((c) => `- ${c.id} (${c.name}): ${c.rule}`).join('\n')}

Red flags:
${RED_FLAGS.map((f) => `- ${f.id} (${f.name}): ${f.example}`).join('\n')}

Company refund and compensation rules:
${COMPANY_RULES}

Coaching language: ${coachingLanguage}

Transcript:
${lines}`;
  return [
    { role: 'system', content: SYSTEM },
    { role: 'user', content: user },
  ];
}
