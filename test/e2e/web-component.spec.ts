import { test, expect } from '@playwright/test';

test.describe('Web Component', () => {

  test.describe('Initialization', () => {

    test('renders and initializes gallery from attributes', async ({ page }) => {
      await page.goto('/test/fixtures/web-component-test.html');

      // Wait for the custom element's inner container to have images
      const gallery = page.locator('image-cloud#wc-gallery');
      await expect(gallery).toBeAttached();

      // Wait for images to render inside the web component
      const images = gallery.locator('img');
      await expect(images.first()).toBeVisible({ timeout: 10000 });

      // Wait for queue animation to complete
      await page.waitForTimeout(1000);

      const count = await images.count();
      expect(count).toBeGreaterThanOrEqual(2);
      expect(count).toBeLessThanOrEqual(3);
    });

    test('gallery instance is accessible via getInstance', async ({ page }) => {
      await page.goto('/test/fixtures/web-component-test.html');

      // Wait for images to render
      const images = page.locator('image-cloud#wc-gallery img');
      await expect(images.first()).toBeVisible({ timeout: 10000 });

      // Verify getInstance returns a non-null instance
      const hasInstance = await page.evaluate(() => {
        const el = document.querySelector('image-cloud') as any;
        return el.getInstance() !== null;
      });
      expect(hasInstance).toBe(true);
    });

  });

  test.describe('Attribute Changes', () => {

    test('reinitializes when layout attribute changes', async ({ page }) => {
      await page.goto('/test/fixtures/web-component-test.html');

      // Wait for initial render
      const images = page.locator('image-cloud#wc-gallery img');
      await expect(images.first()).toBeVisible({ timeout: 10000 });

      // Change layout attribute
      await page.evaluate(() => {
        document.querySelector('image-cloud')!.setAttribute('layout', 'grid');
      });

      // Wait for reinit — images should still be visible after re-render
      await page.waitForTimeout(2000);
      const newImages = page.locator('image-cloud#wc-gallery img');
      await expect(newImages.first()).toBeVisible({ timeout: 10000 });

      const count = await newImages.count();
      expect(count).toBeGreaterThanOrEqual(2);
    });

  });

  test.describe('Cleanup', () => {

    test('destroys instance when element is removed', async ({ page }) => {
      await page.goto('/test/fixtures/web-component-test.html');

      // Wait for initial render
      const images = page.locator('image-cloud#wc-gallery img');
      await expect(images.first()).toBeVisible({ timeout: 10000 });

      // Remove the element
      await page.evaluate(() => {
        document.querySelector('image-cloud')!.remove();
      });

      // Element should be gone
      const gallery = page.locator('image-cloud#wc-gallery');
      await expect(gallery).toHaveCount(0);
    });

  });

  test.describe('Error Handling', () => {

    test('handles invalid config JSON gracefully', async ({ page }) => {
      const errors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      await page.goto('/test/fixtures/web-component-test.html');

      // Wait for normal init first
      const images = page.locator('image-cloud#wc-gallery img');
      await expect(images.first()).toBeVisible({ timeout: 10000 });

      // Set invalid config — should log error but not crash
      await page.evaluate(() => {
        document.querySelector('image-cloud')!.setAttribute('config', 'not valid json');
      });

      await page.waitForTimeout(1000);

      // Should have logged an error about invalid JSON
      const jsonErrors = errors.filter(e => e.includes('invalid config JSON'));
      expect(jsonErrors.length).toBeGreaterThan(0);
    });

  });

});
