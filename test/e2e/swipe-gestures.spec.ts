import { test, expect, Page } from '@playwright/test';
import { waitForGalleryInit, waitForAnimation } from '../utils/test-helpers';

// Helper to force-click an image by imageId (dataset.imageId), not DOM position.
// Using imageId ensures consistent behavior regardless of image load order.
async function forceClickImage(page: Page, imageId: number, containerId = 'imageCloud') {
  await page.evaluate(({ containerId, imageId }) => {
    const imgs = document.querySelectorAll(`#${containerId} img`);
    for (const img of Array.from(imgs)) {
      if ((img as HTMLElement).dataset.imageId === String(imageId)) {
        (img as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        return;
      }
    }
  }, { containerId, imageId });
}

// Check if image with given imageId is focused (zIndex >= 1000).
// Uses imageId (dataset.imageId) instead of DOM position for reliable cross-load-order checks.
async function isImageFocusedById(page: Page, imageId: number, containerId = 'imageCloud') {
  return page.evaluate(({ containerId, imageId }) => {
    const imgs = document.querySelectorAll(`#${containerId} img`);
    for (const img of Array.from(imgs)) {
      if ((img as HTMLElement).dataset.imageId === String(imageId)) {
        return parseInt(window.getComputedStyle(img as Element).zIndex) >= 1000;
      }
    }
    return false;
  }, { containerId, imageId });
}

// Dispatches touch events cross-browser inside page.evaluate.
// Tries real Touch/TouchEvent constructors first (Chrome with hasTouch: true),
// falls back to createEvent('Event') with manually assigned properties for WebKit.
// A 50ms delay between touchstart and touchmove ensures velocity stays below the
// SwipeEngine threshold so only the distance threshold determines navigation.
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

    const fakeTouch = (x: number, y: number) => ({ identifier: 1, target: gallery, clientX: x, clientY: y, pageX: x, pageY: y, screenX: x, screenY: y, radiusX: 1, radiusY: 1, rotationAngle: 0, force: 1 });
    const fakeTouchList = (items: any[]) => Object.assign(items, { item: (i: number) => items[i] });

    const dispatch = (type: string, x: number, y: number, active: boolean) => {
      let touch: any;
      try { touch = new Touch({ identifier: 1, target: gallery, clientX: x, clientY: y, pageX: x, pageY: y }); }
      catch { touch = fakeTouch(x, y); }

      try {
        gallery.dispatchEvent(new TouchEvent(type, { bubbles: true, cancelable: true, touches: active ? [touch] : [], targetTouches: active ? [touch] : [], changedTouches: [touch] }));
      } catch {
        const evt = document.createEvent('Event') as any;
        evt.initEvent(type, true, true);
        evt.touches = active ? fakeTouchList([touch]) : fakeTouchList([]);
        evt.targetTouches = evt.touches;
        evt.changedTouches = fakeTouchList([touch]);
        gallery.dispatchEvent(evt);
      }
    };

    dispatch('touchstart', startX, startY, true);
    await new Promise(r => setTimeout(r, 50));
    dispatch('touchmove', endX, startY, true);
    dispatch('touchend', endX, startY, false);
  }, { containerId, startX, startY, endX });
}

// Helper to perform a vertical swipe gesture (same cross-browser approach as horizontal).
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

    const fakeTouch = (x: number, y: number) => ({ identifier: 1, target: gallery, clientX: x, clientY: y, pageX: x, pageY: y, screenX: x, screenY: y, radiusX: 1, radiusY: 1, rotationAngle: 0, force: 1 });
    const fakeTouchList = (items: any[]) => Object.assign(items, { item: (i: number) => items[i] });

    const dispatch = (type: string, x: number, y: number, active: boolean) => {
      let touch: any;
      try { touch = new Touch({ identifier: 1, target: gallery, clientX: x, clientY: y, pageX: x, pageY: y }); }
      catch { touch = fakeTouch(x, y); }

      try {
        gallery.dispatchEvent(new TouchEvent(type, { bubbles: true, cancelable: true, touches: active ? [touch] : [], targetTouches: active ? [touch] : [], changedTouches: [touch] }));
      } catch {
        const evt = document.createEvent('Event') as any;
        evt.initEvent(type, true, true);
        evt.touches = active ? fakeTouchList([touch]) : fakeTouchList([]);
        evt.targetTouches = evt.touches;
        evt.changedTouches = fakeTouchList([touch]);
        gallery.dispatchEvent(evt);
      }
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

      // Focus image with imageId=0
      await forceClickImage(page, 0);
      await waitForAnimation(page, 700);
      expect(await isImageFocusedById(page, 0)).toBe(true);

      // Swipe left (negative deltaX) to go to next image (imageId=1)
      await performTouchSwipe(page, -100);
      await waitForAnimation(page, 700);

      // imageId=1 should now be focused, imageId=0 should not be
      expect(await isImageFocusedById(page, 0)).toBe(false);
      expect(await isImageFocusedById(page, 1)).toBe(true);
    });

    test('swipe right on focused image navigates to previous image', async ({ page }) => {
      await page.goto('/test/fixtures/interactions.html');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 500);

      // Focus image with imageId=1
      await forceClickImage(page, 1);
      await waitForAnimation(page, 700);
      expect(await isImageFocusedById(page, 1)).toBe(true);

      // Swipe right (positive deltaX) to go to previous image (imageId=0)
      await performTouchSwipe(page, 100);
      await waitForAnimation(page, 700);

      // imageId=0 should now be focused, imageId=1 should not be
      expect(await isImageFocusedById(page, 1)).toBe(false);
      expect(await isImageFocusedById(page, 0)).toBe(true);
    });

    test('swipe does nothing when no image is focused', async ({ page }) => {
      await page.goto('/test/fixtures/interactions.html');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 500);

      // Verify no image is focused
      expect(await isImageFocusedById(page, 0)).toBe(false);
      expect(await isImageFocusedById(page, 1)).toBe(false);

      // Try swipe left
      await performTouchSwipe(page, -100);
      await waitForAnimation(page, 300);

      // Still no image focused
      expect(await isImageFocusedById(page, 0)).toBe(false);
      expect(await isImageFocusedById(page, 1)).toBe(false);
    });

  });

  test.describe('Swipe Threshold', () => {

    test('small swipe does not navigate (under threshold)', async ({ page }) => {
      await page.goto('/test/fixtures/interactions.html');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 500);

      // Focus image with imageId=0
      await forceClickImage(page, 0);
      await waitForAnimation(page, 700);
      expect(await isImageFocusedById(page, 0)).toBe(true);

      // Small swipe (only 20px, under 50px threshold)
      await performTouchSwipe(page, -20);
      await waitForAnimation(page, 300);

      // imageId=0 should still be focused (no navigation)
      expect(await isImageFocusedById(page, 0)).toBe(true);
    });

  });

  test.describe('Wrap Around', () => {

    test('swipe right on first image wraps to last image', async ({ page }) => {
      await page.goto('/test/fixtures/interactions.html');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 500);

      // Get image count (by imageId: 0 to N-1)
      const imageCount = await page.locator('#imageCloud img').count();
      const lastId = imageCount - 1;

      // Focus image with imageId=0
      await forceClickImage(page, 0);
      await waitForAnimation(page, 700);
      expect(await isImageFocusedById(page, 0)).toBe(true);

      // Swipe right on first image - should wrap to last imageId
      await performTouchSwipe(page, 100);
      await waitForAnimation(page, 700);

      // Last image (imageId=lastId) should be focused, imageId=0 should not
      expect(await isImageFocusedById(page, 0)).toBe(false);
      expect(await isImageFocusedById(page, lastId)).toBe(true);
    });

  });

  test.describe('Vertical Swipe Passthrough', () => {

    test('vertical swipe does not trigger navigation', async ({ page }) => {
      await page.goto('/test/fixtures/interactions.html');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 500);

      // Focus image with imageId=0
      await forceClickImage(page, 0);
      await waitForAnimation(page, 700);
      expect(await isImageFocusedById(page, 0)).toBe(true);

      // Vertical swipe (should not trigger navigation)
      await performVerticalSwipe(page, -100);
      await waitForAnimation(page, 300);

      // imageId=0 should still be focused (no navigation from vertical swipe)
      expect(await isImageFocusedById(page, 0)).toBe(true);
    });

  });

});
