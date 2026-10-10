// Sends call.wav to Gnani Batch with diarization, waits for it, and scores the speaker labels against timeline.json.
// Usage: node --env-file=.env.local scripts/spike/transcribe.mjs [--denoise] [--file other.wav]

import { readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { parseArgs } from 'node:util';
import { gnani, OUT_DIR } from './lib.mjs';

const { values: args } = parseArgs({
  options: { denoise: { type: 'boolean', default: false }, file: { type: 'string', default: 'call.wav' } },
});
const label = `${basename(args.file, '.wav')}-${args.denoise ? 'denoise' : 'raw'}`;
const FINAL = ['COMPLETED', 'PARTIAL_FAILURE', 'FAILED', 'START_FAILED', 'CANCELLED'];

const config = {
  model: 'gnani-prisma-v2.5',
  language_code: 'hi-IN,en-IN',
  mode: 'transcribe',
  with_diarization: true,
  num_speakers: 3,
  is_multi_channel: false,
  with_denoise: args.denoise,
};

const form = new FormData();
form.append('config', JSON.stringify(config));
form.append('files', new Blob([readFileSync(join(OUT_DIR, args.file))], { type: 'audio/wav' }), args.file);

const startedAt = Date.now();
const { job_id: jobId } = await (await gnani('/stt/v3/batch/jobs', { method: 'POST', body: form })).json();
await gnani(`/stt/v3/batch/jobs/${jobId}/start`, { method: 'POST' });
console.log(`Job ${jobId} started (${label})`);

let job;
do {
  await new Promise((resolve) => setTimeout(resolve, 10_000));
  job = await (await gnani(`/stt/v3/batch/jobs/${jobId}`)).json();
  console.log(`  ${job.status}`);
} while (!FINAL.includes(job.status));

const seconds = (Date.now() - startedAt) / 1000;
if (job.status !== 'COMPLETED') throw new Error(`Job ended ${job.status}: ${JSON.stringify(job)}`);

const { data: files } = await (await gnani(`/stt/v3/batch/jobs/${jobId}/files?status=COMPLETED`)).json();
const transcript = await (await fetch(files[0].transcript_url)).json();
writeFileSync(join(OUT_DIR, `transcript-${label}.json`), JSON.stringify(transcript, null, 2));

const timeline = JSON.parse(readFileSync(join(OUT_DIR, 'timeline.json'), 'utf8'));
const expectedRole = (segment) => {
  const middle = (segment.start_time + segment.end_time) / 2;
  const nearest = (line) => Math.max(line.start - middle, middle - line.end, 0);
  return timeline.reduce((best, line) => (nearest(line) < nearest(best) ? line : best)).role;
};

const votes = {};
for (const segment of transcript.segments) {
  const role = expectedRole(segment);
  votes[segment.speaker_id] ??= {};
  votes[segment.speaker_id][role] = (votes[segment.speaker_id][role] ?? 0) + 1;
}
const roleOf = Object.fromEntries(
  Object.entries(votes).map(([id, counts]) => [id, Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]]),
);
const correct = transcript.segments.filter((s) => roleOf[s.speaker_id] === expectedRole(s)).length;

for (const s of transcript.segments) {
  console.log(`[${s.segment_id}] ${s.start_time.toFixed(1)}s spk ${s.speaker_id} (${expectedRole(s)}): ${s.text}`);
}
console.log(
  JSON.stringify(
    {
      label,
      job_id: jobId,
      wall_seconds: seconds,
      duration_seconds: transcript.duration_seconds,
      language_code: transcript.language_code,
      segments: transcript.segments.length,
      speaker_ids: Object.keys(votes).length,
      votes,
      speaker_accuracy: `${correct}/${transcript.segments.length}`,
    },
    null,
    2,
  ),
);
