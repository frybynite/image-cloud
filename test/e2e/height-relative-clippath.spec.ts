/**
 * Height-Relative Clip-Path Tests
 *
 * Tests that height-relative clip-path mode maintains consistent shape appearance
 * across different aspect ratios and image states (default, hover, focused).
 */

import { test, expect } from '@playwright/test';
import { getImageCount } from '../utils/test-helpers';

const TEST_IMAGES = [
  '/test/fixtures/images/image1.jpg',
  '/test/fixtures/images/image2.jpg',
  '/test/fixtures/images/image3.jpg',
  '/test/fixtures/images/food1.jpg'
];

async function initGalleryWithHeightRelativeClipPath(
  page: any,
  shape: string,
  mode: string = 'height-relative',
  hoverShape?: string,
  focusedShape?: string
) {
  await page.goto('/test/fixtures/styling.html');
  await page.evaluate(() => {
    // @ts-ignore
    if (window.gallery) window.gallery.destroy();
    const container = document.getElementById('imageCloud');
    if (container) container.innerHTML = '';
  });

  await page.evaluate(
    async ({ urls, shape, mode, hoverShape, focusedShape }: any) => {
      // @ts-ignore
      window.gallery = new window.ImageCloud({
        container: 'imageCloud',
        loaders: [{ static: { sources: [{ urls }], validateUrls: false } }],
        layout: {
          algorithm: 'grid',
          rotation: { enabled: false },
          grid: { columns: 2, rows: 2, gap: 20 }
        },
        styling: {
          default: {
            clipPath: mode === 'height-relative' ? { shape, mode } : shape
          },
          ...(hoverShape && {
            hover: {
              clipPath: { shape: hoverShape, mode: 'height-relative' }
            }
          }),
          ...(focusedShape && {
            focused: {
              clipPath: { shape: focusedShape, mode: 'height-relative' }
            }
          })
        },
        animation: { duration: 100, queue: { enabled: true, interval: 20 } },
        interaction: { focus: { animationDuration: 100 } }
      });
      // @ts-ignore
      await window.gallery.init();
    },
    { urls: TEST_IMAGES, shape, mode, hoverShape, focusedShape }
  );

  await page.waitForSelector('#imageCloud img', { state: 'visible', timeout: 5000 });
  await page.waitForTimeout(300);
}

test.describe('Height-Relative Clip-Path Mode', () => {

  test.describe('Basic Height-Relative Shapes', () => {

    test('hexagon shape in height-relative mode uses pixel coordinates', async ({ page }) => {
      await initGalleryWithHeightRelativeClipPath(page, 'hexagon', 'height-relative');

      const img = page.locator('#imageCloud img').first();
      const clipPath = await img.evaluate(el =>
        window.getComputedStyle(el).clipPath
      );

      // Should contain 'polygon' with pixel-based coordinates
      expect(clipPath).toContain('polygon');
      expect(clipPath).toContain('px');
      // Should NOT use percentages for height-relative mode
      expect(clipPath).not.toContain('%');
    });

    test('circle shape in height-relative mode uses pixel radius', async ({ page }) => {
      await initGalleryWithHeightRelativeClipPath(page, 'circle', 'height-relative');

      const img = page.locator('#imageCloud img').first();
      const clipPath = await img.evaluate(el =>
        window.getComputedStyle(el).clipPath
      );

      // Circle should use circle() function with pixel radius
      expect(clipPath).toMatch(/circle\(\d+(\.\d+)?px\)/);
    });

    test('diamond shape in height-relative mode uses pixel coordinates', async ({ page }) => {
      await initGalleryWithHeightRelativeClipPath(page, 'diamond', 'height-relative');

      const img = page.locator('#imageCloud img').first();
      const clipPath = await img.evaluate(el =>
        window.getComputedStyle(el).clipPath
      );

      // Should contain 'polygon' with pixel-based coordinates
      expect(clipPath).toContain('polygon');
      expect(clipPath).toContain('px');
      expect(clipPath).not.toContain('%');
    });

    test('all predefined shapes work in height-relative mode', async ({ page }) => {
      const shapes = ['circle', 'square', 'triangle', 'pentagon', 'hexagon', 'octagon', 'diamond'];

      for (const shape of shapes) {
        await initGalleryWithHeightRelativeClipPath(page, shape, 'height-relative');

        const img = page.locator('#imageCloud img').first();
        const clipPath = await img.evaluate(el =>
          window.getComputedStyle(el).clipPath
        );

        // All should have clip-path applied
        expect(clipPath).toBeTruthy();
        expect(clipPath).not.toBe('none');

        if (shape === 'circle') {
          expect(clipPath).toMatch(/circle\(\d+(\.\d+)?px\)/);
        } else {
          // Polygon shapes should use pixel coordinates
          expect(clipPath).toContain('polygon');
          expect(clipPath).toContain('px');
        }
      }
    });
  });

  test.describe('Height-Relative Mode with State Changes', () => {

    test('recalculates clip-path on hover state change', async ({ page }) => {
      await initGalleryWithHeightRelativeClipPath(
        page,
        'pentagon',
        'height-relative',
        'hexagon'
      );

      const img = page.locator('#imageCloud img').first();

      // Get default clip-path
      const defaultClipPath = await img.evaluate(el =>
        window.getComputedStyle(el).clipPath
      );
      expect(defaultClipPath).toContain('polygon');
      expect(defaultClipPath).toContain('px');

      // Hover over image
      await img.hover();
      await page.waitForTimeout(100);

      // Get hover clip-path - should be different (hexagon vs pentagon)
      const hoverClipPath = await img.evaluate(el =>
        window.getComputedStyle(el).clipPath
      );
      expect(hoverClipPath).toContain('polygon');
      expect(hoverClipPath).toContain('px');
      expect(hoverClipPath).not.toBe(defaultClipPath);

      // Mouse leave - revert to default
      await page.mouse.move(0, 0);
      await page.waitForTimeout(100);

      const afterLeaveClipPath = await img.evaluate(el =>
        window.getComputedStyle(el).clipPath
      );
      expect(afterLeaveClipPath).toBe(defaultClipPath);
    });

    test('recalculates clip-path on focus state change', async ({ page }) => {
      await initGalleryWithHeightRelativeClipPath(
        page,
        'square',
        'height-relative',
        undefined,
        'circle'
      );

      const img = page.locator('#imageCloud img').first();

      // Get default clip-path
      const defaultClipPath = await img.evaluate(el =>
        window.getComputedStyle(el).clipPath
      );
      expect(defaultClipPath).toContain('polygon'); // square is polygon
      expect(defaultClipPath).toContain('px');

      // Click to focus
      await img.click();
      await page.waitForTimeout(500); // Wait for animation

      // Get focused clip-path - should change to circle
      const focusedClipPath = await img.evaluate(el =>
        window.getComputedStyle(el).clipPath
      );
      expect(focusedClipPath).toMatch(/circle\(\d+(\.\d+)?px\)/);
      expect(focusedClipPath).not.toBe(defaultClipPath);

      // Press Escape to unfocus
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);

      // Verify back to default
      const afterUnfocusClipPath = await img.evaluate(el =>
        window.getComputedStyle(el).clipPath
      );
      // Check that it returns to a polygon (not circle anymore)
      expect(afterUnfocusClipPath).toContain('polygon');
      expect(afterUnfocusClipPath).not.toContain('circle');
      // Values should be very close (may differ by < 1px due to rounding)
      expect(afterUnfocusClipPath).toMatch(/polygon\(\d+(\.\d+)?px/)
    });
  });

  test.describe('Backward Compatibility', () => {

    test('percent-based mode still works when mode is not specified', async ({ page }) => {
      await page.goto('/test/fixtures/styling.html');
      await page.evaluate(() => {
        // @ts-ignore
        if (window.gallery) window.gallery.destroy();
        const container = document.getElementById('imageCloud');
        if (container) container.innerHTML = '';
      });

      await page.evaluate(async ({ urls }: any) => {
        // @ts-ignore
        window.gallery = new window.ImageCloud({
          container: 'imageCloud',
          loaders: [{ static: { sources: [{ urls }], validateUrls: false } }],
          layout: {
            algorithm: 'grid',
            rotation: { enabled: false },
            grid: { columns: 2, rows: 2, gap: 20 }
          },
          styling: {
            default: {
              clipPath: 'hexagon'  // Legacy format without mode config
            }
          },
          animation: { duration: 100, queue: { enabled: true, interval: 20 } },
          interaction: { focus: { animationDuration: 100 } }
        });
        // @ts-ignore
        await window.gallery.init();
      }, { urls: TEST_IMAGES });

      await page.waitForSelector('#imageCloud img', { state: 'visible', timeout: 5000 });
      await page.waitForTimeout(300);

      const img = page.locator('#imageCloud img').first();
      const clipPath = await img.evaluate(el =>
        window.getComputedStyle(el).clipPath
      );

      // Should use percentage-based polygon for backward compatibility
      expect(clipPath).toContain('polygon');
      expect(clipPath).toContain('%');
      expect(clipPath).not.toContain('px');
    });
  });

  test.describe('Configuration Edge Cases', () => {

    test('handles "none" clip-path with height-relative hover', async ({ page }) => {
      await page.goto('/test/fixtures/styling.html');
      await page.evaluate(() => {
        // @ts-ignore
        if (window.gallery) window.gallery.destroy();
        const container = document.getElementById('imageCloud');
        if (container) container.innerHTML = '';
      });

      await page.evaluate(async ({ urls }: any) => {
        // @ts-ignore
        window.gallery = new window.ImageCloud({
          container: 'imageCloud',
          loaders: [{ static: { sources: [{ urls }], validateUrls: false } }],
          layout: {
            algorithm: 'grid',
            rotation: { enabled: false },
            grid: { columns: 2, rows: 2, gap: 20 }
          },
          styling: {
            default: {
              clipPath: 'none'
            },
            hover: {
              clipPath: { shape: 'circle', mode: 'height-relative' }
            }
          },
          animation: { duration: 100, queue: { enabled: true, interval: 20 } },
          interaction: { focus: { animationDuration: 100 } }
        });
        // @ts-ignore
        await window.gallery.init();
      }, { urls: TEST_IMAGES });

      await page.waitForSelector('#imageCloud img', { state: 'visible', timeout: 5000 });
      await page.waitForTimeout(300);

      const img = page.locator('#imageCloud img').first();

      // Default should have no clip-path
      const defaultClipPath = await img.evaluate(el =>
        window.getComputedStyle(el).clipPath
      );
      expect(['none', 'unset', '']).toContain(defaultClipPath);

      // Hover should apply circle with pixels
      await img.hover();
      await page.waitForTimeout(100);

      const hoverClipPath = await img.evaluate(el =>
        window.getComputedStyle(el).clipPath
      );
      expect(hoverClipPath).toMatch(/circle\(\d+(\.\d+)?px\)/);
    });

    test('handles custom clip-path strings', async ({ page }) => {
      await page.goto('/test/fixtures/styling.html');
      await page.evaluate(() => {
        // @ts-ignore
        if (window.gallery) window.gallery.destroy();
        const container = document.getElementById('imageCloud');
        if (container) container.innerHTML = '';
      });

      await page.evaluate(async ({ urls }: any) => {
        // @ts-ignore
        window.gallery = new window.ImageCloud({
          container: 'imageCloud',
          loaders: [{ static: { sources: [{ urls }], validateUrls: false } }],
          layout: {
            algorithm: 'grid',
            rotation: { enabled: false },
            grid: { columns: 2, rows: 2, gap: 20 }
          },
          styling: {
            default: {
              clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)'
            }
          },
          animation: { duration: 100, queue: { enabled: true, interval: 20 } },
          interaction: { focus: { animationDuration: 100 } }
        });
        // @ts-ignore
        await window.gallery.init();
      }, { urls: TEST_IMAGES });

      await page.waitForSelector('#imageCloud img', { state: 'visible', timeout: 5000 });
      await page.waitForTimeout(300);

      const img = page.locator('#imageCloud img').first();
      const clipPath = await img.evaluate(el =>
        window.getComputedStyle(el).clipPath
      );

      // Should use the custom string as-is (with percentages)
      expect(clipPath).toContain('polygon');
      expect(clipPath).toContain('%');
    });
  });
});
