// Rebuilds the Supabase test project from supabase/migrations and supabase/seed.sql.
// Run with `pnpm db:reset:test`, which loads .env.test.local.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';

const dbUrl = process.env.SUPABASE_TEST_DB_URL;
if (!dbUrl) {
  console.error('Set SUPABASE_TEST_DB_URL in .env.test.local (see README).');
  process.exit(1);
}

const devUrl = existsSync('.env.local')
  ? parseEnv(readFileSync('.env.local', 'utf8')).NEXT_PUBLIC_SUPABASE_URL
  : undefined;
const devRef = devUrl && new URL(devUrl).hostname.split('.')[0];
if (devRef && dbUrl.includes(devRef)) {
  console.error(
    'SUPABASE_TEST_DB_URL points at the dev/production project. It must be the test project.',
  );
  process.exit(1);
}

execFileSync(
  process.execPath,
  [
    'node_modules/supabase/dist/supabase.js',
    'db',
    'reset',
    '--db-url',
    dbUrl,
    '--yes',
  ],
  { stdio: 'inherit' },
);
