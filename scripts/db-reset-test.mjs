// Rebuilds the Supabase test project from supabase/migrations and supabase/seed.sql.
// Run with `pnpm db:reset:test`, which loads .env.test.local.
import { execFileSync } from 'node:child_process';

const dbUrl = process.env.SUPABASE_TEST_DB_URL;
if (!dbUrl) {
  console.error('Set SUPABASE_TEST_DB_URL in .env.test.local (see README).');
  process.exit(1);
}

execFileSync('pnpm', ['supabase', 'db', 'reset', '--db-url', dbUrl, '--yes'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});
