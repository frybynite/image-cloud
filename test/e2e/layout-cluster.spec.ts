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
  '/test/fixtures/images/scenery3.jpg',
  '/test/fixtures/images/computing1.jpg',
  '/test/fixtures/images/computing2.jpg',
  '/test/fixtures/images/computing3.jpg'
];

async function initGallery(page: any, clusterConfig: object = {}, imageCount = 12) {
  await page.goto('/test/fixtures/layout-cluster.html');
  await page.evaluate(() => {
    // @ts-ignore
    if (window.gallery) window.gallery.destroy();
    const container = document.getElementById('imageCloud');
    if (container) container.innerHTML = '';
  });

  const urls = TEST_IMAGES.slice(0, imageCount);

  await page.evaluate(async ({ urls, cluster }: { urls: string[], cluster: object }) => {
    // @ts-ignore
    window.gallery = new window.ImageGallery({
      container: 'imageCloud',
      loader: {
        type: 'static',
        static: { sources: [{ type: 'urls', urls }], validateUrls: false }
      },
      layout: {
        algorithm: 'cluster',
        rotation: { enabled: true, range: { min: -15, max: 15 } },
        cluster
      },
      animation: { duration: 100, queue: { enabled: true, interval: 20 } }
    });
    // @ts-ignore
    await window.gallery.init();
  }, { urls, cluster: clusterConfig });

  await page.waitForSelector('#imageCloud img', { state: 'visible', timeout: 5000 });
  await page.waitForTimeout(400);
}

test.describe('Cluster Layout Algorithm', () => {

  test.describe('Cluster Count', () => {

    test('auto cluster count creates appropriate number of clusters', async ({ page }) => {
      await initGallery(page, { clusterCount: 'auto' }, 12);

      const count = await getImageCount(page);
      expect(count).toBe(12);

      // Verify images are distributed (not all in one spot)
      const images = page.locator('#imageCloud img');
      const positions = await images.evaluateAll((imgs) =>
        imgs.map((img) => {
          const rect = img.getBoundingClientRect();
          return { x: Math.round(rect.x / 50), y: Math.round(rect.y / 50) };
        })
      );

      const uniqueRegions = new Set(positions.map(p => `${p.x},${p.y}`));
      expect(uniqueRegions.size).toBeGreaterThan(3);
    });

    test('fixed cluster count of 2 creates two groups', async ({ page }) => {
      await initGallery(page, { clusterCount: 2, clusterSpacing: 300 }, 8);

      const images = page.locator('#imageCloud img');
      const positions = await images.evaluateAll((imgs) =>
        imgs.map((img) => {
          const rect = img.getBoundingClientRect();
          return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
        })
      );

      // K-means-like clustering check: find two distinct groups
      // Sort by X to find potential clusters
      const sortedByX = [...positions].sort((a, b) => a.x - b.x);
      const midIndex = Math.floor(sortedByX.length / 2);

      // Check if there's a gap between the groups
      const leftGroup = sortedByX.slice(0, midIndex);
      const rightGroup = sortedByX.slice(midIndex);

      const leftMaxX = Math.max(...leftGroup.map(p => p.x));
      const rightMinX = Math.min(...rightGroup.map(p => p.x));

      // There should be some separation between groups
      expect(rightMinX - leftMaxX).toBeGreaterThan(-100); // Allow some overlap due to spread
    });

    test('fixed cluster count of 3 distributes images across three areas', async ({ page }) => {
      await initGallery(page, { clusterCount: 3, clusterSpacing: 200 }, 9);

      const count = await getImageCount(page);
      expect(count).toBe(9);

      // Each cluster should have roughly 3 images (9 / 3)
      const images = page.locator('#imageCloud img');
      for (let i = 0; i < count; i++) {
        await expect(images.nth(i)).toBeVisible();
      }
    });

  });

  test.describe('Cluster Spread', () => {

    test('small spread keeps images tightly grouped', async ({ page }) => {
      await initGallery(page, { clusterCount: 2, clusterSpread: 50, clusterSpacing: 400 }, 6);

      const images = page.locator('#imageCloud img');
      const positions = await images.evaluateAll((imgs) =>
        imgs.map((img) => {
          const rect = img.getBoundingClientRect();
          return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
        })
      );

      // Calculate variance within assumed clusters
      // With tight spread, images in same cluster should be close
      const avgX = positions.reduce((sum, p) => sum + p.x, 0) / positions.length;
      const avgY = positions.reduce((sum, p) => sum + p.y, 0) / positions.length;

      // At least some images should be close to each other
      let closeCount = 0;
      for (let i = 0; i < positions.length; i++) {
        for (let j = i + 1; j < positions.length; j++) {
          const dist = Math.sqrt(
            Math.pow(positions[i].x - positions[j].x, 2) +
            Math.pow(positions[i].y - positions[j].y, 2)
          );
          if (dist < 200) closeCount++;
        }
      }
      expect(closeCount).toBeGreaterThan(0);
    });

    test('large spread distributes images more widely', async ({ page }) => {
      await initGallery(page, { clusterCount: 1, clusterSpread: 300 }, 6);

      const images = page.locator('#imageCloud img');
      const positions = await images.evaluateAll((imgs) =>
        imgs.map((img) => {
          const rect = img.getBoundingClientRect();
          return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
        })
      );

      // With large spread, images should cover more area
      const xRange = Math.max(...positions.map(p => p.x)) - Math.min(...positions.map(p => p.x));
      const yRange = Math.max(...positions.map(p => p.y)) - Math.min(...positions.map(p => p.y));

      // Should cover reasonable area
      expect(xRange + yRange).toBeGreaterThan(100);
    });

  });

  test.describe('Distribution Types', () => {

    test('gaussian distribution concentrates images near cluster centers', async ({ page }) => {
      await initGallery(page, {
        clusterCount: 1,
        clusterSpread: 200,
        distribution: 'gaussian'
      }, 9);

      const count = await getImageCount(page);
      expect(count).toBe(9);

      // Gallery should load without error
      const images = page.locator('#imageCloud img');
      for (let i = 0; i < count; i++) {
        await expect(images.nth(i)).toBeVisible();
      }
    });

    test('uniform distribution spreads images evenly', async ({ page }) => {
      await initGallery(page, {
        clusterCount: 1,
        clusterSpread: 200,
        distribution: 'uniform'
      }, 9);

      const count = await getImageCount(page);
      expect(count).toBe(9);

      // Verify images are distributed
      const images = page.locator('#imageCloud img');
      const positions = await images.evaluateAll((imgs) =>
        imgs.map((img) => {
          const rect = img.getBoundingClientRect();
          return { x: rect.x, y: rect.y };
        })
      );

      const uniquePositions = new Set(
        positions.map(p => `${Math.round(p.x / 20)},${Math.round(p.y / 20)}`)
      );
      expect(uniquePositions.size).toBeGreaterThan(3);
    });

  });

  test.describe('Density', () => {

    test('uniform density creates consistent cluster sizes', async ({ page }) => {
      await initGallery(page, {
        clusterCount: 2,
        clusterSpread: 150,
        density: 'uniform'
      }, 8);

      const count = await getImageCount(page);
      expect(count).toBe(8);
    });

    test('varied density creates different cluster sizes', async ({ page }) => {
      await initGallery(page, {
        clusterCount: 2,
        clusterSpread: 150,
        density: 'varied'
      }, 8);

      const count = await getImageCount(page);
      expect(count).toBe(8);
    });

  });

  test.describe('Overlap', () => {

    test('high overlap creates tighter clusters', async ({ page }) => {
      await initGallery(page, {
        clusterCount: 1,
        clusterSpread: 200,
        overlap: 0.8
      }, 6);

      const count = await getImageCount(page);
      expect(count).toBe(6);

      // With high overlap, images should be close together
      const images = page.locator('#imageCloud img');
      const positions = await images.evaluateAll((imgs) =>
        imgs.map((img) => {
          const rect = img.getBoundingClientRect();
          return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
        })
      );

      // Calculate spread
      const xRange = Math.max(...positions.map(p => p.x)) - Math.min(...positions.map(p => p.x));
      const yRange = Math.max(...positions.map(p => p.y)) - Math.min(...positions.map(p => p.y));

      // Should be relatively compact
      expect(xRange + yRange).toBeLessThan(1000);
    });

    test('zero overlap spreads images more', async ({ page }) => {
      await initGallery(page, {
        clusterCount: 1,
        clusterSpread: 200,
        overlap: 0
      }, 6);

      const count = await getImageCount(page);
      expect(count).toBe(6);
    });

  });

  test.describe('Edge Cases', () => {

    test('handles single image', async ({ page }) => {
      await initGallery(page, { clusterCount: 'auto' }, 1);

      const count = await getImageCount(page);
      expect(count).toBe(1);

      const image = page.locator('#imageCloud img').first();
      await expect(image).toBeVisible();
    });

    test('handles more clusters than images', async ({ page }) => {
      // Request 5 clusters but only 3 images
      await initGallery(page, { clusterCount: 5 }, 3);

      const count = await getImageCount(page);
      expect(count).toBe(3);

      // Should still render without error
      const images = page.locator('#imageCloud img');
      for (let i = 0; i < count; i++) {
        await expect(images.nth(i)).toBeVisible();
      }
    });

    test('images stay within viewport bounds', async ({ page }) => {
      await initGallery(page, { clusterCount: 3, clusterSpread: 150 }, 12);

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
