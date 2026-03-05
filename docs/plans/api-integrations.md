# API Integrations Plan

## Context

image-cloud already exposes `ImageLoader` and `PlacementLayout` as developer-extensible interfaces, and exports engine classes for advanced use. This feature extends the public API with:
1. **Image state change hooks** — config callbacks when images transition between default/hover/focus states
2. **Custom entry animations** — full custom function replacing built-in entry animation
3. **Custom idle animations** — already exists, just needs export/docs cleanup
4. **Loader & layout interface review** — identify gaps

---

## What Already Exists (No Changes Needed)

- `IdleCustomAnimationFn` + `IdleCustomContext` (types.ts) — custom idle already works
- `IdleAnimationConfig.custom` field (types.ts) — already wired in config
- `PlacementLayout` interface (types.ts) — minimal and clean, no gaps identified
- `ImageLoader` interface (types.ts) — handles URL discovery cleanly, no gaps

---

## New API Design

### 1. State Change Hooks (config callbacks, Swiper.js style)

Added `on` top-level key to `ImageCloudOptions`:

```typescript
export interface ImageStateContext {
  element: HTMLElement;
  index: number;
  url: string;
  layout: ImageLayout;
}

export interface ImageCloudCallbacks {
  onImageHover?:   (ctx: ImageStateContext) => void;
  onImageUnhover?: (ctx: ImageStateContext) => void;
  onImageFocus?:   (ctx: ImageStateContext) => void;
  onImageUnfocus?: (ctx: ImageStateContext) => void;
}
```

`ImageCloudOptions` gets: `on?: ImageCloudCallbacks;`

**Wiring in `ImageCloud.ts`:**
- `onImageHover` / `onImageUnhover` — fire in mouseenter/mouseleave handlers
- `onImageFocus` — fire after `zoomEngine.focus()` resolves
- `onImageUnfocus` — fire in `setOnUnfocusCompleteCallback` handler

### 2. Custom Entry Animations

Added `custom?: EntryCustomAnimationFn` to `EntryAnimationConfig`:

```typescript
export interface EntryCustomContext {
  element:         HTMLElement;
  index:           number;
  totalImages:     number;
  layout:          ImageLayout;
  containerBounds: ContainerBounds;
}

export type EntryCustomAnimationFn = (ctx: EntryCustomContext) => Animation | Promise<void> | void;
```

**Wiring in `ImageCloud.ts`:** When `entry.custom` is set, skip built-in path/rotation/scale logic and call `customFn(ctx)` instead, awaiting its result before registering with idle animation engine.

### 3. Idle Animation (export cleanup)

- Exported `IdleCustomAnimationFn` and `IdleCustomContext` from `src/index.ts`

---

## Files Modified

| File | Change |
|------|--------|
| `src/config/types.ts` | Added `ImageStateContext`, `ImageCloudCallbacks`, `EntryCustomContext`, `EntryCustomAnimationFn`; extended `ImageCloudOptions` with `on?`; added `custom?` to `EntryAnimationConfig` |
| `src/ImageCloud.ts` | Store `options.on`; fire callbacks in hover/focus/unfocus handlers; custom entry animation branch |
| `src/index.ts` | Export new types; exported `IdleCustomAnimationFn`, `IdleCustomContext` |
| `docs/parameters.md` | Documented `on` callbacks and `animation.entry.custom` function |
| `examples/api-hooks.html` | New example demonstrating all hooks + custom entry animation |
| `index.html` | Added link to new example |
