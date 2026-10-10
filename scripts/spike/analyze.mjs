// Sends a Gnani transcript to each free model and applies the TRD's code-side checks to the answers.
// Usage: node --env-file=.env.local scripts/spike/analyze.mjs --transcript transcript-call-denoise.json [--runs 3]

import { readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { parseArgs } from 'node:util';
import { OUT_DIR, requireEnv } from './lib.mjs';
import { buildMessages, CHECKS, RED_FLAGS, REPORT_SCHEMA } from './prompt.mjs';

const { values: args } = parseArgs({
  options: {
    transcript: { type: 'string', default: 'transcript-call-denoise.json' },
    runs: { type: 'string', default: '3' },
    only: { type: 'string', default: '' },
  },
});

const CONFIGS = [
  { model: 'google/gemma-4-31b-it:free', response_format: { type: 'json_object' } },
  {
    model: 'nvidia/nemotron-3-super-120b-a12b:free',
    response_format: { type: 'json_schema', json_schema: { name: 'call_report', strict: true, schema: REPORT_SCHEMA } },
    reasoning: { enabled: false },
  },
];
const LEVELS = ['calm', 'annoyed', 'angry'];

const { segments } = JSON.parse(readFileSync(join(OUT_DIR, args.transcript), 'utf8'));
const textOf = new Map(segments.map((s) => [s.segment_id, s.text]));
const normalize = (text) => text.toLowerCase().replace(/[\p{P}\p{S}]/gu, ' ').replace(/\s+/g, ' ').trim();
const quoteFound = (segmentId, quote) => Boolean(quote) && normalize(textOf.get(segmentId) ?? '').includes(normalize(quote));

async function complete(config) {
  const startedAt = Date.now();
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${requireEnv('OPENROUTER_API_KEY')}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...config, temperature: 0, messages: buildMessages(segments, 'hi-IN (Hindi)') }),
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
  const missingKeys = Object.keys(REPORT_SCHEMA.properties).filter((key) => !(key in report));
  const checkIds = new Set(CHECKS.map((c) => c.id));
  const flagIds = new Set(RED_FLAGS.map((f) => f.id));

  const checks = (report.checks ?? []).filter((c) => checkIds.has(c.check_id));
  const badPassQuotes = checks.filter((c) => c.result === 'pass' && !quoteFound(c.segment_id, c.quote));
  const results = Object.fromEntries(checks.map((c) => [c.check_id, badPassQuotes.includes(c) ? 'miss' : c.result]));
  const passed = Object.values(results).filter((r) => r === 'pass').length;
  const total = Object.values(results).filter((r) => r !== 'na').length;

  const flags = (report.red_flags ?? []).filter((f) => flagIds.has(f.flag_id));
  const keptFlags = flags.filter((f) => quoteFound(f.segment_id, f.quote));

  const roleOf = new Map((report.speakers ?? []).map((s) => [s.speaker_id, s.role]));
  const moods = (report.customer_mood ?? []).filter((m) => textOf.has(m.segment_id)).sort((a, b) => a.segment_id - b.segment_id);
  const peak = Math.max(-1, ...moods.map((m) => LEVELS.indexOf(m.level)));

  return {
    missing_keys: missingKeys,
    unknown_ids: (report.checks?.length ?? 0) - checks.length + (report.red_flags?.length ?? 0) - flags.length,
    checks: results,
    pass_quotes_rejected: badPassQuotes.map((c) => ({ check_id: c.check_id, segment_id: c.segment_id, quote: c.quote })),
    score: `${passed}/${total}`,
    red_flags: keptFlags.map((f) => `${f.flag_id}@${f.segment_id}`),
    red_flags_dropped: flags.filter((f) => !keptFlags.includes(f)).map((f) => ({ flag_id: f.flag_id, segment_id: f.segment_id, quote: f.quote })),
    needs_review: keptFlags.length > 0,
    customer_mood: moods.map((m) => `${m.segment_id}:${m.level}`).join(' '),
    frustration_peak: LEVELS[peak] ?? null,
    frustration_turn: moods.find((m) => LEVELS.indexOf(m.level) === peak)?.segment_id ?? null,
    speakers: report.speakers?.map((s) => `${s.speaker_id}=${s.role}`),
    handover_segment_id: segments.find((s) => roleOf.get(s.speaker_id) === 'human_agent')?.segment_id ?? null,
  };
}

const results = [];
for (const config of CONFIGS) {
  const name = `${config.model.split('/')[1].replace(':free', '')}${config.reasoning?.enabled === false ? '-noreason' : ''}`;
  if (!name.includes(args.only)) continue;
  for (let run = 1; run <= Number(args.runs); run++) {
    const tag = `${basename(args.transcript, '.json')}-${name}-run${run}`;
    try {
      const { body, seconds } = await complete(config);
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
      results.push(result);
      console.log(JSON.stringify(result, null, 2));
    } catch (error) {
      results.push({ tag, error: error.message });
      console.log(`${tag}: ${error.message}`);
    }
  }
}

writeFileSync(join(OUT_DIR, `results-${basename(args.transcript, '.json')}.json`), JSON.stringify(results, null, 2));
