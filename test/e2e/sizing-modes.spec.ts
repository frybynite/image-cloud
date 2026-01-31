import { test, expect } from '@playwright/test';
import { waitForGalleryInit, waitForAnimation } from '../utils/test-helpers';

test.describe('Sizing Modes', () => {

  test.describe('Fixed Mode', () => {

    test('applies consistent height to all images', async ({ page }) => {
      await page.setViewportSize({ width: 1200, height: 800 });
      await page.goto('/test/fixtures/sizing-fixed.html');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 500);

      const images = page.locator('#imageCloud img');
      const count = await images.count();
      expect(count).toBeGreaterThan(0);

      // Check all images have approximately the same height (150px configured)
      const heights: number[] = [];
      for (let i = 0; i < count; i++) {
        const height = await images.nth(i).evaluate((el) => el.getBoundingClientRect().height);
        heights.push(height);
      }

      // All heights should be close to 150px (allowing for minor rendering differences)
      for (const height of heights) {
        expect(height).toBeGreaterThanOrEqual(140);
        expect(height).toBeLessThanOrEqual(160);
      }
    });

    test('maintains fixed height regardless of viewport size', async ({ page }) => {
      // Start with large viewport
      await page.setViewportSize({ width: 1600, height: 1000 });
      await page.goto('/test/fixtures/sizing-fixed.html');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 500);

      const img = page.locator('#imageCloud img').first();
      const largeViewportHeight = await img.evaluate((el) => el.getBoundingClientRect().height);

      // Resize to smaller viewport
      await page.setViewportSize({ width: 800, height: 600 });
      await waitForAnimation(page, 700);

      const smallViewportHeight = await img.evaluate((el) => el.getBoundingClientRect().height);

      // Fixed mode: height should remain the same regardless of viewport
      expect(Math.abs(largeViewportHeight - smallViewportHeight)).toBeLessThan(10);
    });

  });

  test.describe('Responsive Mode', () => {

    test('applies different heights per breakpoint', async ({ page }) => {
      // Desktop viewport (>= 1200px)
      await page.setViewportSize({ width: 1400, height: 900 });
      await page.goto('/test/fixtures/responsive.html');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 500);

      const img = page.locator('#imageCloud img').first();
      const desktopHeight = await img.evaluate((el) => el.getBoundingClientRect().height);

      // Desktop should use screen height (250px)
      expect(desktopHeight).toBeGreaterThanOrEqual(200);
      expect(desktopHeight).toBeLessThanOrEqual(300);
    });

    test('uses tablet height on medium viewport', async ({ page }) => {
      // Tablet viewport (768-1199px)
      await page.setViewportSize({ width: 900, height: 700 });
      await page.goto('/test/fixtures/responsive.html');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 500);

      const img = page.locator('#imageCloud img').first();
      const tabletHeight = await img.evaluate((el) => el.getBoundingClientRect().height);

      // Tablet should use tablet height (180px)
      expect(tabletHeight).toBeGreaterThanOrEqual(150);
      expect(tabletHeight).toBeLessThanOrEqual(220);
    });

    test('uses mobile height on small viewport', async ({ page }) => {
      // Mobile viewport (<= 767px)
      await page.setViewportSize({ width: 400, height: 700 });
      await page.goto('/test/fixtures/responsive.html');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 500);

      const img = page.locator('#imageCloud img').first();
      const mobileHeight = await img.evaluate((el) => el.getBoundingClientRect().height);

      // Mobile should use mobile height (120px)
      expect(mobileHeight).toBeGreaterThanOrEqual(100);
      expect(mobileHeight).toBeLessThanOrEqual(160);
    });

    test('changes height when crossing breakpoint threshold', async ({ page }) => {
      // Start at desktop
      await page.setViewportSize({ width: 1400, height: 900 });
      await page.goto('/test/fixtures/responsive.html');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 500);

      const img = page.locator('#imageCloud img').first();
      const desktopHeight = await img.evaluate((el) => el.getBoundingClientRect().height);

      // Resize to mobile (cross breakpoint)
      await page.setViewportSize({ width: 400, height: 700 });
      await waitForAnimation(page, 700);

      const mobileHeight = await img.evaluate((el) => el.getBoundingClientRect().height);

      // Height should decrease significantly
      expect(mobileHeight).toBeLessThan(desktopHeight - 50);
    });

  });

  test.describe('Adaptive Mode', () => {

    test('calculates size based on container', async ({ page }) => {
      await page.setViewportSize({ width: 1200, height: 800 });
      await page.goto('/test/fixtures/sizing-adaptive.html');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 500);

      const img = page.locator('#imageCloud img').first();
      const height = await img.evaluate((el) => el.getBoundingClientRect().height);

      // Should be within minSize (80) and maxSize (300)
      expect(height).toBeGreaterThanOrEqual(80);
      expect(height).toBeLessThanOrEqual(300);
    });

    test('respects minSize constraint', async ({ page }) => {
      await page.setViewportSize({ width: 1200, height: 800 });
      await page.goto('/test/fixtures/sizing-adaptive.html');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 500);

      const images = page.locator('#imageCloud img');
      const count = await images.count();

      // All images should be at least minSize (80px)
      for (let i = 0; i < count; i++) {
        const height = await images.nth(i).evaluate((el) => el.getBoundingClientRect().height);
        expect(height).toBeGreaterThanOrEqual(75); // Allow small tolerance
      }
    });

    test('respects maxSize constraint', async ({ page }) => {
      await page.setViewportSize({ width: 1200, height: 800 });
      await page.goto('/test/fixtures/sizing-adaptive.html');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 500);

      const images = page.locator('#imageCloud img');
      const count = await images.count();

      // All images should be at most maxSize (300px)
      for (let i = 0; i < count; i++) {
        const height = await images.nth(i).evaluate((el) => el.getBoundingClientRect().height);
        expect(height).toBeLessThanOrEqual(310); // Allow small tolerance
      }
    });

    test('adjusts size when viewport changes', async ({ page }) => {
      // Start with large viewport
      await page.setViewportSize({ width: 1600, height: 1000 });
      await page.goto('/test/fixtures/sizing-adaptive.html');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 500);

      const img = page.locator('#imageCloud img').first();
      const largeHeight = await img.evaluate((el) => el.getBoundingClientRect().height);

      // Resize to smaller viewport
      await page.setViewportSize({ width: 600, height: 500 });
      await waitForAnimation(page, 700);

      const smallHeight = await img.evaluate((el) => el.getBoundingClientRect().height);

      // Adaptive mode: smaller container should produce smaller images
      // (unless constrained by minSize)
      expect(smallHeight).toBeLessThanOrEqual(largeHeight + 10);
    });

  });

  test.describe('Mode Comparison', () => {

    test('fixed mode ignores container size changes', async ({ page }) => {
      await page.setViewportSize({ width: 1400, height: 900 });
      await page.goto('/test/fixtures/sizing-fixed.html');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 500);

      const img = page.locator('#imageCloud img').first();
      const beforeHeight = await img.evaluate((el) => el.getBoundingClientRect().height);

      // Significant viewport change
      await page.setViewportSize({ width: 600, height: 400 });
      await waitForAnimation(page, 700);

      const afterHeight = await img.evaluate((el) => el.getBoundingClientRect().height);

      // Fixed height should remain constant
      expect(Math.abs(afterHeight - beforeHeight)).toBeLessThan(10);
    });

    test('responsive mode changes with breakpoints but fixed within breakpoint', async ({ page }) => {
      // Within desktop breakpoint
      await page.setViewportSize({ width: 1400, height: 900 });
      await page.goto('/test/fixtures/responsive.html');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 500);

      const img = page.locator('#imageCloud img').first();
      const height1 = await img.evaluate((el) => el.getBoundingClientRect().height);

      // Still within desktop breakpoint (>= 1200)
      await page.setViewportSize({ width: 1250, height: 850 });
      await waitForAnimation(page, 700);

      const height2 = await img.evaluate((el) => el.getBoundingClientRect().height);

      // Height should be similar (same breakpoint)
      expect(Math.abs(height1 - height2)).toBeLessThan(20);
    });

  });

});
