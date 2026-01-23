import { test, expect } from '@playwright/test';

const TEST_IMAGES = [
  '/test/fixtures/images/image1.jpg',
  '/test/fixtures/images/image2.jpg',
  '/test/fixtures/images/image3.jpg',
  '/test/fixtures/images/food1.jpg',
  '/test/fixtures/images/food2.jpg',
  '/test/fixtures/images/food3.jpg'
];

async function initGallery(page: any, config: object) {
  await page.goto('/test/fixtures/visual-regression.html');

  await page.evaluate(async ({ urls, config }: { urls: string[], config: object }) => {
    // @ts-ignore
    if (window.gallery) window.gallery.destroy();
    const container = document.getElementById('imageCloud');
    if (container) container.innerHTML = '';

    // @ts-ignore
    window.gallery = new window.ImageCloud({
      container: 'imageCloud',
      loader: {
        type: 'static',
        static: { sources: [{ type: 'urls', urls }], validateUrls: false }
      },
      // Disable animations for consistent screenshots
      animation: { duration: 0, queue: { enabled: false } },
      ...config
    });
    // @ts-ignore
    await window.gallery.init();
  }, { urls: TEST_IMAGES, config });

  // Wait for images to fully load
  await page.waitForSelector('#imageCloud img', { state: 'visible', timeout: 5000 });
  await page.waitForTimeout(500); // Allow layout to settle
}

test.describe('Visual Regression', () => {

  test.describe('Layout Algorithms', () => {

    test('radial layout appearance', async ({ page }) => {
      await initGallery(page, {
        layout: {
          algorithm: 'radial',
          rotation: { enabled: false } // Disable rotation for deterministic screenshots
        }
      });

      // Radial layout has some adaptive sizing variability
      await expect(page.locator('#imageCloud')).toHaveScreenshot('layout-radial.png', {
        maxDiffPixelRatio: 0.15
      });
    });

    test('grid layout appearance', async ({ page }) => {
      await initGallery(page, {
        layout: {
          algorithm: 'grid',
          rotation: { enabled: false },
          grid: { columns: 3, rows: 2, gap: 10, jitter: 0 }
        }
      });

      await expect(page.locator('#imageCloud')).toHaveScreenshot('layout-grid.png', {
        maxDiffPixelRatio: 0.05
      });
    });

    test('spiral layout appearance', async ({ page }) => {
      await initGallery(page, {
        layout: {
          algorithm: 'spiral',
          rotation: { enabled: false }, // Disable rotation for deterministic screenshots
          spiral: { type: 'golden', tightness: 1.0 }
        }
      });

      // Spiral layout has some adaptive sizing variability
      await expect(page.locator('#imageCloud')).toHaveScreenshot('layout-spiral.png', {
        maxDiffPixelRatio: 0.15
      });
    });

    test('cluster layout appearance', async ({ page }) => {
      await initGallery(page, {
        layout: {
          algorithm: 'cluster',
          rotation: { enabled: false }, // Disable rotation for deterministic screenshots
          cluster: { count: 2, spread: 0.3 }
        }
      });

      // Cluster layout has some inherent variability in positioning
      await expect(page.locator('#imageCloud')).toHaveScreenshot('layout-cluster.png', {
        maxDiffPixelRatio: 0.30 // Higher tolerance for cluster randomness
      });
    });

    test('wave layout appearance', async ({ page }) => {
      await initGallery(page, {
        layout: {
          algorithm: 'wave',
          rotation: { enabled: false },
          wave: { rows: 2, amplitude: 50, frequency: 1 }
        }
      });

      await expect(page.locator('#imageCloud')).toHaveScreenshot('layout-wave.png', {
        maxDiffPixelRatio: 0.05
      });
    });

  });

  test.describe('Styling', () => {

    test('border styling', async ({ page }) => {
      await initGallery(page, {
        layout: {
          algorithm: 'grid',
          rotation: { enabled: false },
          grid: { columns: 3, rows: 2, gap: 20, jitter: 0 }
        },
        styling: {
          border: {
            width: 4,
            color: '#3498db',
            radius: 8
          }
        }
      });

      await expect(page.locator('#imageCloud')).toHaveScreenshot('styling-border.png', {
        maxDiffPixelRatio: 0.05
      });
    });

    test('shadow preset md', async ({ page }) => {
      await initGallery(page, {
        layout: {
          algorithm: 'grid',
          rotation: { enabled: false },
          grid: { columns: 3, rows: 2, gap: 20, jitter: 0 }
        },
        styling: {
          shadow: { preset: 'md' }
        }
      });

      await expect(page.locator('#imageCloud')).toHaveScreenshot('styling-shadow-md.png', {
        maxDiffPixelRatio: 0.05
      });
    });

    test('shadow preset glow', async ({ page }) => {
      await initGallery(page, {
        layout: {
          algorithm: 'grid',
          rotation: { enabled: false },
          grid: { columns: 3, rows: 2, gap: 20, jitter: 0 }
        },
        styling: {
          shadow: { preset: 'glow' }
        }
      });

      await expect(page.locator('#imageCloud')).toHaveScreenshot('styling-shadow-glow.png', {
        maxDiffPixelRatio: 0.05
      });
    });

    test('filter grayscale', async ({ page }) => {
      await initGallery(page, {
        layout: {
          algorithm: 'grid',
          rotation: { enabled: false },
          grid: { columns: 3, rows: 2, gap: 20, jitter: 0 }
        },
        styling: {
          filter: 'grayscale(100%)'
        }
      });

      await expect(page.locator('#imageCloud')).toHaveScreenshot('styling-filter-grayscale.png', {
        maxDiffPixelRatio: 0.05
      });
    });

    test('filter sepia', async ({ page }) => {
      await initGallery(page, {
        layout: {
          algorithm: 'grid',
          rotation: { enabled: false },
          grid: { columns: 3, rows: 2, gap: 20, jitter: 0 }
        },
        styling: {
          filter: 'sepia(80%)'
        }
      });

      await expect(page.locator('#imageCloud')).toHaveScreenshot('styling-filter-sepia.png', {
        maxDiffPixelRatio: 0.05
      });
    });

    test('combined border and shadow', async ({ page }) => {
      await initGallery(page, {
        layout: {
          algorithm: 'grid',
          rotation: { enabled: false },
          grid: { columns: 3, rows: 2, gap: 20, jitter: 0 }
        },
        styling: {
          border: {
            width: 3,
            color: '#ffffff',
            radius: 12
          },
          shadow: { preset: 'lg' }
        }
      });

      await expect(page.locator('#imageCloud')).toHaveScreenshot('styling-combined.png', {
        maxDiffPixelRatio: 0.05
      });
    });

  });

  test.describe('Responsive', () => {

    test('desktop viewport', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await initGallery(page, {
        layout: {
          algorithm: 'grid',
          rotation: { enabled: false },
          grid: { columns: 3, rows: 2, gap: 15, jitter: 0 }
        }
      });

      await expect(page.locator('#imageCloud')).toHaveScreenshot('responsive-desktop.png', {
        maxDiffPixelRatio: 0.05
      });
    });

    test('tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await initGallery(page, {
        layout: {
          algorithm: 'grid',
          rotation: { enabled: false },
          grid: { columns: 2, rows: 3, gap: 15, jitter: 0 }
        }
      });

      await expect(page.locator('#imageCloud')).toHaveScreenshot('responsive-tablet.png', {
        maxDiffPixelRatio: 0.05
      });
    });

    test('mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await initGallery(page, {
        layout: {
          algorithm: 'grid',
          rotation: { enabled: false },
          grid: { columns: 2, rows: 3, gap: 10, jitter: 0 }
        }
      });

      await expect(page.locator('#imageCloud')).toHaveScreenshot('responsive-mobile.png', {
        maxDiffPixelRatio: 0.05
      });
    });

  });

  test.describe('Dark Background', () => {

    test('gallery on dark background', async ({ page }) => {
      await page.goto('/test/fixtures/visual-regression.html');

      // Set dark background
      await page.evaluate(() => {
        document.body.style.backgroundColor = '#1a1a2e';
        const container = document.getElementById('imageCloud');
        if (container) container.style.backgroundColor = '#16213e';
      });

      await page.evaluate(async (urls: string[]) => {
        // @ts-ignore
        window.gallery = new window.ImageCloud({
          container: 'imageCloud',
          loader: {
            type: 'static',
            static: { sources: [{ type: 'urls', urls }], validateUrls: false }
          },
          layout: {
            algorithm: 'grid',
            rotation: { enabled: false },
            grid: { columns: 3, rows: 2, gap: 20, jitter: 0 }
          },
          styling: {
            border: { width: 2, color: '#ffffff', radius: 8 },
            shadow: { preset: 'glow' }
          },
          animation: { duration: 0, queue: { enabled: false } }
        });
        // @ts-ignore
        await window.gallery.init();
      }, TEST_IMAGES);

      await page.waitForSelector('#imageCloud img', { state: 'visible', timeout: 5000 });
      await page.waitForTimeout(500);

      await expect(page.locator('#imageCloud')).toHaveScreenshot('dark-background.png', {
        maxDiffPixelRatio: 0.05
      });
    });

  });

});

// Note: Mobile project tests excluded - visual tests need consistent viewport sizes
// which are controlled within each test
