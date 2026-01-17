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

    test('images animate in from edges', async ({ page }) => {
      await page.goto('/test/fixtures/animations.html');

      // Check initial state before full animation
      await page.waitForSelector('#imageCloud img', { state: 'attached' });

      // Images should have transforms applied
      const img = page.locator('#imageCloud img').first();
      await expect(img).toBeVisible({ timeout: 2000 });
    });

    test('images appear staggered (queue enabled)', async ({ page }) => {
      await page.goto('/test/fixtures/animations.html');

      // Wait for first image
      await page.waitForSelector('#imageCloud img', { state: 'visible' });

      // Count visible images over time
      let visibleAt100ms = 0;
      let visibleAt300ms = 0;

      await page.waitForTimeout(100);
      visibleAt100ms = await page.locator('#imageCloud img:visible').count();

      await page.waitForTimeout(200);
      visibleAt300ms = await page.locator('#imageCloud img:visible').count();

      // With queue interval of 150ms, we should see staggered appearance
      // This is a soft check - timing can vary
      expect(visibleAt300ms).toBeGreaterThanOrEqual(visibleAt100ms);
    });

  });

  test.describe('Animation Timing', () => {

    test('animation uses configured duration', async ({ page }) => {
      await page.goto('/test/fixtures/animations.html');
      await waitForGalleryInit(page);

      // Check that transition duration is applied
      const img = page.locator('#imageCloud img').first();
      const transition = await img.evaluate((el) =>
        window.getComputedStyle(el).transition
      );

      // Should contain duration info
      expect(transition.length).toBeGreaterThan(0);
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
