import { test, expect, Page } from '@playwright/test';
import { waitForGalleryInit, isImageFocused, waitForAnimation, getImageCount } from '../utils/test-helpers';

// Helper to force-click an image by dispatching click event directly
async function forceClickImage(page: Page, imageIndex: number, containerId = 'imageCloud') {
  await page.evaluate(({ containerId, imageIndex }) => {
    const imgs = document.querySelectorAll(`#${containerId} img`);
    const img = imgs[imageIndex] as HTMLElement;
    if (img) {
      img.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    }
  }, { containerId, imageIndex });
}

test.describe('User Interactions', () => {

  test.describe('Click to Focus', () => {

    test('clicking image focuses it', async ({ page }) => {
      await page.goto('/test/fixtures/interactions.html');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 500); // Wait for entrance animations

      await forceClickImage(page, 0);
      await waitForAnimation(page, 300);

      const focused = await isImageFocused(page, 0);
      expect(focused).toBe(true);
    });

    test('focused image scales up', async ({ page }) => {
      await page.goto('/test/fixtures/interactions.html');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 500);

      const img = page.locator('#imageCloud img').first();
      const beforeBox = await img.boundingBox();

      await forceClickImage(page, 0);
      await waitForAnimation(page, 300);

      const afterBox = await img.boundingBox();

      expect(afterBox!.width).toBeGreaterThan(beforeBox!.width);
      expect(afterBox!.height).toBeGreaterThan(beforeBox!.height);
    });

    // Note: unfocusedOpacity feature exists in config but is not yet implemented in ZoomEngine
    test.skip('unfocused images become dimmed', async ({ page }) => {
      await page.goto('/test/fixtures/interactions.html');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 500);

      await forceClickImage(page, 0);
      await waitForAnimation(page, 300);

      // Check opacity of non-focused images
      const secondImg = page.locator('#imageCloud img').nth(1);
      const opacity = await secondImg.evaluate((el) =>
        parseFloat(window.getComputedStyle(el).opacity)
      );

      expect(opacity).toBeLessThan(1);
      expect(opacity).toBeCloseTo(0.3, 1);
    });

    test('focused image has elevated z-index', async ({ page }) => {
      await page.goto('/test/fixtures/interactions.html');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 500);

      await forceClickImage(page, 0);
      await waitForAnimation(page, 300);

      const img = page.locator('#imageCloud img').first();
      const zIndex = await img.evaluate((el) =>
        parseInt(window.getComputedStyle(el).zIndex)
      );

      expect(zIndex).toBeGreaterThanOrEqual(1000);
    });

    test('clicking another image swaps focus', async ({ page }) => {
      await page.goto('/test/fixtures/interactions.html');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 500);

      await forceClickImage(page, 0);
      await waitForAnimation(page, 300);

      const firstFocused = await isImageFocused(page, 0);
      expect(firstFocused).toBe(true);

      await forceClickImage(page, 1);
      await waitForAnimation(page, 300);

      const firstStillFocused = await isImageFocused(page, 0);
      const secondFocused = await isImageFocused(page, 1);

      expect(firstStillFocused).toBe(false);
      expect(secondFocused).toBe(true);
    });

  });

  test.describe('Unfocus Actions', () => {

    test('pressing ESC unfocuses image', async ({ page }) => {
      await page.goto('/test/fixtures/interactions.html');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 500);

      await forceClickImage(page, 0);
      await waitForAnimation(page, 300);

      expect(await isImageFocused(page, 0)).toBe(true);

      await page.keyboard.press('Escape');
      await waitForAnimation(page, 300);

      expect(await isImageFocused(page, 0)).toBe(false);
    });

    test('clicking outside unfocuses image', async ({ page }) => {
      await page.goto('/test/fixtures/interactions.html');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 500);

      await forceClickImage(page, 0);
      await waitForAnimation(page, 300);

      expect(await isImageFocused(page, 0)).toBe(true);

      // Click on container background (not on any image)
      await page.locator('#imageCloud').click({ position: { x: 10, y: 10 }, force: true });
      await waitForAnimation(page, 300);

      expect(await isImageFocused(page, 0)).toBe(false);
    });

    test('unfocused image returns to original position', async ({ page }) => {
      await page.goto('/test/fixtures/interactions.html');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 500);

      const img = page.locator('#imageCloud img').first();
      const originalBox = await img.boundingBox();

      await forceClickImage(page, 0);
      await waitForAnimation(page, 300);

      await page.keyboard.press('Escape');
      await waitForAnimation(page, 300);

      const finalBox = await img.boundingBox();

      // Should return close to original position (within tolerance)
      expect(Math.abs(finalBox!.x - originalBox!.x)).toBeLessThan(50);
      expect(Math.abs(finalBox!.y - originalBox!.y)).toBeLessThan(50);
    });

    test('opacity returns to normal after unfocus', async ({ page }) => {
      await page.goto('/test/fixtures/interactions.html');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 500);

      await forceClickImage(page, 0);
      await waitForAnimation(page, 300);

      await page.keyboard.press('Escape');
      await waitForAnimation(page, 300);

      const images = page.locator('#imageCloud img');
      const count = await images.count();

      for (let i = 0; i < count; i++) {
        const opacity = await images.nth(i).evaluate((el) =>
          parseFloat(window.getComputedStyle(el).opacity)
        );
        expect(opacity).toBe(1);
      }
    });

  });

  test.describe('Focus State Management', () => {

    test('only one image focused at a time', async ({ page }) => {
      await page.goto('/test/fixtures/interactions.html');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 500);

      await forceClickImage(page, 0);
      await waitForAnimation(page, 300);

      const count = await getImageCount(page);
      let focusedCount = 0;

      for (let i = 0; i < count; i++) {
        if (await isImageFocused(page, i)) {
          focusedCount++;
        }
      }

      expect(focusedCount).toBe(1);
    });

    test('double-clicking focused image unfocuses', async ({ page }) => {
      await page.goto('/test/fixtures/interactions.html');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 500);

      await forceClickImage(page, 0);
      await waitForAnimation(page, 300);

      expect(await isImageFocused(page, 0)).toBe(true);

      await forceClickImage(page, 0);
      await waitForAnimation(page, 300);

      expect(await isImageFocused(page, 0)).toBe(false);
    });

  });

});
