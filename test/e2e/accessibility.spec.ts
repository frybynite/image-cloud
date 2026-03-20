import { test, expect } from '@playwright/test';

// Helper: wait for gallery to fully initialize and images to appear
async function waitForGallery(page: any) {
  await page.waitForFunction(() => window.galleryInitPromise !== undefined);
  await page.evaluate(() => window.galleryInitPromise);
  await page.waitForSelector('#imageCloud img', { state: 'visible', timeout: 10000 });
  await page.waitForTimeout(500);
}

// Helper: wait for gallery and all images to be fully visible (non-zero opacity)
async function waitForAllImagesLoaded(page: any) {
  await waitForGallery(page);
  await page.waitForFunction(() => {
    const imgs = document.querySelectorAll('#imageCloud img');
    return imgs.length >= 5 && Array.from(imgs).every(img => getComputedStyle(img).opacity !== '0');
  }, { timeout: 10000 });
}

test.describe('Accessibility', () => {

  test.describe('Container', () => {
    test('has role="region"', async ({ page }) => {
      await page.goto('/test/fixtures/nav-buttons.html');
      await waitForGallery(page);
      const container = page.locator('#imageCloud');
      await expect(container).toHaveAttribute('role', 'region');
    });

    test('has aria-label', async ({ page }) => {
      await page.goto('/test/fixtures/nav-buttons.html');
      await waitForGallery(page);
      const container = page.locator('#imageCloud');
      await expect(container).toHaveAttribute('aria-label', 'Image gallery');
    });

    test('contains an aria-live region', async ({ page }) => {
      await page.goto('/test/fixtures/nav-buttons.html');
      await waitForGallery(page);
      const liveRegion = page.locator('#imageCloud [aria-live="polite"]');
      await expect(liveRegion).toBeAttached();
    });
  });

  test.describe('Images', () => {
    test('each image has an alt attribute', async ({ page }) => {
      await page.goto('/test/fixtures/nav-buttons.html');
      await waitForGallery(page);
      const images = page.locator('#imageCloud img');
      const count = await images.count();
      expect(count).toBeGreaterThan(0);
      for (let i = 0; i < count; i++) {
        await expect(images.nth(i)).toHaveAttribute('alt', /.*/);
      }
    });
  });

  test.describe('aria-live announcements', () => {
    test('focusing an image updates the aria-live region', async ({ page }) => {
      await page.goto('/test/fixtures/nav-buttons.html');
      await waitForAllImagesLoaded(page);

      const liveRegion = page.locator('#imageCloud [aria-live="polite"]');
      const textBefore = await liveRegion.textContent();

      const firstImage = page.locator('#imageCloud img').first();
      await firstImage.click();
      await page.waitForTimeout(400);

      const textAfter = await liveRegion.textContent();
      expect(textAfter).not.toBe(textBefore);
      expect(textAfter?.length).toBeGreaterThan(0);
    });

    test('unfocusing clears the aria-live region', async ({ page }) => {
      await page.goto('/test/fixtures/nav-buttons.html');
      await waitForAllImagesLoaded(page);

      const firstImage = page.locator('#imageCloud img').first();
      await firstImage.click();
      await page.waitForTimeout(400);

      // Click outside to unfocus
      await page.mouse.click(10, 10);
      await page.waitForTimeout(400);

      const liveRegion = page.locator('#imageCloud [aria-live="polite"]');
      const text = await liveRegion.textContent();
      expect(text?.trim()).toBe('');
    });
  });

  test.describe('Nav buttons keyboard accessibility', () => {
    test('prev button does not have tabindex="-1"', async ({ page }) => {
      await page.goto('/test/fixtures/nav-buttons.html');
      await waitForGallery(page);

      // Make buttons visible first
      const firstImage = page.locator('#imageCloud img').first();
      await firstImage.click();
      await page.waitForTimeout(300);

      const prevBtn = page.locator('.fbn-ic-nav-btn-prev');
      const tabindex = await prevBtn.getAttribute('tabindex');
      expect(tabindex).not.toBe('-1');
    });

    test('next button does not have tabindex="-1"', async ({ page }) => {
      await page.goto('/test/fixtures/nav-buttons.html');
      await waitForGallery(page);

      const firstImage = page.locator('#imageCloud img').first();
      await firstImage.click();
      await page.waitForTimeout(300);

      const nextBtn = page.locator('.fbn-ic-nav-btn-next');
      const tabindex = await nextBtn.getAttribute('tabindex');
      expect(tabindex).not.toBe('-1');
    });
  });

});

declare global {
  interface Window {
    galleryInitPromise: Promise<void>;
    ImageCloud: any;
    gallery: any;
  }
}
