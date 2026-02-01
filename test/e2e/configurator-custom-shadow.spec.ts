import { test, expect } from '@playwright/test';

test.describe('Configurator Custom Shadow', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/configurator/');
    // Wait for gallery to load
    await page.waitForSelector('.fbn-ic-image', { state: 'visible', timeout: 10000 });
    // Expand Image: Style section
    await page.click('text=Image: Style');
    await page.waitForTimeout(100);
  });

  test.describe('Custom Shadow Dropdown Option', () => {

    test('shadow dropdown contains Custom option', async ({ page }) => {
      const shadowSelect = page.locator('#style-shadow');
      const options = await shadowSelect.locator('option').allTextContents();

      expect(options).toContain('Custom...');
    });

    test('selecting Custom shows custom shadow controls', async ({ page }) => {
      const shadowSelect = page.locator('#style-shadow');
      const customControls = page.locator('#custom-shadow-controls');

      // Initially hidden
      await expect(customControls).not.toBeVisible();

      // Enable shadow checkbox first
      await page.locator('#enable-style-shadow').check();

      // Select Custom option
      await shadowSelect.selectOption('custom');

      // Custom controls should be visible
      await expect(customControls).toBeVisible();
    });

    test('selecting preset hides custom shadow controls', async ({ page }) => {
      // Enable shadow and select Custom
      await page.locator('#enable-style-shadow').check();
      await page.locator('#style-shadow').selectOption('custom');

      const customControls = page.locator('#custom-shadow-controls');
      await expect(customControls).toBeVisible();

      // Switch to preset
      await page.locator('#style-shadow').selectOption('md');

      // Custom controls should be hidden
      await expect(customControls).not.toBeVisible();
    });

  });

  test.describe('Custom Shadow Controls', () => {

    test.beforeEach(async ({ page }) => {
      // Enable shadow and select Custom
      await page.locator('#enable-style-shadow').check();
      await page.locator('#style-shadow').selectOption('custom');
    });

    test('custom shadow controls contain all required inputs', async ({ page }) => {
      await expect(page.locator('#shadow-offset-x')).toBeVisible();
      await expect(page.locator('#shadow-offset-y')).toBeVisible();
      await expect(page.locator('#shadow-blur')).toBeVisible();
      await expect(page.locator('#shadow-color')).toBeVisible();
      await expect(page.locator('#shadow-opacity')).toBeVisible();
    });

    test('custom shadow inherits values from previous preset (none)', async ({ page }) => {
      // When switching from 'none' to 'custom', the 'none' preset values are copied
      // 'none' preset: offsetX: 0, offsetY: 0, blur: 0, color: #000000, opacity: 0
      expect(await page.locator('#shadow-offset-x').inputValue()).toBe('0');
      expect(await page.locator('#shadow-offset-y').inputValue()).toBe('0');
      expect(await page.locator('#shadow-blur').inputValue()).toBe('0');
      expect(await page.locator('#shadow-color').inputValue()).toBe('#000000');
      expect(await page.locator('#shadow-opacity').inputValue()).toBe('0');
    });

    test('changing x-offset updates gallery shadow', async ({ page }) => {
      await page.locator('#shadow-offset-x').fill('10');
      await page.locator('#shadow-offset-x').dispatchEvent('change');
      await page.waitForTimeout(300);

      const image = page.locator('.fbn-ic-image').first();
      const boxShadow = await image.evaluate((el) => window.getComputedStyle(el).boxShadow);

      expect(boxShadow).toContain('10px');
    });

    test('changing y-offset updates gallery shadow', async ({ page }) => {
      await page.locator('#shadow-offset-y').fill('20');
      await page.locator('#shadow-offset-y').dispatchEvent('change');
      await page.waitForTimeout(300);

      const image = page.locator('.fbn-ic-image').first();
      const boxShadow = await image.evaluate((el) => window.getComputedStyle(el).boxShadow);

      // Box shadow format: rgba(r,g,b,a) Xpx Ypx blur
      expect(boxShadow).toMatch(/0px 20px/);
    });

    test('changing blur updates gallery shadow', async ({ page }) => {
      await page.locator('#shadow-blur').fill('30');
      await page.locator('#shadow-blur').dispatchEvent('change');
      await page.waitForTimeout(300);

      const image = page.locator('.fbn-ic-image').first();
      const boxShadow = await image.evaluate((el) => window.getComputedStyle(el).boxShadow);

      expect(boxShadow).toContain('30px');
    });

    test('changing color updates gallery shadow', async ({ page }) => {
      await page.locator('#shadow-color').fill('#ff0000');
      await page.locator('#shadow-color').dispatchEvent('change');
      await page.waitForTimeout(300);

      const image = page.locator('.fbn-ic-image').first();
      const boxShadow = await image.evaluate((el) => window.getComputedStyle(el).boxShadow);

      // Red color in rgba format
      expect(boxShadow).toMatch(/rgba?\(255,\s*0,\s*0/);
    });

    test('changing opacity updates gallery shadow', async ({ page }) => {
      // Set a visible color first for easier verification
      await page.locator('#shadow-color').fill('#000000');
      await page.locator('#shadow-color').dispatchEvent('change');
      // Opacity slider uses 'input' event
      await page.locator('#shadow-opacity').fill('0.8');
      await page.locator('#shadow-opacity').dispatchEvent('input');
      await page.waitForTimeout(300);

      const image = page.locator('.fbn-ic-image').first();
      const boxShadow = await image.evaluate((el) => window.getComputedStyle(el).boxShadow);

      // Check opacity in rgba
      expect(boxShadow).toMatch(/rgba\(0,\s*0,\s*0,\s*0\.8\)/);
    });

  });

  test.describe('Preset to Custom Transition', () => {

    test('switching from md preset copies values to custom controls', async ({ page }) => {
      // Enable shadow with md preset
      await page.locator('#enable-style-shadow').check();
      await page.locator('#style-shadow').selectOption('md');

      // Switch to custom
      await page.locator('#style-shadow').selectOption('custom');

      // md preset is: 0 4px 16px rgba(0,0,0,0.4)
      expect(await page.locator('#shadow-offset-x').inputValue()).toBe('0');
      expect(await page.locator('#shadow-offset-y').inputValue()).toBe('4');
      expect(await page.locator('#shadow-blur').inputValue()).toBe('16');
      expect(await page.locator('#shadow-color').inputValue()).toBe('#000000');
      expect(await page.locator('#shadow-opacity').inputValue()).toBe('0.4');
    });

    test('switching from lg preset copies values to custom controls', async ({ page }) => {
      // Enable shadow with lg preset
      await page.locator('#enable-style-shadow').check();
      await page.locator('#style-shadow').selectOption('lg');

      // Switch to custom
      await page.locator('#style-shadow').selectOption('custom');

      // lg preset is: 0 8px 32px rgba(0,0,0,0.5)
      expect(await page.locator('#shadow-offset-x').inputValue()).toBe('0');
      expect(await page.locator('#shadow-offset-y').inputValue()).toBe('8');
      expect(await page.locator('#shadow-blur').inputValue()).toBe('32');
      expect(await page.locator('#shadow-color').inputValue()).toBe('#000000');
      expect(await page.locator('#shadow-opacity').inputValue()).toBe('0.5');
    });

    test('switching from glow preset copies values to custom controls', async ({ page }) => {
      // Enable shadow with glow preset
      await page.locator('#enable-style-shadow').check();
      await page.locator('#style-shadow').selectOption('glow');

      // Switch to custom
      await page.locator('#style-shadow').selectOption('custom');

      // glow preset is: 0 0 30px rgba(255,255,255,0.6)
      expect(await page.locator('#shadow-offset-x').inputValue()).toBe('0');
      expect(await page.locator('#shadow-offset-y').inputValue()).toBe('0');
      expect(await page.locator('#shadow-blur').inputValue()).toBe('30');
      expect(await page.locator('#shadow-color').inputValue()).toBe('#ffffff');
      expect(await page.locator('#shadow-opacity').inputValue()).toBe('0.6');
    });

  });

  test.describe('Default State Custom Shadow', () => {

    test('custom shadow values persist in default state', async ({ page }) => {
      // Set custom shadow in default state
      await page.locator('#enable-style-shadow').check();
      await page.locator('#style-shadow').selectOption('custom');
      await page.locator('#shadow-offset-x').fill('5');
      await page.locator('#shadow-offset-y').fill('10');
      await page.locator('#shadow-blur').fill('20');
      await page.locator('#shadow-color').fill('#0000ff');
      await page.locator('#shadow-opacity').fill('0.6');
      await page.locator('#shadow-opacity').dispatchEvent('input');
      await page.waitForTimeout(200);

      // Switch to hover state and back
      await page.click('button:has-text("Hover")');
      await page.click('button:has-text("Default")');

      // Verify default state values are preserved
      expect(await page.locator('#shadow-offset-x').inputValue()).toBe('5');
      expect(await page.locator('#shadow-offset-y').inputValue()).toBe('10');
      expect(await page.locator('#shadow-blur').inputValue()).toBe('20');
      expect(await page.locator('#shadow-color').inputValue()).toBe('#0000ff');
      expect(await page.locator('#shadow-opacity').inputValue()).toBe('0.6');
    });

    test('default state custom shadow applies to all images', async ({ page }) => {
      // Set custom shadow in default state
      await page.locator('#enable-style-shadow').check();
      await page.locator('#style-shadow').selectOption('custom');
      await page.locator('#shadow-offset-x').fill('8');
      await page.locator('#shadow-offset-y').fill('12');
      await page.locator('#shadow-blur').fill('25');
      await page.locator('#shadow-blur').dispatchEvent('change');
      await page.waitForTimeout(300);

      // Check first image has the shadow
      const image = page.locator('.fbn-ic-image').first();
      const boxShadow = await image.evaluate((el) => window.getComputedStyle(el).boxShadow);

      expect(boxShadow).toContain('8px');
      expect(boxShadow).toContain('12px');
      expect(boxShadow).toContain('25px');
    });

  });

  test.describe('Hover State Custom Shadow', () => {

    test('custom shadow values persist in hover state', async ({ page }) => {
      // Switch to hover state
      await page.click('button:has-text("Hover")');

      // Set custom shadow in hover state
      await page.locator('#enable-style-shadow').check();
      await page.locator('#style-shadow').selectOption('custom');
      await page.locator('#shadow-offset-x').fill('15');
      await page.locator('#shadow-offset-y').fill('15');
      await page.locator('#shadow-blur').fill('35');
      await page.locator('#shadow-color').fill('#ff00ff');
      await page.locator('#shadow-opacity').fill('0.7');
      await page.locator('#shadow-opacity').dispatchEvent('input');
      await page.waitForTimeout(200);

      // Switch to focused state and back to hover
      await page.click('button:has-text("Focused")');
      await page.click('button:has-text("Hover")');

      // Verify hover state values are preserved
      expect(await page.locator('#shadow-offset-x').inputValue()).toBe('15');
      expect(await page.locator('#shadow-offset-y').inputValue()).toBe('15');
      expect(await page.locator('#shadow-blur').inputValue()).toBe('35');
      expect(await page.locator('#shadow-color').inputValue()).toBe('#ff00ff');
      expect(await page.locator('#shadow-opacity').inputValue()).toBe('0.7');
    });

    test('hover state custom shadow applies on image hover', async ({ page }) => {
      // Switch to hover state
      await page.click('button:has-text("Hover")');

      // Set custom shadow for hover state
      await page.locator('#enable-style-shadow').check();
      await page.locator('#style-shadow').selectOption('custom');
      await page.locator('#shadow-offset-x').fill('20');
      await page.locator('#shadow-offset-y').fill('20');
      await page.locator('#shadow-blur').fill('40');
      await page.locator('#shadow-blur').dispatchEvent('change');
      await page.waitForTimeout(300);

      // Hover over an image
      const image = page.locator('.fbn-ic-image').first();
      await image.hover();
      await page.waitForTimeout(100);

      const boxShadow = await image.evaluate((el) => window.getComputedStyle(el).boxShadow);

      // Should have custom hover shadow
      expect(boxShadow).toContain('20px');
      expect(boxShadow).toContain('40px');
    });

    test('hover shadow different from default shadow', async ({ page }) => {
      // Set default shadow to sm preset
      await page.locator('#enable-style-shadow').check();
      await page.locator('#style-shadow').selectOption('sm');
      await page.waitForTimeout(200);

      // Set hover shadow to custom large shadow
      await page.click('button:has-text("Hover")');
      await page.locator('#enable-style-shadow').check();
      await page.locator('#style-shadow').selectOption('custom');
      await page.locator('#shadow-offset-x').fill('0');
      await page.locator('#shadow-offset-y').fill('15');
      await page.locator('#shadow-blur').fill('50');
      await page.locator('#shadow-blur').dispatchEvent('change');
      await page.waitForTimeout(300);

      const image = page.locator('.fbn-ic-image').first();

      // Get default shadow (not hovering)
      const defaultShadow = await image.evaluate((el) => window.getComputedStyle(el).boxShadow);

      // Hover and get hover shadow
      await image.hover();
      await page.waitForTimeout(100);
      const hoverShadow = await image.evaluate((el) => window.getComputedStyle(el).boxShadow);

      // Shadows should be different
      expect(hoverShadow).not.toBe(defaultShadow);
      expect(hoverShadow).toContain('50px');
    });

  });

  test.describe('Focused State Custom Shadow', () => {

    test('custom shadow values persist in focused state', async ({ page }) => {
      // Switch to focused state
      await page.click('button:has-text("Focused")');

      // Set custom shadow in focused state
      await page.locator('#enable-style-shadow').check();
      await page.locator('#style-shadow').selectOption('custom');
      await page.locator('#shadow-offset-x').fill('0');
      await page.locator('#shadow-offset-y').fill('0');
      await page.locator('#shadow-blur').fill('50');
      await page.locator('#shadow-color').fill('#00ffff');
      await page.locator('#shadow-opacity').fill('0.9');
      await page.locator('#shadow-opacity').dispatchEvent('input');
      await page.waitForTimeout(200);

      // Switch to default state and back to focused
      await page.click('button:has-text("Default")');
      await page.click('button:has-text("Focused")');

      // Verify focused state values are preserved
      expect(await page.locator('#shadow-offset-x').inputValue()).toBe('0');
      expect(await page.locator('#shadow-offset-y').inputValue()).toBe('0');
      expect(await page.locator('#shadow-blur').inputValue()).toBe('50');
      expect(await page.locator('#shadow-color').inputValue()).toBe('#00ffff');
      expect(await page.locator('#shadow-opacity').inputValue()).toBe('0.9');
    });

    test('focused state custom shadow applies when image is clicked', async ({ page }) => {
      // Switch to focused state
      await page.click('button:has-text("Focused")');

      // Set custom shadow for focused state - glow effect
      await page.locator('#enable-style-shadow').check();
      await page.locator('#style-shadow').selectOption('custom');
      await page.locator('#shadow-offset-x').fill('0');
      await page.locator('#shadow-offset-x').dispatchEvent('change');
      await page.locator('#shadow-offset-y').fill('0');
      await page.locator('#shadow-offset-y').dispatchEvent('change');
      await page.locator('#shadow-blur').fill('60');
      await page.locator('#shadow-blur').dispatchEvent('change');
      await page.locator('#shadow-color').fill('#ffffff');
      await page.locator('#shadow-color').dispatchEvent('change');
      await page.locator('#shadow-opacity').fill('0.8');
      await page.locator('#shadow-opacity').dispatchEvent('input');
      await page.waitForTimeout(300);

      // Click an image to focus it
      const image = page.locator('.fbn-ic-image').first();
      await image.click();
      await page.waitForTimeout(500); // Wait for zoom animation

      const boxShadow = await image.evaluate((el) => window.getComputedStyle(el).boxShadow);

      // Should have custom focused shadow (white glow)
      expect(boxShadow).toContain('60px');
      expect(boxShadow).toMatch(/rgba?\(255,\s*255,\s*255/);
    });

    test('focused shadow different from default and hover', async ({ page }) => {
      // Set different shadows for each state
      // Default: small shadow
      await page.locator('#enable-style-shadow').check();
      await page.locator('#style-shadow').selectOption('sm');
      await page.waitForTimeout(100);

      // Hover: medium shadow
      await page.click('button:has-text("Hover")');
      await page.locator('#enable-style-shadow').check();
      await page.locator('#style-shadow').selectOption('md');
      await page.waitForTimeout(100);

      // Focused: custom large glow
      await page.click('button:has-text("Focused")');
      await page.locator('#enable-style-shadow').check();
      await page.locator('#style-shadow').selectOption('custom');
      await page.locator('#shadow-offset-x').fill('0');
      await page.locator('#shadow-offset-y').fill('0');
      await page.locator('#shadow-blur').fill('80');
      await page.locator('#shadow-blur').dispatchEvent('change');
      await page.waitForTimeout(300);

      const image = page.locator('.fbn-ic-image').first();

      // Get default shadow
      const defaultShadow = await image.evaluate((el) => window.getComputedStyle(el).boxShadow);

      // Get hover shadow
      await image.hover();
      await page.waitForTimeout(100);
      const hoverShadow = await image.evaluate((el) => window.getComputedStyle(el).boxShadow);

      // Click to focus and get focused shadow
      await image.click();
      await page.waitForTimeout(400);
      const focusedShadow = await image.evaluate((el) => window.getComputedStyle(el).boxShadow);

      // All three should be different
      expect(defaultShadow).not.toBe(hoverShadow);
      expect(hoverShadow).not.toBe(focusedShadow);
      expect(defaultShadow).not.toBe(focusedShadow);
      expect(focusedShadow).toContain('80px');
    });

  });

  test.describe('All States Custom Shadow Values Independent', () => {

    test('each state maintains independent custom shadow values', async ({ page }) => {
      // Set custom shadow in DEFAULT state
      await page.locator('#enable-style-shadow').check();
      await page.locator('#style-shadow').selectOption('custom');
      await page.locator('#shadow-offset-x').fill('1');
      await page.locator('#shadow-offset-y').fill('2');
      await page.locator('#shadow-blur').fill('10');
      await page.locator('#shadow-blur').dispatchEvent('change');

      // Set custom shadow in HOVER state
      await page.click('button:has-text("Hover")');
      await page.locator('#enable-style-shadow').check();
      await page.locator('#style-shadow').selectOption('custom');
      await page.locator('#shadow-offset-x').fill('3');
      await page.locator('#shadow-offset-y').fill('4');
      await page.locator('#shadow-blur').fill('20');
      await page.locator('#shadow-blur').dispatchEvent('change');

      // Set custom shadow in FOCUSED state
      await page.click('button:has-text("Focused")');
      await page.locator('#enable-style-shadow').check();
      await page.locator('#style-shadow').selectOption('custom');
      await page.locator('#shadow-offset-x').fill('5');
      await page.locator('#shadow-offset-y').fill('6');
      await page.locator('#shadow-blur').fill('30');
      await page.locator('#shadow-blur').dispatchEvent('change');

      // Verify DEFAULT state values
      await page.click('button:has-text("Default")');
      expect(await page.locator('#shadow-offset-x').inputValue()).toBe('1');
      expect(await page.locator('#shadow-offset-y').inputValue()).toBe('2');
      expect(await page.locator('#shadow-blur').inputValue()).toBe('10');

      // Verify HOVER state values
      await page.click('button:has-text("Hover")');
      expect(await page.locator('#shadow-offset-x').inputValue()).toBe('3');
      expect(await page.locator('#shadow-offset-y').inputValue()).toBe('4');
      expect(await page.locator('#shadow-blur').inputValue()).toBe('20');

      // Verify FOCUSED state values
      await page.click('button:has-text("Focused")');
      expect(await page.locator('#shadow-offset-x').inputValue()).toBe('5');
      expect(await page.locator('#shadow-offset-y').inputValue()).toBe('6');
      expect(await page.locator('#shadow-blur').inputValue()).toBe('30');
    });

  });

  test.describe('Config JSON Output', () => {

    test('custom shadow outputs as CSS string in config', async ({ page }) => {
      // Enable custom shadow
      await page.locator('#enable-style-shadow').check();
      await page.locator('#style-shadow').selectOption('custom');
      await page.locator('#shadow-offset-x').fill('5');
      await page.locator('#shadow-offset-y').fill('10');
      await page.locator('#shadow-blur').fill('15');
      await page.locator('#shadow-color').fill('#ff0000');
      await page.locator('#shadow-opacity').fill('0.5');
      await page.locator('#shadow-opacity').dispatchEvent('input');
      await page.waitForTimeout(200);

      // Show config JSON
      await page.click('button:has-text("Show Config JSON")');
      await page.waitForSelector('#configModal.active', { timeout: 5000 });

      const configText = await page.locator('#configOutput').textContent();
      const config = JSON.parse(configText || '{}');

      // Custom shadow should be a CSS string
      expect(config.styling?.default?.shadow).toBe('5px 10px 15px rgba(255, 0, 0, 0.5)');
    });

  });

});
