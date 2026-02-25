import { test, expect } from '@playwright/test';
import { getImageCount } from '../utils/test-helpers';

// Local fixture images cycling through available files
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

async function initGallery(page: any, honeycombConfig: object = {}, imageCount = 19) {
  await page.goto('/test/fixtures/layout-honeycomb.html');

  const urls: string[] = [];
  for (let i = 0; i < imageCount; i++) {
    urls.push(TEST_IMAGES[i % TEST_IMAGES.length]);
  }

  await page.evaluate(async ({ urls, honeycomb, count }: { urls: string[], honeycomb: object, count: number }) => {
    // Clean up any previous gallery
    // @ts-ignore
    if (window.gallery) {
      // @ts-ignore
      try { window.gallery.destroy(); } catch (_) {}
    }
    const container = document.getElementById('imageCloud');
    if (container) container.innerHTML = '';

    // @ts-ignore
    window.gallery = new window.ImageCloud({
      container: 'imageCloud',
      loaders: [{ static: { sources: [{ urls }], validateUrls: false } }],
      layout: {
        algorithm: 'honeycomb',
        honeycomb
      },
      image: { sizing: { mode: 'fixed', height: 100 } },
      animation: { duration: 50, queue: { enabled: true, interval: 10 } }
    });
    // @ts-ignore
    await window.gallery.init();
  }, { urls, honeycomb: honeycombConfig, count: imageCount });

  // Wait for all images to be added to DOM with their style.left set
  await page.waitForFunction(
    (n: number) => document.querySelectorAll('#imageCloud img').length >= n,
    imageCount,
    { timeout: 8000 }
  );

  // Wait for all images to have finalTransform set (confirms onload + positioning complete)
  await page.waitForFunction(
    (n: number) => {
      const imgs = Array.from(document.querySelectorAll('#imageCloud img'));
      return imgs.length >= n && imgs.every(img => (img as HTMLElement).dataset.finalTransform);
    },
    imageCount,
    { timeout: 8000 }
  );

  // Small buffer for CSS animations to complete (duration: 50ms)
  await page.waitForTimeout(200);
}

/**
 * Read layout positions from style.left/top (container-relative, set at creation).
 * Sorted by data-image-id so positions[0] is always layout index 0 (center),
 * regardless of DOM insertion order (which depends on async image load order).
 */
async function getLayoutPositions(page: any) {
  return page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('#imageCloud img')) as HTMLElement[];
    const withId = imgs.map(img => ({
      id: parseInt(img.dataset.imageId || '0'),
      x: parseFloat(img.style.left),
      y: parseFloat(img.style.top)
    }));
    withId.sort((a, b) => a.id - b.id);
    return withId.map(({ x, y }) => ({ x, y }));
  });
}

test.describe('Honeycomb Layout Algorithm', () => {

  test.describe('Basic Rendering', () => {

    test('renders all images without errors', async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (err) => errors.push(err.message));

      await initGallery(page, {}, 19);

      const count = await getImageCount(page);
      expect(count).toBe(19);
      expect(errors).toHaveLength(0);

      const images = page.locator('#imageCloud img');
      for (let i = 0; i < count; i++) {
        await expect(images.nth(i)).toBeVisible();
      }
    });

    test('renders with minimal image count', async ({ page }) => {
      await initGallery(page, {}, 1);

      const count = await getImageCount(page);
      expect(count).toBe(1);

      await expect(page.locator('#imageCloud img').first()).toBeVisible();
    });

    test('renders seven images (center + first ring)', async ({ page }) => {
      await initGallery(page, {}, 7);
      expect(await getImageCount(page)).toBe(7);
    });

  });

  test.describe('Center Placement', () => {

    test('center image is positioned near the container center', async ({ page }) => {
      await initGallery(page, {}, 7);

      // Container size from the gallery
      const containerSize = await page.evaluate(() => {
        const el = document.getElementById('imageCloud')!;
        return { width: el.offsetWidth, height: el.offsetHeight };
      });

      // style.left/top are layout positions in container-relative px
      const positions = await getLayoutPositions(page);
      expect(positions.length).toBe(7);

      const centerX = positions[0].x;
      const centerY = positions[0].y;

      // Center image (ring 0) should be within 5px of container center
      // (layout sets it to containerCX/containerCY exactly)
      expect(Math.abs(centerX - containerSize.width / 2)).toBeLessThan(5);
      expect(Math.abs(centerY - containerSize.height / 2)).toBeLessThan(5);
    });

  });

  test.describe('Ring-1 Equidistance', () => {

    test('first ring images (indices 1-6) are equidistant from center image', async ({ page }) => {
      await initGallery(page, {}, 7);

      const positions = await getLayoutPositions(page);
      expect(positions.length).toBe(7);

      const centerX = positions[0].x;
      const centerY = positions[0].y;

      // Distances from center using layout positions (not bounding box)
      const distances = positions.slice(1).map((p) =>
        Math.sqrt(Math.pow(p.x - centerX, 2) + Math.pow(p.y - centerY, 2))
      );

      const minDist = Math.min(...distances);
      const maxDist = Math.max(...distances);

      // Hex ring-1 has two distances (from math): ≈90.1px and 100px (hexH=100)
      // Max variance should be ≤ 10px (theoretical) — allow 12px for float precision
      expect(maxDist - minDist).toBeLessThan(12);
      // Images should be away from center (not collapsed)
      expect(minDist).toBeGreaterThan(40);
    });

  });

  test.describe('Spacing Parameter', () => {

    test('spacing: 0 produces smaller pitch than spacing: 20', async ({ page }) => {
      // Measure pitch with spacing: 0
      await initGallery(page, { spacing: 0 }, 7);
      const positions0 = await getLayoutPositions(page);

      const avgDist0 = positions0.slice(1).reduce((sum, p) => {
        return sum + Math.sqrt(
          Math.pow(p.x - positions0[0].x, 2) +
          Math.pow(p.y - positions0[0].y, 2)
        );
      }, 0) / 6;

      // Measure pitch with spacing: 20
      await initGallery(page, { spacing: 20 }, 7);
      const positions20 = await getLayoutPositions(page);

      const avgDist20 = positions20.slice(1).reduce((sum, p) => {
        return sum + Math.sqrt(
          Math.pow(p.x - positions20[0].x, 2) +
          Math.pow(p.y - positions20[0].y, 2)
        );
      }, 0) / 6;

      // spacing:20 → hexH = 120, ring-1 avg ≈ 114px
      // spacing:0  → hexH = 100, ring-1 avg ≈ 95px
      expect(avgDist20).toBeGreaterThan(avgDist0);
    });

    test('large spacing renders without errors', async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (err) => errors.push(err.message));

      await initGallery(page, { spacing: 30 }, 19);

      expect(await getImageCount(page)).toBe(19);
      expect(errors).toHaveLength(0);
    });

  });

  test.describe('Edge Cases', () => {

    test('handles 19 images across multiple rings', async ({ page }) => {
      await initGallery(page, {}, 19);
      expect(await getImageCount(page)).toBe(19);

      const positions = await getLayoutPositions(page);
      expect(positions.length).toBe(19);
      // All positions should be valid numbers
      positions.forEach(p => {
        expect(isNaN(p.x)).toBe(false);
        expect(isNaN(p.y)).toBe(false);
      });
    });

    test('images have consistent dimensions (uniform sizing)', async ({ page }) => {
      await initGallery(page, {}, 7);

      const sizes = await page.evaluate(() => {
        const imgs = Array.from(document.querySelectorAll('#imageCloud img')) as HTMLElement[];
        return imgs.map(img => ({
          height: parseFloat(img.style.height)
        }));
      });

      // All images should have the same height (fixed sizing mode, 100px)
      sizes.forEach(s => {
        expect(s.height).toBe(100);
      });
    });

  });

});
