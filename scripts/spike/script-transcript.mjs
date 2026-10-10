// Writes the call script as a Gnani-shaped transcript with perfect speaker labels, so the LLM half can run without audio.
// Usage: node scripts/spike/script-transcript.mjs

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { LINES } from './call-script.mjs';
import { OUT_DIR } from './lib.mjs';

const SPEAKER_IDS = { ai_agent: 1, customer: 2, human_agent: 3 };
const SECONDS_PER_CHAR = 0.07;

let time = 0;
const segments = LINES.map((line, index) => {
  const start = time;
  time += line.text.length * SECONDS_PER_CHAR;
  const segment = { segment_id: index, start_time: start, end_time: time, text: line.text, speaker_id: SPEAKER_IDS[line.role] };
  time += 0.5;
  return segment;
});

const transcript = {
  full_transcript: segments.map((s) => s.text).join(' '),
  model: 'call-script',
  language_code: 'hi-IN',
  duration_seconds: time,
  segments,
};
writeFileSync(join(OUT_DIR, 'transcript-script.json'), JSON.stringify(transcript, null, 2));
console.log(`Wrote transcript-script.json (${segments.length} segments, ${time.toFixed(1)}s)`);
