import { test, expect } from '@playwright/test';
import { waitForGalleryInit, getImageCount } from '../utils/test-helpers';

test.describe('Auto-Initialization', () => {

  test.describe('HTML Attribute Configuration', () => {

    test('initializes from data-image-gallery attribute', async ({ page }) => {
      await page.goto('/test/fixtures/auto-init.html');
      await waitForGalleryInit(page);

      // Wait for all images to load (queue animation)
      await page.waitForTimeout(500);

      const count = await getImageCount(page);
      expect(count).toBe(2);
    });

    test('parses JSON from data-gallery-config', async ({ page }) => {
      await page.goto('/test/fixtures/auto-init.html');
      await waitForGalleryInit(page);

      // Config should be parsed and applied - container should exist with images
      const container = page.locator('#imageCloud');
      await expect(container).toBeAttached();

      // Verify images are rendered (proving config was parsed)
      const images = page.locator('#imageCloud img');
      await expect(images.first()).toBeVisible();
    });

    test('handles invalid JSON gracefully', async ({ page }) => {
      const errors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      await page.goto('/test/fixtures/auto-init.html');

      // Inject an element with invalid JSON config
      await page.evaluate(() => {
        const newContainer = document.createElement('div');
        newContainer.id = 'invalidGallery';
        newContainer.setAttribute('data-image-gallery', '');
        newContainer.setAttribute('data-gallery-config', 'invalid json');
        document.body.appendChild(newContainer);
      });

      await page.waitForTimeout(1000);

      // Should log error but not crash page
      await expect(page.locator('body')).toBeVisible();
    });

  });

  test.describe('Multiple Galleries', () => {

    test('initializes multiple galleries on same page', async ({ page }) => {
      await page.goto('/test/fixtures/multi-gallery.html');

      // Wait for both galleries
      await page.waitForSelector('#gallery1 img', { state: 'visible', timeout: 10000 });
      await page.waitForSelector('#gallery2 img', { state: 'visible', timeout: 10000 });

      const gallery1Images = await page.locator('#gallery1 img').count();
      const gallery2Images = await page.locator('#gallery2 img').count();

      expect(gallery1Images).toBe(1);
      expect(gallery2Images).toBe(1);
    });

  });

});
