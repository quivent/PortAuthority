import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for E2E and visual regression testing
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',

  // Test file patterns
  testMatch: '**/*.spec.ts',

  // Timeout configuration
  timeout: 60000,
  expect: {
    timeout: 10000,
  },

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry configuration
  retries: process.env.CI ? 2 : 0,

  // Parallel execution
  workers: process.env.CI ? 2 : undefined,

  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'tests/e2e/reports' }],
    ['json', { outputFile: 'tests/e2e/reports/results.json' }],
    ['list'],
    ...(process.env.CI ? [['github'] as const] : []),
  ],

  // Shared settings for all projects
  use: {
    // Base URL for tests
    baseURL: 'http://localhost:1420',

    // Collect trace on failure
    trace: 'on-first-retry',

    // Screenshot configuration
    screenshot: 'only-on-failure',

    // Video configuration
    video: 'retain-on-failure',

    // Action timeout
    actionTimeout: 10000,

    // Navigation timeout
    navigationTimeout: 30000,

    // Viewport
    viewport: { width: 1280, height: 720 },

    // Ignore HTTPS errors
    ignoreHTTPSErrors: true,

    // Locale and timezone
    locale: 'en-US',
    timezoneId: 'America/New_York',
  },

  // Configure projects for major browsers and Electron
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // Electron-specific configuration for Tauri
    {
      name: 'electron',
      use: {
        ...devices['Desktop Chrome'],
        // Custom Electron launch configuration
        launchOptions: {
          executablePath: process.env.ELECTRON_PATH,
        },
      },
    },

    // Mobile viewports for responsive testing
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },

    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // Web server configuration for development
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:1420',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },

  // Global setup and teardown
  globalSetup: './tests/e2e/setup/global-setup.ts',
  globalTeardown: './tests/e2e/setup/global-teardown.ts',

  // Output directory for test artifacts
  outputDir: 'tests/e2e/artifacts',

  // Maximum failures before stopping
  maxFailures: process.env.CI ? 10 : undefined,

  // Update snapshots with --update-snapshots
  updateSnapshots: process.env.UPDATE_SNAPSHOTS === 'true' ? 'all' : 'missing',

  // Visual comparison configuration
  expect: {
    toHaveScreenshot: {
      maxDiffPixels: 100,
      threshold: 0.2,
    },
  },
});
