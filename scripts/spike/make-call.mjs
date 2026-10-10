// Voices each line of the call script with Gnani Timbre and joins them into one WAV.
// Usage: node --env-file=.env.local scripts/spike/make-call.mjs

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { LINES } from './call-script.mjs';
import { gnani, OUT_DIR } from './lib.mjs';

const SAMPLE_RATE = 16000;
const BYTES_PER_SECOND = SAMPLE_RATE * 2;
const GAP = Buffer.alloc(BYTES_PER_SECOND / 2);

async function speak(line) {
  const res = await gnani('/api/v1/tts/inference', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: line.text,
      voice: line.voice,
      model: 'timbre-v2.5',
      language: line.language,
      speed: 1.0,
      audio_config: { sample_rate: SAMPLE_RATE, num_channels: 1, sample_width: 2, encoding: 'linear_pcm', container: 'wav' },
    }),
  });
  return pcmData(Buffer.from(await res.arrayBuffer()));
}

// Walks the RIFF chunks and returns the samples in the "data" chunk, after checking the format.
function pcmData(wav) {
  if (wav.toString('ascii', 0, 4) !== 'RIFF') throw new Error('Timbre did not return a WAV file');
  let offset = 12;
  while (offset + 8 <= wav.length) {
    const id = wav.toString('ascii', offset, offset + 4);
    const size = wav.readUInt32LE(offset + 4);
    const body = offset + 8;
    if (id === 'fmt ') {
      const channels = wav.readUInt16LE(body + 2);
      const rate = wav.readUInt32LE(body + 4);
      const bits = wav.readUInt16LE(body + 14);
      if (channels !== 1 || rate !== SAMPLE_RATE || bits !== 16) {
        throw new Error(`Unexpected WAV format: ${channels} ch, ${rate} Hz, ${bits} bit`);
      }
    }
    if (id === 'data') return wav.subarray(body, Math.min(body + size, wav.length));
    offset = body + size + (size % 2);
  }
  throw new Error('WAV has no data chunk');
}

function wavHeader(dataBytes) {
  const header = Buffer.alloc(44);
  header.write('RIFF', 0, 'ascii');
  header.writeUInt32LE(36 + dataBytes, 4);
  header.write('WAVEfmt ', 8, 'ascii');
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE(BYTES_PER_SECOND, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36, 'ascii');
  header.writeUInt32LE(dataBytes, 40);
  return header;
}

const parts = [];
const timeline = [];
let bytes = 0;

for (const [index, line] of LINES.entries()) {
  const pcm = await speak(line);
  const start = bytes / BYTES_PER_SECOND;
  parts.push(pcm, GAP);
  bytes += pcm.length + GAP.length;
  timeline.push({ line: index + 1, role: line.role, start, end: start + pcm.length / BYTES_PER_SECOND });
  console.log(`line ${index + 1} ${line.role} ${line.voice}: ${(pcm.length / BYTES_PER_SECOND).toFixed(1)}s`);
}

const audio = Buffer.concat(parts);
writeFileSync(join(OUT_DIR, 'call.wav'), Buffer.concat([wavHeader(audio.length), audio]));
writeFileSync(join(OUT_DIR, 'timeline.json'), JSON.stringify(timeline, null, 2));
console.log(`Wrote call.wav (${(bytes / BYTES_PER_SECOND).toFixed(1)}s, ${(audio.length / 1e6).toFixed(1)} MB) to ${OUT_DIR}`);
