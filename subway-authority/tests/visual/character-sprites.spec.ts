/**
 * Visual Regression Tests - Character Sprites
 * Ensures character visuals remain consistent across updates
 */

import { test, expect } from '@playwright/test';

test.describe('Character Sprite Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="subway-map"]', { timeout: 10000 });
  });

  test('conductor sprite - neutral mood', async ({ page }) => {
    // Wait for character to appear
    const character = page.locator('[data-testid="character-conductor-1"]').first();
    await character.waitFor({ state: 'visible', timeout: 5000 });

    // Take screenshot
    await expect(character).toHaveScreenshot('conductor-neutral.png', {
      maxDiffPixels: 100,
    });
  });

  test('conductor sprite - happy mood', async ({ page }) => {
    // Trigger happy mood (e.g., by port opening)
    await page.click('[data-testid="scan-ports-btn"]');

    const character = page.locator('[data-testid="character-conductor-1"]').first();
    await character.waitFor({ state: 'visible', timeout: 5000 });

    // Wait for animation to settle
    await page.waitForTimeout(1000);

    await expect(character).toHaveScreenshot('conductor-happy.png', {
      maxDiffPixels: 150, // Allow some variance for animations
    });
  });

  test('station master sprite - working mood', async ({ page }) => {
    const character = page
      .locator('[data-testid="character-station-master-1"]')
      .first();
    await character.waitFor({ state: 'visible', timeout: 5000 });

    await expect(character).toHaveScreenshot('station-master-working.png', {
      maxDiffPixels: 100,
    });
  });

  test('maintenance crew sprite - inspecting', async ({ page }) => {
    const character = page
      .locator('[data-testid="character-maintenance-1"]')
      .first();
    await character.waitFor({ state: 'visible', timeout: 5000 });

    await expect(character).toHaveScreenshot('maintenance-inspecting.png', {
      maxDiffPixels: 100,
    });
  });

  test('dialogue bubble rendering', async ({ page }) => {
    // Trigger port event to show dialogue
    await page.click('[data-testid="scan-ports-btn"]');

    // Wait for dialogue to appear
    const dialogue = page.locator('[data-testid="character-dialogue"]').first();
    await dialogue.waitFor({ state: 'visible', timeout: 5000 });

    await expect(dialogue).toHaveScreenshot('dialogue-bubble.png', {
      maxDiffPixels: 100,
    });
  });

  test('character positions on map', async ({ page }) => {
    // Take full map screenshot with characters
    const map = page.locator('[data-testid="subway-map"]');
    await map.waitFor({ state: 'visible' });

    await expect(map).toHaveScreenshot('map-with-characters.png', {
      maxDiffPixels: 200,
      fullPage: true,
    });
  });

  test('character sprite animations', async ({ page }) => {
    const character = page.locator('[data-testid="character-conductor-1"]').first();
    await character.waitFor({ state: 'visible' });

    // Capture animation frames
    for (let i = 0; i < 3; i++) {
      await page.waitForTimeout(500);
      await expect(character).toHaveScreenshot(`conductor-animation-frame-${i}.png`, {
        maxDiffPixels: 200, // Allow variance for animation
      });
    }
  });
});

test.describe('UI Component Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('MTA notification card - info', async ({ page }) => {
    // Trigger notification
    await page.click('[data-testid="scan-ports-btn"]');

    const notification = page.locator('[data-testid="notification"]').first();
    await notification.waitFor({ state: 'visible', timeout: 5000 });

    await expect(notification).toHaveScreenshot('notification-info.png', {
      maxDiffPixels: 100,
    });
  });

  test('subway map - full view', async ({ page }) => {
    const map = page.locator('[data-testid="subway-map"]');
    await map.waitFor({ state: 'visible' });

    await expect(map).toHaveScreenshot('subway-map-full.png', {
      maxDiffPixels: 300,
      fullPage: false,
    });
  });

  test('station board - active ports', async ({ page }) => {
    await page.click('[data-testid="scan-ports-btn"]');

    const board = page.locator('[data-testid="station-board"]');
    await board.waitFor({ state: 'visible', timeout: 5000 });

    await expect(board).toHaveScreenshot('station-board-active.png', {
      maxDiffPixels: 150,
    });
  });

  test('service alert - warning', async ({ page }) => {
    const alert = page.locator('[data-testid="service-alert"]').first();

    if (await alert.isVisible()) {
      await expect(alert).toHaveScreenshot('service-alert-warning.png', {
        maxDiffPixels: 100,
      });
    }
  });

  test('map controls panel', async ({ page }) => {
    const controls = page.locator('[data-testid="map-controls"]');
    await controls.waitFor({ state: 'visible' });

    await expect(controls).toHaveScreenshot('map-controls.png', {
      maxDiffPixels: 100,
    });
  });
});

test.describe('Responsive Visual Regression', () => {
  test('desktop layout (1920x1080)', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await page.waitForSelector('[data-testid="subway-map"]');

    await expect(page).toHaveScreenshot('layout-desktop.png', {
      fullPage: true,
      maxDiffPixels: 500,
    });
  });

  test('tablet layout (768x1024)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.waitForSelector('[data-testid="subway-map"]');

    await expect(page).toHaveScreenshot('layout-tablet.png', {
      fullPage: true,
      maxDiffPixels: 500,
    });
  });

  test('mobile layout (375x667)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForSelector('[data-testid="subway-map"]');

    await expect(page).toHaveScreenshot('layout-mobile.png', {
      fullPage: true,
      maxDiffPixels: 500,
    });
  });
});
