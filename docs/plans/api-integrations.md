# API Integrations Plan

## Overview

Extends image-cloud's public API with a comprehensive set of developer hooks covering
the full image lifecycle — from URL discovery through loading, entry animation, and
interactive state changes.

All hooks live in `ImageCloudOptions.on` (Swiper.js style). Hooks are observational:
they receive context and can drive side effects, but they do not affect library behaviour
unless explicitly designed to do so (e.g. `onBeforeImageLoad` which can override URLs
and fetch options).

---

## What Already Exists (No Changes Needed)

- `IdleCustomAnimationFn` + `IdleCustomContext` — custom idle animation, already works
- `PlacementLayout` interface — minimal and clean, no gaps identified
- `ImageLoader` interface — handles URL discovery cleanly, no gaps

---

## Completed Work

### State Change Hooks ✅ — delivered `4d3d79a`

Four callbacks covering interactive image state, added to `ImageCloudOptions.on`:

```typescript
interface ImageCloudCallbacks {
  onImageHover?:   (ctx: ImageStateContext) => void;
  onImageUnhover?: (ctx: ImageStateContext) => void;
  onImageFocus?:   (ctx: ImageStateContext) => void;
  onImageUnfocus?: (ctx: ImageStateContext) => void;
}

interface ImageStateContext {
  element: HTMLElement;   // the image element
  index:   number;        // zero-based gallery index
  url:     string;        // original URL from loader
  layout:  ImageLayout;   // x, y, rotation, scale, baseSize
}
```

`ImageCloudOptions` extended with `on?: ImageCloudCallbacks`.

**Wiring in `ImageCloud.ts`:**
- `onImageHover` / `onImageUnhover` — fire in `mouseenter` / `mouseleave` handlers
- `onImageFocus` — fires after `zoomEngine.focusImage()` resolves (animation complete)
- `onImageUnfocus` — fires inside `setOnUnfocusCompleteCallback`, after unfocus animation completes

**Files changed:**
- `src/config/types.ts` — `ImageStateContext`, `ImageCloudCallbacks`, `on?` on `ImageCloudOptions`
- `src/ImageCloud.ts` — `this.callbacks` storage; hook calls in hover/focus/unfocus handlers
- `src/index.ts` — exports for new types + `IdleCustomAnimationFn`, `IdleCustomContext` (previously missing)
- `docs/parameters.md` — "Event Callbacks (`on`)" section
- `examples/api-hooks.html` — live demo with event log
- `examples/hooks-example.html` — honeycomb demo with filename label + focus card
- `test/e2e/api-hooks.spec.ts` + `test/fixtures/api-hooks.html` — Playwright tests

---

## Planned Work

---

### 1. Loading Hooks ✅ — delivered

#### Lifecycle callbacks

Four hooks covering image loading progress, added to `ImageCloudCallbacks`:

```typescript
onImageLoaded?:  (ctx: ImageLoadedContext)  => void;  // per image, on success
onImageError?:   (ctx: ImageErrorContext)   => void;  // per image, on failure
onLoadProgress?: (ctx: LoadProgressContext) => void;  // after each image settles
onGalleryReady?: (ctx: GalleryReadyContext) => void;  // all images displayed
```

```typescript
interface ImageLoadedContext {
  element:     HTMLImageElement;
  url:         string;
  index:       number;
  totalImages: number;
  loadTime:    number;    // ms from src set to onload
}

interface ImageErrorContext {
  url:         string;
  index:       number;
  totalImages: number;
}

interface LoadProgressContext {
  loaded:  number;    // images successfully loaded so far
  failed:  number;    // images that errored so far
  total:   number;    // total expected
  percent: number;    // (loaded + failed) / total * 100
}

interface GalleryReadyContext {
  totalImages:  number;
  failedImages: number;
  loadDuration: number;   // ms from first src set to last image displayed
}
```

**Wiring in `ImageCloud.ts`:**

| Hook | Where |
|---|---|
| `onImageLoaded` | Inside `img.onload`, after dimensions are cached, before queue push |
| `onImageError` | Inside `img.onerror` |
| `onLoadProgress` | After each `onload` or `onerror` (once `processedCount` increments) |
| `onGalleryReady` | After the queue finishes processing |

#### Pre-load interceptor (`onBeforeImageLoad`)

Intercepts each image URL before the `<img>` src is set. Can transform the URL or
provide full `fetch()` control for headers and credentials.

```typescript
onBeforeImageLoad?: (ctx: BeforeLoadContext) =>
  BeforeLoadResult | void | Promise<BeforeLoadResult | void>;
```

```typescript
interface BeforeLoadContext {
  url:         string;    // original URL from loader
  index:       number;
  totalImages: number;
}

interface BeforeLoadResult {
  url?:   string;       // override the URL
  fetch?: RequestInit;  // full fetch() options — headers, credentials, cache, etc.
}
```

`RequestInit` is the browser-native type accepted by `fetch()`. No import needed in
browser-targeted TypeScript — it ships in `lib.dom.d.ts`. `RequestInit.headers` accepts
`Record<string, string>`, `Headers`, or `string[][]`, all supporting multiple values
per header name.

**Two modes — determined by return value:**

**Mode A — URL-only (zero overhead):**
Return `{ url }` with no `fetch` key. The library sets `img.src = result.url`.
Standard browser-cached `<img>` load. No performance cost.

```javascript
// CDN size param
onBeforeImageLoad: ({ url }) => ({ url: url + '?w=400&q=80' })

// Proxy
onBeforeImageLoad: ({ url }) => ({ url: `/proxy?src=${encodeURIComponent(url)}` })
```

**Mode B — Fetch mode:**
Return a `fetch` key. The library calls `fetch(result.url ?? url, result.fetch)`,
converts the response to a blob URL, then sets `img.src = blobUrl`. After load,
the blob URL is revoked to free memory.

```javascript
// Bearer token auth
onBeforeImageLoad: () => ({
  fetch: { headers: { 'Authorization': `Bearer ${getToken()}` } }
})

// Auth + force cache bypass
onBeforeImageLoad: () => ({
  fetch: {
    headers: { 'Authorization': `Bearer ${getToken()}` },
    cache: 'no-store'
  }
})

// Private S3 — signed headers + cookies
onBeforeImageLoad: () => ({
  fetch: {
    headers: {
      'Authorization': `AWS4-HMAC-SHA256 ${signature}`,
      'x-amz-security-token': sessionToken
    },
    credentials: 'include',
    cache: 'no-store'
  }
})

// URL transform AND auth headers
onBeforeImageLoad: ({ url }) => ({
  url: url.replace('storage.example.com', 'cdn.example.com'),
  fetch: { headers: { 'Authorization': `Bearer ${getToken()}` } }
})

// Async — refresh expired JWT before each load
onBeforeImageLoad: async ({ url }) => {
  const token = await authClient.getValidToken();
  return { fetch: { headers: { 'Authorization': `Bearer ${token}` } } };
}
```

**Tradeoffs of fetch mode:**
- ✓ Full `RequestInit` control — headers, credentials, cache, CORS mode, etc.
- ✓ Async-safe (e.g. token refresh before each image)
- ✗ Bypasses browser image cache
- ✗ Blob held in memory until object URL is revoked
- ✗ CORS must permit the request

**Note:** Custom loaders (implementing `ImageLoader`) are unaffected. They return plain
URLs. The `onBeforeImageLoad` hook fires in `ImageCloud.ts` after URLs are retrieved from
the loader — the loader never sees it.

---

### 2. Entry Animation Hooks ✅ — delivered

Per-frame lifecycle hooks for entry animations. Observational only — the image always
lands at its layout position regardless of what the hook does.

```typescript
onEntryStart?:    (ctx: EntryStartContext)    => void;
onEntryProgress?: (ctx: EntryProgressContext) => void;  // fires every rAF frame
onEntryComplete?: (ctx: EntryCompleteContext) => void;
```

```typescript
interface EntryStartContext {
  element:     HTMLElement;
  index:       number;
  totalImages: number;
  layout:      ImageLayout;   // final layout (x, y, rotation, scale)
  from:        { x: number; y: number; rotation: number; scale: number };
  to:          { x: number; y: number; rotation: number; scale: number };
  startTime:   number;        // performance.now()
  duration:    number;        // ms
}

interface EntryProgressContext extends EntryStartContext {
  progress:    number;        // 0.0 → 1.0, eased
  rawProgress: number;        // 0.0 → 1.0, linear time
  elapsed:     number;        // ms since startTime
  current:     { x: number; y: number; rotation: number; scale: number };
}

interface EntryCompleteContext {
  element:   HTMLElement;
  index:     number;
  layout:    ImageLayout;
  startTime: number;
  endTime:   number;
  duration:  number;
}
```

**Hook availability by animation type:**

| Entry mode | `onEntryStart` | `onEntryProgress` | `onEntryComplete` |
|---|---|---|---|
| CSS transition (linear path) | ✓ | — | ✓ |
| JS-animated path (bounce, elastic, wave, wobble, pop) | ✓ | ✓ per frame | ✓ |

`onEntryProgress` is not fired for CSS-transitioned images — the browser compositor
owns the interpolation and there is no per-frame callback in the CSS transition API.

**Implementation strategy — WAAPI migration for uniform `onEntryProgress`:**

To enable `onEntryProgress` on all animation types, migrate linear-path animations
from CSS transitions to the Web Animations API (WAAPI):

```javascript
// Current: CSS transition (opaque to JS)
img.style.transition = `transform ${duration}ms ${easing}`;
img.style.transform = finalTransform;

// Proposed: WAAPI (same compositor-thread performance, JS-visible progress)
const anim = img.animate(
  [{ transform: startTransform }, { transform: finalTransform }],
  { duration, easing, fill: 'forwards' }
);
// Can now read anim.effect.getComputedTiming().progress in a rAF loop
```

This migration is contained to `ImageCloud.ts` (`displayImage`) and
`EntryAnimationEngine.ts` (`getTransitionCSS`). No performance regression — WAAPI runs
on the compositor thread identically to CSS transitions.

If WAAPI migration is deferred, synthetic `rawProgress` can be derived from elapsed
time with no DOM changes. Eased `progress` would require a cubic-bezier solver (~1KB).

**Key invariants:**
1. Hooks are observational — they cannot change where the image lands.
2. `onEntryComplete` fires after the library snaps the element to its final transform.
3. If the gallery is cleared mid-animation, stale hook calls are suppressed.

---

### 3. Layout Hooks ✅ — delivered (observational only)

> **Status: needs design discussion before implementation.**

The idea is to give developers hooks into the layout process — both to observe where
images are being placed and potentially to influence placement.

#### Open questions

**What should be hookable?**

The layout engine currently runs synchronously: `layoutEngine.generateLayout()` returns
an array of `ImageLayout` objects all at once. There are a few natural interception points:

1. **Before layout runs** — know the image count and container bounds before positions
   are calculated. Could allow the developer to override layout config dynamically
   (e.g. change algorithm based on image count or viewport size).

2. **Per-image placement** — called for each image as its position is calculated.
   Could allow overriding or nudging individual image positions.

3. **After layout completes** — receive the full set of computed positions before
   images are rendered. Could allow bulk modification (e.g. sort by position, shuffle,
   pin specific images to fixed positions).

**Should layout hooks be observational or transformative?**

Unlike animation hooks (observational only), layout hooks may need to be
*transformative* — the value of intercepting layout is often to change where images
land, not just to know where they're going. This raises questions about:

- Return type: `ImageLayout | void` (modify or pass through)?
- Validation: what happens if a returned position is outside the container?
- Consistency: does overriding one image's position affect others (e.g. collision)?

**Where does a custom layout algorithm fit in?**

The `PlacementLayout` interface already allows fully custom algorithms. Layout hooks
may be redundant for developers who just want a different algorithm — they can already
implement `PlacementLayout`. The hooks would serve a different need: tweaking or
augmenting the *output* of a built-in algorithm without replacing it entirely.

#### Possible API sketch (not finalised)

```typescript
// Observational — know what was computed
onLayoutComplete?: (ctx: LayoutCompleteContext) => void;

// Transformative — modify individual placements
onImagePlaced?: (ctx: ImagePlacedContext) => Partial<ImageLayout> | void;
```

```typescript
interface LayoutCompleteContext {
  layouts:        ImageLayout[];      // full computed layout, read-only
  containerBounds: ContainerBounds;
  algorithm:      LayoutAlgorithm;
  imageCount:     number;
}

interface ImagePlacedContext {
  layout:          ImageLayout;       // computed placement for this image
  index:           number;
  totalImages:     number;
  containerBounds: ContainerBounds;
  algorithm:       LayoutAlgorithm;
}
```

#### Questions to answer in discussion

- Do we want observational hooks, transformative hooks, or both?
- Should `onImagePlaced` be able to return a full `ImageLayout` override, or only
  specific fields (position, rotation, scale)?
- How do layout hooks interact with responsive resize — do they re-fire on every
  container resize?
- Is there a use case for an `onBeforeLayout` hook that can change config before
  the algorithm runs?
- Should layout hooks live in `on` (same as everything else) or somewhere separate
  since they're about computation rather than user interaction?

---

## Full `ImageCloudCallbacks` (delivered)

```typescript
interface ImageCloudCallbacks {
  // State change
  onImageHover?:        (ctx: ImageStateContext)    => void;
  onImageUnhover?:      (ctx: ImageStateContext)    => void;
  onImageFocus?:        (ctx: ImageStateContext)    => void;
  onImageUnfocus?:      (ctx: ImageStateContext)    => void;

  // Loading lifecycle
  onBeforeImageLoad?:   (ctx: BeforeLoadContext)    => BeforeLoadResult | void | Promise<BeforeLoadResult | void>;
  onImageLoaded?:       (ctx: ImageLoadedContext)   => void;
  onImageError?:        (ctx: ImageErrorContext)    => void;
  onLoadProgress?:      (ctx: LoadProgressContext)  => void;
  onGalleryReady?:      (ctx: GalleryReadyContext)  => void;

  // Entry animation lifecycle
  onEntryStart?:        (ctx: EntryStartContext)    => void;
  onEntryProgress?:     (ctx: EntryProgressContext) => void;
  onEntryComplete?:     (ctx: EntryCompleteContext) => void;

  // Layout (observational only — transformative hooks deferred)
  onLayoutComplete?:    (ctx: LayoutCompleteContext) => void;
}
```

---

## Files Modified

| File | Change |
|------|--------|
| `src/config/types.ts` | All new context/result types; extended `ImageCloudCallbacks` |
| `src/ImageCloud.ts` | Loading hooks; `onBeforeImageLoad` with fetch+blob mode; entry hooks; layout hook |
| `src/engines/PathAnimator.ts` | `onProgress` callback; fires per rAF tick |
| `src/index.ts` | All new types exported |
| `docs/parameters.md` | Full documentation for all hooks |
| `docs/examples.md` | Updated example descriptions |
| `examples/api-hooks.html` | 5-panel demo: state change, loading, entry, layout, URL transform |
| `examples/hooks-example.html` | Real-world demo extended with progress bar, layout chip, ready toast |
| `test/e2e/api-hooks.spec.ts` | 30 tests across all hook groups |
| `test/fixtures/api-hooks.html` | Extended with all loading and entry hook logging |
| `test/fixtures/api-hooks-bounce.html` | New: bounce-path fixture for `onEntryProgress` tests |
