import { test, expect } from '@playwright/test';
import { waitForGalleryInit, waitForAnimation } from '../utils/test-helpers';

const TEST_IMAGES = [
  '/test/fixtures/images/image1.jpg',
  '/test/fixtures/images/image2.jpg',
  '/test/fixtures/images/image3.jpg',
  '/test/fixtures/images/food1.jpg',
  '/test/fixtures/images/food2.jpg',
  '/test/fixtures/images/food3.jpg'
];

test.describe('Visual Regression', () => {

  test.describe('Layout Algorithms', () => {

    test('radial layout appearance', async ({ page }) => {
      await page.goto('/test/fixtures/visual-radial.html');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 500);

      await expect(page.locator('#imageCloud')).toHaveScreenshot('layout-radial.png', {
        maxDiffPixelRatio: 0.15
      });
    });

    test('grid layout appearance', async ({ page }) => {
      await page.goto('/test/fixtures/visual-grid.html');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 500);

      await expect(page.locator('#imageCloud')).toHaveScreenshot('layout-grid.png', {
        maxDiffPixelRatio: 0.05
      });
    });

    test('spiral layout appearance', async ({ page }) => {
      await page.goto('/test/fixtures/visual-spiral.html');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 500);

      await expect(page.locator('#imageCloud')).toHaveScreenshot('layout-spiral.png', {
        maxDiffPixelRatio: 0.15
      });
    });

    test('cluster layout appearance', async ({ page }) => {
      await page.goto('/test/fixtures/visual-cluster.html');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 500);

      // Cluster layout has some inherent variability in positioning
      await expect(page.locator('#imageCloud')).toHaveScreenshot('layout-cluster.png', {
        maxDiffPixelRatio: 0.30
      });
    });

    test('wave layout appearance', async ({ page }) => {
      await page.goto('/test/fixtures/visual-wave.html');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 500);

      await expect(page.locator('#imageCloud')).toHaveScreenshot('layout-wave.png', {
        maxDiffPixelRatio: 0.05
      });
    });

  });

  test.describe('Styling', () => {

    test('border styling', async ({ page }) => {
      await page.goto('/test/fixtures/visual-border.html');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 500);

      await expect(page.locator('#imageCloud')).toHaveScreenshot('styling-border.png', {
        maxDiffPixelRatio: 0.05
      });
    });

    test('shadow preset md', async ({ page }) => {
      await page.goto('/test/fixtures/visual-shadow-md.html');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 500);

      await expect(page.locator('#imageCloud')).toHaveScreenshot('styling-shadow-md.png', {
        maxDiffPixelRatio: 0.05
      });
    });

    test('shadow preset glow', async ({ page }) => {
      await page.goto('/test/fixtures/visual-shadow-glow.html');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 500);

      await expect(page.locator('#imageCloud')).toHaveScreenshot('styling-shadow-glow.png', {
        maxDiffPixelRatio: 0.05
      });
    });

    test('filter grayscale', async ({ page }) => {
      await page.goto('/test/fixtures/visual-filter-grayscale.html');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 500);

      await expect(page.locator('#imageCloud')).toHaveScreenshot('styling-filter-grayscale.png', {
        maxDiffPixelRatio: 0.05
      });
    });

    test('filter sepia', async ({ page }) => {
      await page.goto('/test/fixtures/visual-filter-sepia.html');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 500);

      await expect(page.locator('#imageCloud')).toHaveScreenshot('styling-filter-sepia.png', {
        maxDiffPixelRatio: 0.05
      });
    });

    test('combined border and shadow', async ({ page }) => {
      await page.goto('/test/fixtures/visual-combined.html');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 500);

      await expect(page.locator('#imageCloud')).toHaveScreenshot('styling-combined.png', {
        maxDiffPixelRatio: 0.05
      });
    });

  });

  test.describe('Responsive', () => {

    test('desktop viewport', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto('/test/fixtures/visual-responsive-desktop.html');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 500);

      await expect(page.locator('#imageCloud')).toHaveScreenshot('responsive-desktop.png', {
        maxDiffPixelRatio: 0.05
      });
    });

    test('tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/test/fixtures/visual-responsive-tablet.html');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 500);

      await expect(page.locator('#imageCloud')).toHaveScreenshot('responsive-tablet.png', {
        maxDiffPixelRatio: 0.05
      });
    });

    test('mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/test/fixtures/visual-responsive-mobile.html');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 500);

      await expect(page.locator('#imageCloud')).toHaveScreenshot('responsive-mobile.png', {
        maxDiffPixelRatio: 0.05
      });
    });

  });

  test.describe('Dark Background', () => {

    test('gallery on dark background', async ({ page }) => {
      await page.goto('/test/fixtures/visual-dark.html');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 500);

      await expect(page.locator('#imageCloud')).toHaveScreenshot('dark-background.png', {
        maxDiffPixelRatio: 0.05
      });
    });

  });

});

// Note: Mobile project tests excluded - visual tests need consistent viewport sizes
// which are controlled within each test
