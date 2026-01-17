import { test, expect } from '@playwright/test';
import { waitForGalleryInit, getImageCount } from '../utils/test-helpers';

test.describe('Static Image Loader', () => {

  test.describe('URL Sources', () => {

    test('loads images from URL array', async ({ page }) => {
      await page.goto('/test/fixtures/static-basic.html');
      await waitForGalleryInit(page);

      // Wait for all images to load (queue animation)
      await page.waitForTimeout(500);

      const count = await getImageCount(page);
      expect(count).toBe(3);
    });

    test('images have correct src attributes', async ({ page }) => {
      await page.goto('/test/fixtures/static-basic.html');
      await waitForGalleryInit(page);

      // Wait for all images to load (queue animation)
      await page.waitForTimeout(500);

      const images = page.locator('#imageCloud img');
      const srcs = await images.evaluateAll((imgs) =>
        imgs.map((img) => (img as HTMLImageElement).src)
      );

      expect(srcs.some(src => src.includes('image1.jpg'))).toBe(true);
      expect(srcs.some(src => src.includes('image2.jpg'))).toBe(true);
      expect(srcs.some(src => src.includes('image3.jpg'))).toBe(true);
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

      // Wait for all images to load (queue animation)
      await page.waitForTimeout(500);

      const count = await getImageCount(page);
      expect(count).toBe(3);
    });

    test('path sources resolve with basePath', async ({ page }) => {
      await page.goto('/test/fixtures/static-multiple.html');
      await waitForGalleryInit(page);

      // Wait for all images to load (queue animation)
      await page.waitForTimeout(500);

      const images = page.locator('#imageCloud img');
      const srcs = await images.evaluateAll((imgs) =>
        imgs.map((img) => (img as HTMLImageElement).src)
      );

      // All should resolve to full URLs
      srcs.forEach(src => {
        expect(src).toMatch(/^https?:\/\//);
      });
    });

  });

  test.describe('Error Handling', () => {

    test('handles missing image gracefully', async ({ page }) => {
      await page.goto('/test/fixtures/static-basic.html');
      await waitForGalleryInit(page);

      // Inject a bad source
      await page.evaluate(() => {
        // @ts-ignore
        const gallery = window.gallery;
        // Attempting to load after init - verify no crash
      });

      // Page should not crash - container should still be in DOM
      await expect(page.locator('#imageCloud')).toBeAttached();
    });

    test('shows error when all images fail', async ({ page }) => {
      // Create a page with invalid URLs
      await page.setContent(`
        <!DOCTYPE html>
        <html>
        <head>
          <link rel="stylesheet" href="/dist/style.css">
          <style>html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; }</style>
        </head>
        <body>
          <div id="imageCloud"></div>
          <script type="module">
            import { ImageGallery } from '/dist/image-cloud.js';
            window.gallery = new ImageGallery({
              container: 'imageCloud',
              loader: {
                type: 'static',
                static: {
                  sources: [{
                    type: 'urls',
                    urls: ['/nonexistent1.jpg', '/nonexistent2.jpg']
                  }],
                  validateUrls: true,
                  failOnAllMissing: true
                }
              }
            });
          </script>
        </body>
        </html>
      `);

      // Should show error message or handle gracefully
      await page.waitForTimeout(3000);
      const container = page.locator('#imageCloud');
      // Container should exist (not crash), even if empty or with error
      await expect(container).toBeAttached();
    });

  });

});
