import { test, expect } from '@playwright/test';
import { waitForGalleryInit, getImageCount } from '../utils/test-helpers';

test.describe('Static Loader - URLs Shorthand & JSON Source', () => {

  test.describe('URLs Shorthand', () => {

    test('loads images from urls shorthand', async ({ page }) => {
      await page.goto('/test/fixtures/static-urls-shorthand.html');
      await waitForGalleryInit(page);

      await page.waitForTimeout(1000);

      const count = await getImageCount(page);
      expect(count).toBe(6);
    });

    test('images have correct src attributes from urls shorthand', async ({ page }) => {
      await page.goto('/test/fixtures/static-urls-shorthand.html');
      await waitForGalleryInit(page);

      await page.waitForTimeout(1000);

      const images = page.locator('#imageCloud img');
      const srcs = await images.evaluateAll((imgs) =>
        imgs.map((img) => (img as HTMLImageElement).src)
      );

      expect(srcs.some(src => src.includes('image1.jpg'))).toBe(true);
      expect(srcs.some(src => src.includes('food1.jpg'))).toBe(true);
    });

    test('images are visible after load via urls shorthand', async ({ page }) => {
      await page.goto('/test/fixtures/static-urls-shorthand.html');
      await waitForGalleryInit(page);

      await page.waitForTimeout(1000);

      const images = page.locator('#imageCloud img');
      const count = await images.count();
      expect(count).toBe(6);

      for (let i = 0; i < count; i++) {
        await expect(images.nth(i)).toBeVisible();
      }
    });

  });

  test.describe('JSON Source', () => {

    test('loads images from JSON endpoint', async ({ page }) => {
      await page.goto('/test/fixtures/static-json-source.html');
      await waitForGalleryInit(page);

      await page.waitForTimeout(1000);

      const count = await getImageCount(page);
      expect(count).toBe(6);
    });

    test('images from JSON source have correct src attributes', async ({ page }) => {
      await page.goto('/test/fixtures/static-json-source.html');
      await waitForGalleryInit(page);

      await page.waitForTimeout(1000);

      const images = page.locator('#imageCloud img');
      const srcs = await images.evaluateAll((imgs) =>
        imgs.map((img) => (img as HTMLImageElement).src)
      );

      expect(srcs.some(src => src.includes('scenery1.jpg'))).toBe(true);
      expect(srcs.some(src => src.includes('computing1.jpg'))).toBe(true);
    });

  });

  test.describe('Gallery Functionality', () => {

    test('clicking an image focuses it (urls shorthand)', async ({ page }) => {
      await page.goto('/test/fixtures/static-urls-shorthand.html');
      await waitForGalleryInit(page);

      await page.waitForTimeout(1000);

      const firstImage = page.locator('#imageCloud img').first();
      await firstImage.click();
      await page.waitForTimeout(200);

      const hasFocusedClass = await firstImage.evaluate((el) => el.classList.contains('fbn-ic-focused'));
      expect(hasFocusedClass).toBe(true);
    });

    test('pressing Escape unfocuses image (json source)', async ({ page }) => {
      await page.goto('/test/fixtures/static-json-source.html');
      await waitForGalleryInit(page);

      await page.waitForTimeout(1000);

      const firstImage = page.locator('#imageCloud img').first();

      await firstImage.click();
      await page.waitForTimeout(300);

      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);

      const zIndex = await firstImage.evaluate((el) => el.style.zIndex);
      expect(parseInt(zIndex) || 0).toBeLessThan(1000);
    });

  });

});
