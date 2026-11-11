import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    include: ['tests/integration/**/*.test.mjs'],
    environment: 'node',
    setupFiles: ['tests/env.mjs'],
    fileParallelism: false,
    testTimeout: 30000,
    hookTimeout: 60000,
  },
});
