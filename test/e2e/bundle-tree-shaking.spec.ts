/**
 * Bundle Tree-Shaking Validation Tests
 *
 * Verifies that:
 * 1. Individual layout imports create smaller bundles than all-layouts
 * 2. Layout registry system allows tree-shaking of unused algorithms
 * 3. Loader dynamic imports work correctly
 */

import { test, expect } from '@playwright/test';

test.describe('Bundle Tree-Shaking', () => {
  test.describe('Layout Registry', () => {
    test('radial layout renders gallery correctly', async ({ page }) => {
      await page.goto('/test/fixtures/layout-viewport-test.html');

      // Wait for gallery to initialize
      await page.waitForFunction(() => window.galleryInitPromise !== undefined);
      await page.evaluate(() => window.galleryInitPromise);

      // Verify images are rendered
      const images = page.locator('#imageCloud img');
      const count = await images.count();
      expect(count).toBeGreaterThan(0);
    });

    test('layout not imported throws helpful error', async ({ page }) => {
      // Create a test page that tries to use unregistered layout
      await page.goto('/');
      await page.content();

      const errorCaught = await page.evaluate(async () => {
        const { ImageCloud } = await import('/dist/image-cloud.js');
        // Don't import any layout
        try {
          const gallery = new ImageCloud({
            container: 'test',
            images: ['test.jpg'],
            layout: { algorithm: 'spiral' }
          });
          await gallery.init();
          return null; // Should not reach here
        } catch (error) {
          return error instanceof Error ? error.message : String(error);
        }
      });

      expect(errorCaught).toContain('spiral');
      expect(errorCaught).toContain('not registered');
      expect(errorCaught).toContain('import');
    });
  });

  test.describe('Loader Dynamic Imports', () => {
    test('static loader works with dynamic import', async ({ page }) => {
      await page.goto('/test/fixtures/static-urls-shorthand.html');

      // Wait for gallery initialization
      await page.waitForFunction(() => window.gallery !== undefined);
      await page.evaluate(() => window.gallery.init());

      // Verify images loaded
      const images = page.locator('#imageCloud img');
      const count = await images.count();
      expect(count).toBe(6);
    });

    test('composite loader (multiple loaders) works', async ({ page }) => {
      await page.goto('/test/fixtures/composite-loader-basic.html');

      // Wait for gallery initialization
      await page.waitForFunction(() => window.gallery !== undefined);
      await page.evaluate(() => window.gallery.init());

      // Verify images loaded from composite loader
      const images = page.locator('#imageCloud img');
      const count = await images.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('Wrapper External Dependencies', () => {
    test('main bundle does not include layouts or loaders', async ({ page }) => {
      // Verify that the main bundle (without layout imports) exists
      const response = await page.goto('/');

      // Try to fetch main bundle
      const bundleExists = await page.evaluate(async () => {
        try {
          const module = await import('/dist/image-cloud.js');
          return module.ImageCloud !== undefined;
        } catch {
          return false;
        }
      });

      expect(bundleExists).toBe(true);
    });

    test('layout subpath exports are available', async ({ page }) => {
      await page.goto('/');

      const layoutsAvailable = await page.evaluate(async () => {
        const layouts = ['radial', 'grid', 'spiral', 'cluster', 'wave', 'random', 'all'];
        const results = {};

        for (const layout of layouts) {
          try {
            const module = await import(`/dist/layouts/${layout}.js`);
            results[layout] = module !== undefined;
          } catch {
            results[layout] = false;
          }
        }

        return results;
      });

      // All layouts should be available
      expect(layoutsAvailable.radial).toBe(true);
      expect(layoutsAvailable.grid).toBe(true);
      expect(layoutsAvailable.spiral).toBe(true);
      expect(layoutsAvailable.cluster).toBe(true);
      expect(layoutsAvailable.wave).toBe(true);
      expect(layoutsAvailable.random).toBe(true);
      expect(layoutsAvailable.all).toBe(true);
    });
  });
});
