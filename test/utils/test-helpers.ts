import { Page, expect } from '@playwright/test';

export async function waitForGalleryInit(page: Page, containerId = 'imageCloud') {
  await page.waitForSelector(`#${containerId}`, { state: 'attached' });
  // Wait for at least one image to be rendered
  await page.waitForSelector(`#${containerId} img`, { state: 'visible', timeout: 10000 });
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
