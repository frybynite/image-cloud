import { test, expect } from '@playwright/test';

test.describe('Image Counter', () => {

  test.describe('When showImageCounter is enabled', () => {

    test('counter element is created and hidden initially', async ({ page }) => {
      await page.goto('/test/fixtures/image-counter.html');

      await page.waitForFunction(() => window.galleryInitPromise !== undefined);
      await page.evaluate(() => window.galleryInitPromise);

      const counter = page.locator('.fbn-ic-counter');
      await expect(counter).toBeAttached();
      await expect(counter).toHaveClass(/fbn-ic-hidden/);
    });

    test('counter shows on image click', async ({ page }) => {
      await page.goto('/test/fixtures/image-counter.html');

      await page.waitForFunction(() => window.galleryInitPromise !== undefined);
      await page.evaluate(() => window.galleryInitPromise);
      await page.waitForSelector('#imageCloud img', { state: 'visible', timeout: 10000 });
      await page.waitForTimeout(500);

      // Click on the first image
      const firstImage = page.locator('#imageCloud img').first();
      await firstImage.click();
      await page.waitForTimeout(300);

      const counter = page.locator('.fbn-ic-counter');
      await expect(counter).not.toHaveClass(/fbn-ic-hidden/);
      await expect(counter).toContainText(/\d+ of \d+/);
    });

    test('counter updates on arrow key navigation', async ({ page }) => {
      await page.goto('/test/fixtures/image-counter.html');

      await page.waitForFunction(() => window.galleryInitPromise !== undefined);
      await page.evaluate(() => window.galleryInitPromise);
      await page.waitForSelector('#imageCloud img', { state: 'visible', timeout: 10000 });
      await page.waitForTimeout(500);

      // Click first image to focus
      const firstImage = page.locator('#imageCloud img').first();
      await firstImage.click();
      await page.waitForTimeout(300);

      const counter = page.locator('.fbn-ic-counter');
      const initialText = await counter.textContent();

      // Navigate to next image
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(300);

      const nextText = await counter.textContent();
      expect(nextText).not.toBe(initialText);
      await expect(counter).toContainText(/\d+ of \d+/);
    });

    test('counter hides on Escape', async ({ page }) => {
      await page.goto('/test/fixtures/image-counter.html');

      await page.waitForFunction(() => window.galleryInitPromise !== undefined);
      await page.evaluate(() => window.galleryInitPromise);
      await page.waitForSelector('#imageCloud img', { state: 'visible', timeout: 10000 });
      await page.waitForTimeout(500);

      // Click to focus
      const firstImage = page.locator('#imageCloud img').first();
      await firstImage.click();
      await page.waitForTimeout(300);

      const counter = page.locator('.fbn-ic-counter');
      await expect(counter).not.toHaveClass(/fbn-ic-hidden/);

      // Press Escape to unfocus
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);

      await expect(counter).toHaveClass(/fbn-ic-hidden/);
    });

    test('counter hides on click outside', async ({ page }) => {
      await page.goto('/test/fixtures/image-counter.html');

      await page.waitForFunction(() => window.galleryInitPromise !== undefined);
      await page.evaluate(() => window.galleryInitPromise);
      await page.waitForSelector('#imageCloud img', { state: 'visible', timeout: 10000 });
      await page.waitForTimeout(500);

      // Click to focus
      const firstImage = page.locator('#imageCloud img').first();
      await firstImage.click();
      await page.waitForTimeout(300);

      const counter = page.locator('.fbn-ic-counter');
      await expect(counter).not.toHaveClass(/fbn-ic-hidden/);

      // Click outside (on the container background)
      await page.mouse.click(10, 10);
      await page.waitForTimeout(300);

      await expect(counter).toHaveClass(/fbn-ic-hidden/);
    });

    test('counter hides when clicking focused image to unfocus', async ({ page }) => {
      await page.goto('/test/fixtures/image-counter.html');

      await page.waitForFunction(() => window.galleryInitPromise !== undefined);
      await page.evaluate(() => window.galleryInitPromise);
      await page.waitForSelector('#imageCloud img', { state: 'visible', timeout: 10000 });
      await page.waitForTimeout(500);

      const firstImage = page.locator('#imageCloud img').first();
      await firstImage.click();
      await page.waitForTimeout(300);

      const counter = page.locator('.fbn-ic-counter');
      await expect(counter).not.toHaveClass(/fbn-ic-hidden/);

      // Click the same (focused) image to unfocus
      await firstImage.click();
      await page.waitForTimeout(300);

      await expect(counter).toHaveClass(/fbn-ic-hidden/);
    });

  });

  test.describe('When showImageCounter is disabled (default)', () => {

    test('no counter element is created', async ({ page }) => {
      await page.goto('/test/fixtures/image-counter-disabled.html');

      await page.waitForFunction(() => window.galleryInitPromise !== undefined);
      await page.evaluate(() => window.galleryInitPromise);
      await page.waitForSelector('#imageCloud img', { state: 'visible', timeout: 10000 });
      await page.waitForTimeout(500);

      const counter = page.locator('.fbn-ic-counter');
      await expect(counter).toHaveCount(0);
    });

  });

});

// Type declarations
declare global {
  interface Window {
    galleryInitPromise: Promise<void>;
    ImageCloud: any;
    gallery: any;
  }
}
