const { test, expect } = require('@playwright/test');

const TEST_PAGE = '/tests/test-page.html';

test.describe('Icemap Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(TEST_PAGE);
    await page.waitForLoadState('networkidle');
  });

  test('@visual - Normal state layout', async ({ page }) => {
    // test-page.html auto-calls setNormalState() on load
    await page.waitForSelector('#map-container', { timeout: 5000 });
    await expect(page).toHaveScreenshot('normal-state.png');
  });

  test('@visual - Loading state', async ({ page }) => {
    // Trigger loading state via the test page control
    await page.click('button:has-text("Show Loading State")');
    await page.waitForSelector('text=Loading map...', { timeout: 5000 });
    await expect(page).toHaveScreenshot('loading-state.png');
  });

  test('@visual - Error state', async ({ page }) => {
    // Trigger error state via the test page control
    await page.click('button:has-text("Show Error State")');
    await page.waitForSelector('text=Map Error', { timeout: 5000 });
    await expect(page).toHaveScreenshot('error-state.png');
  });

  test('@visual - Mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(TEST_PAGE);
    await page.waitForSelector('#map-container', { timeout: 5000 });
    await expect(page).toHaveScreenshot('mobile-viewport.png');
  });

  test('@visual - Tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(TEST_PAGE);
    await page.waitForSelector('#map-container', { timeout: 5000 });
    await expect(page).toHaveScreenshot('tablet-viewport.png');
  });

  test('@visual - Desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(TEST_PAGE);
    await page.waitForSelector('#map-container', { timeout: 5000 });
    await expect(page).toHaveScreenshot('desktop-viewport.png');
  });
});
