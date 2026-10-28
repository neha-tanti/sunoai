// Sends a call from make-call.mjs to Gnani Batch with diarization, waits for it, and scores the speaker labels against its timeline.
// Usage: node --env-file=.env.local scripts/spike/transcribe.mjs [--call late-order] [--denoise] [--job existing-job-id]

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { CALLS_DIR, gnani, OUT_DIR } from '../lib.mjs';

const { values: args } = parseArgs({
  options: {
    denoise: { type: 'boolean', default: false },
    call: { type: 'string', default: 'late-order' },
    job: { type: 'string' },
  },
});
const label = `${args.call}-${args.job ?? (args.denoise ? 'denoise' : 'raw')}`;
const FINAL = ['COMPLETED', 'PARTIAL_FAILURE', 'FAILED', 'START_FAILED', 'CANCELLED'];
const MAX_WAIT_MS = 15 * 60_000;

async function startJob() {
  const config = {
    model: 'prisma-v3.0',
    language_code: 'hi-IN,en-IN',
    mode: 'transcribe',
    format: 'transcribe',
    with_diarization: true,
    num_speakers: 3,
    is_multi_channel: false,
    with_denoise: args.denoise,
  };
  const form = new FormData();
  form.append('config', JSON.stringify(config));
  form.append('files', new Blob([readFileSync(join(CALLS_DIR, `${args.call}.wav`))], { type: 'audio/wav' }), `${args.call}.wav`);
  const { job_id: jobId } = await (await gnani('/stt/v3/batch/jobs', { method: 'POST', body: form })).json();
  await gnani(`/stt/v3/batch/jobs/${jobId}/start`, { method: 'POST' });
  console.log(`Job ${jobId} started (${label})`);
  return jobId;
}

const startedAt = Date.now();
const jobId = args.job ?? (await startJob());

let job;
do {
  if (Date.now() - startedAt > MAX_WAIT_MS) throw new Error(`Job ${jobId} still ${job?.status} after ${MAX_WAIT_MS / 60_000} minutes`);
  await new Promise((resolve) => setTimeout(resolve, 10_000));
  job = await (await gnani(`/stt/v3/batch/jobs/${jobId}`)).json();
  console.log(`  ${job.status}`);
} while (!FINAL.includes(job.status));

if (job.status !== 'COMPLETED') throw new Error(`Job ended ${job.status}: ${JSON.stringify(job)}`);

const { data: files } = await (await gnani(`/stt/v3/batch/jobs/${jobId}/files?status=COMPLETED`)).json();
if (!files?.length) throw new Error(`Job ${jobId} completed with no completed files`);
const transcriptRes = await fetch(files[0].transcript_url);
if (!transcriptRes.ok) throw new Error(`Transcript download for job ${jobId} failed: ${transcriptRes.status}`);
const transcript = await transcriptRes.json();
mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(join(OUT_DIR, `transcript-${label}.json`), JSON.stringify(transcript, null, 2));

const timeline = JSON.parse(readFileSync(join(CALLS_DIR, `${args.call}.timeline.json`), 'utf8'));
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
      wall_seconds: (Date.parse(job.completed_at) - Date.parse(job.created_at)) / 1000,
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
