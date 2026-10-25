// Uploads the voiced example calls the check page offers to the private examples bucket.
// Usage: node --env-file=.env.local scripts/upload-examples.mjs
// Voice each call first with scripts/make-call.mjs; reads test-calls/calls/<name>.wav.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { CALLS_DIR, requireEnv } from './lib.mjs';

const EXAMPLES = ['late-order', 'insect-in-food', 'order-id-loop'];

const supabase = createClient(
  requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
  requireEnv('SUPABASE_SECRET_KEY'),
  {
    auth: { persistSession: false, autoRefreshToken: false },
  },
);

for (const name of EXAMPLES) {
  const wav = readFileSync(join(CALLS_DIR, `${name}.wav`));
  const uploaded = await supabase.storage
    .from('examples')
    .upload(`${name}.wav`, wav, { contentType: 'audio/wav', upsert: true });
  if (uploaded.error) throw uploaded.error;
  console.log(`Uploaded ${name}.wav (${(wav.length / 1e6).toFixed(1)} MB)`);
}
