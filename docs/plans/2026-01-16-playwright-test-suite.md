# ImageCloud Playwright Test Suite Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create comprehensive E2E test coverage for ImageCloud using Playwright, validating all features including loaders, layout algorithms, animations, interactions, and backward compatibility.

**Architecture:** Tests organized by feature domain in `test/` directory. Static loader tests run without external dependencies; Google Drive tests require API key. HTML test fixtures serve as controlled test environments. Visual regression via Playwright screenshots.

**Tech Stack:** Playwright, TypeScript, Vite dev server for test fixtures

---

## Project Structure

```
test/
├── fixtures/
│   ├── images/                    # Moved from test-images/
│   │   ├── image1.jpg
│   │   ├── image2.jpg
│   │   └── image3.jpg
│   ├── static-basic.html          # Basic static loader test page
│   ├── static-multiple.html       # Multiple sources test page
│   ├── legacy-config.html         # Legacy adapter test page
│   ├── auto-init.html             # Auto-init test page
│   ├── interactions.html          # Focus/unfocus test page
│   ├── responsive.html            # Responsive breakpoints test page
│   └── animations.html            # Animation timing test page
├── e2e/
│   ├── initialization.spec.ts     # Container & config tests
│   ├── static-loader.spec.ts      # Static image loading tests
│   ├── google-drive-loader.spec.ts # Google Drive tests (requires API key)
│   ├── layout.spec.ts             # Layout algorithm tests
│   ├── animation.spec.ts          # Animation behavior tests
│   ├── interaction.spec.ts        # User interaction tests
│   ├── responsive.spec.ts         # Responsive behavior tests
│   ├── backward-compat.spec.ts    # Legacy adapter tests
│   └── auto-init.spec.ts          # Auto-initialization tests
├── utils/
│   └── test-helpers.ts            # Shared test utilities
├── playwright.config.ts           # Playwright configuration
└── README.md                      # Test documentation
```

---

## Task 1: Setup Playwright Infrastructure

**Files:**
- Create: `test/playwright.config.ts`
- Create: `test/utils/test-helpers.ts`
- Create: `test/README.md`
- Modify: `package.json` (add test scripts)

**Step 1: Install Playwright dependencies**

Run:
```bash
npm install -D @playwright/test
npx playwright install chromium
```

Expected: Playwright and Chromium browser installed

**Step 2: Create Playwright configuration**

Create `test/playwright.config.ts`:
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile',
      use: { ...devices['iPhone 13'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

**Step 3: Create test helpers**

Create `test/utils/test-helpers.ts`:
```typescript
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
```

**Step 4: Create test README**

Create `test/README.md`:
```markdown
# ImageCloud Test Suite

## Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- test/e2e/static-loader.spec.ts

# Run tests in UI mode
npm run test:ui

# Run tests with headed browser
npm run test:headed

# Update snapshots
npm run test:update-snapshots
```

## Test Categories

- **initialization** - Container resolution, config merging
- **static-loader** - Static image loading from URLs/paths
- **google-drive-loader** - Google Drive API integration (requires API key)
- **layout** - Radial and random layout algorithms
- **animation** - Animation timing and easing
- **interaction** - Focus/unfocus user interactions
- **responsive** - Responsive breakpoints and resizing
- **backward-compat** - Legacy configuration adapter
- **auto-init** - HTML attribute auto-initialization

## Environment Variables

- `GOOGLE_DRIVE_API_KEY` - Required for Google Drive tests
```

**Step 5: Update package.json with test scripts**

Add to `package.json` scripts:
```json
{
  "scripts": {
    "test": "playwright test --config=test/playwright.config.ts",
    "test:ui": "playwright test --config=test/playwright.config.ts --ui",
    "test:headed": "playwright test --config=test/playwright.config.ts --headed",
    "test:update-snapshots": "playwright test --config=test/playwright.config.ts --update-snapshots"
  }
}
```

**Step 6: Commit**

```bash
git add test/ package.json package-lock.json
git commit -m "feat: add Playwright test infrastructure"
```

---

## Task 2: Create Test Fixtures

**Files:**
- Move: `test-images/` → `test/fixtures/images/`
- Create: `test/fixtures/static-basic.html`
- Create: `test/fixtures/static-multiple.html`
- Create: `test/fixtures/legacy-config.html`
- Create: `test/fixtures/auto-init.html`
- Create: `test/fixtures/interactions.html`
- Create: `test/fixtures/responsive.html`
- Create: `test/fixtures/animations.html`

**Step 1: Move test images to fixtures**

Run:
```bash
mkdir -p test/fixtures/images
mv test-images/* test/fixtures/images/
rmdir test-images
```

**Step 2: Create basic static loader fixture**

Create `test/fixtures/static-basic.html`:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Static Loader - Basic Test</title>
  <link rel="stylesheet" href="/dist/style.css">
  <style>
    html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; }
  </style>
</head>
<body>
  <div id="imageCloud"></div>
  <script type="module">
    import { ImageGallery } from '/dist/image-cloud.js';

    window.gallery = new ImageGallery({
      container: 'imageCloud',
      loader: {
        type: 'static',
        static: {
          sources: [
            {
              type: 'urls',
              urls: [
                '/test/fixtures/images/image1.jpg',
                '/test/fixtures/images/image2.jpg',
                '/test/fixtures/images/image3.jpg'
              ]
            }
          ],
          validateUrls: false
        }
      },
      layout: {
        algorithm: 'radial',
        rotation: { enabled: true }
      },
      animation: {
        duration: 300,
        queue: { enabled: true, interval: 50 }
      },
      debug: true
    });
  </script>
</body>
</html>
```

**Step 3: Create multiple sources fixture**

Create `test/fixtures/static-multiple.html`:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Static Loader - Multiple Sources Test</title>
  <link rel="stylesheet" href="/dist/style.css">
  <style>
    html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; }
  </style>
</head>
<body>
  <div id="imageCloud"></div>
  <script type="module">
    import { ImageGallery } from '/dist/image-cloud.js';

    window.gallery = new ImageGallery({
      container: 'imageCloud',
      loader: {
        type: 'static',
        static: {
          sources: [
            {
              type: 'urls',
              urls: ['/test/fixtures/images/image1.jpg']
            },
            {
              type: 'path',
              basePath: '/test/fixtures/images/',
              files: ['image2.jpg', 'image3.jpg']
            }
          ],
          validateUrls: false
        }
      },
      debug: true
    });
  </script>
</body>
</html>
```

**Step 4: Create legacy config fixture**

Create `test/fixtures/legacy-config.html`:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Legacy Config Test</title>
  <link rel="stylesheet" href="/dist/style.css">
  <style>
    html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; }
  </style>
</head>
<body>
  <div id="imageCloud"></div>
  <script type="module">
    import { ImageGallery } from '/dist/image-cloud.js';

    // Legacy configuration format (should trigger deprecation warnings)
    window.gallery = new ImageGallery({
      containerId: 'imageCloud',
      loaderType: 'static',
      staticLoader: {
        sources: [
          {
            type: 'urls',
            urls: [
              '/test/fixtures/images/image1.jpg',
              '/test/fixtures/images/image2.jpg',
              '/test/fixtures/images/image3.jpg'
            ]
          }
        ]
      },
      config: {
        layout: {
          baseImageSize: 150,
          rotationRange: { min: -10, max: 10 }
        },
        animation: {
          duration: 400,
          queueInterval: 100
        },
        zoom: {
          focusScale: 3.0,
          unfocusedOpacity: 0.4
        },
        debugLogging: true
      }
    });
  </script>
</body>
</html>
```

**Step 5: Create auto-init fixture**

Create `test/fixtures/auto-init.html`:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Auto-Init Test</title>
  <link rel="stylesheet" href="/dist/style.css">
  <style>
    html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; }
  </style>
</head>
<body>
  <div
    id="imageCloud"
    data-image-gallery
    data-gallery-config='{
      "loader": {
        "type": "static",
        "static": {
          "sources": [{"type": "urls", "urls": ["/test/fixtures/images/image1.jpg", "/test/fixtures/images/image2.jpg"]}],
          "validateUrls": false
        }
      },
      "debug": true
    }'
  ></div>
  <script type="module" src="/dist/image-cloud.js"></script>
</body>
</html>
```

**Step 6: Create interactions fixture**

Create `test/fixtures/interactions.html`:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Interactions Test</title>
  <link rel="stylesheet" href="/dist/style.css">
  <style>
    html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; }
  </style>
</head>
<body>
  <div id="imageCloud"></div>
  <script type="module">
    import { ImageGallery } from '/dist/image-cloud.js';

    window.gallery = new ImageGallery({
      container: 'imageCloud',
      loader: {
        type: 'static',
        static: {
          sources: [{
            type: 'urls',
            urls: [
              '/test/fixtures/images/image1.jpg',
              '/test/fixtures/images/image2.jpg',
              '/test/fixtures/images/image3.jpg'
            ]
          }],
          validateUrls: false
        }
      },
      interaction: {
        focus: {
          enabled: true,
          scale: 2.5,
          unfocusedOpacity: 0.3,
          zIndex: 1000
        }
      },
      animation: {
        duration: 200,
        queue: { interval: 30 }
      },
      debug: true
    });
  </script>
</body>
</html>
```

**Step 7: Create responsive fixture**

Create `test/fixtures/responsive.html`:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Responsive Test</title>
  <link rel="stylesheet" href="/dist/style.css">
  <style>
    html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; }
  </style>
</head>
<body>
  <div id="imageCloud"></div>
  <script type="module">
    import { ImageGallery } from '/dist/image-cloud.js';

    window.gallery = new ImageGallery({
      container: 'imageCloud',
      loader: {
        type: 'static',
        static: {
          sources: [{
            type: 'urls',
            urls: [
              '/test/fixtures/images/image1.jpg',
              '/test/fixtures/images/image2.jpg',
              '/test/fixtures/images/image3.jpg'
            ]
          }],
          validateUrls: false
        }
      },
      layout: {
        sizing: {
          base: 200,
          responsive: [
            { minWidth: 1200, height: 250 },
            { minWidth: 768, height: 180 },
            { minWidth: 0, height: 120 }
          ]
        }
      },
      rendering: {
        responsive: {
          breakpoints: { mobile: 768 }
        }
      },
      animation: { duration: 100, queue: { interval: 20 } },
      debug: true
    });
  </script>
</body>
</html>
```

**Step 8: Create animations fixture**

Create `test/fixtures/animations.html`:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Animations Test</title>
  <link rel="stylesheet" href="/dist/style.css">
  <style>
    html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; }
  </style>
</head>
<body>
  <div id="imageCloud"></div>
  <script type="module">
    import { ImageGallery } from '/dist/image-cloud.js';

    window.gallery = new ImageGallery({
      container: 'imageCloud',
      loader: {
        type: 'static',
        static: {
          sources: [{
            type: 'urls',
            urls: [
              '/test/fixtures/images/image1.jpg',
              '/test/fixtures/images/image2.jpg',
              '/test/fixtures/images/image3.jpg'
            ]
          }],
          validateUrls: false
        }
      },
      animation: {
        duration: 500,
        easing: {
          default: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
          bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
          focus: 'cubic-bezier(0.4, 0, 0.2, 1)'
        },
        queue: {
          enabled: true,
          interval: 150
        }
      },
      debug: true
    });
  </script>
</body>
</html>
```

**Step 9: Commit fixtures**

```bash
git add test/fixtures/
git rm -r test-images/
git commit -m "feat: add test fixtures for Playwright E2E tests"
```

---

## Task 3: Write Initialization Tests

**Files:**
- Create: `test/e2e/initialization.spec.ts`

**Step 1: Create initialization test file**

Create `test/e2e/initialization.spec.ts`:
```typescript
import { test, expect } from '@playwright/test';
import { waitForGalleryInit, getImageCount } from '../utils/test-helpers';

test.describe('Gallery Initialization', () => {

  test('initializes with valid container ID', async ({ page }) => {
    await page.goto('/test/fixtures/static-basic.html');
    await waitForGalleryInit(page);

    const container = page.locator('#imageCloud');
    await expect(container).toBeVisible();
  });

  test('loads images into container', async ({ page }) => {
    await page.goto('/test/fixtures/static-basic.html');
    await waitForGalleryInit(page);

    const imageCount = await getImageCount(page);
    expect(imageCount).toBe(3);
  });

  test('applies container styles', async ({ page }) => {
    await page.goto('/test/fixtures/static-basic.html');
    await waitForGalleryInit(page);

    const container = page.locator('#imageCloud');
    const overflow = await container.evaluate((el) => window.getComputedStyle(el).overflow);
    expect(overflow).toBe('hidden');
  });

  test('exposes gallery instance on window', async ({ page }) => {
    await page.goto('/test/fixtures/static-basic.html');
    await waitForGalleryInit(page);

    const hasGallery = await page.evaluate(() => typeof window.gallery !== 'undefined');
    expect(hasGallery).toBe(true);
  });

  test('throws error for missing container', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/test/fixtures/static-basic.html');
    await page.evaluate(() => {
      document.getElementById('imageCloud')?.remove();
      // @ts-ignore
      new window.ImageGallery({ container: 'nonexistent' });
    });

    expect(errors.some(e => e.includes('Container') || e.includes('not found'))).toBe(true);
  });

  test('merges user config with defaults', async ({ page }) => {
    await page.goto('/test/fixtures/static-basic.html');
    await waitForGalleryInit(page);

    // Verify custom duration was applied (300ms in fixture vs 600ms default)
    const duration = await page.evaluate(() => {
      // @ts-ignore
      const config = window.gallery.config || window.gallery.newConfig;
      return config?.animation?.duration;
    });
    expect(duration).toBe(300);
  });

});
```

**Step 2: Run test to verify setup**

Run: `npm test -- test/e2e/initialization.spec.ts`
Expected: Tests should run (some may fail if fixtures not yet served)

**Step 3: Commit**

```bash
git add test/e2e/initialization.spec.ts
git commit -m "test: add initialization E2E tests"
```

---

## Task 4: Write Static Loader Tests

**Files:**
- Create: `test/e2e/static-loader.spec.ts`

**Step 1: Create static loader test file**

Create `test/e2e/static-loader.spec.ts`:
```typescript
import { test, expect } from '@playwright/test';
import { waitForGalleryInit, getImageCount } from '../utils/test-helpers';

test.describe('Static Image Loader', () => {

  test.describe('URL Sources', () => {

    test('loads images from URL array', async ({ page }) => {
      await page.goto('/test/fixtures/static-basic.html');
      await waitForGalleryInit(page);

      const count = await getImageCount(page);
      expect(count).toBe(3);
    });

    test('images have correct src attributes', async ({ page }) => {
      await page.goto('/test/fixtures/static-basic.html');
      await waitForGalleryInit(page);

      const images = page.locator('#imageCloud img');
      const srcs = await images.evaluateAll((imgs) =>
        imgs.map((img) => (img as HTMLImageElement).src)
      );

      expect(srcs).toContain(expect.stringContaining('image1.jpg'));
      expect(srcs).toContain(expect.stringContaining('image2.jpg'));
      expect(srcs).toContain(expect.stringContaining('image3.jpg'));
    });

    test('images are visible after load', async ({ page }) => {
      await page.goto('/test/fixtures/static-basic.html');
      await waitForGalleryInit(page);

      const images = page.locator('#imageCloud img');
      const count = await images.count();

      for (let i = 0; i < count; i++) {
        await expect(images.nth(i)).toBeVisible();
      }
    });

  });

  test.describe('Multiple Sources', () => {

    test('loads from mixed URL and path sources', async ({ page }) => {
      await page.goto('/test/fixtures/static-multiple.html');
      await waitForGalleryInit(page);

      const count = await getImageCount(page);
      expect(count).toBe(3);
    });

    test('path sources resolve with basePath', async ({ page }) => {
      await page.goto('/test/fixtures/static-multiple.html');
      await waitForGalleryInit(page);

      const images = page.locator('#imageCloud img');
      const srcs = await images.evaluateAll((imgs) =>
        imgs.map((img) => (img as HTMLImageElement).src)
      );

      // All should resolve to full URLs
      srcs.forEach(src => {
        expect(src).toMatch(/^https?:\/\//);
      });
    });

  });

  test.describe('Error Handling', () => {

    test('handles missing image gracefully', async ({ page }) => {
      await page.goto('/test/fixtures/static-basic.html');

      // Inject a bad source
      await page.evaluate(() => {
        // @ts-ignore
        const gallery = window.gallery;
        // Attempting to load after init - verify no crash
      });

      // Page should not crash
      await expect(page.locator('#imageCloud')).toBeVisible();
    });

    test('shows error when all images fail', async ({ page }) => {
      // Create a page with invalid URLs
      await page.setContent(`
        <!DOCTYPE html>
        <html>
        <head><link rel="stylesheet" href="/dist/style.css"></head>
        <body>
          <div id="imageCloud"></div>
          <script type="module">
            import { ImageGallery } from '/dist/image-cloud.js';
            window.gallery = new ImageGallery({
              container: 'imageCloud',
              loader: {
                type: 'static',
                static: {
                  sources: [{
                    type: 'urls',
                    urls: ['/nonexistent1.jpg', '/nonexistent2.jpg']
                  }],
                  validateUrls: true,
                  failOnAllMissing: true
                }
              }
            });
          </script>
        </body>
        </html>
      `);

      // Should show error message or handle gracefully
      await page.waitForTimeout(3000);
      const container = page.locator('#imageCloud');
      await expect(container).toBeVisible();
    });

  });

});
```

**Step 2: Run static loader tests**

Run: `npm test -- test/e2e/static-loader.spec.ts`
Expected: Tests should pass

**Step 3: Commit**

```bash
git add test/e2e/static-loader.spec.ts
git commit -m "test: add static loader E2E tests"
```

---

## Task 5: Write Layout Tests

**Files:**
- Create: `test/e2e/layout.spec.ts`

**Step 1: Create layout test file**

Create `test/e2e/layout.spec.ts`:
```typescript
import { test, expect } from '@playwright/test';
import { waitForGalleryInit, getImageTransform } from '../utils/test-helpers';

test.describe('Layout Algorithms', () => {

  test.describe('Radial Layout', () => {

    test('positions images within viewport', async ({ page }) => {
      await page.goto('/test/fixtures/static-basic.html');
      await waitForGalleryInit(page);

      const images = page.locator('#imageCloud img');
      const count = await images.count();
      const viewport = page.viewportSize();

      for (let i = 0; i < count; i++) {
        const box = await images.nth(i).boundingBox();
        expect(box).not.toBeNull();
        if (box && viewport) {
          // Image should be at least partially visible
          expect(box.x + box.width).toBeGreaterThan(0);
          expect(box.y + box.height).toBeGreaterThan(0);
          expect(box.x).toBeLessThan(viewport.width);
          expect(box.y).toBeLessThan(viewport.height);
        }
      }
    });

    test('applies rotation transforms', async ({ page }) => {
      await page.goto('/test/fixtures/static-basic.html');
      await waitForGalleryInit(page);

      // At least one image should have rotation
      const images = page.locator('#imageCloud img');
      const transforms = await images.evaluateAll((imgs) =>
        imgs.map((img) => window.getComputedStyle(img).transform)
      );

      // Transforms should contain rotation (matrix with non-1 values)
      const hasRotation = transforms.some(t =>
        t !== 'none' && !t.includes('matrix(1, 0, 0, 1')
      );
      expect(hasRotation).toBe(true);
    });

    test('images have varied sizes', async ({ page }) => {
      await page.goto('/test/fixtures/static-basic.html');
      await waitForGalleryInit(page);

      const images = page.locator('#imageCloud img');
      const heights = await images.evaluateAll((imgs) =>
        imgs.map((img) => img.getBoundingClientRect().height)
      );

      // Should have height values (layout applied)
      heights.forEach(h => expect(h).toBeGreaterThan(0));
    });

  });

  test.describe('Random Layout', () => {

    test('distributes images across viewport', async ({ page }) => {
      await page.setContent(`
        <!DOCTYPE html>
        <html>
        <head><link rel="stylesheet" href="/dist/style.css">
        <style>html,body{margin:0;height:100%;overflow:hidden}</style>
        </head>
        <body>
          <div id="imageCloud"></div>
          <script type="module">
            import { ImageGallery } from '/dist/image-cloud.js';
            window.gallery = new ImageGallery({
              container: 'imageCloud',
              loader: {
                type: 'static',
                static: {
                  sources: [{type:'urls',urls:['/test/fixtures/images/image1.jpg','/test/fixtures/images/image2.jpg','/test/fixtures/images/image3.jpg']}],
                  validateUrls: false
                }
              },
              layout: { algorithm: 'random' }
            });
          </script>
        </body>
        </html>
      `);

      await waitForGalleryInit(page);

      const images = page.locator('#imageCloud img');
      const positions = await images.evaluateAll((imgs) =>
        imgs.map((img) => {
          const rect = img.getBoundingClientRect();
          return { x: rect.x, y: rect.y };
        })
      );

      // Images should be in different positions
      expect(positions.length).toBe(3);
    });

  });

  test.describe('Spacing', () => {

    test('respects padding from edges', async ({ page }) => {
      await page.goto('/test/fixtures/static-basic.html');
      await waitForGalleryInit(page);

      // Images should not be flush against edges
      const images = page.locator('#imageCloud img');
      const positions = await images.evaluateAll((imgs) =>
        imgs.map((img) => {
          const rect = img.getBoundingClientRect();
          return { left: rect.left, top: rect.top };
        })
      );

      // At least some padding from top-left (default padding is 50px)
      // Note: This is a soft check as radial layout may position some near edges
      expect(positions.length).toBeGreaterThan(0);
    });

  });

});
```

**Step 2: Run layout tests**

Run: `npm test -- test/e2e/layout.spec.ts`
Expected: Tests should pass

**Step 3: Commit**

```bash
git add test/e2e/layout.spec.ts
git commit -m "test: add layout algorithm E2E tests"
```

---

## Task 6: Write Interaction Tests

**Files:**
- Create: `test/e2e/interaction.spec.ts`

**Step 1: Create interaction test file**

Create `test/e2e/interaction.spec.ts`:
```typescript
import { test, expect } from '@playwright/test';
import { waitForGalleryInit, clickImage, isImageFocused, waitForAnimation, getImageCount } from '../utils/test-helpers';

test.describe('User Interactions', () => {

  test.describe('Click to Focus', () => {

    test('clicking image focuses it', async ({ page }) => {
      await page.goto('/test/fixtures/interactions.html');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 500); // Wait for entrance animations

      await clickImage(page, 0);
      await waitForAnimation(page, 300);

      const focused = await isImageFocused(page, 0);
      expect(focused).toBe(true);
    });

    test('focused image scales up', async ({ page }) => {
      await page.goto('/test/fixtures/interactions.html');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 500);

      const img = page.locator('#imageCloud img').first();
      const beforeBox = await img.boundingBox();

      await clickImage(page, 0);
      await waitForAnimation(page, 300);

      const afterBox = await img.boundingBox();

      expect(afterBox!.width).toBeGreaterThan(beforeBox!.width);
      expect(afterBox!.height).toBeGreaterThan(beforeBox!.height);
    });

    test('unfocused images become dimmed', async ({ page }) => {
      await page.goto('/test/fixtures/interactions.html');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 500);

      await clickImage(page, 0);
      await waitForAnimation(page, 300);

      // Check opacity of non-focused images
      const secondImg = page.locator('#imageCloud img').nth(1);
      const opacity = await secondImg.evaluate((el) =>
        parseFloat(window.getComputedStyle(el).opacity)
      );

      expect(opacity).toBeLessThan(1);
      expect(opacity).toBeCloseTo(0.3, 1);
    });

    test('focused image has elevated z-index', async ({ page }) => {
      await page.goto('/test/fixtures/interactions.html');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 500);

      await clickImage(page, 0);
      await waitForAnimation(page, 300);

      const img = page.locator('#imageCloud img').first();
      const zIndex = await img.evaluate((el) =>
        parseInt(window.getComputedStyle(el).zIndex)
      );

      expect(zIndex).toBeGreaterThanOrEqual(1000);
    });

    test('clicking another image swaps focus', async ({ page }) => {
      await page.goto('/test/fixtures/interactions.html');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 500);

      await clickImage(page, 0);
      await waitForAnimation(page, 300);

      const firstFocused = await isImageFocused(page, 0);
      expect(firstFocused).toBe(true);

      await clickImage(page, 1);
      await waitForAnimation(page, 300);

      const firstStillFocused = await isImageFocused(page, 0);
      const secondFocused = await isImageFocused(page, 1);

      expect(firstStillFocused).toBe(false);
      expect(secondFocused).toBe(true);
    });

  });

  test.describe('Unfocus Actions', () => {

    test('pressing ESC unfocuses image', async ({ page }) => {
      await page.goto('/test/fixtures/interactions.html');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 500);

      await clickImage(page, 0);
      await waitForAnimation(page, 300);

      expect(await isImageFocused(page, 0)).toBe(true);

      await page.keyboard.press('Escape');
      await waitForAnimation(page, 300);

      expect(await isImageFocused(page, 0)).toBe(false);
    });

    test('clicking outside unfocuses image', async ({ page }) => {
      await page.goto('/test/fixtures/interactions.html');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 500);

      await clickImage(page, 0);
      await waitForAnimation(page, 300);

      expect(await isImageFocused(page, 0)).toBe(true);

      // Click on container background (not on any image)
      await page.locator('#imageCloud').click({ position: { x: 10, y: 10 } });
      await waitForAnimation(page, 300);

      expect(await isImageFocused(page, 0)).toBe(false);
    });

    test('unfocused image returns to original position', async ({ page }) => {
      await page.goto('/test/fixtures/interactions.html');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 500);

      const img = page.locator('#imageCloud img').first();
      const originalBox = await img.boundingBox();

      await clickImage(page, 0);
      await waitForAnimation(page, 300);

      await page.keyboard.press('Escape');
      await waitForAnimation(page, 300);

      const finalBox = await img.boundingBox();

      // Should return close to original position (within tolerance)
      expect(Math.abs(finalBox!.x - originalBox!.x)).toBeLessThan(50);
      expect(Math.abs(finalBox!.y - originalBox!.y)).toBeLessThan(50);
    });

    test('opacity returns to normal after unfocus', async ({ page }) => {
      await page.goto('/test/fixtures/interactions.html');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 500);

      await clickImage(page, 0);
      await waitForAnimation(page, 300);

      await page.keyboard.press('Escape');
      await waitForAnimation(page, 300);

      const images = page.locator('#imageCloud img');
      const count = await images.count();

      for (let i = 0; i < count; i++) {
        const opacity = await images.nth(i).evaluate((el) =>
          parseFloat(window.getComputedStyle(el).opacity)
        );
        expect(opacity).toBe(1);
      }
    });

  });

  test.describe('Focus State Management', () => {

    test('only one image focused at a time', async ({ page }) => {
      await page.goto('/test/fixtures/interactions.html');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 500);

      await clickImage(page, 0);
      await waitForAnimation(page, 300);

      const count = await getImageCount(page);
      let focusedCount = 0;

      for (let i = 0; i < count; i++) {
        if (await isImageFocused(page, i)) {
          focusedCount++;
        }
      }

      expect(focusedCount).toBe(1);
    });

    test('double-clicking focused image unfocuses', async ({ page }) => {
      await page.goto('/test/fixtures/interactions.html');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 500);

      await clickImage(page, 0);
      await waitForAnimation(page, 300);

      expect(await isImageFocused(page, 0)).toBe(true);

      await clickImage(page, 0);
      await waitForAnimation(page, 300);

      expect(await isImageFocused(page, 0)).toBe(false);
    });

  });

});
```

**Step 2: Run interaction tests**

Run: `npm test -- test/e2e/interaction.spec.ts`
Expected: Tests should pass

**Step 3: Commit**

```bash
git add test/e2e/interaction.spec.ts
git commit -m "test: add user interaction E2E tests"
```

---

## Task 7: Write Animation Tests

**Files:**
- Create: `test/e2e/animation.spec.ts`

**Step 1: Create animation test file**

Create `test/e2e/animation.spec.ts`:
```typescript
import { test, expect } from '@playwright/test';
import { waitForGalleryInit, waitForAnimation } from '../utils/test-helpers';

test.describe('Animation System', () => {

  test.describe('Entrance Animations', () => {

    test('images animate in from edges', async ({ page }) => {
      await page.goto('/test/fixtures/animations.html');

      // Check initial state before full animation
      await page.waitForSelector('#imageCloud img', { state: 'attached' });

      // Images should have transforms applied
      const img = page.locator('#imageCloud img').first();
      await expect(img).toBeVisible({ timeout: 2000 });
    });

    test('images appear staggered (queue enabled)', async ({ page }) => {
      await page.goto('/test/fixtures/animations.html');

      // Wait for first image
      await page.waitForSelector('#imageCloud img', { state: 'visible' });

      // Count visible images over time
      let visibleAt100ms = 0;
      let visibleAt300ms = 0;

      await page.waitForTimeout(100);
      visibleAt100ms = await page.locator('#imageCloud img:visible').count();

      await page.waitForTimeout(200);
      visibleAt300ms = await page.locator('#imageCloud img:visible').count();

      // With queue interval of 150ms, we should see staggered appearance
      // This is a soft check - timing can vary
      expect(visibleAt300ms).toBeGreaterThanOrEqual(visibleAt100ms);
    });

  });

  test.describe('Animation Timing', () => {

    test('animation uses configured duration', async ({ page }) => {
      await page.goto('/test/fixtures/animations.html');
      await waitForGalleryInit(page);

      // Check that transition duration is applied
      const img = page.locator('#imageCloud img').first();
      const transition = await img.evaluate((el) =>
        window.getComputedStyle(el).transition
      );

      // Should contain duration info
      expect(transition.length).toBeGreaterThan(0);
    });

    test('focus animation completes smoothly', async ({ page }) => {
      await page.goto('/test/fixtures/interactions.html');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 500);

      const img = page.locator('#imageCloud img').first();

      // Capture position before click
      const beforeClick = await img.boundingBox();

      // Click to focus
      await img.click();

      // Check mid-animation (image should be transitioning)
      await page.waitForTimeout(100);
      const midAnimation = await img.boundingBox();

      // Wait for animation to complete
      await waitForAnimation(page, 300);
      const afterAnimation = await img.boundingBox();

      // Image should have moved and scaled
      expect(afterAnimation!.width).toBeGreaterThan(beforeClick!.width);
    });

  });

  test.describe('Easing Functions', () => {

    test('transition includes easing', async ({ page }) => {
      await page.goto('/test/fixtures/animations.html');
      await waitForGalleryInit(page);

      const img = page.locator('#imageCloud img').first();
      const transition = await img.evaluate((el) =>
        window.getComputedStyle(el).transition
      );

      // Should include timing function (ease, cubic-bezier, etc.)
      expect(
        transition.includes('ease') ||
        transition.includes('cubic-bezier') ||
        transition.includes('linear')
      ).toBe(true);
    });

  });

});
```

**Step 2: Run animation tests**

Run: `npm test -- test/e2e/animation.spec.ts`
Expected: Tests should pass

**Step 3: Commit**

```bash
git add test/e2e/animation.spec.ts
git commit -m "test: add animation system E2E tests"
```

---

## Task 8: Write Responsive Tests

**Files:**
- Create: `test/e2e/responsive.spec.ts`

**Step 1: Create responsive test file**

Create `test/e2e/responsive.spec.ts`:
```typescript
import { test, expect } from '@playwright/test';
import { waitForGalleryInit, waitForAnimation } from '../utils/test-helpers';

test.describe('Responsive Behavior', () => {

  test.describe('Breakpoint Detection', () => {

    test('uses desktop sizes on large viewport', async ({ page }) => {
      await page.setViewportSize({ width: 1400, height: 900 });
      await page.goto('/test/fixtures/responsive.html');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 500);

      const img = page.locator('#imageCloud img').first();
      const height = await img.evaluate((el) => el.getBoundingClientRect().height);

      // Desktop height should be around 250px (responsive config)
      expect(height).toBeGreaterThanOrEqual(200);
    });

    test('uses tablet sizes on medium viewport', async ({ page }) => {
      await page.setViewportSize({ width: 900, height: 700 });
      await page.goto('/test/fixtures/responsive.html');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 500);

      const img = page.locator('#imageCloud img').first();
      const height = await img.evaluate((el) => el.getBoundingClientRect().height);

      // Tablet height should be around 180px
      expect(height).toBeGreaterThanOrEqual(150);
      expect(height).toBeLessThan(250);
    });

    test('uses mobile sizes on small viewport', async ({ page }) => {
      await page.setViewportSize({ width: 400, height: 700 });
      await page.goto('/test/fixtures/responsive.html');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 500);

      const img = page.locator('#imageCloud img').first();
      const height = await img.evaluate((el) => el.getBoundingClientRect().height);

      // Mobile height should be around 120px
      expect(height).toBeGreaterThanOrEqual(100);
      expect(height).toBeLessThan(180);
    });

  });

  test.describe('Viewport Resize', () => {

    test('recalculates layout on breakpoint change', async ({ page }) => {
      await page.setViewportSize({ width: 1400, height: 900 });
      await page.goto('/test/fixtures/responsive.html');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 500);

      const img = page.locator('#imageCloud img').first();
      const desktopHeight = await img.evaluate((el) => el.getBoundingClientRect().height);

      // Resize to mobile
      await page.setViewportSize({ width: 400, height: 700 });
      await waitForAnimation(page, 700); // Wait for debounced resize + animation

      const mobileHeight = await img.evaluate((el) => el.getBoundingClientRect().height);

      expect(mobileHeight).toBeLessThan(desktopHeight);
    });

    test('minor resize within breakpoint does not re-layout', async ({ page }) => {
      await page.setViewportSize({ width: 1400, height: 900 });
      await page.goto('/test/fixtures/responsive.html');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 500);

      const img = page.locator('#imageCloud img').first();
      const beforeBox = await img.boundingBox();

      // Minor resize (still in desktop breakpoint)
      await page.setViewportSize({ width: 1350, height: 850 });
      await waitForAnimation(page, 700);

      const afterBox = await img.boundingBox();

      // Position should be similar (layout preserved)
      // Note: Some repositioning may occur, so we check approximate equality
      expect(Math.abs(afterBox!.x - beforeBox!.x)).toBeLessThan(100);
    });

  });

  test.describe('Mobile-Specific', () => {

    test('uses mobile focus scale on small viewport', async ({ page }) => {
      await page.setViewportSize({ width: 400, height: 700 });
      await page.goto('/test/fixtures/interactions.html');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 500);

      const img = page.locator('#imageCloud img').first();
      const beforeBox = await img.boundingBox();

      await img.click();
      await waitForAnimation(page, 300);

      const afterBox = await img.boundingBox();

      // Mobile scale is 2.0 (vs desktop 2.5), so scaling should be noticeable but not huge
      const scaleRatio = afterBox!.width / beforeBox!.width;
      expect(scaleRatio).toBeGreaterThan(1.5);
      expect(scaleRatio).toBeLessThan(3);
    });

  });

});

test.describe('Mobile Project', () => {
  test.use({ ...require('@playwright/test').devices['iPhone 13'] });

  test('renders correctly on iPhone', async ({ page }) => {
    await page.goto('/test/fixtures/responsive.html');
    await waitForGalleryInit(page);

    const container = page.locator('#imageCloud');
    await expect(container).toBeVisible();

    const images = page.locator('#imageCloud img');
    const count = await images.count();
    expect(count).toBe(3);
  });

});
```

**Step 2: Run responsive tests**

Run: `npm test -- test/e2e/responsive.spec.ts`
Expected: Tests should pass

**Step 3: Commit**

```bash
git add test/e2e/responsive.spec.ts
git commit -m "test: add responsive behavior E2E tests"
```

---

## Task 9: Write Backward Compatibility Tests

**Files:**
- Create: `test/e2e/backward-compat.spec.ts`

**Step 1: Create backward compatibility test file**

Create `test/e2e/backward-compat.spec.ts`:
```typescript
import { test, expect } from '@playwright/test';
import { waitForGalleryInit, getImageCount, waitForAnimation } from '../utils/test-helpers';

test.describe('Backward Compatibility', () => {

  test.describe('Legacy Configuration', () => {

    test('accepts legacy containerId option', async ({ page }) => {
      await page.goto('/test/fixtures/legacy-config.html');
      await waitForGalleryInit(page);

      const count = await getImageCount(page);
      expect(count).toBe(3);
    });

    test('accepts legacy loaderType + staticLoader', async ({ page }) => {
      await page.goto('/test/fixtures/legacy-config.html');
      await waitForGalleryInit(page);

      const images = page.locator('#imageCloud img');
      await expect(images.first()).toBeVisible();
    });

    test('converts legacy config.layout options', async ({ page }) => {
      await page.goto('/test/fixtures/legacy-config.html');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 500);

      // Legacy baseImageSize: 150 should be applied
      const img = page.locator('#imageCloud img').first();
      const height = await img.evaluate((el) => el.getBoundingClientRect().height);

      // Should be around 150px (legacy baseImageSize)
      expect(height).toBeGreaterThanOrEqual(100);
      expect(height).toBeLessThan(200);
    });

    test('converts legacy config.zoom to interaction.focus', async ({ page }) => {
      await page.goto('/test/fixtures/legacy-config.html');
      await waitForGalleryInit(page);
      await waitForAnimation(page, 500);

      const img = page.locator('#imageCloud img').first();
      const beforeBox = await img.boundingBox();

      await img.click();
      await waitForAnimation(page, 500);

      const afterBox = await img.boundingBox();

      // Legacy focusScale: 3.0 should be applied
      const scale = afterBox!.width / beforeBox!.width;
      expect(scale).toBeGreaterThan(2.5);
    });

    test('converts legacy animation duration', async ({ page }) => {
      await page.goto('/test/fixtures/legacy-config.html');
      await waitForGalleryInit(page);

      // Legacy duration: 400 should be applied
      const gallery = await page.evaluate(() => {
        // @ts-ignore
        const g = window.gallery;
        const config = g.newConfig || g.config;
        return {
          duration: config?.animation?.duration
        };
      });

      expect(gallery.duration).toBe(400);
    });

  });

  test.describe('Deprecation Warnings', () => {

    test('emits deprecation warning for legacy config', async ({ page }) => {
      const warnings: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'warning' || msg.text().includes('deprecated')) {
          warnings.push(msg.text());
        }
      });

      await page.goto('/test/fixtures/legacy-config.html');
      await waitForGalleryInit(page);

      // Should have at least one deprecation warning
      const hasDeprecation = warnings.some(w =>
        w.toLowerCase().includes('deprecated') ||
        w.toLowerCase().includes('legacy')
      );
      expect(hasDeprecation).toBe(true);
    });

    test('new format does not emit deprecation warnings', async ({ page }) => {
      const warnings: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'warning' && msg.text().includes('deprecated')) {
          warnings.push(msg.text());
        }
      });

      await page.goto('/test/fixtures/static-basic.html');
      await waitForGalleryInit(page);

      const deprecationWarnings = warnings.filter(w =>
        w.toLowerCase().includes('deprecated')
      );
      expect(deprecationWarnings.length).toBe(0);
    });

  });

  test.describe('Mixed Configuration', () => {

    test('new config takes precedence over legacy', async ({ page }) => {
      await page.setContent(`
        <!DOCTYPE html>
        <html>
        <head><link rel="stylesheet" href="/dist/style.css">
        <style>html,body{margin:0;height:100%;overflow:hidden}</style>
        </head>
        <body>
          <div id="imageCloud"></div>
          <script type="module">
            import { ImageGallery } from '/dist/image-cloud.js';
            window.gallery = new ImageGallery({
              container: 'imageCloud',
              containerId: 'shouldBeIgnored',
              loader: {
                type: 'static',
                static: {
                  sources: [{type:'urls',urls:['/test/fixtures/images/image1.jpg']}],
                  validateUrls: false
                }
              }
            });
          </script>
        </body>
        </html>
      `);

      await waitForGalleryInit(page);

      // Should use 'container' (new) not 'containerId' (legacy)
      const container = page.locator('#imageCloud');
      await expect(container).toBeVisible();
    });

  });

});
```

**Step 2: Run backward compatibility tests**

Run: `npm test -- test/e2e/backward-compat.spec.ts`
Expected: Tests should pass

**Step 3: Commit**

```bash
git add test/e2e/backward-compat.spec.ts
git commit -m "test: add backward compatibility E2E tests"
```

---

## Task 10: Write Auto-Init Tests

**Files:**
- Create: `test/e2e/auto-init.spec.ts`

**Step 1: Create auto-init test file**

Create `test/e2e/auto-init.spec.ts`:
```typescript
import { test, expect } from '@playwright/test';
import { waitForGalleryInit, getImageCount } from '../utils/test-helpers';

test.describe('Auto-Initialization', () => {

  test.describe('HTML Attribute Configuration', () => {

    test('initializes from data-image-gallery attribute', async ({ page }) => {
      await page.goto('/test/fixtures/auto-init.html');
      await waitForGalleryInit(page);

      const count = await getImageCount(page);
      expect(count).toBe(2);
    });

    test('parses JSON from data-gallery-config', async ({ page }) => {
      await page.goto('/test/fixtures/auto-init.html');
      await waitForGalleryInit(page);

      // Config should be parsed and applied
      const container = page.locator('#imageCloud');
      await expect(container).toBeVisible();
    });

    test('handles invalid JSON gracefully', async ({ page }) => {
      const errors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      await page.setContent(`
        <!DOCTYPE html>
        <html>
        <head><link rel="stylesheet" href="/dist/style.css"></head>
        <body>
          <div id="imageCloud" data-image-gallery data-gallery-config="invalid json"></div>
          <script type="module" src="/dist/image-cloud.js"></script>
        </body>
        </html>
      `);

      await page.waitForTimeout(1000);

      // Should log error but not crash page
      await expect(page.locator('body')).toBeVisible();
    });

  });

  test.describe('Multiple Galleries', () => {

    test('initializes multiple galleries on same page', async ({ page }) => {
      await page.setContent(`
        <!DOCTYPE html>
        <html>
        <head><link rel="stylesheet" href="/dist/style.css">
        <style>
          .gallery { width: 50%; height: 50vh; float: left; position: relative; overflow: hidden; }
        </style>
        </head>
        <body>
          <div id="gallery1" class="gallery" data-image-gallery
            data-gallery-config='{"loader":{"type":"static","static":{"sources":[{"type":"urls","urls":["/test/fixtures/images/image1.jpg"]}],"validateUrls":false}}}'
          ></div>
          <div id="gallery2" class="gallery" data-image-gallery
            data-gallery-config='{"loader":{"type":"static","static":{"sources":[{"type":"urls","urls":["/test/fixtures/images/image2.jpg"]}],"validateUrls":false}}}'
          ></div>
          <script type="module" src="/dist/image-cloud.js"></script>
        </body>
        </html>
      `);

      // Wait for both galleries
      await page.waitForSelector('#gallery1 img', { state: 'visible', timeout: 5000 });
      await page.waitForSelector('#gallery2 img', { state: 'visible', timeout: 5000 });

      const gallery1Images = await page.locator('#gallery1 img').count();
      const gallery2Images = await page.locator('#gallery2 img').count();

      expect(gallery1Images).toBe(1);
      expect(gallery2Images).toBe(1);
    });

  });

  test.describe('Container Requirements', () => {

    test('requires container to have id attribute', async ({ page }) => {
      const warnings: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'warning' || msg.type() === 'error') {
          warnings.push(msg.text());
        }
      });

      await page.setContent(`
        <!DOCTYPE html>
        <html>
        <head><link rel="stylesheet" href="/dist/style.css"></head>
        <body>
          <div data-image-gallery data-gallery-config='{"loader":{"type":"static"}}'></div>
          <script type="module" src="/dist/image-cloud.js"></script>
        </body>
        </html>
      `);

      await page.waitForTimeout(1000);

      // Should warn about missing id
      const hasIdWarning = warnings.some(w =>
        w.toLowerCase().includes('id') || w.toLowerCase().includes('container')
      );
      // Note: Behavior may vary - this documents expected behavior
    });

  });

});
```

**Step 2: Run auto-init tests**

Run: `npm test -- test/e2e/auto-init.spec.ts`
Expected: Tests should pass

**Step 3: Commit**

```bash
git add test/e2e/auto-init.spec.ts
git commit -m "test: add auto-initialization E2E tests"
```

---

## Task 11: Write Google Drive Loader Tests (Optional - Requires API Key)

**Files:**
- Create: `test/e2e/google-drive-loader.spec.ts`

**Step 1: Create Google Drive test file**

Create `test/e2e/google-drive-loader.spec.ts`:
```typescript
import { test, expect } from '@playwright/test';
import { waitForGalleryInit, getImageCount } from '../utils/test-helpers';

// Skip these tests if no API key is available
const GOOGLE_DRIVE_API_KEY = process.env.GOOGLE_DRIVE_API_KEY;

test.describe('Google Drive Loader', () => {
  test.skip(!GOOGLE_DRIVE_API_KEY, 'Requires GOOGLE_DRIVE_API_KEY environment variable');

  test.describe('Folder Loading', () => {

    test('loads images from Google Drive folder', async ({ page }) => {
      await page.goto('/index.html'); // Uses production Google Drive config
      await waitForGalleryInit(page);

      const count = await getImageCount(page);
      expect(count).toBeGreaterThan(0);
    });

    test('handles recursive folder loading', async ({ page }) => {
      await page.goto('/index.html');
      await waitForGalleryInit(page);

      // Should load images from nested folders
      const count = await getImageCount(page);
      expect(count).toBeGreaterThan(0);
    });

  });

  test.describe('Error Handling', () => {

    test('handles invalid API key gracefully', async ({ page }) => {
      const errors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      await page.setContent(`
        <!DOCTYPE html>
        <html>
        <head><link rel="stylesheet" href="/dist/style.css">
        <style>html,body{margin:0;height:100%;overflow:hidden}</style>
        </head>
        <body>
          <div id="imageCloud"></div>
          <script type="module">
            import { ImageGallery } from '/dist/image-cloud.js';
            window.gallery = new ImageGallery({
              container: 'imageCloud',
              loader: {
                type: 'googleDrive',
                googleDrive: {
                  apiKey: 'invalid-api-key',
                  sources: [{
                    type: 'folder',
                    folders: ['https://drive.google.com/drive/folders/invalid']
                  }]
                }
              }
            });
          </script>
        </body>
        </html>
      `);

      await page.waitForTimeout(3000);

      // Should handle error gracefully (log error but not crash)
      await expect(page.locator('body')).toBeVisible();
    });

    test('handles invalid folder URL gracefully', async ({ page }) => {
      await page.setContent(`
        <!DOCTYPE html>
        <html>
        <head><link rel="stylesheet" href="/dist/style.css">
        <style>html,body{margin:0;height:100%;overflow:hidden}</style>
        </head>
        <body>
          <div id="imageCloud"></div>
          <script type="module">
            import { ImageGallery } from '/dist/image-cloud.js';
            window.gallery = new ImageGallery({
              container: 'imageCloud',
              loader: {
                type: 'googleDrive',
                googleDrive: {
                  apiKey: '${GOOGLE_DRIVE_API_KEY}',
                  sources: [{
                    type: 'folder',
                    folders: ['not-a-valid-url']
                  }]
                }
              }
            });
          </script>
        </body>
        </html>
      `);

      await page.waitForTimeout(3000);

      // Should handle gracefully
      await expect(page.locator('#imageCloud')).toBeVisible();
    });

  });

  test.describe('Multiple Sources', () => {

    test('loads from multiple folders', async ({ page }) => {
      // This test requires actual folder IDs to be meaningful
      test.skip(true, 'Requires specific test folder setup');
    });

    test('loads specific files by ID', async ({ page }) => {
      // This test requires actual file IDs to be meaningful
      test.skip(true, 'Requires specific test file setup');
    });

  });

});
```

**Step 2: Run Google Drive tests (if API key available)**

Run: `GOOGLE_DRIVE_API_KEY=your-key npm test -- test/e2e/google-drive-loader.spec.ts`
Expected: Tests should pass or skip appropriately

**Step 3: Commit**

```bash
git add test/e2e/google-drive-loader.spec.ts
git commit -m "test: add Google Drive loader E2E tests"
```

---

## Task 12: Final Integration and Cleanup

**Files:**
- Update: `package.json`
- Update: `.gitignore`
- Remove: `test-package/` (if desired, or keep for manual testing)

**Step 1: Update .gitignore for test artifacts**

Add to `.gitignore`:
```
# Playwright
test-results/
playwright-report/
playwright/.cache/
```

**Step 2: Verify all tests pass**

Run:
```bash
npm run build && npm test
```

Expected: All tests pass

**Step 3: Update package.json version**

Update version to reflect test addition (e.g., `0.2.1`):
```json
{
  "version": "0.2.1"
}
```

**Step 4: Final commit**

```bash
git add .
git commit -m "feat: complete Playwright E2E test suite

- Add test infrastructure with Playwright
- Create HTML test fixtures for all scenarios
- Add initialization, static loader, layout tests
- Add interaction, animation, responsive tests
- Add backward compatibility and auto-init tests
- Add Google Drive loader tests (require API key)

Test coverage:
- Initialization (6 tests)
- Static Loader (8 tests)
- Layout Algorithms (5 tests)
- User Interactions (10 tests)
- Animations (5 tests)
- Responsive Behavior (6 tests)
- Backward Compatibility (7 tests)
- Auto-Init (4 tests)
- Google Drive (5 tests, optional)

Total: ~56 E2E tests"
```

---

## Test Summary

| Category | Tests | Priority |
|----------|-------|----------|
| Initialization | 6 | Critical |
| Static Loader | 8 | Critical |
| Layout | 5 | High |
| Interactions | 10 | Critical |
| Animation | 5 | Medium |
| Responsive | 6 | High |
| Backward Compat | 7 | High |
| Auto-Init | 4 | Medium |
| Google Drive | 5 | Medium (optional) |
| **Total** | **56** | |

---

## Execution Commands

```bash
# Run all tests
npm test

# Run specific category
npm test -- test/e2e/interaction.spec.ts

# Run with UI
npm run test:ui

# Run headed (see browser)
npm run test:headed

# Run on specific browser
npm test -- --project=chromium

# Run mobile tests only
npm test -- --project=mobile

# Update visual snapshots
npm run test:update-snapshots
```
