import { test, expect } from '@playwright/test';

test.describe('Configurator Outline', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/configurator/');
    // Wait for gallery to load
    await page.waitForSelector('.fbn-ic-image', { state: 'visible', timeout: 10000 });
    // Expand Image: Style section
    await page.click('text=Image: Style');
    await page.waitForTimeout(100);
  });

  test.describe('Outline Controls Visibility', () => {

    test('outline controls are visible when All side is selected', async ({ page }) => {
      // By default "All" is selected
      await expect(page.locator('#style-outline-width')).toBeVisible();
      await expect(page.locator('#style-outline-color')).toBeVisible();
      await expect(page.locator('#style-outline-style')).toBeVisible();
      await expect(page.locator('#style-outline-offset')).toBeVisible();
    });

    test('outline controls are hidden when specific side is selected', async ({ page }) => {
      // Click on "Top" side selector
      await page.click('button[data-side="top"]');
      await page.waitForTimeout(100);

      // Outline controls should be hidden
      await expect(page.locator('#outline-controls-wrapper')).not.toBeVisible();
    });

    test('outline controls reappear when All is selected again', async ({ page }) => {
      // Select a specific side
      await page.click('button[data-side="right"]');
      await page.waitForTimeout(100);

      // Outline controls should be hidden
      await expect(page.locator('#outline-controls-wrapper')).not.toBeVisible();

      // Select All again
      await page.click('button[data-side="all"]');
      await page.waitForTimeout(100);

      // Outline controls should be visible again
      await expect(page.locator('#outline-controls-wrapper')).toBeVisible();
    });

    test('outline controls have correct default values', async ({ page }) => {
      expect(await page.locator('#style-outline-width').inputValue()).toBe('0');
      expect(await page.locator('#style-outline-color').inputValue()).toBe('#000000');
      expect(await page.locator('#style-outline-style').inputValue()).toBe('solid');
      expect(await page.locator('#style-outline-offset').inputValue()).toBe('0');
    });

    test('outline style dropdown has all expected options', async ({ page }) => {
      const styleSelect = page.locator('#style-outline-style');
      const options = await styleSelect.locator('option').allTextContents();

      expect(options).toContain('Solid');
      expect(options).toContain('Dashed');
      expect(options).toContain('Dotted');
      expect(options).toContain('Double');
      expect(options).toContain('None');
    });

  });

  test.describe('Outline Width Updates Gallery', () => {

    test('changing outline width updates gallery', async ({ page }) => {
      // Enable outline width
      await page.locator('#enable-style-outline-width').check();
      await page.locator('#style-outline-width').fill('3');
      await page.locator('#style-outline-width').dispatchEvent('change');
      await page.waitForTimeout(300);

      const image = page.locator('.fbn-ic-image').first();
      const outlineWidth = await image.evaluate((el) => window.getComputedStyle(el).outlineWidth);

      expect(outlineWidth).toBe('3px');
    });

    test('changing outline color updates gallery', async ({ page }) => {
      // Enable outline width and color
      await page.locator('#enable-style-outline-width').check();
      await page.locator('#style-outline-width').fill('2');
      await page.locator('#enable-style-outline-color').check();
      await page.locator('#style-outline-color').fill('#ff0000');
      await page.locator('#style-outline-color').dispatchEvent('change');
      await page.waitForTimeout(300);

      const image = page.locator('.fbn-ic-image').first();
      const outlineColor = await image.evaluate((el) => window.getComputedStyle(el).outlineColor);

      // Color should be red in rgb format
      expect(outlineColor).toMatch(/rgb\(255,\s*0,\s*0\)/);
    });

  });

  test.describe('Outline Offset Updates Gallery', () => {

    test('changing outline offset updates gallery', async ({ page }) => {
      // Enable outline width and offset
      await page.locator('#enable-style-outline-width').check();
      await page.locator('#style-outline-width').fill('2');
      await page.locator('#enable-style-outline-offset').check();
      await page.locator('#style-outline-offset').fill('5');
      await page.locator('#style-outline-offset').dispatchEvent('change');
      await page.waitForTimeout(300);

      const image = page.locator('.fbn-ic-image').first();
      const outlineOffset = await image.evaluate((el) => window.getComputedStyle(el).outlineOffset);

      expect(outlineOffset).toBe('5px');
    });

    test('negative outline offset is supported', async ({ page }) => {
      // Enable outline width and negative offset
      await page.locator('#enable-style-outline-width').check();
      await page.locator('#style-outline-width').fill('2');
      await page.locator('#enable-style-outline-offset').check();
      await page.locator('#style-outline-offset').fill('-3');
      await page.locator('#style-outline-offset').dispatchEvent('change');
      await page.waitForTimeout(300);

      const image = page.locator('.fbn-ic-image').first();
      const outlineOffset = await image.evaluate((el) => window.getComputedStyle(el).outlineOffset);

      expect(outlineOffset).toBe('-3px');
    });

  });

  test.describe('Outline Values Persist Across State Changes', () => {

    test('outline values persist across state changes', async ({ page }) => {
      // Set outline in default state
      await page.locator('#enable-style-outline-width').check();
      await page.locator('#style-outline-width').fill('4');
      await page.locator('#enable-style-outline-color').check();
      await page.locator('#style-outline-color').fill('#00ff00');
      await page.locator('#style-outline-color').dispatchEvent('change');
      await page.waitForTimeout(200);

      // Switch to hover state and back
      await page.click('button:has-text("Hover")');
      await page.click('button:has-text("Default")');

      // Verify default state values are preserved
      expect(await page.locator('#style-outline-width').inputValue()).toBe('4');
      expect(await page.locator('#style-outline-color').inputValue()).toBe('#00ff00');
    });

    test('each state maintains independent outline values', async ({ page }) => {
      // Set outline in DEFAULT state
      await page.locator('#enable-style-outline-width').check();
      await page.locator('#style-outline-width').fill('2');
      await page.locator('#style-outline-width').dispatchEvent('change');

      // Set outline in HOVER state
      await page.click('button:has-text("Hover")');
      await page.locator('#enable-style-outline-width').check();
      await page.locator('#style-outline-width').fill('4');
      await page.locator('#style-outline-width').dispatchEvent('change');

      // Set outline in FOCUSED state
      await page.click('button:has-text("Focused")');
      await page.locator('#enable-style-outline-width').check();
      await page.locator('#style-outline-width').fill('6');
      await page.locator('#style-outline-width').dispatchEvent('change');

      // Verify DEFAULT state value
      await page.click('button:has-text("Default")');
      expect(await page.locator('#style-outline-width').inputValue()).toBe('2');

      // Verify HOVER state value
      await page.click('button:has-text("Hover")');
      expect(await page.locator('#style-outline-width').inputValue()).toBe('4');

      // Verify FOCUSED state value
      await page.click('button:has-text("Focused")');
      expect(await page.locator('#style-outline-width').inputValue()).toBe('6');
    });

  });

  test.describe('Hover State Outline', () => {

    test('hover state outline applies on image hover', async ({ page }) => {
      // Set hover state outline
      await page.click('button:has-text("Hover")');
      await page.locator('#enable-style-outline-width').check();
      await page.locator('#style-outline-width').fill('3');
      await page.locator('#enable-style-outline-color').check();
      await page.locator('#style-outline-color').fill('#ff0000');
      await page.locator('#style-outline-color').dispatchEvent('change');
      await page.waitForTimeout(300);

      // Hover over an image
      const image = page.locator('.fbn-ic-image').first();
      await image.hover();
      await page.waitForTimeout(100);

      const outlineWidth = await image.evaluate((el) => window.getComputedStyle(el).outlineWidth);
      const outlineColor = await image.evaluate((el) => window.getComputedStyle(el).outlineColor);

      expect(outlineWidth).toBe('3px');
      expect(outlineColor).toMatch(/rgb\(255,\s*0,\s*0\)/);
    });

  });

  test.describe('Focused State Outline', () => {

    test('focused state outline applies when image is clicked', async ({ page }) => {
      // Set focused state outline
      await page.click('button:has-text("Focused")');
      await page.locator('#enable-style-outline-width').check();
      await page.locator('#style-outline-width').fill('5');
      await page.locator('#enable-style-outline-color').check();
      await page.locator('#style-outline-color').fill('#0000ff');
      await page.locator('#style-outline-color').dispatchEvent('change');
      await page.waitForTimeout(300);

      // Click an image to focus it
      const image = page.locator('.fbn-ic-image').first();
      await image.click();
      await page.waitForTimeout(500); // Wait for zoom animation

      const outlineWidth = await image.evaluate((el) => window.getComputedStyle(el).outlineWidth);
      const outlineColor = await image.evaluate((el) => window.getComputedStyle(el).outlineColor);

      expect(outlineWidth).toBe('5px');
      expect(outlineColor).toMatch(/rgb\(0,\s*0,\s*255\)/);
    });

  });

  test.describe('Config JSON Output', () => {

    test('config JSON includes outline when enabled', async ({ page }) => {
      // Enable outline properties
      await page.locator('#enable-style-outline-width').check();
      await page.locator('#style-outline-width').fill('3');
      await page.locator('#enable-style-outline-color').check();
      await page.locator('#style-outline-color').fill('#ff0000');
      await page.locator('#enable-style-outline-style').check();
      await page.locator('#style-outline-style').selectOption('dashed');
      await page.locator('#enable-style-outline-offset').check();
      await page.locator('#style-outline-offset').fill('2');
      await page.locator('#style-outline-offset').dispatchEvent('change');
      await page.waitForTimeout(200);

      // Show config JSON
      await page.click('button:has-text("Show Config JSON")');
      await page.waitForSelector('#configModal.active', { timeout: 5000 });

      const configText = await page.locator('#configOutput').textContent();
      const config = JSON.parse(configText || '{}');

      // Verify outline config
      expect(config.styling?.default?.outline?.width).toBe(3);
      expect(config.styling?.default?.outline?.color).toBe('#ff0000');
      expect(config.styling?.default?.outline?.style).toBe('dashed');
      expect(config.styling?.default?.outline?.offset).toBe(2);
    });

    test('config JSON includes outline for hover state when enabled', async ({ page }) => {
      // Switch to hover state
      await page.click('button:has-text("Hover")');

      // Enable outline properties for hover
      await page.locator('#enable-style-outline-width').check();
      await page.locator('#style-outline-width').fill('4');
      await page.locator('#style-outline-width').dispatchEvent('change');
      await page.waitForTimeout(200);

      // Show config JSON
      await page.click('button:has-text("Show Config JSON")');
      await page.waitForSelector('#configModal.active', { timeout: 5000 });

      const configText = await page.locator('#configOutput').textContent();
      const config = JSON.parse(configText || '{}');

      // Verify hover outline config
      expect(config.styling?.hover?.outline?.width).toBe(4);
    });

  });

});
