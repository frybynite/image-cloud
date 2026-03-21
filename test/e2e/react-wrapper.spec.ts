import { test, expect } from '@playwright/test';

test.describe('React Wrapper', () => {

  test.describe('Initialization', () => {

    test('renders gallery and shows images', async ({ page }) => {
      await page.goto('/test/fixtures/react-test.html');
      const images = page.locator('#root img');
      await expect(images.first()).toBeVisible({ timeout: 10000 });
      await page.waitForTimeout(500);
      const count = await images.count();
      expect(count).toBeGreaterThanOrEqual(3);
    });

    test('exposes ImageCloud instance via ref', async ({ page }) => {
      await page.goto('/test/fixtures/react-test.html');
      await expect(page.locator('#root img').first()).toBeVisible({ timeout: 10000 });
      await page.waitForTimeout(300);

      const hasInstance = await page.evaluate(() => {
        const ref = (window as any).cloudRef;
        return ref?.current?.instance != null;
      });
      expect(hasInstance).toBe(true);
    });

  });

  test.describe('Reactivity', () => {

    test('reinitializes gallery when images prop changes', async ({ page }) => {
      await page.goto('/test/fixtures/react-test.html');
      const images = page.locator('#root img');
      await expect(images.first()).toBeVisible({ timeout: 10000 });
      await page.waitForTimeout(500);

      await page.evaluate(() => {
        (window as any).updateImages([
          '/test/fixtures/images/food1.jpg',
          '/test/fixtures/images/food2.jpg',
        ]);
      });

      await page.waitForTimeout(1000);
      await expect(images.first()).toBeVisible({ timeout: 5000 });
      expect(await images.count()).toBe(2);
    });

  });

  test.describe('Cleanup', () => {

    test('destroys gallery when component unmounts', async ({ page }) => {
      await page.goto('/test/fixtures/react-test.html');
      await expect(page.locator('#root img').first()).toBeVisible({ timeout: 10000 });

      await page.evaluate(() => (window as any).unmount());

      await expect(page.locator('#root img')).toHaveCount(0);
    });

  });

});
