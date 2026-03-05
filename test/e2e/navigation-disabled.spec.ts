import { test, expect } from '@playwright/test';
import { waitForGalleryInit, waitForAnimation } from '../utils/test-helpers';

test.describe('Navigation Config Flags', () => {

  test('keyboard: false prevents arrow key navigation', async ({ page }) => {
    await page.goto('/test/fixtures/interaction-keyboard-disabled.html');
    await waitForGalleryInit(page);
    await waitForAnimation(page, 500);

    // Click an image to focus it
    await page.locator('#imageCloud img').first().click({ force: true });
    await waitForAnimation(page, 300);

    // Confirm an image is focused
    const focusedBefore = await page.evaluate(() => {
      const imgs = document.querySelectorAll('#imageCloud img');
      for (const img of imgs) {
        if (parseInt(window.getComputedStyle(img as HTMLElement).zIndex) >= 1000) return true;
      }
      return false;
    });
    expect(focusedBefore).toBe(true);

    // Get the focused imageId before pressing arrow key
    const idBefore = await page.evaluate(() => {
      const imgs = document.querySelectorAll('#imageCloud img');
      for (const img of imgs) {
        if (parseInt(window.getComputedStyle(img as HTMLElement).zIndex) >= 1000) {
          return (img as HTMLElement).dataset.imageId;
        }
      }
      return null;
    });

    // Focus the container and press arrow key — should do nothing
    await page.locator('#imageCloud').focus();
    await page.keyboard.press('ArrowRight');
    await waitForAnimation(page, 300);

    // Same image should still be focused with same imageId
    const idAfter = await page.evaluate(() => {
      const imgs = document.querySelectorAll('#imageCloud img');
      for (const img of imgs) {
        if (parseInt(window.getComputedStyle(img as HTMLElement).zIndex) >= 1000) {
          return (img as HTMLElement).dataset.imageId;
        }
      }
      return null;
    });
    expect(idAfter).toBe(idBefore);
  });

  test('keyboard: true (default) allows arrow key navigation', async ({ page }) => {
    await page.goto('/test/fixtures/interactions.html');
    await waitForGalleryInit(page);
    await waitForAnimation(page, 500);

    await page.locator('#imageCloud img').first().click({ force: true });

    // Wait until an image is focused (zIndex >= 1000)
    const idBefore = await page.waitForFunction(() => {
      const imgs = document.querySelectorAll('#imageCloud img');
      for (const img of imgs) {
        if (parseInt(window.getComputedStyle(img as HTMLElement).zIndex) >= 1000) {
          return (img as HTMLElement).dataset.imageId ?? null;
        }
      }
      return null;
    }, { timeout: 2000 }).then(h => h.jsonValue());

    expect(idBefore).not.toBeNull();

    await page.locator('#imageCloud').focus();
    await page.keyboard.press('ArrowRight');

    // Wait until a DIFFERENT image is focused
    const idAfter = await page.waitForFunction((before) => {
      const imgs = document.querySelectorAll('#imageCloud img');
      for (const img of imgs) {
        const id = (img as HTMLElement).dataset.imageId;
        if (parseInt(window.getComputedStyle(img as HTMLElement).zIndex) >= 1000 && id !== before) {
          return id;
        }
      }
      return null;
    }, idBefore, { timeout: 2000 }).then(h => h.jsonValue());

    expect(idAfter).not.toBeNull();
    expect(idAfter).not.toBe(idBefore);
  });

  test('swipe: false — gallery initializes without swipe navigation', async ({ page }) => {
    await page.goto('/test/fixtures/interaction-swipe-disabled.html');
    await waitForGalleryInit(page);
    await waitForAnimation(page, 500);

    // Gallery should have initialized successfully with images visible
    const imageCount = await page.locator('#imageCloud img').count();
    expect(imageCount).toBeGreaterThan(0);

    // Click an image to focus it — this should still work
    await page.locator('#imageCloud img').first().click({ force: true });

    // Wait until an image is actually focused rather than using a fixed timeout
    const focused = await page.waitForFunction(() => {
      const imgs = document.querySelectorAll('#imageCloud img');
      for (const img of imgs) {
        if (parseInt(window.getComputedStyle(img as HTMLElement).zIndex) >= 1000) return true;
      }
      return false;
    }, { timeout: 2000 }).then(h => h.jsonValue());

    expect(focused).toBe(true);
  });

});
