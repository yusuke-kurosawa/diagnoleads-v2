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
        // Updated: 2026-02-07 based on current coverage
        lines: 30,
        functions: 25,
        branches: 20,
        statements: 30,
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
