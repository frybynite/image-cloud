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

const TOTAL_IMAGES = 3;  // matches fixture image count

async function getLoadingLog(page: Page): Promise<Array<Record<string, unknown>>> {
  return page.evaluate(() => (window as any).loadingLog ?? []);
}

async function getEntryLog(page: Page): Promise<Array<Record<string, unknown>>> {
  return page.evaluate(() => (window as any).entryLog ?? []);
}

// ─── Loading lifecycle hooks ─────────────────────────────────────────────────

test.describe('Loading Lifecycle Hooks', () => {

  let loadingLog: Array<Record<string, unknown>>;

  test.beforeEach(async ({ page }) => {
    await page.goto('/test/fixtures/api-hooks.html');
    await waitForGalleryInit(page);
    await waitForAnimation(page, 400);
    loadingLog = await getLoadingLog(page);
  });

  test('onBeforeImageLoad fires once per image', async () => {
    const entries = loadingLog.filter(e => e.event === 'beforeLoad');
    expect(entries).toHaveLength(TOTAL_IMAGES);
    for (const e of entries) {
      expect(typeof e.index).toBe('number');
      expect(typeof e.url).toBe('string');
      expect((e.url as string).length).toBeGreaterThan(0);
      expect(e.totalImages).toBe(TOTAL_IMAGES);
    }
  });

  test('onImageLoaded fires for each successfully loaded image', async () => {
    const entries = loadingLog.filter(e => e.event === 'loaded');
    expect(entries.length).toBeGreaterThan(0);
    expect(entries.length).toBeLessThanOrEqual(TOTAL_IMAGES);
    for (const e of entries) {
      expect(typeof e.index).toBe('number');
      expect(e.totalImages).toBe(TOTAL_IMAGES);
      expect(typeof e.url).toBe('string');
      expect(typeof e.loadTime).toBe('number');
      expect(e.loadTime as number).toBeGreaterThanOrEqual(0);
    }
  });

  test('onImageLoaded receives correct totalImages', async () => {
    const entries = loadingLog.filter(e => e.event === 'loaded');
    for (const e of entries) {
      expect(e.totalImages).toBe(TOTAL_IMAGES);
    }
  });

  test('onLoadProgress fires after each image settles', async () => {
    const entries = loadingLog.filter(e => e.event === 'progress');
    expect(entries.length).toBeGreaterThan(0);
    // Each entry: loaded + failed must equal its position in the sequence
    for (let i = 0; i < entries.length; i++) {
      const e = entries[i];
      expect(e.loaded as number + (e.failed as number)).toBe(i + 1);
      expect(e.total).toBe(TOTAL_IMAGES);
    }
  });

  test('onLoadProgress final entry reports 100%', async () => {
    const entries = loadingLog.filter(e => e.event === 'progress');
    const last = entries[entries.length - 1];
    expect(last).toBeDefined();
    expect(last.loaded as number + (last.failed as number)).toBe(TOTAL_IMAGES);
    expect(last.percent).toBe(100);
  });

  test('onGalleryReady fires exactly once', async () => {
    const entries = loadingLog.filter(e => e.event === 'ready');
    expect(entries).toHaveLength(1);
  });

  test('onGalleryReady context has correct fields', async () => {
    const ready = loadingLog.find(e => e.event === 'ready');
    expect(ready).toBeDefined();
    expect(ready!.totalImages).toBe(TOTAL_IMAGES);
    expect(ready!.failedImages).toBe(0);
    expect(typeof ready!.loadDuration).toBe('number');
    expect(ready!.loadDuration as number).toBeGreaterThanOrEqual(0);
  });

  test('onGalleryReady fires after all onImageLoaded events', async () => {
    const readyIdx = loadingLog.findIndex(e => e.event === 'ready');
    const loadedEntries = loadingLog.filter(e => e.event === 'loaded');
    // ready must appear after all loaded events
    expect(readyIdx).toBeGreaterThan(-1);
    for (const e of loadedEntries) {
      const loadedIdx = loadingLog.indexOf(e);
      expect(loadedIdx).toBeLessThan(readyIdx);
    }
  });

  test('hook call order: beforeLoad → loaded → progress → ready', async () => {
    const firstBeforeLoad = loadingLog.findIndex(e => e.event === 'beforeLoad');
    const firstLoaded     = loadingLog.findIndex(e => e.event === 'loaded');
    const firstProgress   = loadingLog.findIndex(e => e.event === 'progress');
    const readyIdx        = loadingLog.findIndex(e => e.event === 'ready');
    expect(firstBeforeLoad).toBeGreaterThan(-1);
    expect(firstLoaded).toBeGreaterThan(-1);
    expect(firstProgress).toBeGreaterThan(-1);
    expect(readyIdx).toBeGreaterThan(-1);
    expect(firstBeforeLoad).toBeLessThan(firstLoaded);
    expect(firstLoaded).toBeLessThan(firstProgress);
    expect(firstProgress).toBeLessThan(readyIdx);
  });

});

// ─── Layout hook ─────────────────────────────────────────────────────────────

test.describe('Layout Hook', () => {

  let layoutLog: Array<Record<string, unknown>>;

  test.beforeEach(async ({ page }) => {
    await page.goto('/test/fixtures/api-hooks.html');
    await waitForGalleryInit(page);
    await waitForAnimation(page, 200);
    layoutLog = await page.evaluate(() => (window as any).layoutLog ?? []);
  });

  test('onLayoutComplete fires exactly once per load', async () => {
    expect(layoutLog).toHaveLength(1);
    expect(layoutLog[0].event).toBe('layoutComplete');
  });

  test('onLayoutComplete imageCount matches fixture image count', async () => {
    expect(layoutLog[0].imageCount).toBe(TOTAL_IMAGES);
  });

  test('onLayoutComplete layouts array length matches imageCount', async () => {
    expect(layoutLog[0].layoutsLen).toBe(TOTAL_IMAGES);
  });

  test('onLayoutComplete provides containerBounds', async () => {
    expect(layoutLog[0].hasContainerBounds).toBe(true);
  });

  test('onLayoutComplete provides algorithm name', async () => {
    expect(typeof layoutLog[0].algorithm).toBe('string');
    expect((layoutLog[0].algorithm as string).length).toBeGreaterThan(0);
  });

});

// ─── Entry animation hooks (CSS linear path) ────────────────────────────────

test.describe('Entry Animation Hooks (CSS path)', () => {

  let entryLog: Array<Record<string, unknown>>;

  test.beforeEach(async ({ page }) => {
    await page.goto('/test/fixtures/api-hooks.html');
    await waitForGalleryInit(page);
    // Wait long enough for CSS transitions (600ms default) + queue interval
    await waitForAnimation(page, 900);
    entryLog = await getEntryLog(page);
  });

  test('onEntryStart fires once per image', async () => {
    const entries = entryLog.filter(e => e.event === 'entryStart');
    expect(entries.length).toBe(TOTAL_IMAGES);
  });

  test('onEntryStart context has correct fields', async () => {
    const entries = entryLog.filter(e => e.event === 'entryStart');
    for (const e of entries) {
      expect(typeof e.index).toBe('number');
      expect(e.totalImages).toBe(TOTAL_IMAGES);
      expect(typeof e.duration).toBe('number');
      expect(e.duration as number).toBeGreaterThan(0);
    }
  });

  test('onEntryComplete fires once per image', async () => {
    const entries = entryLog.filter(e => e.event === 'entryComplete');
    expect(entries.length).toBe(TOTAL_IMAGES);
  });

  test('onEntryComplete elapsed is non-negative', async () => {
    const entries = entryLog.filter(e => e.event === 'entryComplete');
    for (const e of entries) {
      expect(e.elapsed as number).toBeGreaterThanOrEqual(0);
    }
  });

  test('onEntryStart fires before onEntryComplete for same image', async () => {
    for (let idx = 0; idx < TOTAL_IMAGES; idx++) {
      const startIdx    = entryLog.findIndex(e => e.event === 'entryStart'    && e.index === idx);
      const completeIdx = entryLog.findIndex(e => e.event === 'entryComplete' && e.index === idx);
      if (startIdx !== -1 && completeIdx !== -1) {
        expect(startIdx).toBeLessThan(completeIdx);
      }
    }
  });

});

// ─── Entry animation hooks (JS bounce path — onEntryProgress) ────────────────

test.describe('Entry Animation Hooks (JS bounce path)', () => {

  let entryLog: Array<Record<string, unknown>>;

  test.beforeEach(async ({ page }) => {
    await page.goto('/test/fixtures/api-hooks-bounce.html');
    await waitForGalleryInit(page);
    await waitForAnimation(page, 800);
    entryLog = await getEntryLog(page);
  });

  test('onEntryStart fires for each image', async () => {
    const entries = entryLog.filter(e => e.event === 'entryStart');
    expect(entries.length).toBe(TOTAL_IMAGES);
    for (const e of entries) {
      expect(e.hasFrom).toBe(true);
      expect(e.hasTo).toBe(true);
      expect(typeof e.duration).toBe('number');
    }
  });

  test('onEntryProgress fires at least once per image', async () => {
    for (let idx = 0; idx < TOTAL_IMAGES; idx++) {
      const progressEntries = entryLog.filter(e => e.event === 'entryProgress' && e.index === idx);
      expect(progressEntries.length).toBeGreaterThan(0);
    }
  });

  test('onEntryProgress progress values are 0–1', async () => {
    const entries = entryLog.filter(e => e.event === 'entryProgress');
    for (const e of entries) {
      expect(e.progress as number).toBeGreaterThanOrEqual(0);
      expect(e.progress as number).toBeLessThanOrEqual(1);
      expect(e.hasCurrent).toBe(true);
    }
  });

  test('onEntryComplete fires for each image', async () => {
    const entries = entryLog.filter(e => e.event === 'entryComplete');
    expect(entries.length).toBe(TOTAL_IMAGES);
    for (const e of entries) {
      expect(e.elapsed as number).toBeGreaterThanOrEqual(0);
    }
  });

  test('event order: entryStart → entryProgress → entryComplete per image', async () => {
    for (let idx = 0; idx < TOTAL_IMAGES; idx++) {
      const startIdx    = entryLog.findIndex(e => e.event === 'entryStart'    && e.index === idx);
      const progressIdx = entryLog.findIndex(e => e.event === 'entryProgress' && e.index === idx);
      const completeIdx = entryLog.findIndex(e => e.event === 'entryComplete' && e.index === idx);
      if (startIdx !== -1 && progressIdx !== -1 && completeIdx !== -1) {
        expect(startIdx).toBeLessThan(progressIdx);
        expect(progressIdx).toBeLessThan(completeIdx);
      }
    }
  });

});

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
