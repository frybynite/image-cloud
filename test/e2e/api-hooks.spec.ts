import { test, expect, Page } from '@playwright/test';
import { waitForGalleryInit, waitForAnimation } from '../utils/test-helpers';

// Helpers ────────────────────────────────────────────────────────────────────

async function getLog(page: Page): Promise<Array<{ event: string; index: number; url?: string }>> {
  return page.evaluate(() => (window as any).callbackLog ?? []);
}

async function clearLog(page: Page): Promise<void> {
  await page.evaluate(() => { (window as any).callbackLog = []; });
}

/** Dispatch mouse event on the nth image in DOM order */
async function dispatchMouse(page: Page, domIndex: number, eventType: string): Promise<void> {
  await page.evaluate(({ domIndex, eventType }) => {
    const imgs = document.querySelectorAll('#imageCloud img');
    const img = imgs[domIndex] as HTMLElement;
    if (img) img.dispatchEvent(new MouseEvent(eventType, { bubbles: true, cancelable: true }));
  }, { domIndex, eventType });
}

/** Get the imageId (gallery index) of the nth image in DOM */
async function getImageIdAtDomPos(page: Page, domIndex: number): Promise<number> {
  return page.evaluate((domIndex) => {
    const imgs = document.querySelectorAll('#imageCloud img');
    const img = imgs[domIndex] as HTMLImageElement;
    return img ? parseInt(img.dataset.imageId ?? '0') : 0;
  }, domIndex);
}

/** Click the nth image in DOM order */
async function clickImg(page: Page, domIndex: number): Promise<void> {
  await page.evaluate((domIndex) => {
    const imgs = document.querySelectorAll('#imageCloud img');
    const img = imgs[domIndex] as HTMLElement;
    if (img) img.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  }, domIndex);
}

// Tests ──────────────────────────────────────────────────────────────────────

// Mouse-event based tests — desktop (chromium) only; mobile excluded via playwright.config.ts testIgnore
test.describe('API Hooks (`on` callbacks)', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/test/fixtures/api-hooks.html');
    await waitForGalleryInit(page);
    await waitForAnimation(page, 400);
    await clearLog(page);
  });

  test('onImageHover fires on mouseenter', async ({ page }) => {
    const expectedIndex = await getImageIdAtDomPos(page, 0);
    await dispatchMouse(page, 0, 'mouseenter');
    const log = await getLog(page);
    const entry = log.find(e => e.event === 'hover');
    expect(entry).toBeDefined();
    expect(entry!.index).toBe(expectedIndex);
    expect(entry!.url).toBeTruthy();
  });

  test('onImageUnhover fires on mouseleave', async ({ page }) => {
    await dispatchMouse(page, 0, 'mouseenter');
    await dispatchMouse(page, 0, 'mouseleave');
    const log = await getLog(page);
    const unhover = log.find(e => e.event === 'unhover');
    expect(unhover).toBeDefined();
    expect(typeof unhover!.index).toBe('number');
  });

  test('onImageFocus fires after focusing an image', async ({ page }) => {
    const expectedIndex = await getImageIdAtDomPos(page, 0);
    await clickImg(page, 0);
    await waitForAnimation(page, 300);
    const log = await getLog(page);
    const entry = log.find(e => e.event === 'focus');
    expect(entry).toBeDefined();
    expect(entry!.index).toBe(expectedIndex);
  });

  test('onImageUnfocus fires after unfocusing an image', async ({ page }) => {
    // Focus then unfocus
    await clickImg(page, 0);
    await waitForAnimation(page, 300);
    await clearLog(page);
    await clickImg(page, 0);
    await waitForAnimation(page, 300);
    const log = await getLog(page);
    const entry = log.find(e => e.event === 'unfocus');
    expect(entry).toBeDefined();
    expect(typeof entry!.index).toBe('number');
  });

  test('hover context includes url string', async ({ page }) => {
    await dispatchMouse(page, 0, 'mouseenter');
    const log = await getLog(page);
    const entry = log.find(e => e.event === 'hover');
    expect(typeof entry!.url).toBe('string');
    expect(entry!.url!.length).toBeGreaterThan(0);
  });

  test('callbacks for different images report correct index', async ({ page }) => {
    const idx0 = await getImageIdAtDomPos(page, 0);
    const idx1 = await getImageIdAtDomPos(page, 1);
    // They should be different images
    await dispatchMouse(page, 1, 'mouseenter');
    const log = await getLog(page);
    const entry = log.find(e => e.event === 'hover');
    expect(entry?.index).toBe(idx1);
    expect(entry?.index).not.toBe(idx0);
  });

});
