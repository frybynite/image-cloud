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

async function initGallery(page: any, radialConfig: object = {}) {
  await page.goto('/test/fixtures/layout-radial.html');
  await page.evaluate(() => {
    // @ts-ignore
    if (window.gallery) window.gallery.destroy();
    const container = document.getElementById('imageCloud');
    if (container) container.innerHTML = '';
  });

  await page.evaluate(async ({ urls, radial }: { urls: string[], radial: object }) => {
    // @ts-ignore
    window.gallery = new window.ImageCloud({
      container: 'imageCloud',
      loaders: [{ static: { sources: [{ urls }], validateUrls: false } }],
      layout: {
        algorithm: 'radial',
        radial
      },
      animation: { duration: 100, queue: { enabled: true, interval: 20 } }
    });
    // @ts-ignore
    await window.gallery.init();
  }, { urls: TEST_IMAGES, radial: radialConfig });

  await page.waitForSelector('#imageCloud img', { state: 'visible', timeout: 5000 });
  await page.waitForTimeout(400);
}

function getDistancesFromCenter(positions: { x: number, y: number }[], centerX: number, centerY: number) {
  return positions.map(p =>
    Math.sqrt(Math.pow(p.x - centerX, 2) + Math.pow(p.y - centerY, 2))
  );
}

async function getImagePositions(page: any) {
  return page.locator('#imageCloud img').evaluateAll((imgs: HTMLImageElement[]) =>
    imgs.map(img => {
      const rect = img.getBoundingClientRect();
      return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
    })
  );
}

test.describe('Radial Layout Algorithm', () => {

  test.describe('Basic rendering', () => {

    test('renders all images', async ({ page }) => {
      await initGallery(page);
      const count = await getImageCount(page);
      expect(count).toBe(9);
    });

    test('center image is positioned near the middle of the container', async ({ page }) => {
      await initGallery(page);
      const viewport = page.viewportSize();
      if (!viewport) return;

      const centerX = viewport.width / 2;
      const centerY = viewport.height / 2;

      const firstImage = page.locator('#imageCloud img').first();
      const box = await firstImage.boundingBox();
      expect(box).not.toBeNull();

      const imgCenterX = box!.x + box!.width / 2;
      const imgCenterY = box!.y + box!.height / 2;

      // Center image should be within 20% of viewport center
      expect(Math.abs(imgCenterX - centerX)).toBeLessThan(viewport.width * 0.2);
      expect(Math.abs(imgCenterY - centerY)).toBeLessThan(viewport.height * 0.2);
    });

    test('images stay within viewport bounds', async ({ page }) => {
      await initGallery(page);
      const viewport = page.viewportSize();
      const positions = await page.locator('#imageCloud img').evaluateAll((imgs: HTMLImageElement[]) =>
        imgs.map(img => {
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

  test.describe('Tightness', () => {

    test('higher tightness produces tighter rings (images closer to center)', async ({ page }) => {
      const viewport = page.viewportSize() ?? { width: 1280, height: 720 };
      const centerX = viewport.width / 2;
      const centerY = viewport.height / 2;

      // Measure max spread at low tightness
      await initGallery(page, { tightness: 0.5 });
      const loosePositions = await getImagePositions(page);
      const looseDistances = getDistancesFromCenter(loosePositions, centerX, centerY);
      const looseMaxDist = Math.max(...looseDistances);

      // Measure max spread at high tightness
      await initGallery(page, { tightness: 2.0 });
      const tightPositions = await getImagePositions(page);
      const tightDistances = getDistancesFromCenter(tightPositions, centerX, centerY);
      const tightMaxDist = Math.max(...tightDistances);

      // Higher tightness should result in images closer to center
      expect(tightMaxDist).toBeLessThan(looseMaxDist);
    });

    test('default tightness renders without error', async ({ page }) => {
      await initGallery(page);
      const count = await getImageCount(page);
      expect(count).toBe(9);
    });

    test('extreme tightness values render without error', async ({ page }) => {
      await initGallery(page, { tightness: 0.3 });
      expect(await getImageCount(page)).toBe(9);

      await initGallery(page, { tightness: 2.0 });
      expect(await getImageCount(page)).toBe(9);
    });

  });

  test.describe('Edge cases', () => {

    test('handles single image', async ({ page }) => {
      await page.goto('/test/fixtures/layout-radial.html');
      await page.evaluate(async () => {
        // @ts-ignore
        window.gallery = new window.ImageCloud({
          container: 'imageCloud',
          loaders: [{ static: { sources: [{ urls: ['/test/fixtures/images/image1.jpg'] }], validateUrls: false } }],
          layout: { algorithm: 'radial' },
          animation: { duration: 100 }
        });
        // @ts-ignore
        await window.gallery.init();
      });

      await page.waitForSelector('#imageCloud img', { state: 'visible', timeout: 5000 });
      expect(await getImageCount(page)).toBe(1);
    });

    test('handles large image count', async ({ page }) => {
      await page.goto('/test/fixtures/layout-radial.html');
      const urls = Array.from({ length: 20 }, (_, i) => TEST_IMAGES[i % TEST_IMAGES.length]);

      await page.evaluate(async (imageUrls: string[]) => {
        // @ts-ignore
        window.gallery = new window.ImageCloud({
          container: 'imageCloud',
          loaders: [{ static: { sources: [{ urls: imageUrls }], validateUrls: false } }],
          layout: { algorithm: 'radial' },
          animation: { duration: 50, queue: { enabled: true, interval: 10 } }
        });
        // @ts-ignore
        await window.gallery.init();
      }, urls);

      await page.waitForSelector('#imageCloud img', { state: 'visible', timeout: 10000 });
      await page.waitForTimeout(500);
      expect(await getImageCount(page)).toBe(20);
    });

  });

});
