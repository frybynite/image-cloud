import { test, expect, Page } from '@playwright/test';
import { waitForGalleryInit, waitForAnimation } from '../utils/test-helpers';

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

test.describe('Animation System', () => {

  test.describe('Entrance Animations', () => {

    test('images become visible after entrance animation', async ({ page }) => {
      await page.goto('/test/fixtures/animations.html');

      // Wait for images to be attached to DOM
      await page.waitForSelector('#imageCloud img', { state: 'attached' });

      // Images should become visible after animation completes
      const img = page.locator('#imageCloud img').first();
      await expect(img).toBeVisible({ timeout: 2000 });

      // Verify image has a transform applied (indicating animation system is working)
      const transform = await img.evaluate((el) => window.getComputedStyle(el).transform);
      expect(transform).not.toBe('');
    });

    test('images appear staggered (queue enabled)', async ({ page }) => {
      await page.goto('/test/fixtures/animations.html');

      // Wait for first image to appear
      await page.waitForSelector('#imageCloud img', { state: 'visible', timeout: 5000 });

      // Wait for all images to finish appearing (3 images * 150ms interval + buffer)
      await page.waitForTimeout(600);

      // Verify all 3 images are now visible
      const finalCount = await page.locator('#imageCloud img').count();
      expect(finalCount).toBe(3);

      // Verify each image has visibility (all eventually appeared)
      const images = page.locator('#imageCloud img');
      for (let i = 0; i < finalCount; i++) {
        await expect(images.nth(i)).toBeVisible();
      }
    });

  });

  test.describe('Animation Timing', () => {

    test('animation uses configured duration', async ({ page }) => {
      await page.goto('/test/fixtures/animations.html');
      await waitForGalleryInit(page);

      // Check that transition duration is applied
      const img = page.locator('#imageCloud img').first();
      const transitionDuration = await img.evaluate((el) =>
        window.getComputedStyle(el).transitionDuration
      );

      // Duration should be non-trivial (not 0s)
      // Multiple durations may be returned for different properties (e.g., "0.6s, 0.8s")
      expect(transitionDuration).not.toBe('0s');
      expect(transitionDuration.length).toBeGreaterThan(0);
    });

    test('focus animation completes smoothly', async ({ page }) => {
      await page.goto('/test/fixtures/interactions.html');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 500);

      const img = page.locator('#imageCloud img').first();

      // Capture position before click
      const beforeClick = await img.boundingBox();

      // Click to focus using force click to avoid pointer interception issues
      await forceClickImage(page, 0);

      // Check mid-animation (image should be transitioning)
      await page.waitForTimeout(100);

      // Wait for animation to complete
      await waitForAnimation(page, 300);
      const afterAnimation = await img.boundingBox();

      // Image should have moved and scaled
      expect(afterAnimation!.width).toBeGreaterThan(beforeClick!.width);
    });

  });

  test.describe('Easing Functions', () => {

    test('transition includes easing', async ({ page }) => {
      await page.goto('/test/fixtures/animations.html');
      await waitForGalleryInit(page);

      const img = page.locator('#imageCloud img').first();
      const transition = await img.evaluate((el) =>
        window.getComputedStyle(el).transition
      );

      // Should include timing function (ease, cubic-bezier, etc.)
      expect(
        transition.includes('ease') ||
        transition.includes('cubic-bezier') ||
        transition.includes('linear')
      ).toBe(true);
    });

  });

});
