# showImageCounter Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add an image counter ("3 of 12") that appears when an image is focused, positioned at bottom-center of the viewport.

**Architecture:** Auto-create a counter element inside the gallery container (same pattern as loading/error elements). Update its text on focus, navigation, and unfocus. Support custom elements via `counterElement` config.

**Tech Stack:** TypeScript, CSS, Playwright tests

---

### Task 1: Add config types and defaults

**Files:**
- Modify: `src/config/types.ts:469-476` (UIRenderingConfig)
- Modify: `src/config/defaults.ts:273-278` (ui defaults)

**Step 1: Add `counterElement` to UIRenderingConfig**

In `src/config/types.ts`, add to the `UIRenderingConfig` interface:

```typescript
export interface UIRenderingConfig {
  showLoadingSpinner: boolean;
  showImageCounter?: boolean;
  showThumbnails?: boolean;
  theme?: 'light' | 'dark' | 'auto';
  loadingElement?: string | HTMLElement;
  errorElement?: string | HTMLElement;
  counterElement?: string | HTMLElement;  // NEW
}
```

**Step 2: Update default from stub to `false`**

In `src/config/defaults.ts`, change the `showImageCounter` default:

```typescript
ui: Object.freeze({
  showLoadingSpinner: false,
  showImageCounter: false,  // Changed from undefined stub
  showThumbnails: undefined,
  theme: undefined
}),
```

**Step 3: Run type-check**

Run: `npm run type-check`
Expected: PASS

**Step 4: Commit**

```bash
git add src/config/types.ts src/config/defaults.ts
git commit -m "feat(config): add counterElement type and showImageCounter default"
```

---

### Task 2: Add CSS styles

**Files:**
- Modify: `src/styles/functionalStyles.ts:5-45` (FUNCTIONAL_CSS)
- Modify: `src/styles/image-cloud.css:126` (after .fbn-ic-error)

**Step 1: Add functional counter styles**

In `src/styles/functionalStyles.ts`, add before the closing backtick of `FUNCTIONAL_CSS`:

```css
.fbn-ic-counter {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10001;
  pointer-events: none;
}
```

**Step 2: Add theming counter styles**

In `src/styles/image-cloud.css`, add after the `.fbn-ic-error` block (after line 126):

```css
/* Image Counter */
.fbn-ic-counter {
    background: rgba(0, 0, 0, 0.6);
    color: #fff;
    padding: 6px 16px;
    border-radius: 16px;
    font-family: system-ui, sans-serif;
    font-size: 14px;
}
```

**Step 3: Run build**

Run: `npm run build`
Expected: PASS

**Step 4: Commit**

```bash
git add src/styles/functionalStyles.ts src/styles/image-cloud.css
git commit -m "feat(styles): add counter positioning and theming CSS"
```

---

### Task 3: Add counter element management to ImageCloud

**Files:**
- Modify: `src/ImageCloud.ts`

**Step 1: Add instance properties**

After the existing `errorElAutoCreated` property (~line 58), add:

```typescript
private counterEl: HTMLElement | null;
private counterElAutoCreated: boolean;
```

**Step 2: Initialize in constructor**

After `this.errorElAutoCreated = false;` (~line 86), add:

```typescript
this.counterElAutoCreated = false;
```

Note: `counterEl` is typed as `HTMLElement | null` and TypeScript will require initialization. Set it alongside the other null DOM refs or in `setupUI()`.

**Step 3: Add counter setup to `setupUI()`**

After the error element block in `setupUI()` (~line 260), add:

```typescript
// Counter element
if (uiConfig.showImageCounter) {
  if (uiConfig.counterElement) {
    this.counterEl = this.resolveElement(uiConfig.counterElement);
    this.counterElAutoCreated = false;
  } else {
    this.counterEl = this.createDefaultCounterElement();
    this.counterElAutoCreated = true;
  }
}
```

**Step 4: Add `createDefaultCounterElement()` helper**

After `createDefaultErrorElement()` (~line 286), add:

```typescript
private createDefaultCounterElement(): HTMLElement {
  const el = document.createElement('div');
  el.className = 'fbn-ic-counter fbn-ic-hidden';
  this.containerEl!.appendChild(el);
  return el;
}
```

**Step 5: Add `updateCounter()` and `hideCounter()` methods**

After `hideError()` (~line 875), add:

```typescript
private updateCounter(index: number): void {
  if (!this.fullConfig.rendering.ui.showImageCounter || !this.counterEl) return;
  this.counterEl.textContent = `${index + 1} of ${this.imageElements.length}`;
  this.counterEl.classList.remove('fbn-ic-hidden');
}

private hideCounter(): void {
  if (this.counterEl) {
    this.counterEl.classList.add('fbn-ic-hidden');
  }
}
```

**Step 6: Add counter cleanup to `destroy()`**

In `destroy()`, after the error element cleanup block, add:

```typescript
if (this.counterElAutoCreated && this.counterEl) {
  this.counterEl.remove();
  this.counterEl = null;
}
```

**Step 7: Run type-check**

Run: `npm run type-check`
Expected: PASS

**Step 8: Commit**

```bash
git add src/ImageCloud.ts
git commit -m "feat: add counter element management (create, update, hide, destroy)"
```

---

### Task 4: Wire counter into focus/navigation/unfocus

**Files:**
- Modify: `src/ImageCloud.ts`

**Step 1: Update `handleImageClick()`**

In `handleImageClick()` (~line 818-828), add counter calls:

```typescript
if (isFocused) {
  await this.zoomEngine.unfocusImage();
  this.currentFocusIndex = null;
  this.swipeEngine?.disable();
  this.hideCounter();  // NEW
} else {
  const imageId = imageElement.dataset.imageId;
  this.currentFocusIndex = imageId !== undefined ? parseInt(imageId, 10) : null;
  this.swipeEngine?.enable();
  await this.zoomEngine.focusImage(imageElement, bounds, originalLayout);
  if (this.currentFocusIndex !== null) this.updateCounter(this.currentFocusIndex);  // NEW
}
```

**Step 2: Update `navigateToNextImage()` and `navigateToPreviousImage()`**

In `navigateToNextImage()` (~line 325-330), add after `this.navigateToImage(nextIndex)`:

```typescript
this.updateCounter(nextIndex);
```

In `navigateToPreviousImage()` (~line 335-340), add after `this.navigateToImage(prevIndex)`:

```typescript
this.updateCounter(prevIndex);
```

**Step 3: Update Escape and click-outside unfocus handlers**

In `setupEventListeners()` (~line 291-294), the Escape handler:

```typescript
if (e.key === 'Escape') {
  this.zoomEngine.unfocusImage();
  this.currentFocusIndex = null;
  this.swipeEngine?.disable();
  this.hideCounter();  // NEW
}
```

In the click handler (~line 311-315):

```typescript
if (!(e.target as HTMLElement).closest('.fbn-ic-image')) {
  this.zoomEngine.unfocusImage();
  this.currentFocusIndex = null;
  this.swipeEngine?.disable();
  this.hideCounter();  // NEW
}
```

**Step 4: Run type-check and build**

Run: `npm run type-check && npm run build`
Expected: PASS

**Step 5: Commit**

```bash
git add src/ImageCloud.ts
git commit -m "feat: wire counter into focus, navigation, and unfocus flows"
```

---

### Task 5: Write Playwright tests

**Files:**
- Create: `test/fixtures/image-counter.html`
- Create: `test/e2e/image-counter.spec.ts`

**Step 1: Create test fixture**

Create `test/fixtures/image-counter.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Image Counter Test</title>
  <link rel="stylesheet" href="/dist/style.css">
  <style>
    html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background-color: #1a1a2e; }
    #imageCloud { width: 100%; height: 100%; }
  </style>
</head>
<body>
  <div id="imageCloud"></div>
  <script type="module">
    import { ImageCloud } from '/dist/image-cloud.js';
    window.ImageCloud = ImageCloud;
    window.gallery = new ImageCloud({
      container: 'imageCloud',
      loaders: [{
        static: {
          sources: [{
            urls: [
              '/test/fixtures/images/image1.jpg',
              '/test/fixtures/images/image2.jpg',
              '/test/fixtures/images/image3.jpg'
            ]
          }],
          validateUrls: false
        }
      }],
      rendering: {
        ui: { showImageCounter: true }
      },
      animation: { duration: 300, queue: { enabled: true, interval: 50 } }
    });
    window.galleryInitPromise = window.gallery.init().catch(error => {
      console.error('Gallery initialization failed:', error);
    });
  </script>
</body>
</html>
```

**Step 2: Create test file**

Create `test/e2e/image-counter.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Image Counter', () => {

  test.describe('When showImageCounter is enabled', () => {

    test('counter element exists in DOM but is hidden initially', async ({ page }) => {
      await page.goto('/test/fixtures/image-counter.html');
      await page.waitForFunction(() => window.galleryInitPromise !== undefined);
      await page.evaluate(() => window.galleryInitPromise);
      await page.waitForSelector('#imageCloud img', { state: 'visible', timeout: 10000 });
      await page.waitForTimeout(500);

      const counter = page.locator('.fbn-ic-counter');
      await expect(counter).toBeAttached();
      await expect(counter).toHaveClass(/fbn-ic-hidden/);
    });

    test('counter shows on image focus with correct text', async ({ page }) => {
      await page.goto('/test/fixtures/image-counter.html');
      await page.waitForFunction(() => window.galleryInitPromise !== undefined);
      await page.evaluate(() => window.galleryInitPromise);
      await page.waitForSelector('#imageCloud img', { state: 'visible', timeout: 10000 });
      await page.waitForTimeout(500);

      const firstImage = page.locator('#imageCloud img').first();
      await firstImage.click();
      await page.waitForTimeout(300);

      const counter = page.locator('.fbn-ic-counter');
      await expect(counter).not.toHaveClass(/fbn-ic-hidden/);
      await expect(counter).toHaveText('1 of 3');
    });

    test('counter updates on arrow key navigation', async ({ page }) => {
      await page.goto('/test/fixtures/image-counter.html');
      await page.waitForFunction(() => window.galleryInitPromise !== undefined);
      await page.evaluate(() => window.galleryInitPromise);
      await page.waitForSelector('#imageCloud img', { state: 'visible', timeout: 10000 });
      await page.waitForTimeout(500);

      const firstImage = page.locator('#imageCloud img').first();
      await firstImage.click();
      await page.waitForTimeout(300);

      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(300);

      const counter = page.locator('.fbn-ic-counter');
      await expect(counter).toHaveText('2 of 3');
    });

    test('counter hides on Escape', async ({ page }) => {
      await page.goto('/test/fixtures/image-counter.html');
      await page.waitForFunction(() => window.galleryInitPromise !== undefined);
      await page.evaluate(() => window.galleryInitPromise);
      await page.waitForSelector('#imageCloud img', { state: 'visible', timeout: 10000 });
      await page.waitForTimeout(500);

      const firstImage = page.locator('#imageCloud img').first();
      await firstImage.click();
      await page.waitForTimeout(300);

      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);

      const counter = page.locator('.fbn-ic-counter');
      await expect(counter).toHaveClass(/fbn-ic-hidden/);
    });

    test('counter hides on click outside', async ({ page }) => {
      await page.goto('/test/fixtures/image-counter.html');
      await page.waitForFunction(() => window.galleryInitPromise !== undefined);
      await page.evaluate(() => window.galleryInitPromise);
      await page.waitForSelector('#imageCloud img', { state: 'visible', timeout: 10000 });
      await page.waitForTimeout(500);

      const firstImage = page.locator('#imageCloud img').first();
      await firstImage.click();
      await page.waitForTimeout(300);

      // Click on empty area
      await page.mouse.click(10, 10);
      await page.waitForTimeout(300);

      const counter = page.locator('.fbn-ic-counter');
      await expect(counter).toHaveClass(/fbn-ic-hidden/);
    });

  });

  test.describe('When showImageCounter is disabled', () => {

    test('no counter element exists', async ({ page }) => {
      await page.goto('/test/fixtures/static-basic.html');
      await page.waitForSelector('#imageCloud img', { state: 'visible', timeout: 10000 });
      await page.waitForTimeout(500);

      const counter = page.locator('.fbn-ic-counter');
      await expect(counter).toHaveCount(0);
    });

  });

});

declare global {
  interface Window {
    galleryInitPromise: Promise<void>;
    ImageCloud: any;
    gallery: any;
  }
}
```

**Step 3: Run tests**

Run: `npx playwright test --config=test/playwright.config.ts test/e2e/image-counter.spec.ts`
Expected: All tests PASS

**Step 4: Commit**

```bash
git add test/fixtures/image-counter.html test/e2e/image-counter.spec.ts
git commit -m "test: add image counter e2e tests"
```

---

### Task 6: Update docs and PARAMETERS.md

**Files:**
- Modify: `docs/PARAMETERS.md:1346-1351`
- Modify: `docs/BACKLOG.md` (mark showImageCounter as done)

**Step 1: Add to PARAMETERS.md rendering.ui table**

After the `ui.errorElement` row, add:

```
| `ui.showImageCounter` | `boolean` | `false` | Show a "1 of N" counter when an image is focused. |
| `ui.counterElement` | `string \| HTMLElement` | `undefined` | Custom counter element (ID string or HTMLElement reference). If omitted and `showImageCounter` is true, a default counter is auto-created inside the container. |
```

**Step 2: Mark backlog item**

In `docs/BACKLOG.md`, update the `showImageCounter` part of the rendering.ui stubs line to mark it as partially done, or split it out as completed.

**Step 3: Commit**

```bash
git add docs/PARAMETERS.md docs/BACKLOG.md
git commit -m "docs: add showImageCounter and counterElement to PARAMETERS.md"
```

---

### Task 7: Run full test suite and verify

**Step 1: Build**

Run: `npm run build`
Expected: PASS

**Step 2: Run all tests**

Run: `npm test`
Expected: All tests pass (no regressions)

**Step 3: Final commit if any fixes needed**
