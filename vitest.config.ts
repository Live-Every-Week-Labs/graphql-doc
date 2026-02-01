import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      graphql: path.resolve(__dirname, 'node_modules/graphql'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      enabled: true,
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/components/**/*.{ts,tsx}'],
      thresholds: {
        lines: 70,
        functions: 80,
        statements: 70,
        branches: 54,
      },
    },
  },
});
