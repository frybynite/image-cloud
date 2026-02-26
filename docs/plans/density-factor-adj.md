# Radial Tightness & Density Factor Decoupling Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Decouple ring spacing from image size in radial layout by introducing a `radial.tightness` parameter, so `densityFactor` only affects image size and `tightness` independently controls how close rings are.

**Architecture:** Add a `RadialAlgorithmConfig` type with a `tightness` field. Change `RadialPlacementLayout` to compute ring radii from container geometry × tightness instead of imageSize. Wire up configurator controls and documentation.

**Tech Stack:** TypeScript, Vite, Playwright (e2e), plain HTML configurator

---

## Background & Design Decisions

### Current behavior (broken)
Ring spacing formula: `radiusY = currentRing * (imageSize * 0.8)`

- `densityFactor` → scales `imageSize` in LayoutEngine → accidentally changes ring spacing
- No dedicated control for ring spacing

### Target behavior
Ring spacing formula: `radiusY = currentRing * ringStep * tightness`

where `ringStep = maxRadius / estimatedMaxRings` — derived from container geometry only.

- `densityFactor` → scales image size only (no ring spacing effect)
- `tightness` → scales ring spacing only (no image size effect)
- Default `tightness: 1.0` should produce visually similar output to current default

### Why container-based ring step?
Basing ring spacing on `maxRadius / estimatedMaxRings` (where `estimatedMaxRings = Math.ceil(Math.sqrt(imageCount))`) makes rings fill the available space at tightness=1.0, then tightness compresses/expands from there. It's fully independent of imageSize.

---

## Task 1: Add `RadialAlgorithmConfig` type and default

**Files:**
- Modify: `src/config/types.ts` (near `SpiralAlgorithmConfig` ~line 255)
- Modify: `src/config/defaults.ts` (near layout defaults ~line 200)

**Step 1: Add the interface to types.ts**

In `src/config/types.ts`, after the `SpiralAlgorithmConfig` interface (~line 261), add:

```typescript
export interface RadialAlgorithmConfig {
  tightness: number;  // Ring spacing multiplier (default: 1.0). Higher = more spread, lower = tighter.
}
```

**Step 2: Add `radial?` to `LayoutConfig`**

In the `LayoutConfig` interface (~line 283), add alongside the other algorithm configs:

```typescript
  radial?: RadialAlgorithmConfig;
```

**Step 3: Add default in defaults.ts**

In `src/config/defaults.ts`, the layout default object (~line 200) does not have algorithm-specific sub-objects for radial. No change needed to the frozen layout default — the layout code will use a fallback default. However, export a standalone default constant at the top of the file near the other defaults:

```typescript
export const DEFAULT_RADIAL_CONFIG: RadialAlgorithmConfig = {
  tightness: 1.0,
};
```

**Step 4: Verify TypeScript compiles**

```bash
npm run type-check
```
Expected: no errors.

**Step 5: Commit**

```bash
git add src/config/types.ts src/config/defaults.ts
git commit -m "feat: add RadialAlgorithmConfig type with tightness field"
```

---

## Task 2: Update RadialPlacementLayout ring spacing formula

**Files:**
- Modify: `src/layouts/RadialPlacementLayout.ts`

### Key change
Replace the current ring radius calculation which is coupled to `imageSize`:

```typescript
// OLD (line 88-89) - ring spacing tied to imageSize
const radiusY = currentRing * (imageSize * 0.8);
const radiusX = radiusY * 1.5;
```

With container-geometry-based spacing controlled by tightness:

```typescript
// NEW - ring spacing independent of imageSize
const tightness = radialConfig.tightness;
const ringStep = (maxRadius / estimatedMaxRings) * tightness;
const radiusY = currentRing * ringStep;
const radiusX = radiusY * 1.5;
```

**Step 1: Import the config type and default**

At the top of `RadialPlacementLayout.ts`, add imports:

```typescript
import type { PlacementLayout, ImageLayout, ContainerBounds, LayoutConfig, RadialAlgorithmConfig, ImageConfig } from '../config/types';
import { DEFAULT_RADIAL_CONFIG } from '../config/defaults';
```

**Step 2: Read radial config inside `generate()`**

After the existing config reads (after line ~49), add:

```typescript
const radialConfig: RadialAlgorithmConfig = {
  ...DEFAULT_RADIAL_CONFIG,
  ...this.config.radial,
};
```

**Step 3: Compute `maxRadius` before the while loop**

Currently the method doesn't have a `maxRadius`. Add it after `cx`/`cy` (around line 53):

```typescript
const padding = this.config.spacing.padding ?? 50;
const maxRadius = Math.min(
  cx - padding - imageSize / 2,
  cy - padding - imageSize / 2
);
```

Note: `padding` is currently read inside the loop — move the declaration outside.

**Step 4: Replace ring radius formula**

In the while loop, replace the existing `radiusY`/`radiusX` lines with:

```typescript
const ringStep = (maxRadius / estimatedMaxRings) * radialConfig.tightness;
const radiusY = currentRing * ringStep;
const radiusX = radiusY * 1.5;
```

**Step 5: Remove the now-redundant `padding` declaration inside the loop**

The `padding` variable that was previously declared inside the loop body (line ~121) must be removed since it's now declared outside.

**Step 6: Run tests**

```bash
npm test
```

Expected: all tests pass. If visual regression snapshots fail, update them:

```bash
npm run test -- --update-snapshots
```

**Step 7: Manually verify in browser**

Start dev server from project root:
```bash
npx vite --port 5175
```

Open `http://localhost:5175/configurator/`, switch to Radial, verify:
- Layout looks similar to before (rings still fill the space)
- Changing Density Factor changes image sizes but ring spacing stays consistent
- (tightness not yet wired up — that's Task 3)

**Step 8: Commit**

```bash
git add src/layouts/RadialPlacementLayout.ts
git commit -m "feat: decouple radial ring spacing from imageSize, use container geometry"
```

---

## Task 3: Add tightness control to configurator

**Files:**
- Modify: `configurator/index.html`
- Modify: `configurator/field-descriptions.json`

### Context
Spiral has an `algorithm-specific` div with `data-algorithm="spiral"` that shows/hides based on selected algorithm. Radial currently has no such div — it needs one adding, following the exact same pattern as spiral/wave/cluster.

Look at how the `onAlgorithmChange` function shows/hides these divs (search for `algorithm-specific` and `onAlgorithmChange` in the file).

**Step 1: Add the radial algorithm-specific div in configurator HTML**

Find the spiral algorithm-specific block (around line 1072). Add a new radial block **before** it:

```html
<!-- Radial-specific options -->
<div class="algorithm-specific" data-algorithm="radial">
    <div class="control-row">
        <input type="checkbox" class="control-checkbox" id="enable-radial-tightness">
        <label class="control-label" data-label="Tightness" data-path="radial.tightness" data-desc-key="layout.radial.tightness">Tightness</label>
        <div class="control-input">
            <span class="value-display">1.0</span>
            <input type="range" id="radial-tightness" min="0.3" max="2.0" step="0.1" value="1.0" oninput="updateRangeDisplay(this)">
        </div>
    </div>
</div>
```

**Step 2: Wire up tightness in the config builder**

Find the section that builds the layout config (search for `algorithm === 'spiral'` or similar). Add a radial branch alongside it:

```javascript
} else if (algorithm === 'radial') {
    const radial = {};
    const tightness = getEnabledValue('enable-radial-tightness', 'radial-tightness', parseFloat);
    if (tightness !== undefined) radial.tightness = tightness;
    if (Object.keys(radial).length > 0) layout.radial = radial;
}
```

**Step 3: Add field description**

In `configurator/field-descriptions.json`, find the `layout` section. Add a `radial` object with the tightness description:

```json
"radial": {
  "tightness": "Ring spacing multiplier. 1.0 = rings fill available space. Lower values tighten rings together; higher values spread them further apart. (default: 1.0)"
}
```

**Step 4: Test in browser**

Open configurator, select Radial. Verify:
- "Tightness" control appears
- Adjusting it changes ring spacing without affecting image sizes
- Adjusting Density Factor changes image sizes without affecting ring spacing

**Step 5: Commit**

```bash
git add configurator/index.html configurator/field-descriptions.json
git commit -m "feat: add radial tightness control to configurator"
```

---

## Task 4: Update PARAMETERS.md documentation

**Files:**
- Modify: `docs/PARAMETERS.md`

**Step 1: Find the radial layout section**

Search for "radial" in `docs/PARAMETERS.md`. There will be a section describing the radial layout parameters. Add the new `radial.tightness` parameter alongside the existing ones.

**Step 2: Add tightness documentation**

Add a row/entry like:

```markdown
### `layout.radial.tightness`
- **Type:** `number`
- **Default:** `1.0`
- **Range:** `0.3` – `2.0`

Ring spacing multiplier. At `1.0`, rings are evenly distributed to fill the available container space. Values below `1.0` tighten rings together (more overlap, more central clustering). Values above `1.0` spread rings further apart.

Note: This parameter controls ring spacing only. Image size is controlled separately by `densityFactor`.
```

**Step 3: Update the `densityFactor` description**

Find the existing `densityFactor` documentation and update it to clarify it now only affects image size (not ring spacing):

Add a note: _"In radial layouts, `densityFactor` affects image size only. Ring spacing is controlled by `layout.radial.tightness`."_

**Step 4: Commit**

```bash
git add docs/PARAMETERS.md
git commit -m "docs: document radial.tightness and clarify densityFactor scope"
```

---

## Task 5: Update visual regression snapshots

**Files:**
- `test/e2e/visual-regression.spec.ts-snapshots/` (auto-generated)

The ring spacing change in Task 2 will cause the radial visual regression snapshot to differ.

**Step 1: Update snapshots**

```bash
npm test -- --update-snapshots
```

**Step 2: Visually inspect the new snapshot**

Check `test/e2e/visual-regression.spec.ts-snapshots/visual-radial-chromium-darwin.png` (or similar filename) looks correct — rings should fill the space similarly to before.

**Step 3: Commit updated snapshots**

```bash
git add test/e2e/visual-regression.spec.ts-snapshots/
git commit -m "test: update radial visual regression snapshot for new ring spacing formula"
```

---

## Final Verification

```bash
npm test
npm run type-check
```

All tests pass, no TypeScript errors.
