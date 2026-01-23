import { test, expect } from '@playwright/test';

test.describe('Loading Spinner', () => {

  test.describe('When showLoadingSpinner is enabled', () => {

    test('spinner is hidden initially (has hidden class)', async ({ page }) => {
      // Check the initial state before gallery init
      await page.goto('/test/fixtures/loading-spinner.html');

      const loading = page.locator('#loading');
      await expect(loading).toBeAttached();

      // The hidden class should be present initially (from HTML)
      await expect(loading).toHaveClass(/fbn-ic-hidden/);
    });

    test('config is properly set when showLoadingSpinner is true', async ({ page }) => {
      await page.goto('/test/fixtures/loading-spinner.html');

      // Wait for gallery init to complete
      await page.waitForFunction(() => window.galleryInitPromise !== undefined);
      await page.evaluate(() => window.galleryInitPromise);

      // Check if config was properly set
      const debugInfo = await page.evaluate(() => {
        const gallery = (window as any).gallery;
        return {
          hasLoadingEl: !!document.getElementById('loading'),
          configShowSpinner: gallery?.fullConfig?.rendering?.ui?.showLoadingSpinner
        };
      });

      // Verify the config is set correctly
      expect(debugInfo.hasLoadingEl).toBe(true);
      expect(debugInfo.configShowSpinner).toBe(true);
    });

    // Note: Testing spinner visibility during loading is timing-dependent
    // The slow fixture (loading-spinner-slow.html) can be used for manual/visual testing
    test.skip('spinner is visible during slow image loading', async ({ page }) => {
      // Use fixture with custom slow loader (3 second delay)
      await page.goto('/test/fixtures/loading-spinner-slow.html');

      const loading = page.locator('#loading');

      // Spinner should be visible while images are loading (custom loader has 3s delay)
      await expect(loading).not.toHaveClass(/fbn-ic-hidden/, { timeout: 2000 });

      // Wait for images to finish loading
      await page.waitForSelector('#imageCloud img', { state: 'visible', timeout: 15000 });

      // Spinner should be hidden after loading
      await expect(loading).toHaveClass(/fbn-ic-hidden/, { timeout: 5000 });
    });

    test('spinner hides after images are loaded', async ({ page }) => {
      await page.goto('/test/fixtures/loading-spinner.html');

      // Wait for gallery to fully initialize
      await page.waitForFunction(() => window.galleryInitPromise !== undefined);
      await page.evaluate(() => window.galleryInitPromise);

      // Wait for images to appear
      await page.waitForSelector('#imageCloud img', { state: 'visible', timeout: 10000 });
      await page.waitForTimeout(500); // Allow animation to complete

      const loading = page.locator('#loading');

      // Spinner should be hidden after loading
      await expect(loading).toHaveClass(/fbn-ic-hidden/);
    });

    test('spinner element contains spinner div and text', async ({ page }) => {
      await page.goto('/test/fixtures/loading-spinner.html');

      const loading = page.locator('#loading');
      const spinner = loading.locator('.fbn-ic-spinner');
      const text = loading.locator('p');

      await expect(spinner).toBeAttached();
      await expect(text).toBeAttached();
      await expect(text).toHaveText('Loading images...');
    });

  });

  test.describe('When showLoadingSpinner is disabled (default)', () => {

    test('spinner stays hidden throughout loading', async ({ page }) => {
      // Track if spinner ever becomes visible
      let spinnerEverVisible = false;

      await page.route('**/test/fixtures/images/*.jpg', async route => {
        // Delay image responses
        await new Promise(resolve => setTimeout(resolve, 300));
        await route.continue();
      });

      await page.goto('/test/fixtures/loading-spinner-disabled.html');

      const loading = page.locator('#loading');

      // Check immediately - should be hidden
      await expect(loading).toHaveClass(/fbn-ic-hidden/);

      // Set up a MutationObserver to detect if hidden class is ever removed
      spinnerEverVisible = await page.evaluate(() => {
        return new Promise<boolean>((resolve) => {
          const loading = document.getElementById('loading');
          if (!loading) {
            resolve(false);
            return;
          }

          let wasVisible = false;
          const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
              if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                if (!loading.classList.contains('fbn-ic-hidden')) {
                  wasVisible = true;
                }
              }
            }
          });

          observer.observe(loading, { attributes: true });

          // Wait for loading to complete then check
          setTimeout(() => {
            observer.disconnect();
            resolve(wasVisible);
          }, 2000);
        });
      });

      expect(spinnerEverVisible).toBe(false);
    });

    test('spinner remains hidden after images load', async ({ page }) => {
      await page.goto('/test/fixtures/loading-spinner-disabled.html');

      // Wait for gallery to fully initialize
      await page.waitForFunction(() => window.galleryInitPromise !== undefined);
      await page.evaluate(() => window.galleryInitPromise);

      // Wait for images to appear
      await page.waitForSelector('#imageCloud img', { state: 'visible', timeout: 10000 });
      await page.waitForTimeout(500);

      const loading = page.locator('#loading');

      // Spinner should still be hidden
      await expect(loading).toHaveClass(/fbn-ic-hidden/);
    });

  });

  test.describe('Without loading element in DOM', () => {

    test('gallery works without loading element', async ({ page }) => {
      // Use a fixture that doesn't have the loading element
      await page.goto('/test/fixtures/static-basic.html');

      // Gallery should initialize fine
      await page.waitForSelector('#imageCloud img', { state: 'visible', timeout: 10000 });

      // Wait for queue animation to complete
      await page.waitForTimeout(1000);

      const images = page.locator('#imageCloud img');
      const count = await images.count();
      expect(count).toBeGreaterThan(0);

      // No loading element should exist
      const loading = page.locator('#loading');
      await expect(loading).toHaveCount(0);
    });

  });

});

// Type declarations
declare global {
  interface Window {
    galleryInitPromise: Promise<void>;
    galleryInitError?: Error;
    ImageCloud: any;
    gallery: any;
  }
}
