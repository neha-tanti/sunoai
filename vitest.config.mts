import { defineConfig } from 'vitest/config';
import { loadTestProjectEnv } from './scripts/test-project.mjs';

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
    env: loadTestProjectEnv(),
  },
});
