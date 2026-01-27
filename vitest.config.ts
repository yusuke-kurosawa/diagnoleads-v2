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
        // Global thresholds - set to current baseline for gradual improvement
        // Current: 15.65% statements, 9.82% branches, 9.42% functions, 15.96% lines
        lines: 15,
        functions: 9,
        branches: 9,
        statements: 15,
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
