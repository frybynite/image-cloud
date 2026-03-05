# Loading Hooks

## Goal

Give developers visibility into the image loading lifecycle, and the ability to
intercept each image request before it fires — to transform URLs, inject headers,
or control fetch behaviour.

---

## Part 1 — Lifecycle Callbacks

These fire at natural points during gallery initialisation. They live in `on` alongside
the existing state-change hooks.

```typescript
interface ImageCloudCallbacks {
  // existing
  onImageHover?:     (ctx: ImageStateContext) => void;
  onImageUnhover?:   (ctx: ImageStateContext) => void;
  onImageFocus?:     (ctx: ImageStateContext) => void;
  onImageUnfocus?:   (ctx: ImageStateContext) => void;

  // new — loading lifecycle
  onImageLoaded?:    (ctx: ImageLoadedContext)   => void;  // per image, on success
  onImageError?:     (ctx: ImageErrorContext)    => void;  // per image, on failure
  onLoadProgress?:   (ctx: LoadProgressContext)  => void;  // after each image settles
  onGalleryReady?:   (ctx: GalleryReadyContext)  => void;  // all images displayed
}
```

### Context shapes

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
  loaded:      number;    // images successfully loaded so far
  failed:      number;    // images that errored so far
  total:       number;    // total expected
  percent:     number;    // (loaded + failed) / total * 100
}

interface GalleryReadyContext {
  totalImages:  number;
  failedImages: number;
  loadDuration: number;   // ms from first src set to last image displayed
}
```

### Where they fire in `ImageCloud.ts`

| Hook | Where |
|---|---|
| `onImageLoaded` | Inside `img.onload`, after dimensions are cached, before queue push |
| `onImageError` | Inside `img.onerror` |
| `onLoadProgress` | After each `onload` or `onerror` (once `processedCount` increments) |
| `onGalleryReady` | After the queue finishes processing (after `startQueueProcessing` drains) |

---

## Part 2 — Pre-load Hook (`onBeforeImageLoad`)

Intercepts each image URL before the `<img>` src is set. Can transform the URL,
add request headers, or provide full fetch control.

```typescript
interface ImageCloudCallbacks {
  // ... existing and lifecycle hooks above ...

  onBeforeImageLoad?: (ctx: BeforeLoadContext) =>
    BeforeLoadResult | void | Promise<BeforeLoadResult | void>;
}
```

```typescript
interface BeforeLoadContext {
  url:         string;    // original URL from loader
  index:       number;
  totalImages: number;
}

interface BeforeLoadResult {
  url?:          string;                             // override the URL
  headers?:      Record<string, string>;             // request headers
  fetchOptions?: Omit<RequestInit, 'headers'>;       // other fetch() options
}
```

### Two modes

The hook's return value determines how the image is loaded:

#### Mode A — URL-only (zero overhead)

Return a modified URL string (or `{ url: '...' }` with no headers):

```javascript
onBeforeImageLoad({ url }) {
  // Add CDN size param
  return { url: url + '?w=400&q=80' };
}
```

The library sets `img.src = result.url`. Standard browser-cached `<img>` load.
No performance cost, no memory overhead.

#### Mode B — Headers / fetch mode

Return headers (or fetchOptions):

```javascript
onBeforeImageLoad({ url }) {
  return {
    headers: { 'Authorization': `Bearer ${getToken()}` }
  };
}
```

Because `<img>` elements cannot carry custom request headers, the library falls back
to `fetch()`:

```
fetch(url, { headers, ...fetchOptions })
  → response.blob()
  → URL.createObjectURL(blob)
  → img.src = objectURL
```

After the image loads, the object URL is revoked (`URL.revokeObjectURL`) to free memory.

**Tradeoffs of fetch mode:**
- ✓ Full header control (auth, cache-control, accept, etc.)
- ✓ Async-safe — hook can be async (e.g. to refresh an expired token)
- ✗ Bypasses browser image cache (each page load re-fetches)
- ✗ Slightly higher memory during load (blob in memory until object URL is revoked)
- ✗ CORS must permit the request (same as any credentialed fetch)

The library should use Mode A automatically whenever no headers/fetchOptions are
returned, so callers that only transform URLs pay no overhead.

### Async support

The hook is intentionally async-capable:

```javascript
// JWT refresh before each image load
onBeforeImageLoad: async ({ url }) => {
  const token = await authClient.getValidToken();
  return { headers: { Authorization: `Bearer ${token}` } };
}
```

The library awaits the hook before setting `img.src`, so the loading queue naturally
serialises per-image pre-processing.

---

## Use cases

| Use case | Hook return |
|---|---|
| Resize via CDN params (`?w=400`) | `{ url: newUrl }` |
| Signed URL / token in query string | `{ url: signedUrl }` |
| Bearer token auth | `{ headers: { Authorization: '...' } }` |
| Private S3 (signed headers) | `{ headers: { ... }, fetchOptions: { credentials: 'include' } }` |
| Force cache bypass | `{ fetchOptions: { cache: 'no-store' } }` |
| Proxy through own server | `{ url: '/proxy?src=' + encodeURIComponent(url) }` |

---

## Files to Modify

| File | Change |
|---|---|
| `src/config/types.ts` | Add `BeforeLoadContext`, `BeforeLoadResult`, `ImageLoadedContext`, `ImageErrorContext`, `LoadProgressContext`, `GalleryReadyContext`; extend `ImageCloudCallbacks` |
| `src/ImageCloud.ts` | Fire `onImageLoaded`, `onImageError`, `onLoadProgress`, `onGalleryReady` at the appropriate points; call `onBeforeImageLoad` before each `img.src` assignment; implement fetch-mode fallback with blob URL + revoke |
| `src/index.ts` | Export new context/result types |
| `docs/parameters.md` | Document all new hooks under a "Loading Hooks" section |

---

## Key Invariants

1. **`onBeforeImageLoad` that returns void/undefined is a no-op.** URL and fetch behaviour are unchanged.
2. **URL-only returns never trigger fetch mode.** Mode is determined strictly by the presence of `headers` or `fetchOptions`.
3. **Blob URLs are always revoked** after the image loads (or errors), regardless of whether idle animation is registered.
4. **Load generation check applies to hooks too.** If the gallery is cleared while images are loading, hooks for stale loads are suppressed.
5. **`onGalleryReady` fires even if some images failed.** `failedImages` in context tells you how many were skipped.
