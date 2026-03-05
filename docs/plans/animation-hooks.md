# Entry Animation Hooks

## Goal

Add per-frame lifecycle hooks for image entry animations, placed in the existing `on` callbacks alongside `onImageHover`, `onImageFocus`, etc.

Developers should be able to observe each image's entry animation — knowing when it starts, tracking its position every frame, and knowing when it finishes — in order to drive side effects (particle trails, overlay elements, progress indicators, analytics, etc.) without touching the animation itself.

**The image always lands where the layout dictates. Hooks are observational only.**

---

## What Was Removed (to be redesigned)

The previous `animation.entry.custom` approach was a *replacement* model: a developer-supplied function that took over the entire entry animation. This was removed because:

- It conflated "I want to observe the animation" with "I want to replace the animation"
- It bypassed the library's animation loop, making lifecycle hooks impossible
- Per-frame progress was not available for CSS-transitioned images

The `on.onImageHover / onImageFocus / onImageUnfocus` callbacks remain and are unaffected.

---

## New API Design

### Three hooks added to `ImageCloudCallbacks`

```typescript
interface ImageCloudCallbacks {
  // existing
  onImageHover?:     (ctx: ImageStateContext) => void;
  onImageUnhover?:   (ctx: ImageStateContext) => void;
  onImageFocus?:     (ctx: ImageStateContext) => void;
  onImageUnfocus?:   (ctx: ImageStateContext) => void;

  // new
  onEntryStart?:    (ctx: EntryStartContext)    => void;
  onEntryProgress?: (ctx: EntryProgressContext) => void;  // fires every rAF frame
  onEntryComplete?: (ctx: EntryCompleteContext) => void;
}
```

### Context shapes

```typescript
interface EntryStartContext {
  element:       HTMLElement;
  index:         number;
  totalImages:   number;
  layout:        ImageLayout;            // final layout (x, y, rotation, scale)
  from:          { x: number; y: number; rotation: number; scale: number };
  to:            { x: number; y: number; rotation: number; scale: number };
  startTime:     number;                 // performance.now()
  duration:      number;                 // ms
}

interface EntryProgressContext extends EntryStartContext {
  progress:      number;                 // 0.0 → 1.0, eased
  rawProgress:   number;                 // 0.0 → 1.0, linear time
  elapsed:       number;                 // ms since startTime
  current:       { x: number; y: number; rotation: number; scale: number };
}

interface EntryCompleteContext {
  element:       HTMLElement;
  index:         number;
  layout:        ImageLayout;
  startTime:     number;
  endTime:       number;
  duration:      number;
}
```

### Hook availability by animation type

| Entry mode | `onEntryStart` | `onEntryProgress` | `onEntryComplete` |
|---|---|---|---|
| CSS transition (linear path, no JS rotation/scale) | ✓ | — | ✓ |
| JS-animated path (bounce, elastic, wave, wobble, pop) | ✓ | ✓ per frame | ✓ |

`onEntryProgress` is not fired for CSS-transitioned images because the browser compositor
owns the interpolation and there is no per-frame callback in the CSS transition API.

---

## Implementation Strategy

### Per-frame accuracy: WAAPI migration for linear paths

To enable `onEntryProgress` on *all* animation types uniformly (including the currently CSS-transitioned linear path), the implementation should migrate linear-path animations from:

```javascript
// Current: CSS transition (opaque to JS)
img.style.transition = `transform ${duration}ms ${easing}`;
img.style.transform = finalTransform;
```

to the **Web Animations API**:

```javascript
// Proposed: WAAPI (compositor-thread, same performance, JS-visible progress)
const anim = img.animate(
  [{ transform: startTransform }, { transform: finalTransform }],
  { duration, easing, fill: 'forwards' }
);
// Can now read anim.effect.getComputedTiming().progress in a rAF loop
```

WAAPI runs on the compositor thread (same performance as CSS transitions) but returns an
`Animation` object whose `currentTime` and `progress` are readable from a rAF loop.

This migration is contained to one place in `ImageCloud.ts` (the `displayImage` function's
CSS path) and the relevant section of `EntryAnimationEngine.ts` (`getTransitionCSS`).

### If WAAPI migration is deferred

As a lighter alternative, synthetic progress can be computed from elapsed time:

```
rawProgress = (performance.now() - startTime) / duration
```

This gives `rawProgress` (linear, 0→1) with no DOM changes. To get eased `progress`, a
cubic-bezier solver is needed (adds ~1KB). Without it, `current` position in the hook
is linearly interpolated while the visual is eased — acceptable for most side effects.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/config/types.ts` | Add `EntryStartContext`, `EntryProgressContext`, `EntryCompleteContext`; extend `ImageCloudCallbacks` |
| `src/ImageCloud.ts` | Fire `onEntryStart` before animation; pass callbacks into `animatePath`; fire `onEntryComplete` after; optionally migrate CSS path to WAAPI |
| `src/engines/PathAnimator.ts` | Accept optional callbacks; fire `onEntryProgress` inside the existing rAF loop |
| `src/index.ts` | Export new context types |
| `docs/parameters.md` | Document three hooks, context objects, and the CSS vs JS table |
| `examples/api-hooks.html` | Add a demo panel for entry hooks (replace the removed custom-animation panel) |

---

## Key Invariants

1. **Hooks are observational.** They cannot affect where the image ends up.
2. **Final position is always the layout position.** The library snaps the element to its computed transform after animation; `onEntryComplete` fires after the snap.
3. **No hook fires if the gallery is cleared mid-animation.** The load generation check that already cancels stale image loads should also suppress stale hook calls.
