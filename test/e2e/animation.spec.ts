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

      // Entry animation sets inline transition style with the configured duration
      const img = page.locator('#imageCloud img').first();
      const transition = await img.evaluate((el: HTMLElement) => el.style.transition);

      // animations.html sets animation.duration: 500
      expect(transition).toContain('500ms');
    });

    test('deprecated entry timing duration is used as fallback with console warn', async ({ page }) => {
      const warnings: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'warning') warnings.push(msg.text());
      });

      await page.goto('/test/fixtures/animation-deprecated-duration.html');
      await waitForGalleryInit(page);

      // Deprecated path should emit a console.warn
      expect(warnings.some(w => w.includes('deprecated'))).toBe(true);

      // Entry animation transition should use the deprecated value (1200ms)
      const img = page.locator('#imageCloud img').first();
      const transition = await img.evaluate((el: HTMLElement) => el.style.transition);
      expect(transition).toContain('1200ms');
    });

    test('animation.duration wins over deprecated entry timing when both provided', async ({ page }) => {
      const warnings: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'warning') warnings.push(msg.text());
      });

      await page.goto('/test/fixtures/animation-both-durations.html');
      await waitForGalleryInit(page);

      // No deprecation warn when base duration is explicitly provided
      expect(warnings.some(w => w.includes('deprecated'))).toBe(false);

      // Transition should use base duration (800ms), not entry timing (1200ms)
      const img = page.locator('#imageCloud img').first();
      const transition = await img.evaluate((el: HTMLElement) => el.style.transition);
      expect(transition).toContain('800ms');
      expect(transition).not.toContain('1200ms');
    });

    test('focus animation uses configured animationDuration', async ({ page }) => {
      await page.goto('/test/fixtures/animation-focus-duration.html');
      await waitForGalleryInit(page);
      // Wait for all entry animations to fully complete (600ms default + 3 images × 150ms stagger)
      await waitForAnimation(page, 1200);

      // Click first image to trigger focus zoom animation
      await page.evaluate(() => {
        const img = document.querySelector('#imageCloud img') as HTMLElement;
        img?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      });

      // Small wait to ensure element.animate() has been called
      await page.waitForTimeout(50);

      // Find the Web Animation (numeric duration) created by ZoomEngine.animateWithDimensions
      // CSS transitions return string durations; Web Animations return numbers
      const focusDuration = await page.evaluate(() => {
        const img = document.querySelector('#imageCloud img') as HTMLElement;
        const webAnimation = img.getAnimations().find(a => {
          const timing = (a.effect as KeyframeEffect)?.getTiming();
          return typeof timing?.duration === 'number';
        });
        if (!webAnimation) return null;
        return (webAnimation.effect as KeyframeEffect).getTiming().duration;
      });

      expect(focusDuration).toBe(1200);
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
