import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    cache: false,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text'],
      include: ['src/**/*.{ts,tsx}'],
      // Only the shell and type declarations are excluded: both are covered end to end.
      exclude: ['src/main.tsx', 'src/types.ts', 'src/vite-env.d.ts'],
      // Floors set just under the 2026-11-18 measurement, so coverage cannot drift down.
      // Some handlers are covered by the Playwright suite rather than unit tests.
      thresholds: { statements: 80, branches: 85, functions: 65, lines: 80 },
    },
  },
});
