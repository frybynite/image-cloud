import { test, expect } from '@playwright/test';
import { waitForGalleryInit, getImageTransform } from '../utils/test-helpers';

test.describe('Layout Algorithms', () => {

  test.describe('Radial Layout', () => {

    test('positions images within viewport', async ({ page }) => {
      // Uses fixture with dark background and red border for visual validation
      // Loads 12 images to test radial layout with multiple rings
      await page.goto('/test/fixtures/layout-viewport-test.html');
      await waitForGalleryInit(page);

      // Wait for all images to load with queue animation
      await page.waitForTimeout(1500);

      const images = page.locator('#imageCloud img');
      const count = await images.count();
      const viewport = page.viewportSize();

      // Should have loaded all 12 images
      expect(count).toBe(12);

      for (let i = 0; i < count; i++) {
        const box = await images.nth(i).boundingBox();
        expect(box).not.toBeNull();
        if (box && viewport) {
          // Image should be at least partially visible (some part within viewport)
          // Check that the image overlaps with the viewport area
          expect(box.x + box.width).toBeGreaterThan(0);
          expect(box.y + box.height).toBeGreaterThan(0);
          expect(box.x).toBeLessThan(viewport.width);
          expect(box.y).toBeLessThan(viewport.height);
        }
      }
    });

    test('applies rotation transforms', async ({ page }) => {
      await page.goto('/test/fixtures/static-basic.html');
      await waitForGalleryInit(page);

      // At least one image should have rotation
      const images = page.locator('#imageCloud img');
      const transforms = await images.evaluateAll((imgs) =>
        imgs.map((img) => window.getComputedStyle(img).transform)
      );

      // Transforms should contain rotation (matrix with non-1 values)
      const hasRotation = transforms.some(t =>
        t !== 'none' && !t.includes('matrix(1, 0, 0, 1')
      );
      expect(hasRotation).toBe(true);
    });

    test('layout applies dimensions to images', async ({ page }) => {
      await page.goto('/test/fixtures/static-basic.html');
      await waitForGalleryInit(page);

      const images = page.locator('#imageCloud img');
      const dimensions = await images.evaluateAll((imgs) =>
        imgs.map((img) => {
          const rect = img.getBoundingClientRect();
          return { width: rect.width, height: rect.height };
        })
      );

      // All images should have positive dimensions (layout applied sizes)
      dimensions.forEach(dim => {
        expect(dim.width).toBeGreaterThan(0);
        expect(dim.height).toBeGreaterThan(0);
      });
    });

  });

  test.describe('Random Layout', () => {

    test('distributes images at different positions', async ({ page }) => {
      // Load static-basic.html first, then reinitialize with random layout
      await page.goto('/test/fixtures/static-basic.html');
      await waitForGalleryInit(page);

      // Destroy current gallery and create new one with random layout
      await page.evaluate(async () => {
        // @ts-ignore
        if (window.gallery) {
          // @ts-ignore
          window.gallery.destroy();
        }
        // Clear container
        const container = document.getElementById('imageCloud');
        if (container) container.innerHTML = '';

        // @ts-ignore
        window.gallery = new window.ImageCloud({
          container: 'imageCloud',
          loaders: [{ static: {
              sources: [{urls:['/test/fixtures/images/image1.jpg','/test/fixtures/images/image2.jpg','/test/fixtures/images/image3.jpg']}],
              validateUrls: false
            } }],
          layout: { algorithm: 'random' }
        });
        // @ts-ignore
        await window.gallery.init();
      });

      // Wait for images to appear and queue animation to complete
      await page.waitForSelector('#imageCloud img', { state: 'visible', timeout: 10000 });
      await page.waitForTimeout(500);

      const images = page.locator('#imageCloud img');
      const positions = await images.evaluateAll((imgs) =>
        imgs.map((img) => {
          const rect = img.getBoundingClientRect();
          return { x: rect.x, y: rect.y };
        })
      );

      // Should have multiple images
      expect(positions.length).toBeGreaterThanOrEqual(2);

      // Verify images are at different positions (not all stacked)
      const uniquePositions = new Set(positions.map(p => `${Math.round(p.x)},${Math.round(p.y)}`));
      expect(uniquePositions.size).toBeGreaterThan(1);
    });

  });

  test.describe('Spacing', () => {

    test('images are positioned within viewport bounds', async ({ page }) => {
      await page.goto('/test/fixtures/static-basic.html');
      await waitForGalleryInit(page);
      // Wait for all 12 images to load (queue animation)
      await page.waitForTimeout(1500);

      const images = page.locator('#imageCloud img');
      const viewport = page.viewportSize();
      const positions = await images.evaluateAll((imgs) =>
        imgs.map((img) => {
          const rect = img.getBoundingClientRect();
          return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom };
        })
      );

      expect(positions.length).toBeGreaterThan(0);

      // Verify images are at least partially within the viewport
      positions.forEach(pos => {
        // At least part of the image should be visible in viewport
        expect(pos.right).toBeGreaterThan(0);
        expect(pos.bottom).toBeGreaterThan(0);
        if (viewport) {
          expect(pos.left).toBeLessThan(viewport.width);
          expect(pos.top).toBeLessThan(viewport.height);
        }
      });
    });

  });

});
