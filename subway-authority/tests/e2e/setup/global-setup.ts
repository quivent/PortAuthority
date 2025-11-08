/**
 * Playwright Global Setup
 * Runs once before all E2E tests
 */

import { chromium, FullConfig } from '@playwright/test';
import path from 'path';
import fs from 'fs';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting E2E test suite global setup...');

  // Create necessary directories
  const dirs = [
    'tests/e2e/screenshots',
    'tests/e2e/videos',
    'tests/e2e/artifacts',
    'tests/e2e/reports',
  ];

  for (const dir of dirs) {
    const dirPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`✅ Created directory: ${dir}`);
    }
  }

  // Launch browser for pre-test checks
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Wait for dev server to be ready
    const baseURL = config.use?.baseURL || 'http://localhost:1420';
    console.log(`⏳ Waiting for dev server at ${baseURL}...`);

    let retries = 0;
    const maxRetries = 60; // 60 seconds

    while (retries < maxRetries) {
      try {
        const response = await page.goto(baseURL, {
          waitUntil: 'domcontentloaded',
          timeout: 2000,
        });

        if (response?.ok()) {
          console.log('✅ Dev server is ready!');
          break;
        }
      } catch (error) {
        retries++;
        if (retries >= maxRetries) {
          throw new Error(`Dev server not ready after ${maxRetries} seconds`);
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    // Perform any additional setup (e.g., seed test data, clear storage)
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    console.log('✅ Global setup completed successfully!');
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;
