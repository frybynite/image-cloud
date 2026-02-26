import { test, expect } from '@playwright/test';
import { waitForGalleryInit, waitForAnimation } from '../utils/test-helpers';

/**
 * Idle Animation Tests
 *
 * Tests use element.getAnimations() to check Web Animations API state.
 * Fixture uses entry: 300ms, startDelay: 300ms for fast tests.
 */

async function getImageAnimations(page: any, imageIndex: number) {
  return page.evaluate((idx: number) => {
    const imgs = document.querySelectorAll('#imageCloud img');
    const img = imgs[idx] as HTMLElement;
    if (!img) return null;
    return img.getAnimations().map(a => ({
      playState: a.playState,
      currentTime: a.currentTime
    }));
  }, imageIndex);
}

async function hasRunningAnimation(page: any, imageIndex: number): Promise<boolean> {
  const anims = await getImageAnimations(page, imageIndex);
  if (!anims) return false;
  return anims.some((a: any) => a.playState === 'running');
}

async function getAnimationCount(page: any, imageIndex: number): Promise<number> {
  const anims = await getImageAnimations(page, imageIndex);
  if (!anims) return 0;
  return anims.length;
}

/**
 * Force-click an image, bypassing stability checks.
 * Needed because wiggle animation keeps elements "unstable" from Playwright's perspective.
 */
async function forceClickImage(page: any, imageIndex: number) {
  await page.evaluate((idx: number) => {
    const imgs = document.querySelectorAll('#imageCloud img');
    const img = imgs[idx] as HTMLElement;
    img?.click();
  }, imageIndex);
}

test.describe('Idle Animations', () => {

  test.describe('Wiggle', () => {

    test('wiggle animation starts after entry and start delay complete', async ({ page }) => {
      await page.goto('/test/fixtures/idle-animations.html');
      await waitForGalleryInit(page);

      // Wait for entry (300ms) + startDelay (300ms) + buffer
      await waitForAnimation(page, 750);

      const running = await hasRunningAnimation(page, 0);
      expect(running).toBe(true);
    });

    test('wiggle animation pauses immediately when image is clicked', async ({ page }) => {
      await page.goto('/test/fixtures/idle-animations.html');
      await waitForGalleryInit(page);

      // Wait for idle to start
      await waitForAnimation(page, 750);

      // Verify idle running before click (composite: 'add' animations only)
      const idleRunningBefore = await page.evaluate((idx: number) => {
        const img = document.querySelectorAll('#imageCloud img')[idx] as HTMLElement;
        if (!img) return false;
        return img.getAnimations().some(a => {
          const effect = a.effect as KeyframeEffect;
          return effect?.composite === 'add' && a.playState === 'running';
        });
      }, 0);
      expect(idleRunningBefore).toBe(true);

      // Force-click the image (wiggle makes it unstable for normal click)
      await forceClickImage(page, 0);

      // Check immediately — idle animation should be paused (composite: 'add' anim not running)
      // Focus animation from ZoomEngine may be running, but idle should be paused
      const idleRunningAfterClick = await page.evaluate((idx: number) => {
        const img = document.querySelectorAll('#imageCloud img')[idx] as HTMLElement;
        if (!img) return false;
        return img.getAnimations().some(a => {
          const effect = a.effect as KeyframeEffect;
          return effect?.composite === 'add' && a.playState === 'running';
        });
      }, 0);
      expect(idleRunningAfterClick).toBe(false);
    });

    test('wiggle animation resumes after unfocus animation completes', async ({ page }) => {
      await page.goto('/test/fixtures/idle-animations.html');
      await waitForGalleryInit(page);

      // Wait for idle to start
      await waitForAnimation(page, 750);

      // Focus image
      await forceClickImage(page, 0);

      // Wait for focus animation to complete (~600ms default)
      await waitForAnimation(page, 700);

      // Unfocus image
      await forceClickImage(page, 0);

      // Wait for unfocus animation (default ~600ms) + buffer
      await waitForAnimation(page, 800);

      const running = await hasRunningAnimation(page, 0);
      expect(running).toBe(true);
    });

    test('multiple images all have running idle animations', async ({ page }) => {
      await page.goto('/test/fixtures/idle-animations.html');
      await waitForGalleryInit(page);

      // Wait for all idles to start (queue interval 150ms * 5 images = 750ms + startDelay 300ms + buffer)
      await waitForAnimation(page, 1200);

      const imageCount = await page.locator('#imageCloud img').count();
      expect(imageCount).toBeGreaterThan(0);

      // Check first few images all have running animations
      for (let i = 0; i < Math.min(3, imageCount); i++) {
        const running = await hasRunningAnimation(page, i);
        expect(running).toBe(true);
      }
    });

  });

  test.describe('Blink', () => {

    test('blink animation creates running opacity animation', async ({ page }) => {
      await page.goto('/test/fixtures/idle-animations-blink.html');
      await waitForGalleryInit(page);

      // Wait for entry (300ms) + startDelay (300ms) + buffer
      await waitForAnimation(page, 750);

      const anims = await getImageAnimations(page, 0);
      expect(anims).not.toBeNull();
      expect(anims!.length).toBeGreaterThan(0);
      expect(anims!.some((a: any) => a.playState === 'running')).toBe(true);
    });

  });

  test.describe('Cleanup', () => {

    test('destroy() stops all idle animations', async ({ page }) => {
      await page.goto('/test/fixtures/idle-animations.html');
      await waitForGalleryInit(page);

      // Wait for idle to start
      await waitForAnimation(page, 750);

      const running = await hasRunningAnimation(page, 0);
      expect(running).toBe(true);

      // Destroy the gallery
      await page.evaluate(() => {
        (window as any).gallery.destroy();
      });

      const animCount = await getAnimationCount(page, 0);
      expect(animCount).toBe(0);
    });

  });

});
