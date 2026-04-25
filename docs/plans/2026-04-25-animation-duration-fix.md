# Animation Duration Fix Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix `animation.duration` so it actually controls entry animation timing, deprecate the redundant `animation.entry.timing.duration`, and give `interaction.focus.animationDuration` a proper default and configurator control.

**Architecture:** The fix happens in three layers: (1) config merging in `defaults.ts` applies deprecation logic so the resolved `animation.duration` is always the authoritative entry duration, (2) engines read their duration from the correct resolved field, (3) configurator and docs are updated to match. The two duration controls (`animation.duration` for entry, `interaction.focus.animationDuration` for zoom) remain fully independent.

**Tech Stack:** TypeScript, Vite, Playwright (tests), vanilla JS (configurator)

---

## Background

Three bugs exist today:

1. `animation.duration` is dead code — entry animation reads `animation.entry.timing.duration` instead, zoom hardcodes `?? 600`.
2. `animation.entry.timing.duration` was added by mistake — it duplicates `animation.duration` with no added value (`EntryTimingConfig` is a one-field wrapper).
3. `interaction.focus.animationDuration` has no default and no configurator control.

**Deprecation logic (interim, until v1.2):**
- User provides `animation.duration` → use it (entry + zoom fallback)
- User provides `animation.entry.timing.duration` but NOT `animation.duration` → use it + `console.warn`
- Neither provided → default 600ms

`interaction.focus.animationDuration` is fully independent — its default becomes 600ms explicitly.

---

## Task 1: Update Types

**Files:**
- Modify: `src/config/types.ts`

**Step 1: Make `animation.duration` optional in `AnimationConfig`**

In `AnimationConfig` interface (around line 417), change `duration: number` to `duration?: number`.

This allows `mergeConfig` to detect whether the user explicitly provided it.

```ts
export interface AnimationConfig {
  duration?: number;   // Base animation duration (ms). Default: 600. Deprecated: animation.entry.timing.duration
  easing: AnimationEasingConfig;
  queue: AnimationQueueConfig;
  entry?: EntryAnimationConfig;
  idle?: IdleAnimationConfig;
}
```

**Step 2: Make `interaction.focus.animationDuration` required with explicit type**

In `FocusInteractionConfig` (around line 478), change `animationDuration?: number` to `animationDuration: number`.

```ts
export interface FocusInteractionConfig {
  scalePercent: number;
  zIndex: number;
  animationDuration: number;   // Focus/unfocus animation duration (ms). Default: 600.
}
```

**Step 3: Run type-check**

```bash
npm run type-check
```

Expected: errors in `AnimationEngine.ts` and anywhere `animation.duration` is read as non-optional. Fix those in the next task.

---

## Task 2: Update Defaults

**Files:**
- Modify: `src/config/defaults.ts`

**Step 1: Set `animation.duration` default to 600 in `DEFAULT_CONFIG`**

`animation.duration` was already 600 — keep it. But since it's now optional in the type, the default object still sets it (this is fine; `DEFAULT_CONFIG` is not the user config).

**Step 2: Set `interaction.focus.animationDuration` to 600 explicitly**

In `DEFAULT_CONFIG.interaction.focus` (around line 252), change:
```ts
animationDuration: undefined  // Use default animation duration
```
to:
```ts
animationDuration: 600
```

**Step 3: Add deprecation logic in `mergeConfig`**

After the animation merge block (around line 550 — after the `if (userConfig.animation)` block closes), add:

```ts
// Resolve effective animation duration (deprecation bridge for animation.entry.timing.duration)
const userProvidedBaseDuration = userConfig.animation?.duration !== undefined;
const userProvidedEntryTiming = userConfig.animation?.entry?.timing?.duration !== undefined;

if (!userProvidedBaseDuration && userProvidedEntryTiming) {
  console.warn(
    '[image-cloud] animation.entry.timing.duration is deprecated and will be removed in v1.2. ' +
    'Use animation.duration instead.'
  );
  merged.animation.duration = userConfig.animation!.entry!.timing!.duration!;
} else if (!userProvidedBaseDuration) {
  merged.animation.duration = 600;
}

// Sync resolved duration into entry timing so EntryAnimationEngine reads the right value
if (merged.animation.entry) {
  merged.animation.entry = {
    ...merged.animation.entry,
    timing: { duration: merged.animation.duration! }
  };
}
```

**Step 4: Run type-check**

```bash
npm run type-check
```

Expected: passes or shows remaining issues in engine files — fix those next.

---

## Task 3: Fix Engines

**Files:**
- Modify: `src/engines/AnimationEngine.ts`
- Modify: `src/engines/ZoomEngine.ts`

**Step 1: Fix `AnimationEngine` — handle optional `duration`**

`AnimationEngine` reads `this.config.duration` at lines 70 and 234. Since `duration` is now optional in the type, add fallback:

Line 70: `const animDuration = duration ?? this.config.duration ?? 600;`
Line 234: `const animDuration = duration ?? this.config.duration ?? 600;`

**Step 2: Fix `ZoomEngine` — remove hardcoded fallback**

`ZoomEngine` reads `this.config.animationDuration ?? 600` at lines 356 and 438. Since `animationDuration` now has a proper default (never undefined after merge), simplify:

Line 356: `const duration = this.config.animationDuration;`
Line 438: `const duration = this.config.animationDuration;`

**Step 3: Run type-check**

```bash
npm run type-check
```

Expected: clean pass.

---

## Task 4: Verify `ImageCloud.ts` Wiring

**Files:**
- Modify: `src/ImageCloud.ts` (lines 121–133 only, if needed)

**Step 1: Verify entry duration flows correctly**

At line 132, `IdleAnimationEngine` is passed the entry duration:
```ts
(entryConfig as EntryAnimationConfig).timing?.duration ?? 600
```

After Task 2's sync step, `entryConfig.timing.duration` will always equal `animation.duration`. The `?? 600` is now just belt-and-suspenders — leave it as is. No change needed unless type-check flags it.

**Step 2: Run type-check**

```bash
npm run type-check
```

Expected: clean pass.

---

## Task 5: Update Configurator

**Files:**
- Modify: `configurator/index.html`
- Modify: `configurator/field-descriptions.json`

**Step 1: Remove "Entry > Duration" control from HTML**

Remove these lines (around 1837–1844):
```html
<div class="control-row">
    <input type="checkbox" class="control-checkbox" id="enable-entry-duration">
    <label class="control-label" data-label="Duration" data-path="timing.duration" data-desc-key="animation.entry.timing.duration">Duration</label>
    <div class="control-input">
        <input type="number" id="entry-duration" value="600" min="100" max="2000" step="50">
        <span class="value-display">ms</span>
    </div>
</div>
```

**Step 2: Remove "Entry Duration" JS logic**

Remove these lines from `buildConfig()` (around 3998–4001):
```js
const entryTiming = {};
const entryDuration = getEnabledValue('enable-entry-duration', 'entry-duration', parseInt);
if (entryDuration !== undefined) entryTiming.duration = entryDuration;
if (Object.keys(entryTiming).length > 0) entry.timing = entryTiming;
```

**Step 3: Add "Focus > Animation Duration" control to HTML**

After the Z-Index control-row (after line 2151, before the closing `</div>` of the focus control-group), add:
```html
<div class="control-row">
    <input type="checkbox" class="control-checkbox" id="enable-focus-animationDuration">
    <label class="control-label" data-label="Anim. Duration" data-path="animationDuration" data-desc-key="interaction.focus.animationDuration">Anim. Duration</label>
    <div class="control-input">
        <input type="number" id="focus-animationDuration" value="600" min="100" max="2000" step="50">
        <span class="value-display">ms</span>
    </div>
</div>
```

**Step 4: Add "Focus Animation Duration" JS logic**

In `buildConfig()`, after the `zIndex` line (around line 4163), add:
```js
const animationDuration = getEnabledValue('enable-focus-animationDuration', 'focus-animationDuration', parseInt);
if (animationDuration !== undefined) focus.animationDuration = animationDuration;
```

**Step 5: Update `field-descriptions.json`**

In the `interaction.focus` section, add:
```json
"animationDuration": "Duration of focus/unfocus zoom animation in milliseconds (default: 600)"
```

Remove the `animation.entry.timing` section from `field-descriptions.json`:
```json
"timing": {
    "_title": "Animation timing settings",
    "duration": "Duration of entry animation (default: 600)"
},
```

**Step 6: Verify configurator works**

Start dev server and manually test:
```bash
npm run dev
```
- Change `animation.duration` → entry animation speed changes
- Change `interaction.focus.animationDuration` → focus zoom speed changes
- Verify no "Entry > Duration" control appears

---

## Task 6: Update Documentation

**Files:**
- Modify: `docs/parameters.md`
- Modify: `docs/changelog.md`

**Step 1: Update `animation.duration` description**

Find the animation table (around line 1072). The `duration` row currently says:
```
| `duration` | `number` | `600` | Base animation duration (ms). |
```
No change needed to the table itself, but add a note after the table:

> **Note:** `animation.duration` is the base duration for entry animations.

**Step 2: Mark `animation.entry.timing.duration` as deprecated**

Find the entry timing section (around where `timing.duration` is documented). Change:
```
| `duration` | `number` | `600` | ... |
```
to:
```
| `duration` | `number` | `600` | **Deprecated.** Use `animation.duration` instead. Will be removed in v1.2. |
```

**Step 3: Document `interaction.focus.animationDuration`**

Find the interaction.focus table. Currently it shows `scalePercent` and `zIndex` only. Add:
```
| `animationDuration` | `number` | `600` | Focus/unfocus zoom animation duration (ms). Independent from `animation.duration`. |
```

**Step 4: Add changelog entry**

At the top of `docs/changelog.md`, add a new entry for the current version:

```markdown
## [Unreleased]

### Fixed
- `animation.duration` now correctly controls entry animation duration (was previously ignored)
- `interaction.focus.animationDuration` now has an explicit default of 600ms

### Deprecated
- `animation.entry.timing.duration` is deprecated. Use `animation.duration` instead. Will be removed in v1.2.

### Added
- `interaction.focus.animationDuration` is now configurable in the configurator
```

---

## Task 7: Run Full Test Suite

**Step 1: Run all tests**

```bash
npm test
```

**Step 2: If any tests fail, run individually**

```bash
npm run test:headed
```

Expected: all existing tests pass (no behavior change for users who weren't using `animation.entry.timing.duration`).

---

## Task 8: Manual Smoke Test

**Step 1: Start dev server**

```bash
npm run dev
```

**Step 2: Test `animation.duration`**

Open the configurator. Set `animation.duration` to 2000. Reload gallery. Images should fly in slowly (2s).

**Step 3: Test `interaction.focus.animationDuration`**

Set `interaction.focus.animationDuration` to 2000. Click an image. Zoom should be slow (2s). Click again to unfocus — also slow.

**Step 4: Test deprecation warning**

In browser console, run:
```js
new ImageCloud({ images: [...], animation: { entry: { timing: { duration: 1200 } } } })
```
Expected: `console.warn` with deprecation message, entry animation uses 1200ms.

**Step 5: Test both set (base wins)**

```js
new ImageCloud({ images: [...], animation: { duration: 800, entry: { timing: { duration: 1200 } } } })
```
Expected: `animation.duration = 800` wins, no console.warn.
