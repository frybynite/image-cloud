/**
 * Height-Relative Clip-Path Centering Tests
 *
 * Tests that height-relative clip-path shapes are properly centered horizontally
 * for images with different aspect ratios (portrait, landscape, square).
 */

import { test, expect } from '@playwright/test';

const TEST_IMAGES = [
  '/test/fixtures/images/image1.jpg',  // Landscape (wider than tall)
  '/test/fixtures/images/image2.jpg',  // Landscape
  '/test/fixtures/images/image3.jpg',  // Square or portrait
  '/test/fixtures/images/food1.jpg'    // Landscape
];

const PORTRAIT_IMAGES = [
  '/test/fixtures/images/image3.jpg'   // Portrait or square (will test)
];

async function initGalleryWithPortraitImage(
  page: any,
  shape: string = 'hexagon',
  urls: string[] = TEST_IMAGES,
  columnsForLayout: number = 2
) {
  await page.goto('/test/fixtures/styling.html');
  await page.evaluate(() => {
    // @ts-ignore
    if (window.gallery) window.gallery.destroy();
    const container = document.getElementById('imageCloud');
    if (container) container.innerHTML = '';
  });

  await page.evaluate(
    async ({ urls, shape, columnsForLayout }: any) => {
      // @ts-ignore
      window.DEBUG_CLIPPATH = true;
      // @ts-ignore
      window.gallery = new window.ImageCloud({
        container: 'imageCloud',
        loaders: [{ static: { sources: [{ urls }], validateUrls: false } }],
        layout: {
          algorithm: 'grid',
          rotation: { enabled: false },
          grid: { columns: columnsForLayout, rows: 2, gap: 20 }
        },
        styling: {
          default: {
            clipPath: { shape, mode: 'height-relative' }
          }
        },
        animation: { duration: 100, queue: { enabled: true, interval: 20 } },
        interaction: { focus: { animationDuration: 100 } }
      });
      // @ts-ignore
      await window.gallery.init();
    },
    { urls, shape, columnsForLayout }
  );

  await page.waitForSelector('#imageCloud img', { state: 'visible', timeout: 5000 });
  await page.waitForTimeout(500);  // Wait for layout calculations

  // Log any console messages
  const logs = await page.evaluate(() => {
    // @ts-ignore
    return (window as any).__consoleLogs || [];
  });
  if (logs.length > 0) {
    console.log('Console logs from page:', logs);
  }
}

function parseClipPath(clipPathStr: string): number[] | null {
  // Extract polygon coordinates from clip-path string
  const match = clipPathStr.match(/polygon\((.*?)\)/);
  if (!match) return null;

  const coordsStr = match[1];
  const coords: number[] = [];

  const pairs = coordsStr.split(',').map(p => p.trim());
  pairs.forEach(pair => {
    const [x, y] = pair.split(' ').map(v => parseFloat(v));
    coords.push(x, y);
  });

  return coords;
}

test.describe('Height-Relative Clip-Path Centering', () => {

  test('hexagon in height-relative mode is horizontally centered for portrait image', async ({ page }) => {
    // Test with portrait source image (tall container, single column)
    await initGalleryWithPortraitImage(page, 'hexagon', PORTRAIT_IMAGES, 1);

    const img = page.locator('#imageCloud img').first();

    // Check if element was created in forEach, and if onload was called
    const createdFlag = await img.evaluate(el => (el as any).dataset.createdFlag === 'true');
    const onloadCalled = await img.evaluate(el => (el as any).dataset.onloadCalled === 'true');
    const imageComplete = await img.evaluate(el => el.complete);
    const naturalWidth = await img.evaluate(el => el.naturalWidth);
    console.log(`Created flag: ${createdFlag}, Onload called: ${onloadCalled}, Image complete: ${imageComplete}, Natural width: ${naturalWidth}`);

    // Get image dimensions
    const imageWidth = await img.evaluate(el => el.offsetWidth);
    const imageHeight = await img.evaluate(el => el.offsetHeight);

    console.log(`Image dimensions: ${imageWidth}x${imageHeight}`);

    // Get the clip-path
    const clipPath = await img.evaluate(el => window.getComputedStyle(el).clipPath);
    console.log(`Clip-path: ${clipPath}`);

    const coords = parseClipPath(clipPath);
    if (!coords) {
      throw new Error('Could not parse clip-path coordinates');
    }

    // Extract X coordinates (every other element starting at 0)
    const xCoords = [];
    for (let i = 0; i < coords.length; i += 2) {
      xCoords.push(coords[i]);
    }

    const minX = Math.min(...xCoords);
    const maxX = Math.max(...xCoords);
    const shapeWidth = maxX - minX;
    const shapeCenter = minX + (shapeWidth / 2);
    const imageCenterX = imageWidth / 2;

    console.log(`Shape X range: ${minX} to ${maxX} (width: ${shapeWidth})`);
    console.log(`Shape center X: ${shapeCenter}`);
    console.log(`Image center X: ${imageCenterX}`);
    console.log(`Difference: ${Math.abs(shapeCenter - imageCenterX)}`);

    // The shape center should be close to the image center (within 1px due to rounding)
    expect(Math.abs(shapeCenter - imageCenterX)).toBeLessThan(2);
  });

  test('hexagon in height-relative mode is horizontally centered for landscape image', async ({ page }) => {
    // Use 4 columns to force wide layout that creates landscape-like rendered dimensions
    await initGalleryWithPortraitImage(page, 'hexagon', TEST_IMAGES, 4);

    const img = page.locator('#imageCloud img').first();

    // Get image dimensions
    const imageWidth = await img.evaluate(el => el.offsetWidth);
    const imageHeight = await img.evaluate(el => el.offsetHeight);

    console.log(`Image dimensions: ${imageWidth}x${imageHeight}`);

    // Get the clip-path
    const clipPath = await img.evaluate(el => window.getComputedStyle(el).clipPath);
    console.log(`Clip-path: ${clipPath}`);

    const coords = parseClipPath(clipPath);
    if (!coords) {
      throw new Error('Could not parse clip-path coordinates');
    }

    // Extract X coordinates
    const xCoords = [];
    for (let i = 0; i < coords.length; i += 2) {
      xCoords.push(coords[i]);
    }

    const minX = Math.min(...xCoords);
    const maxX = Math.max(...xCoords);
    const shapeWidth = maxX - minX;
    const shapeCenter = minX + (shapeWidth / 2);
    const imageCenterX = imageWidth / 2;

    console.log(`Shape X range: ${minX} to ${maxX} (width: ${shapeWidth})`);
    console.log(`Shape center X: ${shapeCenter}`);
    console.log(`Image center X: ${imageCenterX}`);
    console.log(`Difference: ${Math.abs(shapeCenter - imageCenterX)}`);

    // The shape center should be close to the image center (within 1px due to rounding)
    expect(Math.abs(shapeCenter - imageCenterX)).toBeLessThan(2);
  });

  test('circle in height-relative mode uses pixel radius (not affected by width)', async ({ page }) => {
    await initGalleryWithPortraitImage(page, 'circle');

    const img = page.locator('#imageCloud img').first();

    const imageHeight = await img.evaluate(el => el.offsetHeight);
    const clipPath = await img.evaluate(el => window.getComputedStyle(el).clipPath);

    console.log(`Image height: ${imageHeight}`);
    console.log(`Clip-path: ${clipPath}`);

    // Circle should use circle(Rpx) format where R is a pixel value
    expect(clipPath).toMatch(/circle\(\d+(\.\d+)?px\)/);

    // Extract the radius value
    const radiusMatch = clipPath.match(/circle\((\d+(?:\.\d+)?)px\)/);
    if (radiusMatch) {
      const radius = parseFloat(radiusMatch[1]);
      // For height-relative, radius should be imageHeight / 2
      const expectedRadius = Math.round(imageHeight / 2 * 100) / 100;
      console.log(`Radius: ${radius}, Expected: ${expectedRadius}`);
      expect(Math.abs(radius - expectedRadius)).toBeLessThan(1);
    }
  });

});
