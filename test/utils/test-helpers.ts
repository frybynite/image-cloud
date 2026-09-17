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
