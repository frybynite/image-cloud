# Keyboard & Swipe Per-Container Navigation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make `interaction.navigation.keyboard` and `interaction.navigation.swipe` config flags actually work, scoped per gallery container instance.

**Architecture:** Move the `keydown` listener from `document` to each gallery's `containerEl` (with `tabindex="0"`), guarded by the `keyboard` config flag. Guard `SwipeEngine` instantiation with the `swipe` flag. Both default to `true`. Add configurator controls and a side-by-side demo example.

**Tech Stack:** TypeScript, Playwright (tests), Vite (build), vanilla HTML/JS (configurator + examples).

---

### Task 1: Set real defaults for keyboard and swipe

**Files:**
- Modify: `src/config/defaults.ts:268-272`

**Step 1: Update defaults**

Change the `navigation` block from stub `undefined` values to `true`:

```ts
navigation: Object.freeze({
  keyboard: true,
  swipe: true,
  mouseWheel: undefined  // STUB: Not implemented yet
}),
```

**Step 2: Run type-check**

```bash
npm run type-check
```
Expected: no errors.

**Step 3: Commit**

```bash
git add src/config/defaults.ts
git commit -m "feat: default interaction.navigation.keyboard and .swipe to true"
```

---

### Task 2: Scope keyboard navigation to the container

**Files:**
- Modify: `src/ImageCloud.ts:220-244` (init), `src/ImageCloud.ts:325-342` (setupEventListeners)

**Step 1: Write a failing test**

Create `test/e2e/navigation-disabled.spec.ts`:

```ts
import { test, expect } from '@playwright/test';
import { waitForGalleryInit, waitForAnimation } from '../utils/test-helpers';

test.describe('Navigation Config Flags', () => {

  test('keyboard: false prevents arrow key navigation', async ({ page }) => {
    await page.goto('/test/fixtures/interaction-keyboard-disabled.html');
    await waitForGalleryInit(page);
    await waitForAnimation(page, 500);

    // Click the container to give it DOM focus, then click an image
    await page.locator('#imageCloud').click({ position: { x: 10, y: 10 }, force: true });
    await page.locator('#imageCloud img').first().click({ force: true });
    await waitForAnimation(page, 300);

    // Confirm an image is focused
    const focusedBefore = await page.evaluate(() => {
      const imgs = document.querySelectorAll('#imageCloud img');
      for (const img of imgs) {
        if (parseInt(window.getComputedStyle(img as HTMLElement).zIndex) >= 1000) return true;
      }
      return false;
    });
    expect(focusedBefore).toBe(true);

    // Arrow key should do nothing (keyboard disabled)
    await page.locator('#imageCloud').focus();
    await page.keyboard.press('ArrowRight');
    await waitForAnimation(page, 300);

    // Same image should still be focused (no navigation occurred — imageId unchanged)
    const focusedAfter = await page.evaluate(() => {
      const imgs = document.querySelectorAll('#imageCloud img');
      for (const img of imgs) {
        if (parseInt(window.getComputedStyle(img as HTMLElement).zIndex) >= 1000) return true;
      }
      return false;
    });
    expect(focusedAfter).toBe(true);
  });

  test('keyboard: true (default) allows arrow key navigation', async ({ page }) => {
    await page.goto('/test/fixtures/interactions.html');
    await waitForGalleryInit(page);
    await waitForAnimation(page, 500);

    await page.locator('#imageCloud img').first().click({ force: true });
    await waitForAnimation(page, 300);

    const idBefore = await page.evaluate(() => {
      const imgs = document.querySelectorAll('#imageCloud img');
      for (const img of imgs) {
        if (parseInt(window.getComputedStyle(img as HTMLElement).zIndex) >= 1000) {
          return (img as HTMLElement).dataset.imageId;
        }
      }
      return null;
    });

    await page.locator('#imageCloud').focus();
    await page.keyboard.press('ArrowRight');
    await waitForAnimation(page, 300);

    const idAfter = await page.evaluate(() => {
      const imgs = document.querySelectorAll('#imageCloud img');
      for (const img of imgs) {
        if (parseInt(window.getComputedStyle(img as HTMLElement).zIndex) >= 1000) {
          return (img as HTMLElement).dataset.imageId;
        }
      }
      return null;
    });

    expect(idAfter).not.toBeNull();
    expect(idAfter).not.toBe(idBefore);
  });

});
```

**Step 2: Create the test fixture**

Create `test/fixtures/interaction-keyboard-disabled.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Keyboard Disabled Test</title>
  <link rel="stylesheet" href="/dist/style.css">
  <style>
    html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; }
  </style>
</head>
<body>
  <div id="imageCloud"></div>
  <script type="module">
    import { ImageCloud } from '/dist/image-cloud.js';

    window.gallery = new ImageCloud({
      container: 'imageCloud',
      loaders: [{
        static: {
          sources: [{ urls: [
            '/test/fixtures/images/image1.jpg',
            '/test/fixtures/images/image2.jpg',
            '/test/fixtures/images/image3.jpg'
          ]}],
          validateUrls: false
        }
      }],
      interaction: {
        navigation: { keyboard: false }
      },
      animation: {
        duration: 200,
        queue: { enabled: true, interval: 30 }
      }
    });

    window.gallery.init().catch(console.error);
  </script>
</body>
</html>
```

**Step 3: Run the tests to confirm they fail**

```bash
npm test -- navigation-disabled
```
Expected: both tests fail (keyboard listener still on `document`, flag not checked).

**Step 4: Add `tabindex="0"` to the container in `init()`**

In `src/ImageCloud.ts`, find the line `this.containerEl.classList.add('fbn-ic-gallery');` (around line 222) and add directly after it:

```ts
this.containerEl.setAttribute('tabindex', '0');
```

**Step 5: Move keydown listener to container and guard with config flag**

In `setupEventListeners()` (around line 325), replace:

```ts
// Global keyboard events
document.addEventListener('keydown', (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    this.zoomEngine.unfocusImage();
    this.currentFocusIndex = null;
    this.swipeEngine?.disable();
    this.hideCounter();
  } else if (e.key === 'ArrowRight') {
    this.navigateToNextImage();
  } else if (e.key === 'ArrowLeft') {
    this.navigateToPreviousImage();
  } else if ((e.key === 'Enter' || e.key === ' ') && this.hoveredImage) {
    // Focus the hovered image (works whether or not another image is focused)
    this.handleImageClick(this.hoveredImage.element, this.hoveredImage.layout);
    e.preventDefault(); // Prevent space from scrolling the page
  }
});
```

With:

```ts
// Keyboard navigation — scoped to container, guarded by config flag
if (this.fullConfig.interaction.navigation?.keyboard !== false) {
  this.containerEl!.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      this.zoomEngine.unfocusImage();
      this.currentFocusIndex = null;
      this.swipeEngine?.disable();
      this.hideCounter();
    } else if (e.key === 'ArrowRight') {
      this.navigateToNextImage();
    } else if (e.key === 'ArrowLeft') {
      this.navigateToPreviousImage();
    } else if ((e.key === 'Enter' || e.key === ' ') && this.hoveredImage) {
      this.handleImageClick(this.hoveredImage.element, this.hoveredImage.layout);
      e.preventDefault();
    }
  });
}
```

**Step 6: Build and run the tests**

```bash
npm run build && npm test -- navigation-disabled
```
Expected: both tests pass.

**Step 7: Run the full test suite to check for regressions**

```bash
npm test
```
Expected: all tests pass. If existing keyboard tests fail because they use `page.keyboard.press` without first focusing the container, update them to call `await page.locator('#imageCloud').focus()` before pressing keys.

**Step 8: Commit**

```bash
git add src/ImageCloud.ts test/e2e/navigation-disabled.spec.ts test/fixtures/interaction-keyboard-disabled.html
git commit -m "feat: scope keyboard navigation to container, guard with interaction.navigation.keyboard flag"
```

---

### Task 3: Guard SwipeEngine with swipe config flag

**Files:**
- Modify: `src/ImageCloud.ts:224-238`

**Step 1: Write a failing test** (add to `test/e2e/navigation-disabled.spec.ts`)

```ts
test('swipe: false prevents SwipeEngine initialization', async ({ page }) => {
  await page.goto('/test/fixtures/interaction-swipe-disabled.html');
  await waitForGalleryInit(page);
  await waitForAnimation(page, 500);

  // swipeEngine should be null when swipe: false
  const hasSwipeEngine = await page.evaluate(() => {
    return (window as any).gallery?.swipeEngine !== null;
  });
  expect(hasSwipeEngine).toBe(false);
});
```

**Step 2: Create the test fixture**

Create `test/fixtures/interaction-swipe-disabled.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Swipe Disabled Test</title>
  <link rel="stylesheet" href="/dist/style.css">
  <style>
    html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; }
  </style>
</head>
<body>
  <div id="imageCloud"></div>
  <script type="module">
    import { ImageCloud } from '/dist/image-cloud.js';

    window.gallery = new ImageCloud({
      container: 'imageCloud',
      loaders: [{
        static: {
          sources: [{ urls: [
            '/test/fixtures/images/image1.jpg',
            '/test/fixtures/images/image2.jpg',
            '/test/fixtures/images/image3.jpg'
          ]}],
          validateUrls: false
        }
      }],
      interaction: {
        navigation: { swipe: false }
      },
      animation: {
        duration: 200,
        queue: { enabled: true, interval: 30 }
      }
    });

    window.gallery.init().catch(console.error);
  </script>
</body>
</html>
```

Note: `swipeEngine` is a private field. To make it accessible in the test, either make it `public` temporarily or expose it via a test-only getter. The simplest approach: expose it on `window.gallery` by assigning after init. Alternatively, test indirectly by verifying that a swipe gesture does not navigate.

**Step 3: Run test to confirm it fails**

```bash
npm test -- navigation-disabled
```

**Step 4: Guard SwipeEngine initialization**

In `src/ImageCloud.ts`, find the `new SwipeEngine(...)` block (around line 224) and wrap it:

```ts
// Initialize swipe engine for touch navigation (guarded by config flag)
if (this.fullConfig.interaction.navigation?.swipe !== false) {
  this.swipeEngine = new SwipeEngine(this.containerEl, {
    onNext: () => this.navigateToNextImage(),
    onPrev: () => this.navigateToPreviousImage(),
    onDragOffset: (offset) => this.zoomEngine.setDragOffset(offset),
    onDragEnd: (navigated) => {
      if (!navigated) {
        this.zoomEngine.clearDragOffset(true, SNAP_BACK_DURATION_MS);
      } else {
        this.zoomEngine.clearDragOffset(false);
      }
    }
  });
}
```

**Step 5: Build and run tests**

```bash
npm run build && npm test -- navigation-disabled
```
Expected: all 3 navigation-disabled tests pass.

**Step 6: Run full suite**

```bash
npm test
```
Expected: all pass.

**Step 7: Commit**

```bash
git add src/ImageCloud.ts test/e2e/navigation-disabled.spec.ts test/fixtures/interaction-swipe-disabled.html
git commit -m "feat: guard SwipeEngine init with interaction.navigation.swipe flag"
```

---

### Task 4: Add Navigation controls to the configurator

**Files:**
- Modify: `configurator/index.html:2161-2165` (HTML controls)
- Modify: `configurator/index.html:4135-4145` (JS config builder)
- Modify: `configurator/field-descriptions.json`

**Step 1: Add the Navigation control group in the HTML**

In `configurator/index.html`, find the `<!-- Disable Dragging -->` comment (around line 2161) and insert the following block **before** it:

```html
<!-- Navigation -->
<div class="control-group">
    <h5 class="control-group-title" data-label="Navigation" data-path="interaction.navigation" data-desc-key="interaction.navigation">Navigation</h5>
    <div class="control-row">
        <input type="checkbox" class="control-checkbox" id="interaction-keyboard" checked>
        <label class="control-label" data-label="Keyboard Navigation" data-path="interaction.navigation.keyboard" data-desc-key="interaction.navigation.keyboard" style="flex: 0 0 auto;">Keyboard Navigation</label>
    </div>
    <div class="control-row">
        <input type="checkbox" class="control-checkbox" id="interaction-swipe" checked>
        <label class="control-label" data-label="Swipe Gestures" data-path="interaction.navigation.swipe" data-desc-key="interaction.navigation.swipe" style="flex: 0 0 auto;">Swipe Gestures</label>
    </div>
</div>
```

**Step 2: Add config builder logic**

In the `// Interaction` section of the JS config builder (around line 4142), add after the focus block and before the dragging line:

```js
const navigation = {};
const keyboardEl = document.getElementById('interaction-keyboard');
if (keyboardEl && !keyboardEl.checked) navigation.keyboard = false;
const swipeEl = document.getElementById('interaction-swipe');
if (swipeEl && !swipeEl.checked) navigation.swipe = false;
if (Object.keys(navigation).length > 0) interaction.navigation = navigation;
```

**Step 3: Add field descriptions**

In `configurator/field-descriptions.json`, find the `"interaction"` key and add inside it:

```json
"navigation": {
  "_title": "Control which navigation methods are active",
  "keyboard": "Enable arrow key (← →) and Escape navigation, scoped to the gallery container. Click the gallery first to focus it. Default: true",
  "swipe": "Enable touch swipe gestures to navigate between focused images. Disable to prevent swipe conflicts with scrollable parent containers. Default: true"
}
```

**Step 4: Verify manually**

Run `npm run dev`, open the configurator, expand Interaction, uncheck Keyboard Navigation and Swipe Gestures, and verify the generated config JSON includes `interaction.navigation.keyboard: false` and `interaction.navigation.swipe: false`.

**Step 5: Commit**

```bash
git add configurator/index.html configurator/field-descriptions.json
git commit -m "feat: add keyboard and swipe navigation toggles to configurator"
```

---

### Task 5: Add side-by-side demo example

**Files:**
- Create: `examples/keyboard-navigation-demo.html`
- Modify: `index.html`

**Step 1: Create the example**

Create `examples/keyboard-navigation-demo.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Image Cloud - Per-Container Keyboard Navigation</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@frybynite/image-cloud@latest/dist/style.css">
    <style>
        html, body {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            background-color: #05060F;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            color: #e2e8f0;
            display: flex;
            flex-direction: column;
        }
        .instructions {
            padding: 12px 20px;
            background: #0f172a;
            border-bottom: 1px solid #1e293b;
            font-size: 0.9rem;
            color: #94a3b8;
            flex-shrink: 0;
        }
        .instructions strong { color: #e2e8f0; }
        .galleries {
            display: flex;
            flex: 1;
            overflow: hidden;
        }
        .gallery-pane {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }
        .gallery-pane + .gallery-pane {
            border-left: 2px solid #1e293b;
        }
        .gallery-label {
            padding: 8px 16px;
            font-size: 0.8rem;
            font-weight: 600;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            flex-shrink: 0;
        }
        .label-on { background: #064e3b; color: #6ee7b7; }
        .label-off { background: #3b0764; color: #d8b4fe; }
        .gallery-container {
            flex: 1;
            outline: none;
        }
        .gallery-container:focus-visible {
            box-shadow: inset 0 0 0 2px #60a5fa;
        }
    </style>
    <script type="importmap">
    {
        "imports": {
            "@frybynite/image-cloud": "https://cdn.jsdelivr.net/npm/@frybynite/image-cloud@latest/dist/image-cloud.js"
        }
    }
    </script>
</head>
<body>
    <div class="instructions">
        <strong>Per-container keyboard navigation demo.</strong>
        Click an image to focus it, then use <strong>← →</strong> arrow keys to navigate.
        The left gallery responds to keys; the right gallery does not.
    </div>
    <div class="galleries">
        <div class="gallery-pane">
            <div class="gallery-label label-on">Keyboard Navigation ON (default)</div>
            <div id="galleryLeft" class="gallery-container" role="region" aria-label="Gallery with keyboard navigation"></div>
        </div>
        <div class="gallery-pane">
            <div class="gallery-label label-off">Keyboard Navigation OFF</div>
            <div id="galleryRight" class="gallery-container" role="region" aria-label="Gallery without keyboard navigation"></div>
        </div>
    </div>

    <script type="module">
        import { ImageCloud } from '@frybynite/image-cloud';

        const IMAGES = [
            'https://images.pexels.com/photos/1266810/pexels-photo-1266810.jpeg?auto=compress&cs=tinysrgb&w=800',
            'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=800',
            'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1511593358241-7eea1f3c84e5?w=800&auto=format&fit=crop',
            'https://images.pexels.com/photos/1287460/pexels-photo-1287460.jpeg?auto=compress&cs=tinysrgb&w=800',
            'https://images.pexels.com/photos/1054218/pexels-photo-1054218.jpeg?auto=compress&cs=tinysrgb&w=800',
        ];

        const sharedConfig = {
            images: IMAGES,
            layout: { type: 'grid' },
        };

        const leftCloud = new ImageCloud({
            ...sharedConfig,
            container: 'galleryLeft',
            // keyboard: true is the default — no need to specify
        });

        const rightCloud = new ImageCloud({
            ...sharedConfig,
            container: 'galleryRight',
            interaction: {
                navigation: { keyboard: false }
            }
        });

        document.addEventListener('DOMContentLoaded', () => {
            leftCloud.init().catch(console.error);
            rightCloud.init().catch(console.error);
        });
    </script>
    <script src="view-source-popup.js"></script>
</body>
</html>
```

**Step 2: Add link in index.html**

In `index.html`, find the line linking to `entry-animations.html` (or `layout-algorithms.html`) and add nearby:

```html
<li><a href="examples/keyboard-navigation-demo.html">Per-Container Keyboard Navigation</a></li>
```

**Step 3: Manually verify**

Run `npm run dev`, open the demo, click an image in the left pane, press arrow keys — it navigates. Click an image in the right pane, press arrow keys — nothing happens.

**Step 4: Commit**

```bash
git add examples/keyboard-navigation-demo.html index.html
git commit -m "feat: add per-container keyboard navigation demo example"
```

---

### Task 6: Update PARAMETERS.md and dead-code plan

**Files:**
- Modify: `docs/PARAMETERS.md`
- Modify: `docs/plans/dead-code.md`

**Step 1: Update PARAMETERS.md**

Find the `interaction.navigation` section and update `keyboard` and `swipe` entries to reflect they are now implemented (not stubs), with `true` as the default.

**Step 2: Update dead-code plan**

In `docs/plans/dead-code.md`, remove `interaction.navigation.keyboard` and `interaction.navigation.swipe` from the stub parameters table since they are now implemented.

**Step 3: Commit**

```bash
git add docs/PARAMETERS.md docs/plans/dead-code.md
git commit -m "docs: mark interaction.navigation.keyboard and .swipe as implemented"
```
