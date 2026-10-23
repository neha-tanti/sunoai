// Runs the test calls in scripts/calls/ through the LLM and the report checks, and lists every difference from each call's EXPECTED.
// Each call's transcript is read from the newest Ready call with the same title ("missing item") in the project .env.local points at:
// voice the call with scripts/spike/make-call.mjs and upload the WAV in the app first.
// Usage: pnpm check:calls [--call missing-item] [--runs 3] [--coaching-lang bn-IN]

import { readdirSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { loadChecklist } from '../server/checklist';
import { requestAnalysis } from '../server/llm';
import { buildMessages, llmAnswerSchema } from '../server/prompts/analyze';
import { buildReport, type Report } from '../server/report';
import { createAdminClient } from '../server/supabase';

type Expected = {
  score: string;
  needs_review: boolean;
  frustration_peak: string;
  checks: Record<string, string>;
  segments: {
    red_flags: string[];
    handover: number | null;
    frustration_turn: number | null;
  };
};

type CallScript = { LINES: unknown[]; EXPECTED: Expected };

const ANALYSIS_DEADLINE_MS = 280_000;

const { values: args } = parseArgs({
  options: {
    call: { type: 'string' },
    runs: { type: 'string', default: '3' },
    'coaching-lang': { type: 'string' },
  },
});

const callNames = args.call
  ? [args.call]
  : readdirSync(new URL('./calls/', import.meta.url))
      .filter((file) => file !== 'voices.mjs')
      .map((file) => file.replace(/\.mjs$/, ''));

const supabase = createAdminClient();
const { checklist } = await loadChecklist();

for (const name of callNames) {
  const script: CallScript = await import(`./calls/${name}.mjs`);
  const call = await loadCall(name.replaceAll('-', ' '));
  const coachingLang = args['coaching-lang'] ?? call.coaching_lang;
  // Segment ids only line up with EXPECTED when the transcript has one segment per script line.
  const segmentsMatchLines = call.segments.length === script.LINES.length;

  for (let run = 1; run <= Number(args.runs); run++) {
    const tag = `${name} run ${run}`;
    try {
      const llm = await requestAnalysis(
        buildMessages(call.segments, checklist, coachingLang),
        AbortSignal.timeout(ANALYSIS_DEADLINE_MS),
      );
      const { report, rejected } = buildReport({
        answer: llmAnswerSchema.parse(JSON.parse(llm.content ?? 'null')),
        segments: call.segments,
        checklist,
        durationSeconds: call.duration_seconds ?? 0,
        coachingLang,
      });
      const misses = differences(report, script.EXPECTED, segmentsMatchLines);
      console.log(
        `${tag} (${llm.model}): ${report.score_passed}/${report.score_total}, ${misses.length ? misses.join('; ') : 'matches EXPECTED'}`,
      );
      console.log(
        `  coaching: ${report.coaching?.text ?? rejected.coaching ?? 'none'}`,
      );
    } catch (err) {
      console.log(`${tag}: failed, ${String(err)}`);
    }
  }
}

async function loadCall(title: string) {
  const call = await supabase
    .from('calls')
    .select('id, coaching_lang, duration_seconds')
    .eq('title', title)
    .eq('status', 'ready')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (call.error) throw call.error;
  if (!call.data) throw new Error(`No Ready call titled "${title}"`);

  const segments = await supabase
    .from('transcript_segments')
    .select('segment_id, start_time, end_time, speaker_id, text')
    .eq('call_id', call.data.id)
    .order('segment_id');
  if (segments.error) throw segments.error;
  return { ...call.data, segments: segments.data };
}

function differences(
  report: Report,
  expected: Expected,
  segmentsMatchLines: boolean,
) {
  const resultOf = new Map(report.checks.map((c) => [c.check_id, c.result]));
  const pairs: [string, unknown, unknown][] = [
    ['score', `${report.score_passed}/${report.score_total}`, expected.score],
    ['needs_review', report.needs_review, expected.needs_review],
    ['frustration_peak', report.frustration_peak, expected.frustration_peak],
    ...Object.entries(expected.checks).map(
      ([id, result]): [string, unknown, unknown] => [
        id,
        resultOf.get(id),
        result,
      ],
    ),
  ];
  if (segmentsMatchLines) {
    pairs.push(
      [
        'red_flags',
        report.red_flags
          .map((flag) => `${flag.flag_id}@${flag.segment_id}`)
          .sort()
          .join(','),
        [...expected.segments.red_flags].sort().join(','),
      ],
      ['handover', report.handover_segment_id, expected.segments.handover],
      [
        'frustration_turn',
        report.frustration.turn?.segment_id ?? null,
        expected.segments.frustration_turn,
      ],
    );
  }
  return pairs
    .filter(([, actual, wanted]) => actual !== wanted)
    .map(
      ([field, actual, wanted]) => `${field}: ${actual} (expected ${wanted})`,
    );
}
