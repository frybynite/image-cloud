# Rename rendering.ui → ui Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Promote `rendering.ui` to a top-level `ui` config key, removing the now-empty `rendering` namespace entirely.

**Architecture:** Rename the `UIRenderingConfig` type to `UIConfig`, add `ui` as a top-level key on `ImageCloudConfig` and `ImageCloudOptions`, remove `rendering` from both, update the config merger and legacy adapter (add a deprecation shim for old `rendering.ui` usage), update all internal reads from `this.fullConfig.rendering.ui` to `this.fullConfig.ui`, update test fixtures, add a UI accordion section to the configurator above the Config section, and update docs.

**Tech Stack:** TypeScript, Playwright (tests), Vite (build), vanilla HTML/JS (configurator).

---

### Task 1: Update types and defaults

**Files:**
- Modify: `src/config/types.ts`
- Modify: `src/config/defaults.ts`

**Step 1: Update `src/config/types.ts`**

a) Rename `UIRenderingConfig` → `UIConfig`:
```ts
export interface UIConfig {
  showLoadingSpinner: boolean;
  showImageCounter?: boolean;
  loadingElement?: string | HTMLElement;
  errorElement?: string | HTMLElement;
  counterElement?: string | HTMLElement;
}
```

b) Remove `RenderingConfig` interface entirely.

c) On `ImageCloudConfig`, replace `rendering: RenderingConfig` with `ui: UIConfig`:
```ts
export interface ImageCloudConfig {
  loaders: LoaderEntry[];
  config: ConfigSection;
  image: ImageConfig;
  layout: LayoutConfig;
  animation: AnimationConfig;
  interaction: InteractionConfig;
  ui: UIConfig;
  styling?: ImageStylingConfig;
}
```

d) On `ImageCloudOptions`, replace `rendering?: Partial<RenderingConfig>` with `ui?: Partial<UIConfig>` and add a deprecated shim for old users:
```ts
export interface ImageCloudOptions {
  container?: string | HTMLElement;
  images?: string[];
  loaders?: LoaderEntry[];
  config?: ConfigSection;
  image?: Partial<ImageConfig>;
  layout?: Partial<LayoutConfig>;
  animation?: Partial<AnimationConfig>;
  interaction?: Partial<InteractionConfig>;
  ui?: Partial<UIConfig>;
  /** @deprecated Use `ui` instead of `rendering.ui` */
  rendering?: { ui?: Partial<UIConfig> };
  styling?: Partial<ImageStylingConfig>;
}
```

**Step 2: Update `src/config/defaults.ts`**

a) Change the `DEFAULT_CONFIG` rendering block:
```ts
// UI configuration
ui: Object.freeze({
  showLoadingSpinner: false,
  showImageCounter: false
}),
```
Remove the `rendering` key entirely from `DEFAULT_CONFIG`.

b) In the `mergeConfig` function, replace the `rendering` merge block:
```ts
// Remove:
if (userConfig.rendering) {
  merged.rendering = { ... };
  if (userConfig.rendering.ui) {
    merged.rendering.ui = { ... };
  }
}

// Replace with:
// Backwards compat: support old rendering.ui
if ((userConfig as any).rendering?.ui) {
  console.warn('[ImageCloud] rendering.ui is deprecated. Use ui instead.');
  merged.ui = {
    ...DEFAULT_CONFIG.ui,
    ...(userConfig as any).rendering.ui,
    ...userConfig.ui
  };
} else if (userConfig.ui) {
  merged.ui = {
    ...DEFAULT_CONFIG.ui,
    ...userConfig.ui
  };
}
```

**Step 3: Run type-check**
```bash
npm run type-check
```
Expected: errors for `rendering.ui` references in ImageCloud.ts, index.ts, adapter.ts — these will be fixed in later tasks.

---

### Task 2: Update internal references in ImageCloud.ts and index.ts

**Files:**
- Modify: `src/ImageCloud.ts`
- Modify: `src/index.ts`

**Step 1: Update `src/ImageCloud.ts`**

Find all occurrences of `this.fullConfig.rendering.ui` (3 locations) and replace with `this.fullConfig.ui`:

- Line ~262: `const uiConfig = this.fullConfig.rendering.ui;` → `const uiConfig = this.fullConfig.ui;`
- Line ~940: `if (!this.fullConfig.rendering.ui.showLoadingSpinner` → `if (!this.fullConfig.ui.showLoadingSpinner`
- Line ~961: `if (!this.fullConfig.rendering.ui.showImageCounter` → `if (!this.fullConfig.ui.showImageCounter`

**Step 2: Update `src/index.ts`**

Replace the exported type name:
```ts
// Remove:
UIRenderingConfig,

// Add:
UIConfig,
```

**Step 3: Run type-check**
```bash
npm run type-check
```
Expected: errors only in adapter.ts now.

---

### Task 3: Update the legacy adapter

**Files:**
- Modify: `src/config/adapter.ts`

**Step 1: Update imports** — replace `RenderingConfig` with `UIConfig`:
```ts
import {
  // ...existing imports...
  UIConfig,
} from './types';
```
Remove `RenderingConfig` from imports.

**Step 2: Update `convertRendering`** — rename to `convertUI`, change return type:
```ts
private static convertUI(oldOptions: OldOptions): Partial<{ ui: Partial<UIConfig> }> {
  const legacyConfig = (oldOptions as any).config;
  if (legacyConfig?.ui) {
    this.warn('rendering', 'Top-level config.ui is deprecated. Use top-level ui instead.');
    return {
      ui: {
        showLoadingSpinner: legacyConfig.ui.showLoadingSpinner ?? false
      }
    };
  }
  return {};
}
```

**Step 3: Update the call site** — find where `convertRendering` is called and update:
```ts
// Old:
const rendering = this.convertRendering(oldOptions);
if (rendering && Object.keys(rendering).length > 0) newOptions.rendering = rendering;

// New:
const uiPartial = this.convertUI(oldOptions);
if (uiPartial.ui) newOptions.ui = uiPartial.ui;
```

**Step 4: Run type-check — must be clean**
```bash
npm run type-check
```
Expected: no errors.

**Step 5: Commit**
```bash
git add src/config/types.ts src/config/defaults.ts src/ImageCloud.ts src/index.ts src/config/adapter.ts
git commit -m "feat: promote rendering.ui to top-level ui config key"
```

---

### Task 4: Update test fixtures and specs

**Files:**
- Modify: `test/fixtures/image-counter.html`
- Modify: `test/fixtures/loading-spinner.html`
- Modify: `test/fixtures/loading-spinner-slow.html`
- Modify: `test/e2e/loading-spinner.spec.ts`

**Step 1: Update `test/fixtures/image-counter.html`**

Change:
```js
rendering: {
  ui: {
    showImageCounter: true
  }
},
```
To:
```js
ui: {
  showImageCounter: true
},
```

**Step 2: Update `test/fixtures/loading-spinner.html`**

Change:
```js
rendering: {
  ui: {
    showLoadingSpinner: true
  }
},
```
To:
```js
ui: {
  showLoadingSpinner: true
},
```

**Step 3: Update `test/fixtures/loading-spinner-slow.html`** — same change.

**Step 4: Update `test/e2e/loading-spinner.spec.ts`**

Change:
```ts
configShowSpinner: gallery?.fullConfig?.rendering?.ui?.showLoadingSpinner
```
To:
```ts
configShowSpinner: gallery?.fullConfig?.ui?.showLoadingSpinner
```

**Step 5: Build and run affected tests**
```bash
npm run build && npm test -- --grep "spinner|counter|Image Counter|Loading" 2>&1 | tail -20
```
Expected: all pass.

**Step 6: Run full suite**
```bash
npm test 2>&1 | tail -10
```
Expected: all pass (same pre-existing flaky failures only).

**Step 7: Commit**
```bash
git add test/fixtures/image-counter.html test/fixtures/loading-spinner.html test/fixtures/loading-spinner-slow.html test/e2e/loading-spinner.spec.ts
git commit -m "test: update fixtures and specs for rendering.ui → ui rename"
```

---

### Task 5: Add UI accordion section to the configurator

**Files:**
- Modify: `configurator/index.html`
- Modify: `configurator/field-descriptions.json`

**Step 1: Add the UI accordion section HTML**

In `configurator/index.html`, find the `<!-- Config Section -->` comment (around line 2173) and insert the following block **immediately before** it:

```html
<!-- UI Section -->
<div class="accordion" data-section="ui">
    <div class="accordion-header" onclick="toggleAccordion(this.parentElement)">
        <span class="accordion-title" data-label="UI" data-path="ui" data-desc-key="ui">UI</span>
        <span class="accordion-arrow">▼</span>
    </div>
    <div class="accordion-content">
        <div class="control-row">
            <input type="checkbox" class="control-checkbox" id="ui-show-loading-spinner">
            <label class="control-label" data-label="Show Loading Spinner" data-path="ui.showLoadingSpinner" data-desc-key="ui.showLoadingSpinner" style="flex: 0 0 auto;">Show Loading Spinner</label>
        </div>
        <div class="control-row">
            <input type="checkbox" class="control-checkbox" id="ui-show-image-counter">
            <label class="control-label" data-label="Show Image Counter" data-path="ui.showImageCounter" data-desc-key="ui.showImageCounter" style="flex: 0 0 auto;">Show Image Counter</label>
        </div>
    </div>
</div>
```

**Step 2: Add the config builder JS**

In the configurator JS section, find the `// Interaction` config builder block. After it (and before the `// Styling` block), add:

```js
// UI
const ui = {};
const showSpinnerEl = document.getElementById('ui-show-loading-spinner');
if (showSpinnerEl && showSpinnerEl.checked) ui.showLoadingSpinner = true;
const showCounterEl = document.getElementById('ui-show-image-counter');
if (showCounterEl && showCounterEl.checked) ui.showImageCounter = true;
if (Object.keys(ui).length > 0) config.ui = ui;
```

**Step 3: Add field descriptions**

In `configurator/field-descriptions.json`, add a `"ui"` top-level key:

```json
"ui": {
  "_title": "UI display options",
  "showLoadingSpinner": "Show a spinner while images are loading. Default: false",
  "showImageCounter": "Show a '1 of N' counter when an image is focused. Hidden when no image is focused. Default: false"
}
```

**Step 4: Verify manually** — run `npm run dev`, open configurator, confirm the UI section appears above Config, check both checkboxes, verify the generated config JSON includes `ui.showLoadingSpinner: true` and `ui.showImageCounter: true`.

**Step 5: Commit**
```bash
git add configurator/index.html configurator/field-descriptions.json
git commit -m "feat: add UI section to configurator above Config section"
```

---

### Task 6: Update documentation

**Files:**
- Modify: `docs/PARAMETERS.md`
- Modify: `docs/api/types.md`

**Step 1: Update `docs/PARAMETERS.md`**

Find the section documenting `rendering.ui` parameters (the table rows with `ui.showLoadingSpinner` etc.) and update the section header from `rendering.ui` to `ui`. The parameter names already say `ui.showLoadingSpinner` so the table rows themselves are correct — just the section heading and any prose referencing `rendering.ui` needs updating.

Also update the full JSON reference block — change:
```json
"rendering": {
  "ui": {
    "showLoadingSpinner": false,
    "showImageCounter": false
  }
}
```
To:
```json
"ui": {
  "showLoadingSpinner": false,
  "showImageCounter": false
}
```

**Step 2: Update `docs/api/types.md`**

Change:
```ts
interface RenderingConfig {
  ui: UIRenderingConfig;
}

interface UIRenderingConfig {
  showLoadingSpinner: boolean;  // Default: false
}
```
To:
```ts
interface UIConfig {
  showLoadingSpinner: boolean;   // Default: false
  showImageCounter?: boolean;    // Default: false
  loadingElement?: string | HTMLElement;
  errorElement?: string | HTMLElement;
  counterElement?: string | HTMLElement;
}
```

**Step 3: Commit**
```bash
git add docs/PARAMETERS.md docs/api/types.md
git commit -m "docs: update rendering.ui → ui in PARAMETERS.md and types.md"
```
