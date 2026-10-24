// Rebuilds the Supabase test project from supabase/migrations and supabase/seed.sql.
// Run with `pnpm db:reset:test`, which loads .env.test.local.
import { execFileSync } from 'node:child_process';
import { assertNotDevProject } from './test-project.mjs';

const dbUrl = process.env.SUPABASE_TEST_DB_URL;
if (!dbUrl) {
  console.error('Set SUPABASE_TEST_DB_URL in .env.test.local (see README).');
  process.exit(1);
}
assertNotDevProject(dbUrl);

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
