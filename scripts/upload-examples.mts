// Uploads the voiced example calls the check page offers to the private examples bucket.
// Usage: pnpm tsx --env-file=.env.local scripts/upload-examples.mts
// Voice each call first with scripts/make-call.mjs; reads test-calls/calls/<name>.wav.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { EXAMPLE_CALLS } from '../lib/examples';
import { CALLS_DIR, requireEnv } from './lib.mjs';

const supabase = createClient(
  requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
  requireEnv('SUPABASE_SECRET_KEY'),
  {
    auth: { persistSession: false, autoRefreshToken: false },
  },
);

for (const { id: name } of EXAMPLE_CALLS) {
  const wav = readFileSync(join(CALLS_DIR, `${name}.wav`));
  const uploaded = await supabase.storage
    .from('examples')
    .upload(`${name}.wav`, wav, { contentType: 'audio/wav', upsert: true });
  if (uploaded.error) throw uploaded.error;
  console.log(`Uploaded ${name}.wav (${(wav.length / 1e6).toFixed(1)} MB)`);
}
