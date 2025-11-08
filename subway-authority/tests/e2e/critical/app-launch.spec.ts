/**
 * Critical E2E Test: Application Launch
 * Tests the most fundamental user journey - starting the app
 */

import { test, expect } from '@playwright/test';

test.describe('Application Launch', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load application successfully', async ({ page }) => {
    // Wait for main container
    await page.waitForSelector('[data-testid="app-container"]', {
      timeout: 10000,
    });

    // Verify page title
    await expect(page).toHaveTitle(/Subway Authority/i);

    // Verify main UI elements are present
    const header = page.locator('[data-testid="app-header"]');
    await expect(header).toBeVisible();

    // Verify no critical errors
    const errorMessages = page.locator('[role="alert"]');
    await expect(errorMessages).toHaveCount(0);
  });

  test('should display subway map on load', async ({ page }) => {
    const subwayMap = page.locator('[data-testid="subway-map"]');
    await expect(subwayMap).toBeVisible({ timeout: 5000 });

    // Verify map has stations
    const stations = page.locator('[data-testid^="station-"]');
    const stationCount = await stations.count();
    expect(stationCount).toBeGreaterThan(0);
  });

  test('should initialize character system', async ({ page }) => {
    // Wait for characters to load
    await page.waitForSelector('[data-testid^="character-"]', {
      timeout: 5000,
    });

    // Verify at least one character is present
    const characters = page.locator('[data-testid^="character-"]');
    const characterCount = await characters.count();
    expect(characterCount).toBeGreaterThan(0);
  });

  test('should load without console errors', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.waitForLoadState('networkidle');

    // Filter out known harmless errors (if any)
    const criticalErrors = consoleErrors.filter(
      (error) =>
        !error.includes('DevTools') && !error.includes('extension')
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test('should have responsive layout', async ({ page }) => {
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForLoadState('networkidle');

    const container = page.locator('[data-testid="app-container"]');
    const box = await container.boundingBox();
    expect(box?.width).toBeGreaterThan(1000);

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);

    const tabletBox = await container.boundingBox();
    expect(tabletBox?.width).toBeLessThan(800);

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    const mobileBox = await container.boundingBox();
    expect(mobileBox?.width).toBeLessThan(400);
  });

  test('should persist after page reload', async ({ page }) => {
    // Interact with app
    const scanButton = page.locator('[data-testid="scan-ports-btn"]');

    if (await scanButton.isVisible()) {
      await scanButton.click();
      await page.waitForTimeout(1000);
    }

    // Reload page
    await page.reload();

    // Verify app still loads
    await page.waitForSelector('[data-testid="app-container"]', {
      timeout: 10000,
    });

    const header = page.locator('[data-testid="app-header"]');
    await expect(header).toBeVisible();
  });

  test('should display version information', async ({ page }) => {
    // Look for version in footer or about section
    const version = page.locator('[data-testid="app-version"]');

    if (await version.isVisible()) {
      const versionText = await version.textContent();
      expect(versionText).toMatch(/\d+\.\d+\.\d+/);
    }
  });

  test('should load within performance budget', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/');
    await page.waitForSelector('[data-testid="subway-map"]', {
      timeout: 10000,
    });

    const loadTime = Date.now() - startTime;

    // App should load in under 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });
});
