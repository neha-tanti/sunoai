import { existsSync, readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { defineConfig } from 'vitest/config';

const testEnvFile = '.env.test.local';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  ssr: {
    resolve: {
      conditions: ['react-server', 'module', 'node', 'development|production'],
    },
  },
  test: {
    include: ['**/*.test.ts'],
    environment: 'node',
    fileParallelism: false,
    env: existsSync(testEnvFile)
      ? parseEnv(readFileSync(testEnvFile, 'utf8'))
      : {},
  },
});
