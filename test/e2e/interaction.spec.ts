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

    test('pressing ESC twice during unfocus does not restart the animation', async ({ page }) => {
      await page.goto('/test/fixtures/interactions.html');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 500);

      await forceClickImage(page, 0);
      await waitForAnimation(page, 300); // wait for 150ms focus animation + buffer

      expect(await isImageFocused(page, 0)).toBe(true);

      // Use browser-side timing to reliably hit the mid-animation window.
      // animationDuration is 150ms in this fixture.
      // Esc #1 at t=0 → unfocus animation runs (ends at t=150ms, class removed).
      // Esc #2 at t=100ms → with bug: cancels first, restarts from focused (ends t=250ms).
      // Check at t=200ms:
      //   fix present  → animation done at t=150ms → class absent → false ✓
      //   bug present  → animation done at t=250ms → class still present → true ✗
      const hasFocusedClassAt200ms = await page.evaluate(() => {
        return new Promise<boolean>((resolve) => {
          const img = document.querySelector('#imageCloud img') as HTMLElement;

          document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

          setTimeout(() => {
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

            setTimeout(() => {
              resolve(img.classList.contains('fbn-ic-focused'));
            }, 100); // 100ms after second Esc = 200ms after first
          }, 100); // second Esc at 100ms (well within 150ms animation)
        });
      });

      expect(hasFocusedClassAt200ms).toBe(false);

      // Also confirm everything settles cleanly
      await waitForAnimation(page, 400);
      expect(await isImageFocused(page, 0)).toBe(false);
    });

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

  test.describe('Cross-Animation', () => {

    test('clicking different image triggers cross-animation', async ({ page }) => {
      await page.goto('/test/fixtures/interactions.html');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 500);

      // Focus first image
      await forceClickImage(page, 0);
      await waitForAnimation(page, 700);

      expect(await isImageFocused(page, 0)).toBe(true);

      // Click second image - triggers cross-animation
      await forceClickImage(page, 1);
      await waitForAnimation(page, 700);

      // First should be unfocused, second should be focused
      expect(await isImageFocused(page, 0)).toBe(false);
      expect(await isImageFocused(page, 1)).toBe(true);
    });

    test('rapid clicks result in correct final focus', async ({ page }) => {
      await page.goto('/test/fixtures/interactions.html');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 500);

      // Focus first image and let it complete
      await forceClickImage(page, 0);
      await waitForAnimation(page, 700);

      // Click second to start cross-animation, then click third mid-animation
      // This tests the CROSS_ANIMATING interruption case
      await forceClickImage(page, 1);
      await waitForAnimation(page, 300); // Let cross-animation start

      await forceClickImage(page, 2);
      await waitForAnimation(page, 1200); // Wait for all animations to complete

      // Final state: only one image should be focused
      const focusedCount = (await Promise.all([
        isImageFocused(page, 0),
        isImageFocused(page, 1),
        isImageFocused(page, 2)
      ])).filter(Boolean).length;

      // Either image 1 or 2 should be focused (depending on timing)
      // but not image 0, and only one image total
      expect(await isImageFocused(page, 0)).toBe(false);
      expect(focusedCount).toBe(1);
    });

    test('ESC during cross-animation unfocuses all', async ({ page }) => {
      await page.goto('/test/fixtures/interactions.html');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 500);

      // Focus first image
      await forceClickImage(page, 0);
      await waitForAnimation(page, 700);

      // Click second to start cross-animation
      await forceClickImage(page, 1);
      await waitForAnimation(page, 200); // Let animation start properly

      // Press ESC during animation
      await page.keyboard.press('Escape');
      await waitForAnimation(page, 1000); // Wait for unfocus animations to complete

      // Both should be unfocused
      expect(await isImageFocused(page, 0)).toBe(false);
      expect(await isImageFocused(page, 1)).toBe(false);
    });

    test('images return to original positions after rapid cancel', async ({ page }) => {
      await page.goto('/test/fixtures/interactions.html');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 500);

      // Get original positions
      const images = page.locator('#imageCloud img');
      const originalPos0 = await images.nth(0).boundingBox();
      const originalPos1 = await images.nth(1).boundingBox();

      // Focus first
      await forceClickImage(page, 0);
      await waitForAnimation(page, 700);

      // Start cross-animation to second
      await forceClickImage(page, 1);
      await waitForAnimation(page, 200); // Let animation start

      // Cancel with ESC
      await page.keyboard.press('Escape');
      await waitForAnimation(page, 1000); // Wait for unfocus animations

      // Check positions returned to original (within tolerance)
      // Use larger tolerance as images animate back from mid-animation positions
      const finalPos0 = await images.nth(0).boundingBox();
      const finalPos1 = await images.nth(1).boundingBox();

      expect(Math.abs(finalPos0!.x - originalPos0!.x)).toBeLessThan(100);
      expect(Math.abs(finalPos0!.y - originalPos0!.y)).toBeLessThan(100);
      expect(Math.abs(finalPos1!.x - originalPos1!.x)).toBeLessThan(100);
      expect(Math.abs(finalPos1!.y - originalPos1!.y)).toBeLessThan(100);
    });

    test('z-index layering after cross-animation', async ({ page }) => {
      await page.goto('/test/fixtures/interactions.html');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 500);

      // Focus first image
      await forceClickImage(page, 0);
      await waitForAnimation(page, 700);

      // Verify first image has elevated z-index when focused
      const images = page.locator('#imageCloud img');
      const zIndexFocused = await images.nth(0).evaluate((el) =>
        parseInt(window.getComputedStyle(el).zIndex) || 0
      );
      expect(zIndexFocused).toBeGreaterThanOrEqual(1000);

      // Click second to trigger cross-animation and wait for completion
      await forceClickImage(page, 1);
      await waitForAnimation(page, 800);

      // After cross-animation completes:
      // - First image should have lower z-index (returned to original)
      // - Second image should have elevated z-index (now focused)
      const zIndex0After = await images.nth(0).evaluate((el) =>
        parseInt(window.getComputedStyle(el).zIndex) || 0
      );
      const zIndex1After = await images.nth(1).evaluate((el) =>
        parseInt(window.getComputedStyle(el).zIndex) || 0
      );

      // Second should be focused with elevated z-index
      expect(await isImageFocused(page, 1)).toBe(true);
      expect(zIndex1After).toBeGreaterThanOrEqual(1000);
      // First should have lower z-index than second
      expect(zIndex1After).toBeGreaterThan(zIndex0After);
    });

  });

});
