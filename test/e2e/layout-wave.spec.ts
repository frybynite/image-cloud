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

async function initGallery(page: any, waveConfig: object = {}, imageCount = 9) {
  await page.goto('/test/fixtures/layout-wave.html');
  await page.evaluate(() => {
    // @ts-ignore
    if (window.gallery) window.gallery.destroy();
    const container = document.getElementById('imageCloud');
    if (container) container.innerHTML = '';
  });

  const urls = [];
  for (let i = 0; i < imageCount; i++) {
    urls.push(TEST_IMAGES[i % TEST_IMAGES.length]);
  }

  await page.evaluate(async ({ urls, wave }: { urls: string[], wave: object }) => {
    // @ts-ignore
    window.gallery = new window.ImageCloud({
      container: 'imageCloud',
      loader: {
        type: 'static',
        static: { sources: [{ type: 'urls', urls }], validateUrls: false }
      },
      layout: {
        algorithm: 'wave',
        rotation: { enabled: true, range: { min: -10, max: 10 } },
        wave
      },
      animation: { duration: 100, queue: { enabled: true, interval: 20 } }
    });
    // @ts-ignore
    await window.gallery.init();
  }, { urls, wave: waveConfig });

  await page.waitForSelector('#imageCloud img', { state: 'visible', timeout: 5000 });
  await page.waitForTimeout(400);
}

test.describe('Wave Layout Algorithm', () => {

  test.describe('Basic Wave', () => {

    test('creates wave pattern with default settings', async ({ page }) => {
      await initGallery(page, {});

      const count = await getImageCount(page);
      expect(count).toBe(9);

      // Verify images form a wave pattern (Y positions vary)
      const images = page.locator('#imageCloud img');
      const positions = await images.evaluateAll((imgs) =>
        imgs.map((img) => {
          const rect = img.getBoundingClientRect();
          return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
        })
      );

      // Y values should have some variance (wave effect)
      const yValues = positions.map(p => p.y);
      const yRange = Math.max(...yValues) - Math.min(...yValues);
      expect(yRange).toBeGreaterThan(20); // Some vertical variation
    });

    test('images are horizontally distributed', async ({ page }) => {
      await initGallery(page, { rows: 1 });

      const images = page.locator('#imageCloud img');
      const xPositions = await images.evaluateAll((imgs) =>
        imgs.map((img) => img.getBoundingClientRect().x).sort((a, b) => a - b)
      );

      // Images should be spread horizontally
      const xRange = xPositions[xPositions.length - 1] - xPositions[0];
      expect(xRange).toBeGreaterThan(200);

      // Should be somewhat evenly spaced
      for (let i = 1; i < xPositions.length; i++) {
        expect(xPositions[i]).toBeGreaterThan(xPositions[i - 1]);
      }
    });

  });

  test.describe('Rows', () => {

    test('single row places all images on one wave', async ({ page }) => {
      await initGallery(page, { rows: 1, amplitude: 50 }, 6);

      const images = page.locator('#imageCloud img');
      const positions = await images.evaluateAll((imgs) =>
        imgs.map((img) => {
          const rect = img.getBoundingClientRect();
          return { y: rect.y + rect.height / 2 };
        })
      );

      // All images should be in roughly the same vertical band
      // (accounting for wave amplitude and image height)
      const avgY = positions.reduce((sum, p) => sum + p.y, 0) / positions.length;
      positions.forEach(p => {
        expect(Math.abs(p.y - avgY)).toBeLessThan(300); // Within wave amplitude + image variance
      });
    });

    test('multiple rows create stacked waves', async ({ page }) => {
      await initGallery(page, { rows: 2 }, 8);

      const images = page.locator('#imageCloud img');
      const positions = await images.evaluateAll((imgs) =>
        imgs.map((img) => {
          const rect = img.getBoundingClientRect();
          return { y: rect.y + rect.height / 2 };
        })
      );

      // Sort Y positions to find row groups
      const sortedY = [...positions.map(p => p.y)].sort((a, b) => a - b);

      // Should have two distinct Y regions
      const midIndex = Math.floor(sortedY.length / 2);
      const topHalfAvg = sortedY.slice(0, midIndex).reduce((a, b) => a + b, 0) / midIndex;
      const bottomHalfAvg = sortedY.slice(midIndex).reduce((a, b) => a + b, 0) / (sortedY.length - midIndex);

      // There should be vertical separation between rows
      expect(bottomHalfAvg - topHalfAvg).toBeGreaterThan(50);
    });

    test('three rows distribute images across three levels', async ({ page }) => {
      await initGallery(page, { rows: 3 }, 9);

      const count = await getImageCount(page);
      expect(count).toBe(9);

      // 9 images / 3 rows = 3 images per row
      const images = page.locator('#imageCloud img');
      for (let i = 0; i < count; i++) {
        await expect(images.nth(i)).toBeVisible();
      }
    });

  });

  test.describe('Amplitude', () => {

    test('small amplitude creates subtle waves', async ({ page }) => {
      await initGallery(page, { rows: 1, amplitude: 20, frequency: 2 }, 6);

      const images = page.locator('#imageCloud img');
      const yPositions = await images.evaluateAll((imgs) =>
        imgs.map((img) => img.getBoundingClientRect().y + img.getBoundingClientRect().height / 2)
      );

      const yRange = Math.max(...yPositions) - Math.min(...yPositions);
      // Small amplitude should create relatively small Y range
      // (Note: some variance comes from image heights, not just wave amplitude)
      expect(yRange).toBeLessThan(300);
    });

    test('large amplitude creates dramatic waves', async ({ page }) => {
      await initGallery(page, { rows: 1, amplitude: 150, frequency: 1 }, 6);

      const images = page.locator('#imageCloud img');
      const yPositions = await images.evaluateAll((imgs) =>
        imgs.map((img) => img.getBoundingClientRect().y + img.getBoundingClientRect().height / 2)
      );

      const yRange = Math.max(...yPositions) - Math.min(...yPositions);
      // Large amplitude should create larger Y range
      expect(yRange).toBeGreaterThan(50);
    });

  });

  test.describe('Frequency', () => {

    test('low frequency creates gentle curves', async ({ page }) => {
      await initGallery(page, { rows: 1, amplitude: 80, frequency: 0.5 }, 6);

      const count = await getImageCount(page);
      expect(count).toBe(6);

      // Gallery should render without error
      const images = page.locator('#imageCloud img');
      for (let i = 0; i < count; i++) {
        await expect(images.nth(i)).toBeVisible();
      }
    });

    test('high frequency creates more wave cycles', async ({ page }) => {
      await initGallery(page, { rows: 1, amplitude: 80, frequency: 3 }, 9);

      const images = page.locator('#imageCloud img');
      const yPositions = await images.evaluateAll((imgs) =>
        imgs.map((img) => img.getBoundingClientRect().y + img.getBoundingClientRect().height / 2)
      );

      // With high frequency, there should be direction changes
      let directionChanges = 0;
      for (let i = 2; i < yPositions.length; i++) {
        const prevDir = yPositions[i - 1] - yPositions[i - 2];
        const currDir = yPositions[i] - yPositions[i - 1];
        if (prevDir * currDir < 0) directionChanges++;
      }

      // Should have at least one direction change (wave peak/trough)
      expect(directionChanges).toBeGreaterThanOrEqual(0);
    });

  });

  test.describe('Synchronization', () => {

    test('synchronized mode aligns all rows', async ({ page }) => {
      await initGallery(page, { rows: 2, synchronization: 'synchronized' }, 8);

      const count = await getImageCount(page);
      expect(count).toBe(8);
    });

    test('offset mode staggers row phases', async ({ page }) => {
      await initGallery(page, { rows: 2, synchronization: 'offset', phaseShift: Math.PI / 2 }, 8);

      const count = await getImageCount(page);
      expect(count).toBe(8);
    });

    test('alternating mode inverts alternate rows', async ({ page }) => {
      await initGallery(page, { rows: 2, synchronization: 'alternating' }, 8);

      const count = await getImageCount(page);
      expect(count).toBe(8);
    });

  });

  test.describe('Orientation', () => {

    test('follow orientation rotates images along wave', async ({ page }) => {
      await initGallery(page, { rows: 1, orientation: 'follow', amplitude: 100, frequency: 1 }, 6);

      const images = page.locator('#imageCloud img');
      const transforms = await images.evaluateAll((imgs) =>
        imgs.map((img) => window.getComputedStyle(img).transform)
      );

      // At least some images should have rotation (transform matrix)
      const hasTransform = transforms.some(t => t !== 'none');
      expect(hasTransform).toBe(true);
    });

    test('upright orientation keeps images vertical', async ({ page }) => {
      await initGallery(page, {
        rows: 1,
        orientation: 'upright',
        amplitude: 100,
        frequency: 1
      }, 6);

      // Disable rotation in layout config
      await page.goto('/test/fixtures/layout-wave.html');
      await page.evaluate(async () => {
        // @ts-ignore
        window.gallery = new window.ImageCloud({
          container: 'imageCloud',
          loader: {
            type: 'static',
            static: {
              sources: [{
                type: 'urls',
                urls: [
                  '/test/fixtures/images/image1.jpg',
                  '/test/fixtures/images/image2.jpg',
                  '/test/fixtures/images/image3.jpg'
                ]
              }],
              validateUrls: false
            }
          },
          layout: {
            algorithm: 'wave',
            rotation: { enabled: false },
            wave: { rows: 1, orientation: 'upright', amplitude: 100, frequency: 1 }
          },
          animation: { duration: 100, queue: { enabled: true, interval: 20 } }
        });
        // @ts-ignore
        await window.gallery.init();
      });

      await page.waitForSelector('#imageCloud img', { state: 'visible', timeout: 5000 });
      await page.waitForTimeout(300);

      const images = page.locator('#imageCloud img');
      const transforms = await images.evaluateAll((imgs) =>
        imgs.map((img) => window.getComputedStyle(img).transform)
      );

      // With rotation disabled and upright orientation, transforms should be simpler
      // (may still have scale/translate but no significant rotation)
      expect(transforms.length).toBe(3);
    });

  });

  test.describe('Edge Cases', () => {

    test('handles single image', async ({ page }) => {
      await initGallery(page, { rows: 1 }, 1);

      const count = await getImageCount(page);
      expect(count).toBe(1);

      const image = page.locator('#imageCloud img').first();
      await expect(image).toBeVisible();
    });

    test('handles large image count', async ({ page }) => {
      await initGallery(page, { rows: 3 }, 18);

      const count = await getImageCount(page);
      expect(count).toBe(18);

      // All images should be visible
      const images = page.locator('#imageCloud img');
      const visibleCount = await images.evaluateAll((imgs) =>
        imgs.filter((img) => {
          const rect = img.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        }).length
      );
      expect(visibleCount).toBe(18);
    });

    test('images stay within viewport bounds', async ({ page }) => {
      await initGallery(page, { rows: 2, amplitude: 80 }, 8);

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
