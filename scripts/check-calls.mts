// Runs the test calls in scripts/calls/ through the LLM and the report checks, and lists every difference from each call's EXPECTED.
// Each call's transcript is read from the newest Ready call with the same title ("missing item") in the project .env.local points at:
// voice the call with scripts/make-call.mjs and upload the WAV in the app first.
// Usage: pnpm check:calls [--call missing-item] [--runs 3] [--coaching-lang bn-IN]

import { readdirSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { coachingLanguage } from '../lib/call-upload';
import { runAnalysis } from '../server/analysis';
import { loadChecklist } from '../server/checklist';
import { DEADLINE_MS } from '../server/pipeline';
import type { Report } from '../server/report';
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

const { values: args } = parseArgs({
  options: {
    call: { type: 'string' },
    runs: { type: 'string', default: '3' },
    'coaching-lang': { type: 'string' },
  },
});

const runs = Number(args.runs);
if (!Number.isInteger(runs) || runs < 1) {
  throw new Error(
    `--runs must be a whole number of 1 or more, not "${args.runs}"`,
  );
}
if (args['coaching-lang'] !== undefined)
  coachingLanguage(args['coaching-lang']);

const callNames = args.call
  ? [args.call]
  : readdirSync(new URL('./calls/', import.meta.url))
      .filter((file) => file !== 'voices.mjs')
      .map((file) => file.replace(/\.mjs$/, ''));

const supabase = createAdminClient();
const { checklist } = await loadChecklist();

for (const name of callNames) {
  try {
    await checkCall(name);
  } catch (err) {
    console.log(`${name}: failed, ${String(err)}`);
  }
}

async function checkCall(name: string) {
  const script: CallScript = await import(`./calls/${name}.mjs`);
  const call = await loadCall(name.replaceAll('-', ' '));
  // Segment ids only line up with EXPECTED when the transcript has one segment per script line.
  const segmentsMatchLines = call.segments.length === script.LINES.length;

  for (let run = 1; run <= runs; run++) {
    const tag = `${name} run ${run}`;
    try {
      const { model, report, rejected } = await runAnalysis(
        {
          segments: call.segments,
          checklist,
          coachingLang: args['coaching-lang'] ?? call.coaching_lang,
          durationSeconds: call.duration_seconds ?? 0,
        },
        AbortSignal.timeout(DEADLINE_MS),
      );
      const misses = differences(report, script.EXPECTED, segmentsMatchLines);
      console.log(
        `${tag} (${model}): ${report.score_passed}/${report.score_total}, ${misses.length ? misses.join('; ') : 'matches EXPECTED'}`,
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
