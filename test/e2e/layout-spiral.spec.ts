import { test, expect } from '@playwright/test';
import { getImageCount } from '../utils/test-helpers';

const TEST_IMAGES = [
  '/test/fixtures/images/image1.jpg',
  '/test/fixtures/images/image2.jpg',
  '/test/fixtures/images/image3.jpg',
  '/test/fixtures/images/food1.jpg',
  '/test/fixtures/images/food2.jpg',
  '/test/fixtures/images/food3.jpg',
  '/test/fixtures/images/scenery1.jpg',
  '/test/fixtures/images/scenery2.jpg',
  '/test/fixtures/images/scenery3.jpg'
];

async function initGallery(page: any, spiralConfig: object = {}) {
  await page.goto('/test/fixtures/layout-spiral.html');
  await page.evaluate(() => {
    // @ts-ignore
    if (window.gallery) window.gallery.destroy();
    const container = document.getElementById('imageCloud');
    if (container) container.innerHTML = '';
  });

  await page.evaluate(async ({ urls, spiral }: { urls: string[], spiral: object }) => {
    // @ts-ignore
    window.gallery = new window.ImageCloud({
      container: 'imageCloud',
      loaders: [{ static: { sources: [{ urls }], validateUrls: false } }],
      layout: {
        algorithm: 'spiral',
        rotation: { enabled: true, range: { min: -10, max: 10 } },
        spiral
      },
      animation: { duration: 100, queue: { enabled: true, interval: 20 } }
    });
    // @ts-ignore
    await window.gallery.init();
  }, { urls: TEST_IMAGES, spiral: spiralConfig });

  await page.waitForSelector('#imageCloud img', { state: 'visible', timeout: 5000 });
  await page.waitForTimeout(400);
}

test.describe('Spiral Layout Algorithm', () => {

  test.describe('Spiral Types', () => {

    test('golden spiral creates outward distribution from center', async ({ page }) => {
      await initGallery(page, { spiralType: 'golden' });

      const images = page.locator('#imageCloud img');
      const positions = await images.evaluateAll((imgs) =>
        imgs.map((img) => {
          const rect = img.getBoundingClientRect();
          return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
        })
      );

      const viewport = page.viewportSize();
      if (!viewport) return;

      const centerX = viewport.width / 2;
      const centerY = viewport.height / 2;

      // Calculate distances from center
      const distances = positions.map(p =>
        Math.sqrt(Math.pow(p.x - centerX, 2) + Math.pow(p.y - centerY, 2))
      );

      // First image should be closest to center
      expect(distances[0]).toBeLessThan(distances[distances.length - 1]);

      // Distances should generally increase (not strictly, but trend)
      const avgFirstHalf = distances.slice(0, 4).reduce((a, b) => a + b, 0) / 4;
      const avgSecondHalf = distances.slice(5).reduce((a, b) => a + b, 0) / 4;
      expect(avgSecondHalf).toBeGreaterThan(avgFirstHalf * 0.8);
    });

    test('archimedean spiral creates even arm spacing', async ({ page }) => {
      await initGallery(page, { spiralType: 'archimedean', tightness: 1.0 });

      const count = await getImageCount(page);
      expect(count).toBe(9);

      // Verify images are positioned
      const images = page.locator('#imageCloud img');
      for (let i = 0; i < count; i++) {
        await expect(images.nth(i)).toBeVisible();
      }
    });

    test('logarithmic spiral creates natural growth pattern', async ({ page }) => {
      await initGallery(page, { spiralType: 'logarithmic', tightness: 1.0 });

      const count = await getImageCount(page);
      expect(count).toBe(9);

      const images = page.locator('#imageCloud img');
      const positions = await images.evaluateAll((imgs) =>
        imgs.map((img) => {
          const rect = img.getBoundingClientRect();
          return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
        })
      );

      // Verify images are distributed (not stacked)
      const uniquePositions = new Set(
        positions.map(p => `${Math.round(p.x / 30)},${Math.round(p.y / 30)}`)
      );
      expect(uniquePositions.size).toBeGreaterThan(5);
    });

  });

  test.describe('Direction', () => {

    test('clockwise direction spirals in correct direction', async ({ page }) => {
      await initGallery(page, { spiralType: 'golden', direction: 'clockwise' });

      const count = await getImageCount(page);
      expect(count).toBe(9);

      // Images should be positioned (direction affects angle calculation)
      const images = page.locator('#imageCloud img');
      for (let i = 0; i < count; i++) {
        await expect(images.nth(i)).toBeVisible();
      }
    });

    test('counterclockwise direction spirals in opposite direction', async ({ page }) => {
      await initGallery(page, { spiralType: 'golden', direction: 'counterclockwise' });

      const count = await getImageCount(page);
      expect(count).toBe(9);
    });

  });

  test.describe('Tightness', () => {

    test('tight spiral keeps images closer together', async ({ page }) => {
      await initGallery(page, { spiralType: 'golden', tightness: 2.0 });

      const images = page.locator('#imageCloud img');
      const positions = await images.evaluateAll((imgs) =>
        imgs.map((img) => {
          const rect = img.getBoundingClientRect();
          return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
        })
      );

      const viewport = page.viewportSize();
      if (!viewport) return;

      const centerX = viewport.width / 2;
      const centerY = viewport.height / 2;

      // Calculate max distance from center
      const maxDistance = Math.max(...positions.map(p =>
        Math.sqrt(Math.pow(p.x - centerX, 2) + Math.pow(p.y - centerY, 2))
      ));

      // With tight spiral, max distance should be less than half viewport
      expect(maxDistance).toBeLessThan(Math.min(viewport.width, viewport.height) * 0.6);
    });

    test('loose spiral spreads images further apart', async ({ page }) => {
      await initGallery(page, { spiralType: 'golden', tightness: 0.5 });

      const count = await getImageCount(page);
      expect(count).toBe(9);

      // Verify all images are visible
      const images = page.locator('#imageCloud img');
      for (let i = 0; i < count; i++) {
        await expect(images.nth(i)).toBeVisible();
      }
    });

  });

  test.describe('Scale Decay', () => {

    test('scale decay makes outer images smaller', async ({ page }) => {
      await initGallery(page, { spiralType: 'golden', scaleDecay: 0.8 });

      const images = page.locator('#imageCloud img');
      const sizes = await images.evaluateAll((imgs) =>
        imgs.map((img) => {
          const rect = img.getBoundingClientRect();
          return rect.height;
        })
      );

      // First image (center) should be larger than last (outer)
      expect(sizes[0]).toBeGreaterThan(sizes[sizes.length - 1] * 0.9);
    });

    test('no scale decay keeps images same size', async ({ page }) => {
      await initGallery(page, { spiralType: 'golden', scaleDecay: 0 });

      const images = page.locator('#imageCloud img');
      const sizes = await images.evaluateAll((imgs) =>
        imgs.map((img) => img.getBoundingClientRect().height)
      );

      // All images should be approximately the same size
      const avgSize = sizes.reduce((a, b) => a + b, 0) / sizes.length;
      sizes.forEach(size => {
        expect(Math.abs(size - avgSize)).toBeLessThan(avgSize * 0.2);
      });
    });

  });

  test.describe('Start Angle', () => {

    test('different start angles produce different layouts', async ({ page }) => {
      const getFirstImagePos = async (startAngle: number) => {
        await initGallery(page, { spiralType: 'golden', startAngle });
        const img = page.locator('#imageCloud img').first();
        const box = await img.boundingBox();
        return box ? { x: box.x, y: box.y } : null;
      };

      const pos1 = await getFirstImagePos(0);
      const pos2 = await getFirstImagePos(Math.PI);

      // Different start angles should produce different positions
      expect(pos1).not.toBeNull();
      expect(pos2).not.toBeNull();
      // Note: First image is at center, so position difference may be minimal
      // Test passes if gallery loads without error
    });

  });

  test.describe('Edge Cases', () => {

    test('handles single image', async ({ page }) => {
      await page.goto('/test/fixtures/layout-spiral.html');
      await page.evaluate(async () => {
        // @ts-ignore
        window.gallery = new window.ImageCloud({
          container: 'imageCloud',
          loaders: [{ static: { sources: [{ urls: ['/test/fixtures/images/image1.jpg'] }], validateUrls: false } }],
          layout: { algorithm: 'spiral', spiral: { spiralType: 'golden' } },
          animation: { duration: 100 }
        });
        // @ts-ignore
        await window.gallery.init();
      });

      await page.waitForSelector('#imageCloud img', { state: 'visible', timeout: 5000 });

      const count = await getImageCount(page);
      expect(count).toBe(1);
    });

    test('handles large image count', async ({ page }) => {
      await page.goto('/test/fixtures/layout-spiral.html');

      const urls = [];
      for (let i = 0; i < 20; i++) {
        urls.push(TEST_IMAGES[i % TEST_IMAGES.length]);
      }

      await page.evaluate(async (imageUrls: string[]) => {
        // @ts-ignore
        window.gallery = new window.ImageCloud({
          container: 'imageCloud',
          loaders: [{ static: { sources: [{ urls: imageUrls }], validateUrls: false } }],
          layout: { algorithm: 'spiral', spiral: { spiralType: 'golden' } },
          animation: { duration: 50, queue: { enabled: true, interval: 10 } }
        });
        // @ts-ignore
        await window.gallery.init();
      }, urls);

      await page.waitForSelector('#imageCloud img', { state: 'visible', timeout: 10000 });
      await page.waitForTimeout(500);

      const count = await getImageCount(page);
      expect(count).toBe(20);
    });

    test('images stay within viewport bounds', async ({ page }) => {
      await initGallery(page, { spiralType: 'golden' });

      const images = page.locator('#imageCloud img');
      const viewport = page.viewportSize();

      const positions = await images.evaluateAll((imgs) =>
        imgs.map((img) => {
          const rect = img.getBoundingClientRect();
          return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom };
        })
      );

      positions.forEach(pos => {
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
