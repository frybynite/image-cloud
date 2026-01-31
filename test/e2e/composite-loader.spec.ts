import { test, expect } from '@playwright/test';
import { waitForGalleryInit, getImageCount } from '../utils/test-helpers';

test.describe('Composite Loader E2E', () => {

  test.describe('Basic Functionality', () => {

    test('loads images from multiple static loaders via JSON config', async ({ page }) => {
      await page.goto('/test/fixtures/composite-loader-basic.html');
      await waitForGalleryInit(page);

      // Wait for all images to load (queue animation)
      await page.waitForTimeout(1000);

      // Should have 6 images total (3 from each static loader)
      const count = await getImageCount(page);
      expect(count).toBe(6);
    });

    test('images have correct src attributes from both loaders', async ({ page }) => {
      await page.goto('/test/fixtures/composite-loader-basic.html');
      await waitForGalleryInit(page);

      // Wait for all images to load (queue animation)
      await page.waitForTimeout(1000);

      const images = page.locator('#imageCloud img');
      const srcs = await images.evaluateAll((imgs) =>
        imgs.map((img) => (img as HTMLImageElement).src)
      );

      // Check for images from first loader (image1-3)
      expect(srcs.some(src => src.includes('image1.jpg'))).toBe(true);
      expect(srcs.some(src => src.includes('image2.jpg'))).toBe(true);
      expect(srcs.some(src => src.includes('image3.jpg'))).toBe(true);

      // Check for images from second loader (food1-3)
      expect(srcs.some(src => src.includes('food1.jpg'))).toBe(true);
      expect(srcs.some(src => src.includes('food2.jpg'))).toBe(true);
      expect(srcs.some(src => src.includes('food3.jpg'))).toBe(true);
    });

    test('images are visible after load', async ({ page }) => {
      await page.goto('/test/fixtures/composite-loader-basic.html');
      await waitForGalleryInit(page);

      // Wait for all images to load
      await page.waitForTimeout(1000);

      const images = page.locator('#imageCloud img');
      const count = await images.count();

      expect(count).toBe(6);

      for (let i = 0; i < count; i++) {
        await expect(images.nth(i)).toBeVisible();
      }
    });

    test('preserves URL order from loaders', async ({ page }) => {
      await page.goto('/test/fixtures/composite-loader-basic.html');
      await waitForGalleryInit(page);

      // Wait for all images to load
      await page.waitForTimeout(1000);

      const images = page.locator('#imageCloud img');
      const srcs = await images.evaluateAll((imgs) =>
        imgs.map((img) => (img as HTMLImageElement).src)
      );

      // Find indices
      const image1Index = srcs.findIndex(src => src.includes('image1.jpg'));
      const food1Index = srcs.findIndex(src => src.includes('food1.jpg'));

      // First loader's images should come before second loader's
      expect(image1Index).toBeLessThan(food1Index);
    });

  });

  test.describe('Gallery Functionality', () => {

    test('clicking an image focuses it', async ({ page }) => {
      await page.goto('/test/fixtures/composite-loader-basic.html');
      await waitForGalleryInit(page);

      // Wait for all images to load
      await page.waitForTimeout(1000);

      const firstImage = page.locator('#imageCloud img').first();
      await firstImage.click();
      await page.waitForTimeout(200);

      // Check that image has the focused class
      const hasFocusedClass = await firstImage.evaluate((el) => el.classList.contains('fbn-ic-focused'));
      expect(hasFocusedClass).toBe(true);
    });

    test('pressing Escape unfocuses image', async ({ page }) => {
      await page.goto('/test/fixtures/composite-loader-basic.html');
      await waitForGalleryInit(page);

      // Wait for all images to load
      await page.waitForTimeout(1000);

      const firstImage = page.locator('#imageCloud img').first();

      // Focus the image
      await firstImage.click();
      await page.waitForTimeout(300);

      // Press Escape
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);

      // Image should return to normal z-index
      const zIndex = await firstImage.evaluate((el) => el.style.zIndex);
      expect(parseInt(zIndex) || 0).toBeLessThan(1000);
    });

  });

});
