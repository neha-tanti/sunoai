// Runs `next dev` on the Supabase test project. Run with `pnpm dev:test`.
import { spawn } from 'node:child_process';
import { loadTestProjectEnv } from './test-project.mjs';

loadTestProjectEnv();

spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev'], {
  stdio: 'inherit',
}).on('exit', (code) => process.exit(code ?? 0));
