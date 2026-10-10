// Sends a Gnani transcript to each free model setup, applies the TRD's code-side checks and compares with EXPECTED.
// Usage: node --env-file=.env.local scripts/spike/analyze.mjs --transcript transcript-call-denoise.json [--runs 3] [--only nemotron]

import { readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { parseArgs } from 'node:util';
import { EXPECTED } from './call-script.mjs';
import { OUT_DIR, requireEnv } from './lib.mjs';
import { buildMessages, CHECKS, RED_FLAGS, REPORT_SCHEMA } from './prompt.mjs';

const { values: args } = parseArgs({
  options: {
    transcript: { type: 'string', default: 'transcript-call-denoise.json' },
    runs: { type: 'string', default: '3' },
    only: { type: 'string', default: '' },
  },
});

const NEMOTRON = 'nvidia/nemotron-3-super-120b-a12b:free';
const APODEX = 'apodex/apodex-1.1-mini:free';
const DOTS = 'dots-studio/dots-3-note-preview:free';

// Each setup is one request, sent the way lib/llm.ts will send LLM_MODELS.
const SETUPS = {
  nemotron: [NEMOTRON],
  apodex: [APODEX],
  dots: [DOTS],
  'llm-models': [NEMOTRON, APODEX, DOTS],
};
const REQUEST = {
  response_format: { type: 'json_schema', json_schema: { name: 'call_report', strict: true, schema: REPORT_SCHEMA } },
  reasoning: { enabled: false },
  temperature: 0,
};
const LEVELS = ['calm', 'annoyed', 'angry'];

const transcript = JSON.parse(readFileSync(join(OUT_DIR, args.transcript), 'utf8'));
const { segments } = transcript;
const textOf = new Map(segments.map((s) => [s.segment_id, s.text]));
const normalize = (text) => text.normalize('NFC').toLowerCase().replace(/[\p{P}\p{S}]/gu, ' ').replace(/\s+/g, ' ').trim();

function quoteFound(segmentId, quote) {
  if (!quote || !textOf.has(segmentId)) return false;
  const wanted = normalize(quote);
  return wanted !== '' && normalize(textOf.get(segmentId)).includes(wanted);
}

async function complete(models) {
  const startedAt = Date.now();
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${requireEnv('OPENROUTER_API_KEY')}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...REQUEST, models, messages: buildMessages(segments, 'hi-IN (Hindi)') }),
  });
  const body = await res.json();
  if (!res.ok || body.error) throw new Error(`OpenRouter ${res.status}: ${JSON.stringify(body.error ?? body)}`);
  return { body, seconds: (Date.now() - startedAt) / 1000 };
}

function parse(content) {
  try {
    return { report: JSON.parse(content), fenced: false };
  } catch {
    const inner = content.match(/```(?:json)?\s*([\s\S]*?)```/)?.[1];
    if (!inner) return { report: null, fenced: false };
    try {
      return { report: JSON.parse(inner), fenced: true };
    } catch {
      return { report: null, fenced: true };
    }
  }
}

function check(report) {
  const checkIds = new Set(CHECKS.map((c) => c.id));
  const flagIds = new Set(RED_FLAGS.map((f) => f.id));

  const answers = new Map((report.checks ?? []).filter((c) => checkIds.has(c.check_id)).map((c) => [c.check_id, c]));
  const badPassQuotes = [...answers.values()].filter((c) => c.result === 'pass' && !quoteFound(c.segment_id, c.quote));
  const results = Object.fromEntries(
    CHECKS.map(({ id }) => {
      const answer = answers.get(id);
      return [id, answer && !badPassQuotes.includes(answer) ? answer.result : 'miss'];
    }),
  );
  const passed = Object.values(results).filter((r) => r === 'pass').length;
  const total = Object.values(results).filter((r) => r !== 'na').length;

  const flags = (report.red_flags ?? []).filter((f) => flagIds.has(f.flag_id));
  const keptFlags = flags.filter((f) => quoteFound(f.segment_id, f.quote));

  const roleOf = new Map((report.speakers ?? []).map((s) => [s.speaker_id, s.role]));
  const customerSegments = new Set(segments.filter((s) => roleOf.get(s.speaker_id) === 'customer').map((s) => s.segment_id));
  const moods = (report.customer_mood ?? []).filter((m) => customerSegments.has(m.segment_id)).sort((a, b) => a.segment_id - b.segment_id);
  const peak = Math.max(-1, ...moods.map((m) => LEVELS.indexOf(m.level)));

  return {
    missing_top_level_keys: Object.keys(REPORT_SCHEMA.properties).filter((key) => !(key in report)),
    unknown_ids: (report.checks?.length ?? 0) - answers.size + (report.red_flags?.length ?? 0) - flags.length,
    omitted_checks: CHECKS.filter((c) => !answers.has(c.id)).map((c) => c.id),
    checks: results,
    pass_quotes_rejected: badPassQuotes.map((c) => ({ check_id: c.check_id, segment_id: c.segment_id, quote: c.quote })),
    score: `${passed}/${total}`,
    red_flags: keptFlags.map((f) => `${f.flag_id}@${f.segment_id}`),
    red_flags_dropped: flags.filter((f) => !keptFlags.includes(f)).map((f) => ({ flag_id: f.flag_id, segment_id: f.segment_id, quote: f.quote })),
    needs_review: keptFlags.length > 0,
    customer_mood: moods.map((m) => `${m.segment_id}:${m.level}`).join(' '),
    frustration_peak: LEVELS[peak] ?? null,
    frustration_turn: peak > 0 ? moods.find((m) => LEVELS.indexOf(m.level) === peak).segment_id : null,
    speakers: report.speakers?.map((s) => `${s.speaker_id}=${s.role}`),
    handover_segment_id: segments.find((s) => roleOf.get(s.speaker_id) === 'human_agent')?.segment_id ?? null,
  };
}

// Segment ids only line up with EXPECTED on the script transcript; Gnani splits lines differently.
function missesAgainstExpected(result) {
  const pairs = [
    ['score', result.score, EXPECTED.score],
    ['needs_review', result.needs_review, EXPECTED.needs_review],
    ['frustration_peak', result.frustration_peak, EXPECTED.frustration_peak],
    ...Object.entries(EXPECTED.checks).map(([id, expected]) => [id, result.checks[id], expected]),
  ];
  if (transcript.model === 'call-script') {
    pairs.push(
      ['red_flags', result.red_flags.join(','), EXPECTED.segments.red_flags.join(',')],
      ['handover', result.handover_segment_id, EXPECTED.segments.handover],
      ['frustration_turn', result.frustration_turn, EXPECTED.segments.frustration_turn],
    );
  }
  return pairs.filter(([, actual, expected]) => actual !== expected).map(([field, actual, expected]) => `${field}: ${actual} (expected ${expected})`);
}

const results = [];
for (const [setup, models] of Object.entries(SETUPS)) {
  if (!setup.includes(args.only)) continue;
  for (let run = 1; run <= Number(args.runs); run++) {
    const tag = `${basename(args.transcript, '.json')}-${setup}-run${run}`;
    try {
      const { body, seconds } = await complete(models);
      const content = body.choices[0].message.content ?? '';
      writeFileSync(join(OUT_DIR, `llm-${tag}.txt`), content);
      const { report, fenced } = parse(content);
      const result = {
        tag,
        answered_by: body.model,
        seconds,
        tokens: { completion: body.usage?.completion_tokens, reasoning: body.usage?.completion_tokens_details?.reasoning_tokens },
        json_valid: Boolean(report),
        needed_fence_strip: fenced,
        ...(report && check(report)),
      };
      if (report) result.misses_against_expected = missesAgainstExpected(result);
      results.push(result);
      console.log(JSON.stringify(result, null, 2));
    } catch (error) {
      results.push({ tag, error: error.message });
      console.log(`${tag}: ${error.message}`);
    }
  }
}

const suffix = args.only ? `-${args.only}` : '';
writeFileSync(join(OUT_DIR, `results-${basename(args.transcript, '.json')}${suffix}.json`), JSON.stringify(results, null, 2));
