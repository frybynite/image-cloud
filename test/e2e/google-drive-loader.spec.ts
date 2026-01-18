import { test, expect } from '@playwright/test';
import { waitForGalleryInit } from '../utils/test-helpers';

// Skip mobile tests - Google Drive API tests are network-dependent
// and behavior is identical across devices
test.describe('Google Drive Loader', () => {
  test.beforeEach(async ({}, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'Skip on mobile - API behavior identical');
  });

  test.describe('Folder Loading', () => {

    test('loads images from public Google Drive folder', async ({ page }) => {
      await page.goto('/test/fixtures/google-drive-basic.html');

      // Wait for gallery initialization (may take longer due to API call)
      await page.waitForFunction(
        () => window.galleryInitPromise !== undefined,
        { timeout: 5000 }
      );

      // Wait for the init promise to resolve
      await page.evaluate(() => window.galleryInitPromise);

      // Wait for images to appear
      await page.waitForSelector('#imageCloud img', { state: 'visible', timeout: 15000 });

      // Should have loaded at least one image
      const images = page.locator('#imageCloud img');
      const count = await images.count();
      expect(count).toBeGreaterThan(0);
    });

    test('images have Google Drive CDN URLs', async ({ page }) => {
      await page.goto('/test/fixtures/google-drive-basic.html');

      await page.waitForFunction(() => window.galleryInitPromise !== undefined);
      await page.evaluate(() => window.galleryInitPromise);

      // Wait for images to load
      await page.waitForSelector('#imageCloud img', { state: 'visible', timeout: 15000 });
      await page.waitForTimeout(500);

      const images = page.locator('#imageCloud img');
      const srcs = await images.evaluateAll((imgs) =>
        imgs.map((img) => (img as HTMLImageElement).src)
      );

      // All images should use the Google CDN URL format
      srcs.forEach(src => {
        expect(src).toMatch(/lh3\.googleusercontent\.com|drive\.google\.com/);
      });
    });

    test('images are visible and rendered', async ({ page }) => {
      await page.goto('/test/fixtures/google-drive-basic.html');

      await page.waitForFunction(() => window.galleryInitPromise !== undefined);
      await page.evaluate(() => window.galleryInitPromise);

      await page.waitForSelector('#imageCloud img', { state: 'visible', timeout: 15000 });
      await page.waitForTimeout(1000);

      const images = page.locator('#imageCloud img');
      const count = await images.count();

      // Check each image is visible
      for (let i = 0; i < count; i++) {
        await expect(images.nth(i)).toBeVisible();
      }

      // Check images have loaded (naturalWidth > 0)
      const loadedImages = await images.evaluateAll((imgs) =>
        imgs.filter((img) => {
          const imgEl = img as HTMLImageElement;
          return imgEl.complete && imgEl.naturalWidth > 0;
        }).length
      );
      expect(loadedImages).toBeGreaterThan(0);
    });

  });

  test.describe('Layout Integration', () => {

    test('applies radial layout to Google Drive images', async ({ page }) => {
      await page.goto('/test/fixtures/google-drive-basic.html');

      await page.waitForFunction(() => window.galleryInitPromise !== undefined);
      await page.evaluate(() => window.galleryInitPromise);

      await page.waitForSelector('#imageCloud img', { state: 'visible', timeout: 15000 });
      await page.waitForTimeout(1000);

      // Check images have transforms applied
      const images = page.locator('#imageCloud img');
      const transforms = await images.evaluateAll((imgs) =>
        imgs.map((img) => window.getComputedStyle(img).transform)
      );

      // At least some images should have rotation (non-identity matrix)
      const hasTransform = transforms.some(t => t !== 'none');
      expect(hasTransform).toBe(true);
    });

    test('images are positioned within viewport', async ({ page }) => {
      await page.goto('/test/fixtures/google-drive-basic.html');

      await page.waitForFunction(() => window.galleryInitPromise !== undefined);
      await page.evaluate(() => window.galleryInitPromise);

      await page.waitForSelector('#imageCloud img', { state: 'visible', timeout: 15000 });
      await page.waitForTimeout(1000);

      const images = page.locator('#imageCloud img');
      const viewport = page.viewportSize();
      const count = await images.count();

      for (let i = 0; i < count; i++) {
        const box = await images.nth(i).boundingBox();
        expect(box).not.toBeNull();
        if (box && viewport) {
          // Image should be at least partially visible
          expect(box.x + box.width).toBeGreaterThan(0);
          expect(box.y + box.height).toBeGreaterThan(0);
        }
      }
    });

  });

  test.describe('Error Handling', () => {

    test('handles invalid API key gracefully', async ({ page }) => {
      // Navigate to a page and create gallery with invalid API key
      await page.goto('/test/fixtures/google-drive-unit-test.html');
      await page.waitForFunction(() => typeof window.GoogleDriveLoader !== 'undefined');

      const error = await page.evaluate(async () => {
        // @ts-ignore
        const loader = new window.GoogleDriveLoader({
          apiKey: 'INVALID_API_KEY_12345'
        });
        try {
          await loader.loadImagesFromFolder('https://drive.google.com/drive/folders/1HYxzGcUmPl5I5pUHlGUHDx2i5IS1f3Ph');
          return null;
        } catch (e) {
          return (e as Error).message;
        }
      });

      // Should either throw an error or fall back to direct loading
      // (which will also fail due to CORS, but shouldn't crash)
      expect(error).not.toBeNull();
    });

    test('handles non-existent folder gracefully', async ({ page }) => {
      await page.goto('/test/fixtures/google-drive-unit-test.html');
      await page.waitForFunction(() => typeof window.GoogleDriveLoader !== 'undefined');

      const error = await page.evaluate(async () => {
        // @ts-ignore
        const loader = new window.GoogleDriveLoader({
          apiKey: 'AIzaSyD5mCAAOFnUrTABbgZHeEHoq5h5YALI3jc'
        });
        try {
          // Use a folder ID that doesn't exist or isn't shared
          await loader.loadImagesFromFolder('https://drive.google.com/drive/folders/NONEXISTENT_FOLDER_ID_12345');
          return null;
        } catch (e) {
          return (e as Error).message;
        }
      });

      // Should throw an error for non-existent folder
      expect(error).not.toBeNull();
    });

  });

  test.describe('Loader Direct API', () => {

    test('loadFiles handles array of file URLs', async ({ page }) => {
      await page.goto('/test/fixtures/google-drive-unit-test.html');
      await page.waitForFunction(() => typeof window.GoogleDriveLoader !== 'undefined');

      // Test with valid file ID format (won't actually load, but tests URL generation)
      const result = await page.evaluate(async () => {
        // @ts-ignore
        const loader = new window.GoogleDriveLoader({});
        // Without API key, loadFiles just converts IDs to URLs
        return await loader.loadFiles(['abc123', 'def456']);
      });

      expect(result).toHaveLength(2);
      expect(result[0]).toContain('abc123');
      expect(result[1]).toContain('def456');
    });

  });

});

// Add type declarations for window
declare global {
  interface Window {
    galleryInitPromise: Promise<void>;
    galleryInitError?: Error;
    GoogleDriveLoader: any;
    ImageGallery: any;
    gallery: any;
  }
}
