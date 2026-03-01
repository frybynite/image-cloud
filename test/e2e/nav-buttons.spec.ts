import { test, expect } from '@playwright/test';

test.describe('Navigation Buttons', () => {

  test.describe('When showNavButtons is enabled', () => {

    test('buttons are created and hidden initially', async ({ page }) => {
      await page.goto('/test/fixtures/nav-buttons.html');

      await page.waitForFunction(() => window.galleryInitPromise !== undefined);
      await page.evaluate(() => window.galleryInitPromise);

      const prevBtn = page.locator('.fbn-ic-nav-btn-prev');
      const nextBtn = page.locator('.fbn-ic-nav-btn-next');
      await expect(prevBtn).toBeAttached();
      await expect(nextBtn).toBeAttached();
      await expect(prevBtn).toHaveClass(/fbn-ic-hidden/);
      await expect(nextBtn).toHaveClass(/fbn-ic-hidden/);
    });

    test('buttons appear on image click', async ({ page }) => {
      await page.goto('/test/fixtures/nav-buttons.html');

      await page.waitForFunction(() => window.galleryInitPromise !== undefined);
      await page.evaluate(() => window.galleryInitPromise);
      await page.waitForSelector('#imageCloud img', { state: 'visible', timeout: 10000 });
      await page.waitForTimeout(500);

      const firstImage = page.locator('#imageCloud img').first();
      await firstImage.click();
      await page.waitForTimeout(300);

      const prevBtn = page.locator('.fbn-ic-nav-btn-prev');
      const nextBtn = page.locator('.fbn-ic-nav-btn-next');
      await expect(prevBtn).not.toHaveClass(/fbn-ic-hidden/);
      await expect(nextBtn).not.toHaveClass(/fbn-ic-hidden/);
    });

    test('clicking next navigates to a different image', async ({ page }) => {
      await page.goto('/test/fixtures/nav-buttons.html');

      await page.waitForFunction(() => window.galleryInitPromise !== undefined);
      await page.evaluate(() => window.galleryInitPromise);
      await page.waitForSelector('#imageCloud img', { state: 'visible', timeout: 10000 });
      await page.waitForFunction(() => {
        const imgs = document.querySelectorAll('#imageCloud img');
        return imgs.length >= 5 && Array.from(imgs).every(img => getComputedStyle(img).opacity !== '0');
      }, { timeout: 10000 });

      const firstImage = page.locator('#imageCloud img').first();
      await firstImage.click();
      await page.waitForTimeout(300);

      // Get focused image id before clicking next
      const focusedBefore = await page.evaluate(() => {
        const el = document.querySelector('#imageCloud img.fbn-ic-focused');
        return el?.dataset.imageId ?? null;
      });

      const nextBtn = page.locator('.fbn-ic-nav-btn-next');
      await nextBtn.click();
      await page.waitForTimeout(400);

      const focusedAfter = await page.evaluate(() => {
        const el = document.querySelector('#imageCloud img.fbn-ic-focused');
        return el?.dataset.imageId ?? null;
      });

      expect(focusedAfter).not.toBe(focusedBefore);
      expect(focusedAfter).not.toBeNull();
    });

    test('clicking prev navigates to a different image', async ({ page }) => {
      await page.goto('/test/fixtures/nav-buttons.html');

      await page.waitForFunction(() => window.galleryInitPromise !== undefined);
      await page.evaluate(() => window.galleryInitPromise);
      await page.waitForSelector('#imageCloud img', { state: 'visible', timeout: 10000 });
      await page.waitForFunction(() => {
        const imgs = document.querySelectorAll('#imageCloud img');
        return imgs.length >= 5 && Array.from(imgs).every(img => getComputedStyle(img).opacity !== '0');
      }, { timeout: 10000 });

      const firstImage = page.locator('#imageCloud img').first();
      await firstImage.click();
      await page.waitForTimeout(300);

      const focusedBefore = await page.evaluate(() => {
        const el = document.querySelector('#imageCloud img.fbn-ic-focused');
        return el?.dataset.imageId ?? null;
      });

      const prevBtn = page.locator('.fbn-ic-nav-btn-prev');
      await prevBtn.click();
      await page.waitForTimeout(400);

      const focusedAfter = await page.evaluate(() => {
        const el = document.querySelector('#imageCloud img.fbn-ic-focused');
        return el?.dataset.imageId ?? null;
      });

      expect(focusedAfter).not.toBe(focusedBefore);
      expect(focusedAfter).not.toBeNull();
    });

    test('clicking next does NOT unfocus', async ({ page }) => {
      await page.goto('/test/fixtures/nav-buttons.html');

      await page.waitForFunction(() => window.galleryInitPromise !== undefined);
      await page.evaluate(() => window.galleryInitPromise);
      await page.waitForSelector('#imageCloud img', { state: 'visible', timeout: 10000 });
      await page.waitForFunction(() => {
        const imgs = document.querySelectorAll('#imageCloud img');
        return imgs.length >= 5 && Array.from(imgs).every(img => getComputedStyle(img).opacity !== '0');
      }, { timeout: 10000 });

      const firstImage = page.locator('#imageCloud img').first();
      await firstImage.click();
      await page.waitForTimeout(300);

      const nextBtn = page.locator('.fbn-ic-nav-btn-next');
      await nextBtn.click();
      await page.waitForTimeout(400);

      // Some image should still be focused
      const focusedCount = await page.locator('#imageCloud img.fbn-ic-focused').count();
      expect(focusedCount).toBeGreaterThan(0);
    });

    test('buttons hide on Escape', async ({ page }) => {
      await page.goto('/test/fixtures/nav-buttons.html');

      await page.waitForFunction(() => window.galleryInitPromise !== undefined);
      await page.evaluate(() => window.galleryInitPromise);
      await page.waitForSelector('#imageCloud img', { state: 'visible', timeout: 10000 });
      await page.waitForTimeout(500);

      const firstImage = page.locator('#imageCloud img').first();
      await firstImage.click();
      await page.waitForTimeout(300);

      const prevBtn = page.locator('.fbn-ic-nav-btn-prev');
      const nextBtn = page.locator('.fbn-ic-nav-btn-next');
      await expect(prevBtn).not.toHaveClass(/fbn-ic-hidden/);

      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);

      await expect(prevBtn).toHaveClass(/fbn-ic-hidden/);
      await expect(nextBtn).toHaveClass(/fbn-ic-hidden/);
    });

    test('buttons hide on click outside', async ({ page }) => {
      await page.goto('/test/fixtures/nav-buttons.html');

      await page.waitForFunction(() => window.galleryInitPromise !== undefined);
      await page.evaluate(() => window.galleryInitPromise);
      await page.waitForSelector('#imageCloud img', { state: 'visible', timeout: 10000 });
      await page.waitForTimeout(500);

      const firstImage = page.locator('#imageCloud img').first();
      await firstImage.click();
      await page.waitForTimeout(300);

      const prevBtn = page.locator('.fbn-ic-nav-btn-prev');
      const nextBtn = page.locator('.fbn-ic-nav-btn-next');
      await expect(prevBtn).not.toHaveClass(/fbn-ic-hidden/);

      await page.mouse.click(10, 10);
      await page.waitForTimeout(300);

      await expect(prevBtn).toHaveClass(/fbn-ic-hidden/);
      await expect(nextBtn).toHaveClass(/fbn-ic-hidden/);
    });

    test('buttons hide when clicking focused image to unfocus', async ({ page }) => {
      await page.goto('/test/fixtures/nav-buttons.html');

      await page.waitForFunction(() => window.galleryInitPromise !== undefined);
      await page.evaluate(() => window.galleryInitPromise);
      await page.waitForSelector('#imageCloud img', { state: 'visible', timeout: 10000 });
      await page.waitForFunction(() => {
        const imgs = document.querySelectorAll('#imageCloud img');
        return imgs.length >= 5 && Array.from(imgs).every(img => getComputedStyle(img).opacity !== '0');
      }, { timeout: 10000 });

      const firstImage = page.locator('#imageCloud img').first();
      await firstImage.click();

      const prevBtn = page.locator('.fbn-ic-nav-btn-prev');
      const nextBtn = page.locator('.fbn-ic-nav-btn-next');
      await expect(prevBtn).not.toHaveClass(/fbn-ic-hidden/, { timeout: 5000 });

      // Click the same (focused) image to unfocus
      await firstImage.click();

      await expect(prevBtn).toHaveClass(/fbn-ic-hidden/, { timeout: 5000 });
      await expect(nextBtn).toHaveClass(/fbn-ic-hidden/, { timeout: 5000 });
    });

  });

  test.describe('When showNavButtons is disabled (default)', () => {

    test('no nav button elements are created', async ({ page }) => {
      await page.goto('/test/fixtures/nav-buttons-disabled.html');

      await page.waitForFunction(() => window.galleryInitPromise !== undefined);
      await page.evaluate(() => window.galleryInitPromise);
      await page.waitForSelector('#imageCloud img', { state: 'visible', timeout: 10000 });
      await page.waitForTimeout(500);

      const navBtns = page.locator('.fbn-ic-nav-btn');
      await expect(navBtns).toHaveCount(0);
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
