import { existsSync, readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';

/**
 * Throws unless `value` (a project URL or database URL) is clear of the
 * dev/production project named in .env.local.
 * @param {string} value
 */
export function assertNotDevProject(value) {
  if (!existsSync('.env.local')) {
    throw new Error(
      'Create .env.local first: it names the dev/production project the tests must never touch (see README).',
    );
  }
  const devUrl = parseEnv(
    readFileSync('.env.local', 'utf8'),
  ).NEXT_PUBLIC_SUPABASE_URL;
  if (!devUrl) {
    throw new Error('Set NEXT_PUBLIC_SUPABASE_URL in .env.local (see README).');
  }
  const devRef = new URL(devUrl).hostname.split('.')[0];
  if (value.includes(devRef)) {
    throw new Error(
      '.env.test.local points at the dev/production project. Tests must use the test project.',
    );
  }
}

const TEST_PROJECT_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'SUPABASE_SECRET_KEY',
];

export function loadTestProjectEnv() {
  if (!existsSync('.env.test.local')) {
    throw new Error(
      'Create .env.test.local for the Supabase test project (see README).',
    );
  }
  const env = parseEnv(readFileSync('.env.test.local', 'utf8'));
  for (const name of TEST_PROJECT_VARS) {
    if (!env[name]) {
      throw new Error(`Set ${name} in .env.test.local (see README).`);
    }
  }
  assertNotDevProject(env.NEXT_PUBLIC_SUPABASE_URL);
  Object.assign(process.env, env);
  return env;
}
