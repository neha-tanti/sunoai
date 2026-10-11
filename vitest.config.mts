import { defineConfig } from 'vitest/config';

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
  },
});
