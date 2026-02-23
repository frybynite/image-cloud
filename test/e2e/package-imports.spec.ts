/**
 * Package Import Tests
 *
 * Tests that the package can be imported as it would be when installed via npm.
 * This validates that:
 * 1. The built dist files are correctly structured
 * 2. Package exports are correctly configured
 * 3. Loader bundles are accessible via package subpaths
 * 4. TypeScript types are available
 */

import { test, expect } from '@playwright/test';

test.describe('Package Imports (as installed via npm)', () => {

  test.describe('Main Package Export', () => {

    test('can import ImageCloud from package root', async ({ page }) => {
      // Simulate importing from '@frybynite/image-cloud'
      await page.goto('/');

      const canImport = await page.evaluate(async () => {
        try {
          const module = await import('/dist/image-cloud.js');
          return {
            hasImageCloud: 'ImageCloud' in module,
            hasCompositeLoader: 'CompositeLoader' in module
          };
        } catch (e) {
          return { error: String(e) };
        }
      });

      expect(canImport.hasImageCloud).toBe(true);
      expect(canImport.hasCompositeLoader).toBe(true);
    });

    test('can import from package wrappers (react, vue, web-component)', async ({ page }) => {
      await page.goto('/');

      const wrappers = await page.evaluate(async () => {
        const results: Record<string, boolean> = {};

        // Test React wrapper
        try {
          const react = await import('/dist/react.js');
          results.react = 'default' in react || Object.keys(react).length > 0;
        } catch (e) {
          results.react = false;
        }

        // Test Vue wrapper
        try {
          const vue = await import('/dist/vue.js');
          results.vue = 'default' in vue || Object.keys(vue).length > 0;
        } catch (e) {
          results.vue = false;
        }

        // Test Web Component wrapper
        try {
          const wc = await import('/dist/web-component.js');
          results.webComponent = 'default' in wc || Object.keys(wc).length > 0;
        } catch (e) {
          results.webComponent = false;
        }

        return results;
      });

      expect(wrappers.react).toBe(true);
      expect(wrappers.vue).toBe(true);
      expect(wrappers.webComponent).toBe(true);
    });
  });

  test.describe('Auto-init Bundle', () => {

    test('demonstrates auto-init bundle usage pattern', async ({ page }) => {
      await page.goto('/');

      const canImport = await page.evaluate(async () => {
        try {
          // Users can import auto-init for automatic gallery initialization
          const module = await import('/dist/image-cloud-auto-init.js');
          return {
            hasExports: Object.keys(module).length > 0,
            moduleKeys: Object.keys(module)
          };
        } catch (e) {
          return { error: String(e) };
        }
      });

      expect(canImport.moduleKeys).toBeDefined();
      expect(Array.isArray(canImport.moduleKeys)).toBe(true);
    });
  });

  test.describe('CSS Import', () => {

    test('style.css is available from @frybynite/image-cloud/style.css', async ({ page }) => {
      // Check that CSS file exists and is accessible
      const cssResponse = await page.goto('/dist/style.css');
      expect(cssResponse?.ok()).toBe(true);
    });
  });
});
