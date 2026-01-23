import { test, expect, devices } from '@playwright/test';
import { waitForGalleryInit, waitForAnimation } from '../utils/test-helpers';

test.describe('Responsive Behavior', () => {

  test.describe('Breakpoint Detection', () => {

    test('uses desktop sizes on large viewport', async ({ page }) => {
      await page.setViewportSize({ width: 1400, height: 900 });
      await page.goto('/test/fixtures/responsive.html');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 500);

      const img = page.locator('#imageCloud img').first();
      const height = await img.evaluate((el) => el.getBoundingClientRect().height);

      // Desktop height should be around 250px (responsive config)
      expect(height).toBeGreaterThanOrEqual(200);
    });

    test('uses tablet sizes on medium viewport', async ({ page }) => {
      await page.setViewportSize({ width: 900, height: 700 });
      await page.goto('/test/fixtures/responsive.html');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 500);

      const img = page.locator('#imageCloud img').first();
      const height = await img.evaluate((el) => el.getBoundingClientRect().height);

      // Tablet height should be between mobile (120px) and desktop (250px)
      // Actual height may vary due to aspect ratio, but should be in reasonable range
      expect(height).toBeGreaterThanOrEqual(150);
      expect(height).toBeLessThan(350);
    });

    test('uses mobile sizes on small viewport', async ({ page }) => {
      await page.setViewportSize({ width: 400, height: 700 });
      await page.goto('/test/fixtures/responsive.html');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 500);

      const img = page.locator('#imageCloud img').first();
      const height = await img.evaluate((el) => el.getBoundingClientRect().height);

      // Mobile height should be around 120px
      expect(height).toBeGreaterThanOrEqual(100);
      expect(height).toBeLessThan(180);
    });

  });

  test.describe('Viewport Resize', () => {

    test('recalculates layout on breakpoint change', async ({ page }) => {
      await page.setViewportSize({ width: 1400, height: 900 });
      await page.goto('/test/fixtures/responsive.html');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 500);

      const img = page.locator('#imageCloud img').first();
      const desktopHeight = await img.evaluate((el) => el.getBoundingClientRect().height);

      // Resize to mobile
      await page.setViewportSize({ width: 400, height: 700 });
      await waitForAnimation(page, 700); // Wait for debounced resize + animation

      const mobileHeight = await img.evaluate((el) => el.getBoundingClientRect().height);

      expect(mobileHeight).toBeLessThan(desktopHeight);
    });

    test('minor resize within breakpoint does not re-layout', async ({ page }) => {
      await page.setViewportSize({ width: 1400, height: 900 });
      await page.goto('/test/fixtures/responsive.html');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 500);

      const img = page.locator('#imageCloud img').first();
      const beforeBox = await img.boundingBox();

      // Minor resize (still in desktop breakpoint)
      await page.setViewportSize({ width: 1350, height: 850 });
      await waitForAnimation(page, 700);

      const afterBox = await img.boundingBox();

      // Position should be similar (layout preserved)
      // Note: Some repositioning may occur, so we check approximate equality
      expect(Math.abs(afterBox!.x - beforeBox!.x)).toBeLessThan(100);
    });

  });

  test.describe('Mobile-Specific', () => {

    test('uses mobile focus scale on small viewport', async ({ page }) => {
      await page.setViewportSize({ width: 400, height: 700 });
      await page.goto('/test/fixtures/interactions.html');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 500);

      const img = page.locator('#imageCloud img').first();
      const beforeBox = await img.boundingBox();

      // Force click in case images are overlapping
      await img.click({ force: true });
      await waitForAnimation(page, 300);

      const afterBox = await img.boundingBox();

      // Mobile scale is 2.0 (vs desktop 2.5), so scaling should be noticeable but not huge
      const scaleRatio = afterBox!.width / beforeBox!.width;
      expect(scaleRatio).toBeGreaterThan(1.5);
      expect(scaleRatio).toBeLessThan(3);
    });

  });

});

test.describe('Mobile Project', () => {
  // Use only viewport and userAgent from iPhone 13, not defaultBrowserType
  // (defaultBrowserType forces a new worker and can't be used in describe blocks)
  const { defaultBrowserType, ...iPhoneConfig } = devices['iPhone 13'];
  test.use(iPhoneConfig);

  test('renders correctly on iPhone', async ({ page }) => {
    await page.goto('/test/fixtures/responsive.html');
    await waitForGalleryInit(page);
    await waitForAnimation(page, 500); // Wait for all images to load via queue animation

    const container = page.locator('#imageCloud');
    await expect(container).toBeVisible();

    const images = page.locator('#imageCloud img');
    const count = await images.count();
    expect(count).toBe(3);
  });

});
