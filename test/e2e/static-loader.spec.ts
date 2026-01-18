import { test, expect } from '@playwright/test';
import { waitForGalleryInit, getImageCount } from '../utils/test-helpers';

test.describe('Static Image Loader', () => {

  test.describe('URL Sources', () => {

    test('loads images from URL array', async ({ page }) => {
      await page.goto('/test/fixtures/static-basic.html');
      await waitForGalleryInit(page);

      // Wait for all images to load (queue animation)
      await page.waitForTimeout(1000);

      const count = await getImageCount(page);
      expect(count).toBe(12);
    });

    test('images have correct src attributes', async ({ page }) => {
      await page.goto('/test/fixtures/static-basic.html');
      await waitForGalleryInit(page);

      // Wait for all images to load (queue animation)
      await page.waitForTimeout(1000);

      const images = page.locator('#imageCloud img');
      const srcs = await images.evaluateAll((imgs) =>
        imgs.map((img) => (img as HTMLImageElement).src)
      );

      // Check for images from each category
      expect(srcs.some(src => src.includes('image1.jpg'))).toBe(true);
      expect(srcs.some(src => src.includes('computing1.jpg'))).toBe(true);
      expect(srcs.some(src => src.includes('food1.jpg'))).toBe(true);
      expect(srcs.some(src => src.includes('scenery1.jpg'))).toBe(true);
    });

    test('images are visible after load', async ({ page }) => {
      await page.goto('/test/fixtures/static-basic.html');
      await waitForGalleryInit(page);

      const images = page.locator('#imageCloud img');
      const count = await images.count();

      for (let i = 0; i < count; i++) {
        await expect(images.nth(i)).toBeVisible();
      }
    });

  });

  test.describe('Multiple Sources', () => {

    test('loads from mixed URL and path sources', async ({ page }) => {
      await page.goto('/test/fixtures/static-multiple.html');
      await waitForGalleryInit(page);

      // Wait for all images to load (queue animation with 12 images takes longer)
      await page.waitForTimeout(2000);

      const count = await getImageCount(page);
      // 3 from URLs + 9 from path (PDF filtered out) = 12 total
      expect(count).toBe(12);
    });

    test('path sources resolve with basePath', async ({ page }) => {
      await page.goto('/test/fixtures/static-multiple.html');
      await waitForGalleryInit(page);

      // Wait for all images to load (queue animation with 12 images takes longer)
      await page.waitForTimeout(2000);

      const images = page.locator('#imageCloud img');
      const srcs = await images.evaluateAll((imgs) =>
        imgs.map((img) => (img as HTMLImageElement).src)
      );

      // All should resolve to full URLs
      srcs.forEach(src => {
        expect(src).toMatch(/^https?:\/\//);
      });
    });

    test('filters out non-image files (PDF)', async ({ page }) => {
      await page.goto('/test/fixtures/static-multiple.html');
      await waitForGalleryInit(page);

      // Wait for all images to load (queue animation with 12 images takes longer)
      await page.waitForTimeout(2000);

      const images = page.locator('#imageCloud img');
      const srcs = await images.evaluateAll((imgs) =>
        imgs.map((img) => (img as HTMLImageElement).src)
      );

      // PDF should be filtered out
      expect(srcs.some(src => src.includes('.pdf'))).toBe(false);
      expect(srcs.some(src => src.includes('skip-me'))).toBe(false);

      // All sources should be image files
      srcs.forEach(src => {
        expect(src).toMatch(/\.(jpg|jpeg|png|gif|webp)$/i);
      });
    });

  });

  test.describe('Error Handling', () => {

    test('handles missing image gracefully', async ({ page }) => {
      // Load the basic gallery fixture
      await page.goto('/test/fixtures/static-basic.html');
      await waitForGalleryInit(page);

      // Wait for all 12 images to be present (queue animation)
      await expect(page.locator('#imageCloud img')).toHaveCount(12, { timeout: 10000 });

      // Get initial image count
      const initialCount = await getImageCount(page);
      expect(initialCount).toBe(12);

      // Dynamically add a broken image to the container
      await page.evaluate(() => {
        const container = document.getElementById('imageCloud');
        if (container) {
          const brokenImg = document.createElement('img');
          brokenImg.src = '/nonexistent-image-that-does-not-exist-12345.jpg';
          brokenImg.classList.add('cloud-image');
          brokenImg.style.height = '225px';
          brokenImg.style.position = 'absolute';
          brokenImg.style.left = '50px';
          brokenImg.style.top = '50px';
          container.appendChild(brokenImg);
        }
      });

      // Wait for the broken image to fail loading
      await page.waitForTimeout(500);

      // Page should not crash - container should still be in DOM
      await expect(page.locator('#imageCloud')).toBeAttached();

      // All images (including broken one) should be in DOM
      const allImages = page.locator('#imageCloud img');
      await expect(allImages).toHaveCount(13, { timeout: 2000 }); // 12 original + 1 broken

      // Only valid images should have loaded successfully
      const validLoadedImages = await allImages.evaluateAll((imgs) =>
        imgs.filter((img) => {
          const imgEl = img as HTMLImageElement;
          return imgEl.complete && imgEl.naturalWidth > 0;
        }).length
      );
      expect(validLoadedImages).toBe(12); // Only the original 12 loaded properly

      // Gallery should still be functional - verify an original image is clickable
      const firstImage = page.locator('#imageCloud img').first();
      await expect(firstImage).toBeVisible();
    });

    test('continues to work when some images fail to load', async ({ page }) => {
      // Load fixture with mixed valid and invalid URLs (1 valid, 2 invalid)
      await page.goto('/test/fixtures/static-mixed-errors.html');
      await waitForGalleryInit(page);

      // Wait for the gallery to initialize and images to attempt loading
      await page.waitForTimeout(1000);

      // Container should exist and not crash
      const container = page.locator('#imageCloud');
      await expect(container).toBeAttached();

      // Only successfully loaded images are added to the DOM
      // Failed images are not displayed (onerror doesn't add to displayQueue)
      const images = page.locator('#imageCloud img');
      const count = await images.count();
      expect(count).toBe(1); // Only the 1 valid image

      // Verify the valid image loaded successfully
      const validLoadedImages = await images.evaluateAll((imgs) =>
        imgs.filter((img) => {
          const imgEl = img as HTMLImageElement;
          return imgEl.complete && imgEl.naturalWidth > 0;
        }).length
      );
      expect(validLoadedImages).toBe(1);

      // Verify the gallery is still functional - image should be visible and clickable
      const firstImage = images.first();
      await expect(firstImage).toBeVisible();
    });

  });

});
