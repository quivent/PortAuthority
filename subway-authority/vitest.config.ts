import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],

  test: {
    // Test environment
    environment: 'jsdom',

    // Global setup/teardown
    setupFiles: ['./tests/setup/vitest-setup.ts'],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData/',
        '**/__tests__/',
        'src/main.tsx',
        'src/vite-env.d.ts',
      ],
      // Coverage thresholds
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
      // Per-file thresholds for critical modules
      perFile: true,
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80,
    },

    // Test globals
    globals: true,

    // Include/exclude patterns
    include: ['src/**/*.{test,spec}.{ts,tsx}', 'tests/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],

    // Timeout configuration
    testTimeout: 10000,
    hookTimeout: 10000,

    // Reporter configuration
    reporters: ['verbose', 'html', 'json'],
    outputFile: {
      html: './coverage/test-report.html',
      json: './coverage/test-results.json',
    },

    // Mock configuration
    mockReset: true,
    restoreMocks: true,
    clearMocks: true,

    // Performance
    isolate: true,
    threads: true,
    maxThreads: 4,

    // UI mode configuration
    ui: true,

    // Benchmarking
    benchmark: {
      include: ['**/*.bench.{ts,tsx}'],
      outputFile: './tests/performance/results/benchmarks.json',
    },
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@stores': path.resolve(__dirname, './src/stores'),
      '@types': path.resolve(__dirname, './src/types'),
      '@services': path.resolve(__dirname, './src/services'),
      '@assets': path.resolve(__dirname, './src/assets'),
      '@tests': path.resolve(__dirname, './tests'),
    },
  },
});
