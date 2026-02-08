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
        // Core business logic - current: 46.51%, target: gradual increase
        'lib/features/**': {
          lines: 45,
          functions: 40,
        },
        // API layer - current: 100%, maintain high coverage
        'server/**': {
          lines: 90,
          functions: 85,
        },
        // UI layer - current: 16.38%, E2E補完のため低め
        'components/**': {
          lines: 15,
          functions: 12,
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
