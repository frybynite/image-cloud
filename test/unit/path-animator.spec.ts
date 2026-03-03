import { test, expect } from '@playwright/test';

// Unit tests for PathAnimator
// Tests the requiresJSAnimation exported function

test.describe('PathAnimator Unit Tests', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/test/fixtures/path-animator-unit-test.html');
    await page.waitForFunction(() => typeof window.requiresJSAnimation !== 'undefined');
  });

  test.describe('requiresJSAnimation', () => {

    test('returns true for bounce path type', async ({ page }) => {
      const result = await page.evaluate(() => {
        // @ts-ignore
        return window.requiresJSAnimation('bounce');
      });
      expect(result).toBe(true);
    });

    test('returns true for elastic path type', async ({ page }) => {
      const result = await page.evaluate(() => {
        // @ts-ignore
        return window.requiresJSAnimation('elastic');
      });
      expect(result).toBe(true);
    });

    test('returns true for wave path type', async ({ page }) => {
      const result = await page.evaluate(() => {
        // @ts-ignore
        return window.requiresJSAnimation('wave');
      });
      expect(result).toBe(true);
    });

    test('returns false for linear path type', async ({ page }) => {
      const result = await page.evaluate(() => {
        // @ts-ignore
        return window.requiresJSAnimation('linear');
      });
      expect(result).toBe(false);
    });

    test('returns false for arc path type', async ({ page }) => {
      const result = await page.evaluate(() => {
        // @ts-ignore
        return window.requiresJSAnimation('arc');
      });
      expect(result).toBe(false);
    });

  });

});
