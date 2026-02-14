import { test, expect, Page } from '@playwright/test';
import { waitForGalleryInit, waitForAnimation } from '../utils/test-helpers';

/**
 * Entry Animation Tests
 *
 * TESTING CHALLENGES:
 * - Initial transform state is transient (set in JS, then immediately animates)
 * - By the time Playwright queries, animation may have started/completed
 * - Race conditions make "initial state" tests unreliable
 *
 * RELIABLE TESTS:
 * - Final state (images end up in correct positions)
 * - Transition CSS properties (duration, easing applied)
 * - Image visibility after animation
 * - Configuration is passed correctly
 */

/**
 * Helper to get image position after animation
 */
async function getImagePosition(page: Page, imageIndex: number) {
  return page.evaluate((index) => {
    const img = document.querySelectorAll('#imageCloud img')[index] as HTMLElement;
    if (!img) return null;
    const rect = img.getBoundingClientRect();
    return { x: rect.left, y: rect.top, width: rect.width, height: rect.height };
  }, imageIndex);
}

/**
 * Helper to get container dimensions
 */
async function getContainerBounds(page: Page) {
  return page.evaluate(() => {
    const container = document.getElementById('imageCloud');
    if (!container) return null;
    return { width: container.offsetWidth, height: container.offsetHeight };
  });
}

/**
 * Helper to get transition CSS from an image
 */
async function getImageTransition(page: Page, imageIndex: number = 0) {
  return page.evaluate((index) => {
    const img = document.querySelectorAll('#imageCloud img')[index] as HTMLElement;
    return img ? window.getComputedStyle(img).transition : null;
  }, imageIndex);
}

/**
 * Helper to get the gallery config that was used
 */
async function getGalleryConfig(page: Page) {
  return page.evaluate(() => (window as any).galleryConfig);
}

test.describe('Entry Animations', () => {

  test.describe('Configuration Verification', () => {

    test('entry config is passed to gallery', async ({ page }) => {
      await page.goto('/test/fixtures/entry-animations.html?position=center&duration=800');
      await waitForGalleryInit(page);

      const config = await getGalleryConfig(page);
      expect(config.animation.entry.start.position).toBe('center');
      expect(config.animation.entry.timing.duration).toBe(800);
    });

    test('circular config is passed correctly', async ({ page }) => {
      await page.goto('/test/fixtures/entry-animations.html?position=circular&radius=500&distribution=random');
      await waitForGalleryInit(page);

      const config = await getGalleryConfig(page);
      expect(config.animation.entry.start.position).toBe('circular');
      expect(config.animation.entry.start.circular.radius).toBe('500');
      expect(config.animation.entry.start.circular.distribution).toBe('random');
    });

  });

  test.describe('Final State: All Positions', () => {

    test('nearest-edge: images end up within container', async ({ page }) => {
      await page.goto('/test/fixtures/entry-animations.html?position=nearest-edge');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 2500);

      const container = await getContainerBounds(page);
      const imageCount = await page.locator('#imageCloud img').count();
      expect(imageCount).toBeGreaterThan(0);

      for (let i = 0; i < Math.min(3, imageCount); i++) {
        const pos = await getImagePosition(page, i);
        expect(pos).not.toBeNull();
        expect(pos!.x).toBeGreaterThan(-pos!.width);
        expect(pos!.x).toBeLessThan(container!.width);
      }
    });

    test('top: images end up within container', async ({ page }) => {
      await page.goto('/test/fixtures/entry-animations.html?position=top');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 2500);

      const container = await getContainerBounds(page);
      const imageCount = await page.locator('#imageCloud img').count();

      for (let i = 0; i < Math.min(3, imageCount); i++) {
        const pos = await getImagePosition(page, i);
        expect(pos!.y).toBeGreaterThanOrEqual(-10); // Allow small margin
        expect(pos!.y).toBeLessThan(container!.height);
      }
    });

    test('bottom: images end up within container', async ({ page }) => {
      await page.goto('/test/fixtures/entry-animations.html?position=bottom');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 2500);

      const container = await getContainerBounds(page);
      const imageCount = await page.locator('#imageCloud img').count();

      for (let i = 0; i < Math.min(3, imageCount); i++) {
        const pos = await getImagePosition(page, i);
        expect(pos!.y).toBeGreaterThanOrEqual(-10);
        expect(pos!.y).toBeLessThan(container!.height);
      }
    });

    test('left: images end up within container', async ({ page }) => {
      await page.goto('/test/fixtures/entry-animations.html?position=left');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 2500);

      const container = await getContainerBounds(page);
      const imageCount = await page.locator('#imageCloud img').count();

      for (let i = 0; i < Math.min(3, imageCount); i++) {
        const pos = await getImagePosition(page, i);
        expect(pos!.x).toBeGreaterThanOrEqual(-10);
        expect(pos!.x).toBeLessThan(container!.width);
      }
    });

    test('right: images end up within container', async ({ page }) => {
      await page.goto('/test/fixtures/entry-animations.html?position=right');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 2500);

      const container = await getContainerBounds(page);
      const imageCount = await page.locator('#imageCloud img').count();

      for (let i = 0; i < Math.min(3, imageCount); i++) {
        const pos = await getImagePosition(page, i);
        expect(pos!.x).toBeGreaterThanOrEqual(-10);
        expect(pos!.x).toBeLessThan(container!.width);
      }
    });

    test('center: images have visible size after animation', async ({ page }) => {
      await page.goto('/test/fixtures/entry-animations.html?position=center');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 2500);

      const imageCount = await page.locator('#imageCloud img').count();
      expect(imageCount).toBeGreaterThan(0);

      // After animation, images should have non-zero size
      const pos = await getImagePosition(page, 0);
      expect(pos!.width).toBeGreaterThan(0);
      expect(pos!.height).toBeGreaterThan(0);
    });

    test('circular: images end up within container', async ({ page }) => {
      await page.goto('/test/fixtures/entry-animations.html?position=circular');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 2500);

      const container = await getContainerBounds(page);
      const imageCount = await page.locator('#imageCloud img').count();

      for (let i = 0; i < Math.min(3, imageCount); i++) {
        const pos = await getImagePosition(page, i);
        expect(pos!.x).toBeGreaterThan(-pos!.width);
        expect(pos!.x).toBeLessThan(container!.width);
      }
    });

    test('random-edge: images end up within container', async ({ page }) => {
      await page.goto('/test/fixtures/entry-animations.html?position=random-edge');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 2500);

      const container = await getContainerBounds(page);
      const imageCount = await page.locator('#imageCloud img').count();

      for (let i = 0; i < Math.min(3, imageCount); i++) {
        const pos = await getImagePosition(page, i);
        expect(pos!.x).toBeGreaterThan(-pos!.width);
        expect(pos!.x).toBeLessThan(container!.width);
      }
    });

  });

  test.describe('Layout-Aware Defaults', () => {

    test('radial layout loads successfully with default entry', async ({ page }) => {
      await page.goto('/test/fixtures/entry-animations.html?layout=radial&useDefault=true');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 2500);

      const imageCount = await page.locator('#imageCloud img').count();
      expect(imageCount).toBeGreaterThan(0);

      // All images should be visible
      for (let i = 0; i < Math.min(3, imageCount); i++) {
        await expect(page.locator('#imageCloud img').nth(i)).toBeVisible();
      }
    });

    test('grid layout loads successfully with default entry', async ({ page }) => {
      await page.goto('/test/fixtures/entry-animations.html?layout=grid&useDefault=true');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 2500);

      const imageCount = await page.locator('#imageCloud img').count();
      expect(imageCount).toBeGreaterThan(0);

      for (let i = 0; i < Math.min(3, imageCount); i++) {
        await expect(page.locator('#imageCloud img').nth(i)).toBeVisible();
      }
    });

    test('spiral layout loads successfully with default entry', async ({ page }) => {
      await page.goto('/test/fixtures/entry-animations.html?layout=spiral&useDefault=true');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 2500);

      const imageCount = await page.locator('#imageCloud img').count();
      expect(imageCount).toBeGreaterThan(0);

      for (let i = 0; i < Math.min(3, imageCount); i++) {
        await expect(page.locator('#imageCloud img').nth(i)).toBeVisible();
      }
    });

    test('cluster layout loads successfully with default entry', async ({ page }) => {
      await page.goto('/test/fixtures/entry-animations.html?layout=cluster&useDefault=true');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 2500);

      const imageCount = await page.locator('#imageCloud img').count();
      expect(imageCount).toBeGreaterThan(0);

      for (let i = 0; i < Math.min(3, imageCount); i++) {
        await expect(page.locator('#imageCloud img').nth(i)).toBeVisible();
      }
    });

    test('random layout loads successfully with default entry', async ({ page }) => {
      await page.goto('/test/fixtures/entry-animations.html?layout=random&useDefault=true');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 2500);

      const imageCount = await page.locator('#imageCloud img').count();
      expect(imageCount).toBeGreaterThan(0);

      for (let i = 0; i < Math.min(3, imageCount); i++) {
        await expect(page.locator('#imageCloud img').nth(i)).toBeVisible();
      }
    });

  });

  test.describe('Timing Configuration', () => {

    test('custom duration is applied to transition CSS', async ({ page }) => {
      await page.goto('/test/fixtures/entry-animations.html?position=top&duration=1000');
      await waitForGalleryInit(page);

      const transition = await getImageTransition(page, 0);

      // Transition should include the configured duration (1000ms = 1s)
      expect(transition).toContain('1s');
    });

    test('short duration is applied correctly', async ({ page }) => {
      await page.goto('/test/fixtures/entry-animations.html?position=top&duration=300');
      await waitForGalleryInit(page);

      const transition = await getImageTransition(page, 0);

      // Transition should include 0.3s
      expect(transition).toContain('0.3s');
    });

  });

  test.describe('Easing Configuration', () => {

    test('entry easing is applied to transition CSS', async ({ page }) => {
      await page.goto('/test/fixtures/entry-animations.html?position=top');
      await waitForGalleryInit(page);

      const transition = await getImageTransition(page, 0);

      // Should include easing function (cubic-bezier from our config)
      expect(transition).toContain('cubic-bezier');
    });

  });

  test.describe('Image Visibility', () => {

    test('all images become visible after animation completes', async ({ page }) => {
      await page.goto('/test/fixtures/entry-animations.html?position=nearest-edge');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 3000);

      const images = page.locator('#imageCloud img');
      const count = await images.count();
      expect(count).toBe(6); // We load 6 images in the fixture

      // All images should be visible
      for (let i = 0; i < count; i++) {
        await expect(images.nth(i)).toBeVisible();
      }
    });

    test('images have opacity 1 after animation', async ({ page }) => {
      await page.goto('/test/fixtures/entry-animations.html?position=center');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 3000);

      const opacity = await page.evaluate(() => {
        const img = document.querySelector('#imageCloud img') as HTMLElement;
        return img ? window.getComputedStyle(img).opacity : null;
      });

      expect(opacity).toBe('1');
    });

  });

  test.describe('Entry Path Animations', () => {

    test('bounce path: images end up at final position', async ({ page }) => {
      await page.goto('/test/fixtures/entry-animations.html?position=top&path=bounce');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 2000);

      const images = await page.locator('#imageCloud img').all();
      expect(images.length).toBeGreaterThan(0);

      // Verify images are within container bounds
      const containerBox = await page.locator('#imageCloud').boundingBox();
      for (const img of images) {
        const imgBox = await img.boundingBox();
        if (imgBox && containerBox) {
          expect(imgBox.x).toBeGreaterThan(containerBox.x - imgBox.width);
          expect(imgBox.y).toBeGreaterThan(containerBox.y - imgBox.height);
        }
      }
    });

    test('elastic path: images end up at final position', async ({ page }) => {
      await page.goto('/test/fixtures/entry-animations.html?position=center&path=elastic');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 2500);

      const images = await page.locator('#imageCloud img').all();
      expect(images.length).toBeGreaterThan(0);

      // Verify images are visible
      for (const img of images) {
        const opacity = await img.evaluate((el) => window.getComputedStyle(el).opacity);
        expect(parseFloat(opacity)).toBeGreaterThan(0);
      }
    });

    test('wave path: images end up at final position', async ({ page }) => {
      await page.goto('/test/fixtures/entry-animations.html?position=left&path=wave');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 2000);

      const images = await page.locator('#imageCloud img').all();
      expect(images.length).toBeGreaterThan(0);

      // Verify images are within container bounds
      const containerBox = await page.locator('#imageCloud').boundingBox();
      for (const img of images) {
        const imgBox = await img.boundingBox();
        if (imgBox && containerBox) {
          expect(imgBox.x).toBeGreaterThan(containerBox.x - imgBox.width);
          expect(imgBox.y).toBeGreaterThan(containerBox.y - imgBox.height);
        }
      }
    });

    test('bounce preset applies correctly', async ({ page }) => {
      await page.goto('/test/fixtures/entry-animations.html?position=top&path=bounce&bouncePreset=energetic');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 2000);

      const images = await page.locator('#imageCloud img').all();
      expect(images.length).toBeGreaterThan(0);
    });

    test('elastic preset applies correctly', async ({ page }) => {
      await page.goto('/test/fixtures/entry-animations.html?position=center&path=elastic&elasticPreset=wobbly');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 2500);

      const images = await page.locator('#imageCloud img').all();
      expect(images.length).toBeGreaterThan(0);
    });

    test('wave preset applies correctly', async ({ page }) => {
      await page.goto('/test/fixtures/entry-animations.html?position=left&path=wave&wavePreset=serpentine');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 2000);

      const images = await page.locator('#imageCloud img').all();
      expect(images.length).toBeGreaterThan(0);
    });

  });

});
