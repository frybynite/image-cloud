#!/usr/bin/env node
/**
 * Captures screenshots of each layout algorithm for docs/images/
 * Requires: dev server running on localhost:5173
 * Usage: node scripts/screenshot-layouts.mjs
 */
import { chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, '../docs/images');
const BASE_URL = 'http://localhost:5173';

// Picsum photos: reliable, clean URLs, no query strings needed
const TEST_IMAGES = [
  'https://picsum.photos/id/10/600/400.jpg',
  'https://picsum.photos/id/11/600/400.jpg',
  'https://picsum.photos/id/13/600/400.jpg',
  'https://picsum.photos/id/15/600/400.jpg',
  'https://picsum.photos/id/16/600/400.jpg',
  'https://picsum.photos/id/17/600/400.jpg',
  'https://picsum.photos/id/18/600/400.jpg',
  'https://picsum.photos/id/20/600/400.jpg',
  'https://picsum.photos/id/21/600/400.jpg',
  'https://picsum.photos/id/22/600/400.jpg',
  'https://picsum.photos/id/24/600/400.jpg',
  'https://picsum.photos/id/25/600/400.jpg',
  'https://picsum.photos/id/26/600/400.jpg',
  'https://picsum.photos/id/27/600/400.jpg',
  'https://picsum.photos/id/28/600/400.jpg',
  'https://picsum.photos/id/29/600/400.jpg',
  'https://picsum.photos/id/30/600/400.jpg',
  'https://picsum.photos/id/31/600/400.jpg',
  'https://picsum.photos/id/32/600/400.jpg',
  'https://picsum.photos/id/33/600/400.jpg',
];

const LAYOUTS = [
  {
    name: 'radial',
    config: {
      algorithm: 'radial',
      sizing: { mode: 'fixed', height: 150 },
    },
  },
  {
    name: 'spiral',
    config: {
      algorithm: 'spiral',
      sizing: { mode: 'adaptive' },
      spiral: {
        spiralType: 'archimedean',
        direction: 'counterclockwise',
        tightness: 0.6,
      },
    },
  },
  {
    name: 'grid',
    config: {
      algorithm: 'grid',
      sizing: { mode: 'adaptive' },
      grid: {
        columns: 'auto',
        rows: 'auto',
        stagger: 'none',
        jitter: 0,
        overlap: 0,
        gap: 10,
      },
    },
  },
  {
    name: 'cluster',
    config: {
      algorithm: 'cluster',
      sizing: { mode: 'adaptive' },
      cluster: {
        clusterCount: 3,
        clusterSpread: 120,
        clusterSpacing: 200,
        overlap: 0.4,
        distribution: 'gaussian',
      },
    },
  },
  {
    name: 'wave',
    config: {
      algorithm: 'wave',
      sizing: { mode: 'adaptive' },
      wave: {
        amplitude: 80,
        synchronization: 'alternating',
      },
    },
  },
  {
    name: 'honeycomb',
    imageCount: 19,
    config: {
      algorithm: 'honeycomb',
      sizing: { mode: 'adaptive' },
      honeycomb: { spacing: 4 },
    },
  },
  {
    name: 'random',
    config: {
      algorithm: 'random',
      sizing: { mode: 'adaptive' },
    },
  },
];

async function setup(page) {
  await page.goto(`${BASE_URL}/test/fixtures/layout-radial.html`);
  await page.waitForFunction(() => window.ImageCloud !== undefined, { timeout: 10000 });

  // Set dark background
  await page.evaluate(() => {
    document.body.style.background = '#0f0e17';
    document.documentElement.style.background = '#0f0e17';
    const container = document.getElementById('imageCloud');
    if (container) container.style.background = '#0f0e17';
  });

  // Pre-warm: load all images into browser cache
  await page.evaluate((urls) => {
    return Promise.all(urls.map(url => new Promise((resolve) => {
      const img = new Image();
      img.onload = img.onerror = resolve;
      img.src = url;
    })));
  }, TEST_IMAGES);
}

async function captureLayout(page, layout) {
  // Reset container
  await page.evaluate(() => {
    const container = document.getElementById('imageCloud');
    if (container) container.innerHTML = '';
  });

  // Initialize the gallery
  await page.evaluate(async ({ urls, layoutConfig, imageConfig }) => {
    const cloud = new window.ImageCloud({
      container: 'imageCloud',
      loaders: [{ static: { sources: [{ urls }], validateUrls: false } }],
      layout: layoutConfig,
      ...(imageConfig ? { image: imageConfig } : {}),
      animation: {
        queue: { enabled: false },
        entry: { timing: { duration: 0 } },
      },
    });
    window._cloud = cloud;
    await cloud.init();
  }, {
    urls: layout.imageCount ? TEST_IMAGES.slice(0, layout.imageCount) : TEST_IMAGES,
    layoutConfig: layout.config,
    imageConfig: layout.imageConfig || null,
  });

  // Wait for images to appear and render
  await page.waitForSelector('#imageCloud img', { state: 'attached', timeout: 15000 });
  await page.waitForTimeout(500);

  // Screenshot the gallery element
  const galleryEl = page.locator('#imageCloud');
  await galleryEl.screenshot({
    path: `${OUTPUT_DIR}/layout-${layout.name}.png`,
  });

  console.log(`✓ Captured layout-${layout.name}.png`);
}

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 800, height: 500 },
  });
  const page = await context.newPage();

  page.on('pageerror', (err) => console.error('Page error:', err.message));

  await setup(page);

  for (const layout of LAYOUTS) {
    try {
      await captureLayout(page, layout);
    } catch (err) {
      console.error(`✗ Failed layout-${layout.name}:`, err.message);
    }
  }

  await browser.close();
  console.log(`\nDone! Images saved to docs/images/`);
}

main().catch(console.error);
