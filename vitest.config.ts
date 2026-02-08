import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    include: ['test/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['test/e2e/**', 'node_modules/**', '.next/**'],
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['app/**', 'lib/**', 'server/**', 'components/**'],
      exclude: [
        '**/*.config.*',
        '**/*.d.ts',
        '**/types/**',
        'test/**',
        '.next/**',
        'node_modules/**',
        '**/*.md',
        '**/*.json',
        '**/*.css',
      ],
      thresholds: {
        // Global thresholds - enforced in CI
        // Updated: 2026-02-08 based on current coverage
        global: {
          lines: 35,
          functions: 30,
          branches: 25,
          statements: 35,
        },
        // Core business logic - strict coverage required
        'lib/features/**': {
          lines: 70,
          functions: 65,
        },
        // API layer - integration tested
        'server/**': {
          lines: 65,
          functions: 60,
        },
        // UI layer - E2E補完のため低め
        'components/**': {
          lines: 20,
          functions: 15,
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@payload-config': path.resolve(__dirname, './test/mocks/payload-config.ts'),
    },
  },
});
