import { Page, expect } from '@playwright/test';

export async function waitForGalleryInit(page: Page, containerId = 'imageCloud') {
  await page.waitForSelector(`#${containerId}`, { state: 'attached' });
  // Wait for at least one image to be rendered
  await page.waitForSelector(`#${containerId} img`, { state: 'visible', timeout: 10000 });
}

/**
 * Wait until the gallery has finished loading and animating, instead of guessing with a fixed timeout.
 * Images are appended as they load and fly in from off-screen, so on slow runners (CI) a fixed wait
 * can measure a partially-loaded or mid-flight gallery.
 *
 * Settled means: the expected number of images is present (if given), every image has finished
 * loading, and no image's bounding rect has changed for `stableMs`.
 *
 * Pass `expectedCount` whenever the test knows it — without it, a long gap between two image
 * loads is indistinguishable from "done".
 */
export async function waitForGallerySettled(
  page: Page,
  options: { expectedCount?: number; containerId?: string; stableMs?: number; timeout?: number } = {}
) {
  const { expectedCount, containerId = 'imageCloud', stableMs = 250, timeout = 15000 } = options;
  await page.waitForSelector(`#${containerId} img`, { state: 'visible', timeout });
  await page.waitForFunction(
    ({ containerId, expectedCount, stableMs }) => {
      const imgs = Array.from(document.querySelectorAll<HTMLImageElement>(`#${containerId} img`));
      const w = window as any;
      const now = performance.now();
      const ready =
        imgs.length > 0 &&
        (expectedCount === undefined || imgs.length === expectedCount) &&
        imgs.every((img) => img.complete && img.naturalWidth > 0);
      const signature = ready
        ? imgs.map((img) => {
            const r = img.getBoundingClientRect();
            return [r.left, r.top, r.width, r.height].map((n) => n.toFixed(1)).join(',');
          }).join('|')
        : null;
      if (signature === null || w.__fbnSettleSig !== signature) {
        w.__fbnSettleSig = signature;
        w.__fbnSettleSince = now;
        return false;
      }
      return now - w.__fbnSettleSince >= stableMs;
    },
    { containerId, expectedCount, stableMs },
    { polling: 50, timeout }
  );
}

/**
 * Instrument the configurator so tests can wait for its debounced auto-apply instead of racing it.
 * The configurator applies changes 300ms after the last input event, then destroys and rebuilds
 * the gallery asynchronously — a fixed wait can read the old gallery. Call once after page load.
 */
export async function trackConfiguratorApplies(page: Page) {
  await page.evaluate(() => {
    const w = window as any;
    if (w.__fbnApply) return;
    const state = { inFlight: 0, lastEventAt: performance.now(), lastCompletedStartAt: 0 };
    w.__fbnApply = state;
    const onEvent = () => { state.lastEventAt = performance.now(); };
    document.addEventListener('input', onEvent, true);
    document.addEventListener('change', onEvent, true);
    const original = w.applyChanges;
    w.applyChanges = async function (...args: unknown[]) {
      const startedAt = performance.now();
      state.inFlight++;
      try {
        return await original.apply(this, args);
      } finally {
        state.inFlight--;
        state.lastCompletedStartAt = Math.max(state.lastCompletedStartAt, startedAt);
      }
    };
  });
}

/**
 * Wait until the configurator has applied the latest form changes and rebuilt the gallery:
 * an apply that started after the most recent input/change event has completed, nothing is
 * in flight, and the rebuilt gallery has settled. Requires trackConfiguratorApplies().
 */
export async function waitForConfiguratorApplied(page: Page) {
  await page.waitForFunction(
    () => {
      const s = (window as any).__fbnApply;
      return s && s.inFlight === 0 && s.lastCompletedStartAt > s.lastEventAt;
    },
    undefined,
    { polling: 50, timeout: 15000 }
  );
  await waitForGallerySettled(page);
}

export async function getImageCount(page: Page, containerId = 'imageCloud') {
  return page.locator(`#${containerId} img`).count();
}

export async function getImageTransform(page: Page, imageIndex: number, containerId = 'imageCloud') {
  const img = page.locator(`#${containerId} img`).nth(imageIndex);
  return img.evaluate((el) => window.getComputedStyle(el).transform);
}

export async function clickImage(page: Page, imageIndex: number, containerId = 'imageCloud') {
  const img = page.locator(`#${containerId} img`).nth(imageIndex);
  await img.click();
}

export async function isImageFocused(page: Page, imageIndex: number, containerId = 'imageCloud') {
  const img = page.locator(`#${containerId} img`).nth(imageIndex);
  const zIndex = await img.evaluate((el) => window.getComputedStyle(el).zIndex);
  return parseInt(zIndex) >= 1000;
}

export async function waitForAnimation(page: Page, duration = 700) {
  await page.waitForTimeout(duration);
}

export async function getConsoleWarnings(page: Page): Promise<string[]> {
  const warnings: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'warning') {
      warnings.push(msg.text());
    }
  });
  return warnings;
}
