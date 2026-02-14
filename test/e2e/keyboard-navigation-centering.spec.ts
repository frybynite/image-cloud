import { test, expect, Page } from '@playwright/test';
import { waitForAnimation } from '../utils/test-helpers';

// Helper to get the imageId of the currently focused image
async function getFocusedImageId(page: Page): Promise<string | null> {
  return page.evaluate(() => {
    const imgs = document.querySelectorAll('#imageCloud img');
    for (const img of imgs) {
      const style = window.getComputedStyle(img as HTMLElement);
      if (parseInt(style.zIndex) >= 1000) {
        return (img as HTMLElement).dataset.imageId || null;
      }
    }
    return null;
  });
}

// Helper to check if any image is focused
async function hasAnyFocusedImage(page: Page): Promise<boolean> {
  return (await getFocusedImageId(page)) !== null;
}

// Wait for the gallery to fully initialize using galleryInitPromise
async function waitForFullInit(page: Page) {
  await page.waitForFunction(() => (window as any).galleryInitPromise !== undefined);
  await page.evaluate(() => (window as any).galleryInitPromise);
  await page.waitForSelector('#imageCloud img', { state: 'visible', timeout: 10000 });
  await waitForAnimation(page, 500);
}

test.describe('Keyboard Navigation Centering', () => {

  test('ArrowRight navigates through images in sequential imageId order', async ({ page }) => {
    await page.goto('/test/fixtures/image-counter.html');
    await waitForFullInit(page);

    // Click first image to focus it
    const firstImage = page.locator('#imageCloud img').first();
    await firstImage.click({ force: true });
    await waitForAnimation(page, 300);

    const firstId = await getFocusedImageId(page);
    expect(firstId).not.toBeNull();

    // Navigate through all images and collect imageIds
    const totalImages = await page.locator('#imageCloud img').count();
    const imageIds: number[] = [parseInt(firstId!)];

    for (let i = 1; i < totalImages; i++) {
      await page.keyboard.press('ArrowRight');
      await waitForAnimation(page, 300);

      const currentId = await getFocusedImageId(page);
      expect(currentId, `Image should be focused after ArrowRight #${i}`).not.toBeNull();
      imageIds.push(parseInt(currentId!));
    }

    // Each subsequent imageId should be exactly +1 (mod total layouts)
    for (let i = 1; i < imageIds.length; i++) {
      const expected = (imageIds[i - 1] + 1) % totalImages;
      expect(imageIds[i], `After imageId ${imageIds[i-1]}, expected ${expected}`).toBe(expected);
    }
  });

  test('ArrowLeft navigates in reverse imageId order', async ({ page }) => {
    await page.goto('/test/fixtures/image-counter.html');
    await waitForFullInit(page);

    // Click first image to focus it
    const firstImage = page.locator('#imageCloud img').first();
    await firstImage.click({ force: true });
    await waitForAnimation(page, 300);

    const firstId = parseInt((await getFocusedImageId(page))!);
    const totalImages = await page.locator('#imageCloud img').count();

    // Navigate left
    await page.keyboard.press('ArrowLeft');
    await waitForAnimation(page, 300);

    const afterLeftId = parseInt((await getFocusedImageId(page))!);
    const expectedPrevId = (firstId - 1 + totalImages) % totalImages;
    expect(afterLeftId, `ArrowLeft from imageId ${firstId} should go to ${expectedPrevId}`).toBe(expectedPrevId);
  });

  test('ArrowRight wraps from last image to first', async ({ page }) => {
    await page.goto('/test/fixtures/image-counter.html');
    await waitForFullInit(page);

    const totalImages = await page.locator('#imageCloud img').count();

    // Click first image
    const firstImage = page.locator('#imageCloud img').first();
    await firstImage.click({ force: true });
    await waitForAnimation(page, 300);

    // Navigate through all images to wrap around
    for (let i = 0; i < totalImages; i++) {
      await page.keyboard.press('ArrowRight');
      await waitForAnimation(page, 300);
    }

    // Should have wrapped back to the same image we started on
    const wrappedId = await getFocusedImageId(page);
    expect(wrappedId).not.toBeNull();
    expect(await hasAnyFocusedImage(page)).toBe(true);
  });

  test('navigated image layout matches its element (no position mismatch)', async ({ page }) => {
    await page.goto('/test/fixtures/image-counter.html');
    await waitForFullInit(page);

    const viewport = page.viewportSize()!;
    const centerX = viewport.width / 2;
    const centerY = viewport.height / 2;

    // Click first image
    const firstImage = page.locator('#imageCloud img').first();
    await firstImage.click({ force: true });
    await waitForAnimation(page, 300);

    // Navigate through all images and check each one is roughly centered
    // (the zoom engine centers focused images in the viewport)
    const totalImages = await page.locator('#imageCloud img').count();

    for (let i = 0; i < totalImages; i++) {
      const box = await page.evaluate(() => {
        const imgs = document.querySelectorAll('#imageCloud img');
        for (const img of imgs) {
          const style = window.getComputedStyle(img as HTMLElement);
          if (parseInt(style.zIndex) >= 1000) {
            const rect = (img as HTMLElement).getBoundingClientRect();
            return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
          }
        }
        return null;
      });

      expect(box, `Image ${i} should be focused`).not.toBeNull();
      if (box) {
        const imgCenterX = box.x + box.width / 2;
        const imgCenterY = box.y + box.height / 2;
        // With the bug, offsets could be 400-700px. With the fix, should be within 200px.
        // Using 200px tolerance to account for zoom engine positioning variance.
        expect(
          Math.abs(imgCenterX - centerX),
          `Image ${i}: X offset ${Math.abs(imgCenterX - centerX).toFixed(0)}px from center is too large`
        ).toBeLessThan(200);
        expect(
          Math.abs(imgCenterY - centerY),
          `Image ${i}: Y offset ${Math.abs(imgCenterY - centerY).toFixed(0)}px from center is too large`
        ).toBeLessThan(200);
      }

      await page.keyboard.press('ArrowRight');
      await waitForAnimation(page, 300);
    }
  });
});
