# Architecture

Technical overview of the Image Cloud library internals — engines, loaders, design principles, and stability policy.

---

## Engine System

`ImageCloud` (the main class in `src/ImageCloud.ts`) owns all engine instances. Engines are initialized at construction time and coordinated by `ImageCloud`. Each engine has a focused responsibility.

### AnimationEngine (`src/engines/AnimationEngine.ts`)

Foundation for all animation. Drives smooth CSS transitions and tracks active Web Animations API handles. Other engines depend on it.

- `animateTransform()` — CSS transition-based animation
- `animateTransformCancellable()` — Web Animations API (cancellable mid-flight)
- `cancelAnimation(handle, commitStyle)` — stops an animation, optionally locking current position
- `getCurrentTransform(element)` — reads transform state mid-animation (used by ZoomEngine for cross-animation continuity)

### ZoomEngine (`src/engines/ZoomEngine.ts`)

Manages the full focus/unfocus lifecycle. Handles cross-animation: if a zoom-in is in progress when another image is focused, the current position is snapshotted and the new animation starts from there. Never snaps.

- `focusImage()` / `unfocusImage()` / `swapFocus()` — primary API
- State: `ZoomState` enum (IDLE, ZOOMING_IN, ZOOMED, ZOOMING_OUT)

### LayoutEngine (`src/engines/LayoutEngine.ts`)

Generates `ImageLayout` positions for all images using a pluggable `PlacementLayout` strategy. Stores the original state for each image (position, rotation, size) which ZoomEngine uses to animate back to.

- Delegates to one of 7 layout algorithms (see Layouts section)
- Handles adaptive sizing: computes image dimensions based on container size and image count

### EntryAnimationEngine (`src/engines/EntryAnimationEngine.ts`)

Computes starting positions and params for images entering the gallery. Each image starts off-screen (or from a configured origin) and animates to its layout position. Supports multiple path types (linear, bounce, elastic, wave) and entry rotation/scale modes.

### IdleAnimationEngine (`src/engines/IdleAnimationEngine.ts`)

Runs continuous ambient animations on idle images using the Web Animations API with `composite: 'add'` — so idle transforms (wiggle, pulse, spin) layer on top of the base layout transform without overwriting it. Blink uses opacity. Idle animations are paused when an image is focused.

### SwipeEngine (`src/engines/SwipeEngine.ts`)

Touch gesture handler for focused-image navigation. Listens for touchstart/touchmove/touchend, applies drag damping, detects swipe direction (horizontal angle filtered to ±30°), and fires navigation callbacks. Enabled only when an image is focused; disabled otherwise to avoid conflicting with normal scroll.

### PathAnimator (`src/engines/PathAnimator.ts`)

Utility used by EntryAnimationEngine to animate elements along computed paths with easing.

---

## Loader System

Loaders implement the `ImageLoader` interface (`src/config/types.ts`):

```typescript
interface ImageLoader {
  prepare(filter: IImageFilter): Promise<void>;  // async — fetch/discover images
  imagesLength(): number;                         // sync — after prepare()
  imageURLs(): string[];                          // sync — after prepare()
  isPrepared(): boolean;
}
```

`prepare()` is called once during initialization. After it resolves, `imageURLs()` returns the ordered list used to create `<img>` elements.

### StaticImageLoader (`src/loaders/StaticImageLoader.ts`)

Resolves images from predefined URL lists, base path + filename lists, or JSON endpoints. Optionally validates URLs via HTTP HEAD or lightweight fetch before including them.

### GoogleDriveLoader (`src/loaders/GoogleDriveLoader.ts`)

Fetches image listings from the Google Drive API using folder IDs or shared folder URLs. Supports recursive traversal and file-level sources.

### CompositeLoader (`src/loaders/CompositeLoader.ts`)

Wraps multiple `ImageLoader` instances, calling `prepare()` on each and concatenating their `imageURLs()` results. This is how multiple loader configs are combined.

### ImageFilter (`src/loaders/ImageFilter.ts`)

Applied during `prepare()` to filter the discovered image list (e.g., by extension, count limit).

---

## Layout Algorithms

All layouts implement `PlacementLayout` and are selected by the `layout.algorithm` config key. `LayoutEngine` delegates to the active layout.

| Algorithm | File | Description |
|-----------|------|-------------|
| `random` | `RandomPlacementLayout.ts` | Scattered random positions within container |
| `radial` | `RadialPlacementLayout.ts` | Concentric rings around container center |
| `grid` | `GridPlacementLayout.ts` | Row/column grid with optional jitter and overflow modes |
| `spiral` | `SpiralPlacementLayout.ts` | Archimedean spiral from center outward |
| `cluster` | `ClusterPlacementLayout.ts` | Group images into spatial clusters |
| `wave` | `WavePlacementLayout.ts` | Sine wave rows with configurable amplitude/frequency |
| `honeycomb` | `HoneycombPlacementLayout.ts` | Hexagonal grid packing |

---

## Key Design Principles

### Functional CSS injection

`injectFunctionalStyles()` (`src/styles/functionalStyles.ts`) injects a minimal `<style>` block with only the CSS the library needs to function (positioning, overflow, pointer-events). This is done automatically at gallery init — no external CSS file is required for the library to work. The optional `style.css` stylesheet provides visual defaults (borders, shadows, transitions) that are entirely user-overridable.

### Per-container scoping

Each `ImageCloud` instance targets one container element. All engine instances, DOM elements (loading indicator, nav buttons, image counter), and event listeners are owned by that instance and cleaned up on `destroy()`. Multiple independent galleries on the same page are fully isolated.

### Generation-based animation cancellation

`ImageCloud` tracks a `loadGeneration` counter that increments on every reload/resize. Long-running async operations (loader `prepare()`, queue processing) capture the generation at start and bail out if the generation has changed by the time they resolve. This prevents stale image sets from appearing after rapid reloads.

### Adaptive sizing

`LayoutEngine` computes image dimensions dynamically based on container dimensions and image count rather than fixed sizes. `responsive.breakpoints` sets maximum sizes at viewport widths; `image.sizing` controls the base algorithm. This ensures galleries look reasonable across screen sizes without manual tuning.

### CSS class system

All CSS classes are prefixed `fbn-ic-` (e.g., `fbn-ic-gallery`, `fbn-ic-image`, `fbn-ic-focused`). Config-driven `styling.default.className`, `styling.hover.className`, and `styling.focused.className` let users attach their own classes for custom styling.

---

## Public API vs Internal

**Public (stable):**
- `ImageCloud` class constructor and `destroy()`
- `imageCloud()` factory function
- All configuration types exported from `src/index.ts`
- `ImageCloudOptions.on` callbacks — all hooks in `ImageCloudCallbacks` (state change, loading lifecycle, entry animation, layout)
- `ImageLoader` interface (for custom loader implementations)
- Subpath exports: `@frybynite/image-cloud/react`, `/vue`, `/web-component`, `/auto-init`

**Internal (may change):**
- All engine classes (`ZoomEngine`, `LayoutEngine`, etc.)
- All loader classes (`StaticImageLoader`, `GoogleDriveLoader`, `CompositeLoader`)
- Layout classes (`*PlacementLayout`)
- `AnimationHandle`, `ZoomState`, and other internal types not exported from `src/index.ts`
- `injectFunctionalStyles()`, style utilities

**Breaking change policy:** The public config surface and `ImageCloud`/`imageCloud()` API follow semver. Internal engine/loader classes are not part of the public API — they may change in any release.

---

## v2.0 Planned Changes

The loader config structure is targeted for a clean breaking simplification in v2.0:

- **Current:** `{ type: 'static', static: { urls: [...] } }` — type name repeated as key
- **Planned:** `{ type: 'static', urls: [...] }` — flattened discriminated union

This enables proper TypeScript narrowing without non-null assertions and cleans up defaults. Array notation replaces the `composite` type. No backward-compat shim — clean break.

See `docs/backlog.md` (Future Major Version section) for full details.

---

## File Map

```
src/
  ImageCloud.ts           Main class — coordinates all engines
  index.ts                Public exports
  config/
    types.ts              All TypeScript interfaces and types
    defaults.ts           DEFAULT_CONFIG and mergeConfig()
  engines/
    AnimationEngine.ts    CSS + Web Animations API driver
    ZoomEngine.ts         Focus/unfocus lifecycle
    LayoutEngine.ts       Layout generation and original-state store
    EntryAnimationEngine.ts  Entry path calculation
    IdleAnimationEngine.ts   Ambient idle animations
    SwipeEngine.ts        Touch swipe gesture handler
    PathAnimator.ts       Path-based animation utility
  layouts/                One file per layout algorithm
  loaders/
    StaticImageLoader.ts  URL/path/JSON image sources
    GoogleDriveLoader.ts  Google Drive API source
    CompositeLoader.ts    Multi-loader combinator
    ImageFilter.ts        Post-discovery filtering
  styles/
    functionalStyles.ts   Injected functional CSS
  utils/
    styleUtils.ts         Style property builders
    clipPathGenerator.ts  CSS clip-path generation
    hexagonGeometry.ts    Honeycomb layout geometry
  vue/                    Vue 3 component wrapper
  web-component/          Web Component wrapper
```
