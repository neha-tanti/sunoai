import type { Route } from '@playwright/test';

export function fulfillWithRanges(route: Route, audio: Buffer) {
  const headers = { 'Accept-Ranges': 'bytes' };
  const range = /bytes=(\d+)-(\d*)/.exec(route.request().headers().range ?? '');
  if (!range) {
    return route.fulfill({ contentType: 'audio/wav', headers, body: audio });
  }

  const start = Number(range[1]);
  const end = range[2] ? Number(range[2]) : audio.length - 1;
  return route.fulfill({
    status: 206,
    contentType: 'audio/wav',
    headers: {
      ...headers,
      'Content-Range': `bytes ${start}-${end}/${audio.length}`,
    },
    body: audio.subarray(start, end + 1),
  });
}

export function silentWav(seconds: number) {
  const sampleRate = 8000;
  const dataBytes = seconds * sampleRate;
  const wav = Buffer.alloc(44 + dataBytes, 128);
  wav.write('RIFF', 0);
  wav.writeUInt32LE(36 + dataBytes, 4);
  wav.write('WAVEfmt ', 8);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(sampleRate, 24);
  wav.writeUInt32LE(sampleRate, 28);
  wav.writeUInt16LE(1, 32);
  wav.writeUInt16LE(8, 34);
  wav.write('data', 36);
  wav.writeUInt32LE(dataBytes, 40);
  return wav;
}
