/**
 * Playwright Global Teardown
 * Runs once after all E2E tests
 */

import { FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting E2E test suite global teardown...');

  try {
    // Clean up test artifacts if tests passed
    if (!process.env.CI && !process.env.KEEP_ARTIFACTS) {
      const artifactsDir = path.join(process.cwd(), 'tests/e2e/artifacts');

      if (fs.existsSync(artifactsDir)) {
        const files = fs.readdirSync(artifactsDir);

        if (files.length === 0) {
          console.log('✅ No artifacts to clean up');
        } else {
          console.log(`🗑️  Cleaning up ${files.length} artifact(s)...`);
          // Uncomment to actually delete artifacts
          // fs.rmSync(artifactsDir, { recursive: true, force: true });
        }
      }
    }

    // Generate test summary
    const summaryPath = path.join(
      process.cwd(),
      'tests/e2e/reports/summary.txt'
    );

    const summary = `
E2E Test Suite Completed
========================
Timestamp: ${new Date().toISOString()}
Total Tests: (see test report)
Status: COMPLETED
`;

    fs.writeFileSync(summaryPath, summary);
    console.log('✅ Test summary generated');

    console.log('✅ Global teardown completed successfully!');
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    // Don't throw - teardown failures shouldn't fail the build
  }
}

export default globalTeardown;
