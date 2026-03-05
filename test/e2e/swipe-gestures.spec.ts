import { test, expect, Page } from '@playwright/test';
import { waitForGalleryInit, isImageFocused, waitForAnimation } from '../utils/test-helpers';

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

// Helper to perform a horizontal swipe gesture using real Touch/TouchEvent APIs.
// Requires hasTouch: true in the test context (set via test.use at describe level).
// A 50ms delay is inserted between touchstart and touchmove/touchend so that the
// SwipeEngine's velocity calculation stays below the velocity threshold — ensuring
// only the distance threshold determines navigation.
async function performTouchSwipe(page: Page, deltaX: number, containerId = 'imageCloud') {
  const gallery = page.locator(`#${containerId}`);
  const box = await gallery.boundingBox();
  if (!box) return;

  const startX = box.x + box.width / 2;
  const startY = box.y + box.height / 2;
  const endX = startX + deltaX;

  await page.evaluate(async ({ containerId, startX, startY, endX }) => {
    const gallery = document.querySelector(`#${containerId}`) as HTMLElement;
    if (!gallery) return;

    const makeTouch = (x: number, y: number) =>
      new Touch({ identifier: 1, target: gallery, clientX: x, clientY: y, pageX: x, pageY: y });

    const dispatch = (type: string, x: number, y: number, active: boolean) => {
      const touch = makeTouch(x, y);
      gallery.dispatchEvent(new TouchEvent(type, {
        bubbles: true, cancelable: true,
        touches: active ? [touch] : [],
        targetTouches: active ? [touch] : [],
        changedTouches: [touch],
      }));
    };

    dispatch('touchstart', startX, startY, true);
    await new Promise(r => setTimeout(r, 50));
    dispatch('touchmove', endX, startY, true);
    dispatch('touchend', endX, startY, false);
  }, { containerId, startX, startY, endX });
}

// Helper to perform a vertical swipe gesture using real Touch/TouchEvent APIs.
async function performVerticalSwipe(page: Page, deltaY: number, containerId = 'imageCloud') {
  const gallery = page.locator(`#${containerId}`);
  const box = await gallery.boundingBox();
  if (!box) return;

  const startX = box.x + box.width / 2;
  const startY = box.y + box.height / 2;
  const endY = startY + deltaY;

  await page.evaluate(async ({ containerId, startX, startY, endY }) => {
    const gallery = document.querySelector(`#${containerId}`) as HTMLElement;
    if (!gallery) return;

    const makeTouch = (x: number, y: number) =>
      new Touch({ identifier: 1, target: gallery, clientX: x, clientY: y, pageX: x, pageY: y });

    const dispatch = (type: string, x: number, y: number, active: boolean) => {
      const touch = makeTouch(x, y);
      gallery.dispatchEvent(new TouchEvent(type, {
        bubbles: true, cancelable: true,
        touches: active ? [touch] : [],
        targetTouches: active ? [touch] : [],
        changedTouches: [touch],
      }));
    };

    dispatch('touchstart', startX, startY, true);
    await new Promise(r => setTimeout(r, 50));
    dispatch('touchmove', startX, endY, true);
    dispatch('touchend', startX, endY, false);
  }, { containerId, startX, startY, endY });
}

test.describe('Swipe Gesture Navigation', () => {

  // Enable touch emulation so Touch/TouchEvent constructors are available in page.evaluate
  test.use({ hasTouch: true });

  test.describe('Basic Swipe Navigation', () => {

    test('swipe left on focused image navigates to next image', async ({ page }) => {
      await page.goto('/test/fixtures/interactions.html');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 500);

      // Focus first image
      await forceClickImage(page, 0);
      await waitForAnimation(page, 700);
      expect(await isImageFocused(page, 0)).toBe(true);

      // Swipe left (negative deltaX) to go to next image
      await performTouchSwipe(page, -100);
      await waitForAnimation(page, 700);

      // Second image should now be focused
      expect(await isImageFocused(page, 0)).toBe(false);
      expect(await isImageFocused(page, 1)).toBe(true);
    });

    test('swipe right on focused image navigates to previous image', async ({ page }) => {
      await page.goto('/test/fixtures/interactions.html');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 500);

      // Focus second image
      await forceClickImage(page, 1);
      await waitForAnimation(page, 700);
      expect(await isImageFocused(page, 1)).toBe(true);

      // Swipe right (positive deltaX) to go to previous image
      await performTouchSwipe(page, 100);
      await waitForAnimation(page, 700);

      // First image should now be focused
      expect(await isImageFocused(page, 1)).toBe(false);
      expect(await isImageFocused(page, 0)).toBe(true);
    });

    test('swipe does nothing when no image is focused', async ({ page }) => {
      await page.goto('/test/fixtures/interactions.html');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 500);

      // Verify no image is focused
      expect(await isImageFocused(page, 0)).toBe(false);
      expect(await isImageFocused(page, 1)).toBe(false);

      // Try swipe left
      await performTouchSwipe(page, -100);
      await waitForAnimation(page, 300);

      // Still no image focused
      expect(await isImageFocused(page, 0)).toBe(false);
      expect(await isImageFocused(page, 1)).toBe(false);
    });

  });

  test.describe('Swipe Threshold', () => {

    test('small swipe does not navigate (under threshold)', async ({ page }) => {
      await page.goto('/test/fixtures/interactions.html');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 500);

      // Focus first image
      await forceClickImage(page, 0);
      await waitForAnimation(page, 700);
      expect(await isImageFocused(page, 0)).toBe(true);

      // Small swipe (only 20px, under 50px threshold)
      await performTouchSwipe(page, -20);
      await waitForAnimation(page, 300);

      // First image should still be focused (no navigation)
      expect(await isImageFocused(page, 0)).toBe(true);
    });

  });

  test.describe('Wrap Around', () => {

    test('swipe right on first image wraps to last image', async ({ page }) => {
      await page.goto('/test/fixtures/interactions.html');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 500);

      // Get image count
      const imageCount = await page.locator('#imageCloud img').count();

      // Focus first image
      await forceClickImage(page, 0);
      await waitForAnimation(page, 700);
      expect(await isImageFocused(page, 0)).toBe(true);

      // Swipe right on first image - should wrap to last
      await performTouchSwipe(page, 100);
      await waitForAnimation(page, 700);

      // Last image should be focused
      expect(await isImageFocused(page, 0)).toBe(false);
      expect(await isImageFocused(page, imageCount - 1)).toBe(true);
    });

  });

  test.describe('Vertical Swipe Passthrough', () => {

    test('vertical swipe does not trigger navigation', async ({ page }) => {
      await page.goto('/test/fixtures/interactions.html');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 500);

      // Focus first image
      await forceClickImage(page, 0);
      await waitForAnimation(page, 700);
      expect(await isImageFocused(page, 0)).toBe(true);

      // Vertical swipe (should not trigger navigation)
      await performVerticalSwipe(page, -100);
      await waitForAnimation(page, 300);

      // First image should still be focused (no navigation from vertical swipe)
      expect(await isImageFocused(page, 0)).toBe(true);
    });

  });

});
