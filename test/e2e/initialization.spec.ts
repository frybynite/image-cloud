import { test, expect } from '@playwright/test';
import { waitForGalleryInit, getImageCount } from '../utils/test-helpers';

test.describe('Gallery Initialization', () => {

  test('initializes with valid container ID', async ({ page }) => {
    await page.goto('/test/fixtures/static-basic.html');
    await waitForGalleryInit(page);

    const container = page.locator('#imageCloud');
    await expect(container).toBeAttached();
    // Verify the container has images (proving it initialized correctly)
    const imageCount = await getImageCount(page);
    expect(imageCount).toBeGreaterThan(0);
  });

  test('loads images into container', async ({ page }) => {
    await page.goto('/test/fixtures/static-basic.html');
    await waitForGalleryInit(page);

    // Wait a bit for all images to load (queue animation with 12 images)
    await page.waitForTimeout(1500);

    const imageCount = await getImageCount(page);
    expect(imageCount).toBe(12);
  });

  test('applies absolute positioning to images', async ({ page }) => {
    await page.goto('/test/fixtures/static-basic.html');
    await waitForGalleryInit(page);

    // Check that images have absolute positioning for layout
    const image = page.locator('#imageCloud img').first();
    const position = await image.evaluate((el) => window.getComputedStyle(el).position);
    expect(position).toBe('absolute');
  });

  test('exposes gallery instance on window', async ({ page }) => {
    await page.goto('/test/fixtures/static-basic.html');
    await waitForGalleryInit(page);

    const hasGallery = await page.evaluate(() => typeof window.gallery !== 'undefined');
    expect(hasGallery).toBe(true);
  });

  test('throws error for missing container', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/test/fixtures/static-basic.html');
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => {
      document.getElementById('imageCloud')?.remove();
      // @ts-ignore
      const gallery = new window.ImageGallery({
        container: 'nonexistent',
        loader: {
          type: 'static',
          static: {
            sources: [{ type: 'urls', urls: ['/test/fixtures/images/image1.jpg'] }]
          }
        }
      });
      // @ts-ignore
      gallery.init();
    });

    // Wait for error to be logged
    await page.waitForTimeout(100);

    expect(errors.some(e => e.includes('Container') || e.includes('not found'))).toBe(true);
  });

  test('merges user config with defaults', async ({ page }) => {
    await page.goto('/test/fixtures/static-basic.html');
    await waitForGalleryInit(page);

    // Verify custom duration was applied (300ms in fixture vs 600ms default)
    const duration = await page.evaluate(() => {
      // @ts-ignore
      const config = window.gallery.fullConfig;
      return config?.animation?.duration;
    });
    expect(duration).toBe(300);
  });

});
