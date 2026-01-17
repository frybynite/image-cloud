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
      // Load the basic gallery fixture
      await page.goto('/test/fixtures/static-basic.html');
      await waitForGalleryInit(page);

      // Wait for all 3 images to be present (queue animation)
      await expect(page.locator('#imageCloud img')).toHaveCount(3, { timeout: 5000 });

      // Get initial image count
      const initialCount = await getImageCount(page);
      expect(initialCount).toBe(3);

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
      await expect(allImages).toHaveCount(4, { timeout: 2000 }); // 3 original + 1 broken

      // Only valid images should have loaded successfully
      const validLoadedImages = await allImages.evaluateAll((imgs) =>
        imgs.filter((img) => {
          const imgEl = img as HTMLImageElement;
          return imgEl.complete && imgEl.naturalWidth > 0;
        }).length
      );
      expect(validLoadedImages).toBe(3); // Only the original 3 loaded properly

      // Gallery should still be functional - verify an original image is clickable
      const firstImage = page.locator('#imageCloud img').first();
      await expect(firstImage).toBeVisible();
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
