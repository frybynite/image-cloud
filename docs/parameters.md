# Configuration Parameters

The Image Cloud library offers a flexible configuration system to customize every aspect of the gallery, from image loading to animation dynamics.

## Quick Start

The recommended entry point is the `imageCloud()` factory function, which constructs the instance and calls `init()` in a single expression:

```typescript
import { imageCloud } from '@frybynite/image-cloud';
import '@frybynite/image-cloud/style.css';

const cloud = await imageCloud({
  container: 'myGallery',
  images: [
    'https://example.com/photo1.jpg',
    'https://example.com/photo2.jpg',
    'https://example.com/photo3.jpg'
  ]
});
```

The `ImageCloud` class is still exported for power users who need direct lifecycle control:

```typescript
import { ImageCloud } from '@frybynite/image-cloud';

const cloud = new ImageCloud({ container: 'myGallery', images: [...] });
await cloud.init();
```

---

## Table of Contents

- [Framework Wrappers](#framework-wrappers)
- [Structure Overview](#structure-overview)
- [Loaders](#loaders)
  - [`images` Shorthand](#images-shorthand)
  - [Static Loader](#static-loader)
  - [Google Drive Loader](#google-drive-loader)
  - [Multiple Loaders](#multiple-loaders)
  - [Shared Loader Config](#shared-loader-config)
- [Layouts](#layouts)
  - [Base Options](#base-options)
  - [Spacing](#spacing)
  - [Grid](#grid)
  - [Spiral](#spiral)
  - [Cluster](#cluster)
  - [Wave](#wave)
  - [Honeycomb](#honeycomb)
  - [Radial](#radial)
  - [Random](#random)
- [Image Size & Style](#image-size-style)
  - [Sizing](#sizing)
  - [Rotation](#rotation)
  - [Styling](#styling)
- [Animations](#animations)
  - [Entry Animation](#entry-animation)
  - [Entry Paths](#entry-paths)
  - [Entry Rotation](#entry-rotation)
  - [Entry Scale](#entry-scale)
  - [Idle Animation](#idle-animation)
- [Event Callbacks](#event-callbacks)
- [Interaction](#interaction)
- [UI](#ui)
- [Debug](#debug)
- [Complete JSON Reference](#complete-json-reference)
- [Complete Examples](#complete-examples)

---

## Framework Wrappers

Image Cloud provides thin lifecycle wrappers for React, Vue 3, and Web Components. Each wrapper manages mount/unmount/reinit and exposes the core `ImageCloud` instance. Install the main package — framework dependencies are optional peer deps.

### React

```bash
npm install @frybynite/image-cloud react react-dom
```

```tsx
import { ImageCloud } from '@frybynite/image-cloud/react';
import '@frybynite/image-cloud/style.css';

function App() {
  return (
    <ImageCloud
      className="my-gallery"
      style={{ width: '100%', height: '80vh' }}
      loaders={[{
        static: {
          sources: [{
            urls: ['img1.jpg', 'img2.jpg', 'img3.jpg']
          }]
        }
      }]}
      layout={{ algorithm: 'radial' }}
    />
  );
}
```

Props are the same as `ImageCloudOptions` (minus `container`) plus `className` and `style`. Use a ref to access the underlying instance:

```tsx
const ref = useRef<ImageCloudRef>(null);
// ref.current.instance — the core ImageCloud instance
```

### Vue 3

```bash
npm install @frybynite/image-cloud vue
```

```vue
<script setup>
import { ImageCloud } from '@frybynite/image-cloud/vue';
import '@frybynite/image-cloud/style.css';

const options = {
  loaders: [{
    static: {
      sources: [{
        urls: ['img1.jpg', 'img2.jpg', 'img3.jpg']
      }]
    }
  }],
  layout: { algorithm: 'radial' }
};
</script>

<template>
  <ImageCloud :options="options" class="my-gallery" />
</template>
```

Pass configuration via the `options` prop (same as `ImageCloudOptions` minus `container`). Changes to `options` trigger automatic reinit. Use a template ref + `expose` to access the instance.

### Web Component

```bash
npm install @frybynite/image-cloud
```

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@frybynite/image-cloud@latest/dist/style.css">
<script type="module">
  import '@frybynite/image-cloud/web-component';
</script>

<image-cloud
  images='["img1.jpg", "img2.jpg", "img3.jpg"]'
  layout="radial"
></image-cloud>
```

Or with full config:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@frybynite/image-cloud@latest/dist/style.css">
<script type="module">
  import '@frybynite/image-cloud/web-component';
</script>

<image-cloud
  id="myGallery"
  config='{
    "loaders": [{
      "static": {
        "sources": [{"urls": ["img1.jpg", "img2.jpg"]}]
      }
    }],
    "layout": {"algorithm": "radial"}
  }'
></image-cloud>
```

**Attributes:**

| Attribute | Type | Description |
|-----------|------|-------------|
| `config` | JSON string | Full `ImageCloudOptions` (minus `container`) as JSON |
| `images` | JSON array | Shorthand for image URLs |
| `layout` | string | Layout algorithm name (`radial`, `grid`, `spiral`, `cluster`, `wave`, `random`) |

The `<image-cloud>` element auto-registers on import. Use `element.getInstance()` for imperative access. Dispatches `initialized` and `error` custom events.

---

## Structure Overview

```typescript
await imageCloud({
  container: 'my-gallery-id', // string ID or HTMLElement, defaults to 'imageCloud'
  images: [...],               // shorthand: array of image URLs (uses static loader)
  loaders: [...],              // array of loader entries
  config: {
    loaders: {...},            // shared loader settings
    debug: {                   // debug configuration
      enabled: false,
      centers: false,
      loaders: false
    }
  },
  image: { ... },
  layout: { ... },
  animation: { ... },
  on: { ... },
  interaction: { ... },
  ui: { ... },
  styling: { ... }
});
```

The `container` property accepts either a **string element ID** or a direct **HTMLElement** reference:

```typescript
// Using a string ID (works in both JS and JSON config)
const gallery = new ImageCloud({ container: 'my-gallery' });

// Using an HTMLElement reference (TypeScript/JavaScript only)
const el = document.querySelector('.my-gallery') as HTMLElement;
const gallery = new ImageCloud({ container: el });
```

If omitted, defaults to the element with ID `'imageCloud'`.

---

## Loaders

Controls how images are fetched and validated. Loaders are configured via `images` (shorthand), `loaders` (array of loader entries), and `config.loaders` (shared settings).

### `images` Shorthand

The simplest way to load images — a top-level array of URLs:

```typescript
const gallery = new ImageCloud({
  container: 'my-gallery',
  images: [
    'https://example.com/photo1.jpg',
    'https://example.com/photo2.jpg',
    'https://example.com/photo3.jpg'
  ]
});
```

The `images` shorthand is prepended as the first static loader entry. You can combine `images` with explicit `loaders` — the shorthand images come first.

### Static Loader

Load images from direct URLs, local file paths, or JSON endpoints. Configured as `{ static: {...} }` within the `loaders` array.

```typescript
loaders: [{
  static: {
    sources: [...],                      // Required: Array of sources
    validateUrls: true,                  // Optional: Verify URLs exist
    validationTimeout: 5000,             // Optional: Timeout in ms
    validationMethod: 'head',            // Optional: 'head', 'simple', or 'none'
    allowedExtensions: ['jpg', 'png'],   // Optional: Filter by extension
    debugLogging: false                  // Optional: Enable debug output
  }
}]
```

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `sources` | `StaticSource[]` | `[]` | Array of URL, path, or JSON sources. Required. |
| `validateUrls` | `boolean` | `true` | Check if image URLs exist before loading. |
| `validationTimeout` | `number` | `5000` | Timeout (ms) for URL validation. |
| `validationMethod` | `'head' \| 'simple' \| 'none'` | `'head'` | Method used to validate URLs. |
| `allowedExtensions` | `string[]` | `['jpg', 'jpeg', ...]` | Allowed image file extensions. |
| `debugLogging` | `boolean` | `false` | Enable debug logs for the loader. |

**Static Source Objects** (identified by shape, not a `type` field):
*   **URLs:** `{ urls: string[] }` — Direct image URLs
*   **Path:** `{ path: string, files: string[] }` — Base path + filenames
*   **JSON:** `{ json: string }` — JSON endpoint returning `{ "images": ["url1", "url2", ...] }`

**JSON Source Behavior:**
- Fetch uses a 10-second timeout via `AbortController`
- Endpoint must return JSON with shape `{ "images": ["url1", "url2", ...] }`
- Fetched URLs are processed through the standard validation pipeline

### Google Drive Loader

Load images from public Google Drive folders. Configured as `{ googleDrive: {...} }` within the `loaders` array.

```typescript
loaders: [{
  googleDrive: {
    apiKey: 'YOUR_API_KEY',           // Required: Google API key
    sources: [...],                    // Required: Array of sources
    allowedExtensions: ['jpg', 'png'], // Optional: Filter by extension
    debugLogging: false                // Optional: Enable debug output
  }
}]
```

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `apiKey` | `string` | - | **Required.** Your Google Drive API Key. |
| `sources` | `GoogleDriveSource[]` | - | **Required.** Array of folder or file sources. |
| `apiEndpoint` | `string` | `'https://www.googleapis.com/drive/v3/files'` | Google Drive API endpoint. |
| `allowedExtensions` | `string[]` | `['jpg', 'jpeg', ...]` | Allowed image file extensions. |
| `debugLogging` | `boolean` | `false` | Enable debug logs for the loader. |

**Google Drive Source Objects** (identified by shape):
*   **Folder:** `{ folders: string[], recursive?: boolean }` — Load all images from folder(s)
*   **Files:** `{ files: string[] }` — Load specific files by URL or ID

### Multiple Loaders

Use the `loaders` array with multiple entries to pull images from different sources. Composite behavior is implicit — no wrapper needed.

```typescript
const gallery = new ImageCloud({
  container: 'my-gallery',
  loaders: [
    {
      googleDrive: {
        apiKey: 'YOUR_API_KEY',
        sources: [{ folders: ['https://drive.google.com/...'] }]
      }
    },
    {
      static: {
        sources: [{ urls: ['https://example.com/image1.jpg'] }]
      }
    }
  ]
});
```

**Behavior:**
- All loaders are prepared in parallel
- If one loader fails, others continue (failed loader contributes 0 images)
- URLs are combined in the order loaders appear in the array

### Shared Loader Config

Use `config.loaders` to set defaults that apply to all loaders. Individual loader entries can override these settings.

```typescript
config: {
  loaders: {
    validateUrls: true,            // Default: true
    validationTimeout: 5000,       // Default: 5000
    validationMethod: 'head',      // Default: 'head'
    allowedExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp']
  }
}
```

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `validateUrls` | `boolean` | `true` | Check if URLs are accessible before loading. |
| `validationTimeout` | `number` | `5000` | Timeout for URL validation (ms). |
| `validationMethod` | `'head' \| 'simple' \| 'none'` | `'head'` | `'head'` (HTTP HEAD), `'simple'` (URL format check), `'none'`. |
| `allowedExtensions` | `string[]` | `['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp']` | Filter images by extension. |

> **Note:** `debugLogging` has been removed from shared loader config. Use `config.debug.loaders` instead. Per-loader `debugLogging` is still available as an override on individual loader entries.

**Config merge order:** `config.loaders` (shared defaults) → individual loader entry overrides → final config passed to loader constructor.

---

## Layouts

Controls the positioning and sizing of images. For an in-depth discussion of each algorithm's design and characteristics, see [layouts.md](layouts.md).

### Base Options

```typescript
layout: {
  algorithm: 'radial' | 'random' | 'grid' | 'spiral' | 'cluster' | 'wave' | 'honeycomb',
  targetCoverage?: number,         // 0-1, for auto-sizing (default: 0.6)
  densityFactor?: number,          // Controls spacing density (default: 1.0)
  scaleDecay?: number,             // 0-1, outer images smaller (default: 0)
  responsive?: {                   // Responsive breakpoints
    mobile: { maxWidth: number },  // default: 767
    tablet: { maxWidth: number }   // default: 1199
  },
  spacing: LayoutSpacingConfig,
  // Algorithm-specific options
  grid?: GridAlgorithmConfig,
  spiral?: SpiralAlgorithmConfig,
  cluster?: ClusterAlgorithmConfig,
  wave?: WaveAlgorithmConfig
}
```

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `algorithm` | `string` | `'radial'` | Layout algorithm: `'radial'`, `'random'`, `'grid'`, `'spiral'`, `'cluster'`, `'wave'`, `'honeycomb'` |
| `targetCoverage` | `number` | `0.6` | Target percentage of container to fill (0.0-1.0) when using adaptive sizing |
| `densityFactor` | `number` | `1.0` | Multiplier for calculated sizes and spacing. In radial layouts, affects image size only; ring spacing is controlled by `layout.radial.tightness`. |
| `scaleDecay` | `number` | `0` | Size reduction for outer images in spiral/radial layouts (0 = none, 1 = 50% smaller at edge) |
| `responsive.mobile.maxWidth` | `number` | `767` | Maximum viewport width for mobile breakpoint |
| `responsive.tablet.maxWidth` | `number` | `1199` | Maximum viewport width for tablet breakpoint (screen is > tablet) |
| `spacing` | `LayoutSpacingConfig` | *See below* | Configuration for margins and gaps. |

### Spacing

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `padding` | `number` | `50` | Padding from container edges (px). |

---

### Grid

Clean rows and columns with optional stagger and jitter for organic feel.

```typescript
layout: {
  algorithm: 'grid',
  grid: {
    columns: 'auto',      // number | 'auto'
    rows: 'auto',         // number | 'auto'
    stagger: 'none',      // 'none' | 'row' | 'column'
    jitter: 0,            // 0-1, random position variance
    overlap: 0,           // 0-1+, image overlap factor
    fillDirection: 'row', // 'row' | 'column'
    alignment: 'center',  // 'start' | 'center' | 'end'
    gap: 10,              // pixels between cells
    overflowOffset: 0.25  // 0-0.5, offset for overflow stacking
  }
}
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `columns` | `number \| 'auto'` | `'auto'` | Fixed column count or auto-calculate |
| `rows` | `number \| 'auto'` | `'auto'` | Fixed row count or auto-calculate |
| `stagger` | `string` | `'none'` | Offset pattern: `'none'`, `'row'` (brick pattern), `'column'` |
| `jitter` | `number` | `0` | Random offset within cells (0 = none, 1 = max) |
| `overlap` | `number` | `0` | Image size multiplier (0 = fit cell, 0.5 = 50% larger, 1.0 = 2x) |
| `fillDirection` | `string` | `'row'` | Primary fill direction: `'row'` or `'column'` |
| `alignment` | `string` | `'center'` | Incomplete row alignment: `'start'`, `'center'`, `'end'` |
| `gap` | `number` | `10` | Space between cells in pixels |
| `overflowOffset` | `number` | `0.25` | Offset % of cell size for overflow stacking when images > cells |

**Visual characteristics:**
- Clean, organized, professional
- Great for galleries, portfolios, product displays
- `stagger: 'row'` gives a brick/masonry feel
- `jitter` + `overlap` creates a "scattered on table" look

**Overflow Mode:**

When both `columns` and `rows` are fixed numbers and the image count exceeds `columns × rows`, overflow mode activates:

- Extra images are distributed across cells with offset patterns
- Overflow images appear **below** the base image (lower z-index)
- Offset pattern cycles through: bottom-right → upper-left → upper-right → bottom-left → left → right → up → down
- Creates a natural stacking/layering effect within grid structure
- `overflowOffset` controls how far overflow images are offset from cell center (as % of cell size)

---

### Spiral

Images placed along a spiral path emanating from the center.

```typescript
layout: {
  algorithm: 'spiral',
  scaleDecay: 0.5,               // 0-1, outer images smaller (layout-level)
  spiral: {
    spiralType: 'golden',        // 'golden' | 'archimedean' | 'logarithmic'
    direction: 'counterclockwise', // 'clockwise' | 'counterclockwise'
    tightness: 1.0,              // spacing between spiral arms
    startAngle: 0                // initial rotation offset in radians
  }
}
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `spiralType` | `string` | `'golden'` | Spiral pattern type |
| `direction` | `string` | `'counterclockwise'` | Spiral rotation direction |
| `tightness` | `number` | `1.0` | How tightly wound (higher = tighter) |
| `startAngle` | `number` | `0` | Starting angle offset in radians |

> **Note:** `scaleDecay` is configured at `layout.scaleDecay` level, not within `spiral`.

**Spiral Types:**
- `'golden'` - Fibonacci/sunflower pattern, optimal distribution
- `'archimedean'` - Constant spacing between arms (r = a + bθ)
- `'logarithmic'` - Self-similar, appears in nature (r = ae^bθ)

**Visual characteristics:**
- Eye naturally drawn to center
- Organic, nature-inspired feel (shells, sunflowers, galaxies)
- Works well with 10-50+ images
- Center images have highest z-index

---

### Cluster

Organic groupings like photos scattered on a table.

```typescript
layout: {
  algorithm: 'cluster',
  cluster: {
    clusterCount: 'auto',     // number | 'auto'
    clusterSpread: 150,       // pixels, how far images spread from center
    clusterSpacing: 200,      // pixels, minimum distance between clusters
    density: 'uniform',       // 'uniform' | 'varied'
    overlap: 0.3,             // 0-1, overlap within clusters
    distribution: 'gaussian'  // 'gaussian' | 'uniform'
  }
}
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `clusterCount` | `number \| 'auto'` | `'auto'` | Number of groupings (auto aims for ~8 images per cluster) |
| `clusterSpread` | `number` | `150` | How far images spread from cluster center |
| `clusterSpacing` | `number` | `200` | Minimum distance between cluster centers |
| `density` | `string` | `'uniform'` | `'uniform'` = same tightness, `'varied'` = random spread per cluster |
| `overlap` | `number` | `0.3` | Overlap within clusters (0 = minimal, 1 = heavy stacking) |
| `distribution` | `string` | `'gaussian'` | Image spread pattern within cluster |

**Distribution Types:**
- `'gaussian'` - Most images near center, fewer at edges (natural pile)
- `'uniform'` - Even spread within cluster radius

**Visual characteristics:**
- Organic, natural, casual feel
- Creates visual "islands" of content
- Good for 15-100+ images
- Images closer to cluster center have higher z-index

---

### Wave

Images positioned along flowing sine wave curves with extensive configuration.

```typescript
layout: {
  algorithm: 'wave',
  wave: {
    rows: 3,                      // number of wave rows
    amplitude: 100,               // wave height in pixels
    frequency: 2,                 // complete waves across width
    phaseShift: Math.PI / 3,      // phase offset between rows (radians)
    synchronization: 'offset'     // 'offset' | 'synchronized' | 'alternating'
  }
},
image: {
  rotation: { mode: 'tangent' }   // images follow wave curve (optional)
}
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `rows` | `number` | `1` | Number of horizontal wave rows to create |
| `amplitude` | `number` | `100` | Height of wave oscillation in pixels |
| `frequency` | `number` | `2` | Number of complete wave cycles across container width |
| `phaseShift` | `number` | `0` | Phase offset between rows in radians (only for 'offset' sync) |
| `synchronization` | `string` | `'offset'` | How waves align: `'offset'` (staggered), `'synchronized'` (peaks align), `'alternating'` (opposite directions) |

**Synchronization Modes:**
- `'offset'` - Each row is shifted horizontally by `phaseShift`, creating a flowing, staggered pattern
- `'synchronized'` - All rows have peaks at the same horizontal positions, creating vertical alignment
- `'alternating'` - Adjacent rows go opposite directions (180° phase shift), creating a woven pattern

**Image Rotation Along Wave:**

To make images rotate to follow the wave tangent (creating a flowing, dynamic effect), use the image rotation config:
```typescript
image: {
  rotation: { mode: 'tangent' }
}
```

When `mode: 'none'` (default), images remain horizontally oriented.

**Visual characteristics:**
- Flowing, rhythmic, dynamic feel
- Creates horizontal movement across the display
- Works well with 10-50+ images
- Great for timeline-like displays or artistic presentations
- `image.rotation.mode: 'tangent'` creates natural flow along curves
- Multiple synchronization modes offer varied aesthetics

**Examples:**

Single gentle wave with flowing rotation:
```typescript
layout: {
  algorithm: 'wave',
  wave: {
    rows: 1,
    amplitude: 80,
    frequency: 1.5
  }
},
image: {
  rotation: { mode: 'tangent' }  // Images follow wave curve
}
```

Tightly packed alternating waves:
```typescript
layout: {
  algorithm: 'wave',
  wave: {
    rows: 5,
    amplitude: 120,
    frequency: 3,
    synchronization: 'alternating'
  }
},
image: {
  rotation: { mode: 'tangent' }
}
```

Synchronized waves (vertical columns, upright images):
```typescript
layout: {
  algorithm: 'wave',
  wave: {
    rows: 4,
    amplitude: 100,
    frequency: 2,
    synchronization: 'synchronized'
  }
}
// image.rotation.mode defaults to 'none' - images stay upright
```

---

### Honeycomb

Places images in hexagonal rings filling outward clockwise from center-top.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `layout.honeycomb.spacing` | `number` | `0` | Extra gap in pixels between hexagons. `0` = edge-to-edge tiling. |

**Forced clip path:** When `layout.algorithm` is `'honeycomb'`, the `default` and `hover` clip paths are automatically forced to `{ shape: 'hexagon', mode: 'height-relative' }` for proper edge-to-edge tiling. The `focused` clip path remains user-configurable.

**Note:** `image.sizing.variance` and `image.rotation` have no effect in honeycomb layout — uniform sizing is required for tiles to align correctly.

```js
{
  layout: {
    algorithm: 'honeycomb',
    honeycomb: {
      spacing: 0  // pixels of extra gap (default: 0)
    }
  }
}
```

---

### Radial

Concentric rings emanating from center (built-in).

```typescript
layout: {
  algorithm: 'radial',
  radial: {
    tightness: 1.0  // Ring packing (0.3-2.0, default: 1.0). Higher = tighter rings.
  }
},
config: {
  debug: { centers: true }  // Show center markers for debugging
}
```

**Visual characteristics:**
- Center image prominently featured
- Elliptical rings (wider than tall)
- Automatic ring calculation based on image count
- Great for hero/featured content

| Parameter | Type | Default | Range | Description |
| :--- | :--- | :--- | :--- | :--- |
| `radial.tightness` | `number` | `1.0` | `0.3` to `2.0` | Controls how tightly rings are packed. Higher values bring rings closer together; lower values spread them further apart. Controls ring spacing only — image size is controlled separately by `densityFactor`. |

---

### Random

Randomly scattered images with no structure (built-in).

```typescript
layout: {
  algorithm: 'random'
}
```

No algorithm-specific options. Uses base `sizing` and `rotation` config.

**Visual characteristics:**
- Chaotic, energetic feel
- Images randomly positioned within padding bounds
- Size variance applied per image
- Good for creative/artistic displays

---

## Image Size & Style

### Sizing

Controls image sizing behavior.

```typescript
image: {
  sizing: {
    mode: 'fixed' | 'responsive' | 'adaptive',  // Required: sizing mode

    // Fixed mode: single height for all viewports
    // Responsive mode: per-breakpoint heights
    height?: number | {            // Required for fixed/responsive modes
      mobile?: number,             // Height for mobile (< 767px)
      tablet?: number,             // Height for tablet (768-1199px)
      screen?: number              // Height for desktop (>= 1200px)
    },

    // Adaptive mode only:
    minSize?: number,              // default: 50
    maxSize?: number,              // default: 400

    // All modes:
    variance?: {
      min: number,                 // 0.25-1 (e.g., 0.8)
      max: number                  // 1-1.75 (e.g., 1.2)
    }
  }
}
```

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `mode` | `'fixed' \| 'responsive' \| 'adaptive'` | `'adaptive'` | **Required.** Sizing mode selection. |
| `height` | `number \| FixedModeHeight` | - | Fixed/responsive mode: explicit image height(s). |
| `minSize` | `number` | `50` | Adaptive mode only: minimum image height. |
| `maxSize` | `number` | `400` | Adaptive mode only: maximum image height. |
| `variance.min` | `number` | `1.0` | Minimum size multiplier (0.25-1). |
| `variance.max` | `number` | `1.0` | Maximum size multiplier (1-1.75). |

**Sizing Modes:**

| Mode | Description | Height Property |
|------|-------------|-----------------|
| `adaptive` | Auto-calculates based on container and image count (default) | Uses `minSize`/`maxSize` |
| `fixed` | Single explicit height for all viewports | `height: number` |
| `responsive` | Different heights per viewport breakpoint | `height: { mobile, tablet, screen }` |

**Adaptive Mode (default):**
```typescript
image: {
  sizing: {
    mode: 'adaptive',  // Auto-calculates based on container and image count
    minSize: 50,       // Minimum image height
    maxSize: 400       // Maximum image height
  }
}
```

**Fixed Mode - Single Height:**
```typescript
image: {
  sizing: {
    mode: 'fixed',
    height: 150      // All viewports use 150px
  }
}
```

**Responsive Mode - Per-Breakpoint Heights:**
```typescript
image: {
  sizing: {
    mode: 'responsive',
    height: {
      mobile: 100,   // < 767px viewport width
      tablet: 150,   // 768-1199px viewport width
      screen: 200    // >= 1200px viewport width
    }
  }
}
```

### Rotation

Controls image rotation behavior.

```typescript
image: {
  rotation: {
    mode: 'none' | 'random' | 'tangent',  // default: 'none'
    range?: {
      min: number,                 // Negative degrees (-180 to 0)
      max: number                  // Positive degrees (0 to 180)
    }
  }
}
```

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `mode` | `'none' \| 'random' \| 'tangent'` | `'none'` | Rotation mode. |
| `range.min` | `number` | `-15` | Minimum rotation degrees (-180 to 0). |
| `range.max` | `number` | `15` | Maximum rotation degrees (0 to 180). |

**Rotation Modes:**

| Mode | Description | Applicable Layouts |
|------|-------------|-------------------|
| `none` | No rotation (default) | All |
| `random` | Random rotation within range | All |
| `tangent` | Align to curve tangent | Wave, Spiral |

**Example - Classic scattered photos:**
```typescript
image: {
  rotation: { mode: 'random', range: { min: -15, max: 15 } },
  sizing: { variance: { min: 0.9, max: 1.1 } }
}
```

**Example - Spiral with tangent rotation:**
```typescript
image: {
  rotation: { mode: 'tangent' }
},
layout: {
  algorithm: 'spiral',
  scaleDecay: 0.5
}
```

### Styling

Controls the visual appearance of images in different states.

```typescript
styling: {
  default: {
    border: { width: 0, color: '#000', radius: 0, style: 'solid' },
    shadow: 'none',             // 'none' | 'sm' | 'md' | 'lg' | 'glow' or custom CSS
    opacity: 1,
    cursor: 'pointer',
    filter: { },
    outline: { width: 0, color: '#000', style: 'solid', offset: 0 }
  },
  hover: {
    shadow: 'none'              // Applied on mouse hover
  },
  focused: {
    shadow: 'none'              // Applied when image is clicked/focused
  }
}
```

#### Style States

| State | Description |
|-------|-------------|
| `default` | Base styling applied to all images |
| `hover` | Inherits from default, applied on mouse hover |
| `focused` | Inherits from default, applied when image is clicked/zoomed |

> **Note:** All properties from `ImageStyleState` are available for all three states. When a property is not explicitly set in `hover` or `focused`, it inherits the value from `default`. This allows you to override only the specific properties you want to change for each state.

#### Image Style Properties

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `className` | `string \| string[]` | - | CSS class names to apply |
| `border` | `BorderConfig` | *See below* | Border styling (shorthand for all sides) |
| `borderTop` | `Partial<BorderConfig>` | - | Top border override |
| `borderRight` | `Partial<BorderConfig>` | - | Right border override |
| `borderBottom` | `Partial<BorderConfig>` | - | Bottom border override |
| `borderLeft` | `Partial<BorderConfig>` | - | Left border override |
| `borderRadiusTopLeft` | `number` | - | Top-left corner radius override (px) |
| `borderRadiusTopRight` | `number` | - | Top-right corner radius override (px) |
| `borderRadiusBottomRight` | `number` | - | Bottom-right corner radius override (px) |
| `borderRadiusBottomLeft` | `number` | - | Bottom-left corner radius override (px) |
| `shadow` | `ShadowPreset \| string` | `'none'` | Shadow preset or custom CSS shadow |
| `filter` | `FilterConfig` | `{}` | CSS filter effects |
| `opacity` | `number` | `1` | Image opacity (0-1) |
| `cursor` | `string` | `'pointer'` | CSS cursor value |
| `outline` | `OutlineConfig` | *See below* | Outline styling |
| `objectFit` | `string` | - | CSS object-fit value |
| `aspectRatio` | `string` | - | CSS aspect-ratio (e.g., '16/9') |
| `clipPath` | `ClipPathShape \| string \| ClipPathConfig` | `undefined` | Crop image to a predefined shape or custom CSS clip-path. Can be a string (shape name or custom CSS), or a config object with `shape` and `mode` properties. |

#### Clip-Path

The `clipPath` property accepts three formats:

1. **Predefined shape name** (string): `'circle'`, `'square'`, `'triangle'`, `'pentagon'`, `'hexagon'`, `'octagon'`, `'diamond'`
2. **Custom clip-path** (string): CSS clip-path syntax like `'polygon(...)'` or `'inset(...)'`
3. **Configuration object** (for advanced control):
   ```typescript
   {
     shape: ClipPathShape,      // Predefined shape name
     mode: 'percent' | 'height-relative'  // Scaling mode
   }
   ```

**Clip-Path Modes:**

**Height-Relative (Consistent)** - Aspect-ratio aware (default)
- Scales the shape based on the image height, then centers it horizontally
- Maintains consistent visual sizing across images with different aspect ratios
- Ideal for portrait images where percentage mode may appear off-center
- The shape size is calculated as: `scaleFactor = imageHeight / referenceHeight (100px)`

**Percent (Responsive)** - stretches to image size
- Uses percentage-based coordinates that scale responsively with the image dimensions
- Shape maintains the same visual proportion regardless of image size
- Works well when images have varied aspect ratios

**Predefined Shapes:**

| Shape | Use Case |
|-------|----------|
| `'circle'` | Circular crops, user avatars |
| `'square'` | Standard square thumbnails |
| `'triangle'` | Directional or badge designs |
| `'pentagon'` | Star-like geometric layouts |
| `'hexagon'` | Honeycomb layouts, unique patterns |
| `'octagon'` | Stop-sign or badge shapes |
| `'diamond'` | Rotated square, gemstone effect |

**Simple predefined shape (uses default "percent" mode):**
```javascript
styling: {
  default: { clipPath: 'hexagon' }
}
```

**Height-relative mode for consistent aspect-ratio-aware shapes:**
```javascript
styling: {
  default: {
    clipPath: {
      shape: 'hexagon',
      mode: 'height-relative'
    }
  }
}
```

**Custom clip-path (always uses percent mode):**
- `'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)'` - Trapezoid
- `'inset(10% 20% 30% 40%)'` - Rectangular inset
- `'circle(40%)'` - Circle with specific radius

**Animated clip-path transitions:**
Clip-path smoothly animates during focus/unfocus transitions. The animation updates continuously as image dimensions change, ensuring the shape stays perfectly centered.

**Note:** `overflow: hidden` is automatically applied when `clipPath` is used to ensure clean boundaries.

#### Border

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `width` | `number` | `0` | Border width in pixels |
| `color` | `string` | `'#000'` | Border color (CSS color) |
| `radius` | `number` | `0` | Border radius in pixels |
| `style` | `BorderStyle` | `'solid'` | Border line style (see table below) |

**Border Style Options** (ordered by practicality):

| Style | Description |
|-------|-------------|
| `'solid'` | Continuous line (default) |
| `'dashed'` | Series of dashes |
| `'dotted'` | Series of dots |
| `'double'` | Two parallel lines |
| `'none'` | No border |
| `'groove'` | 3D carved into page effect |
| `'ridge'` | 3D raised from page effect |
| `'inset'` | 3D embedded look |
| `'outset'` | 3D raised look |
| `'hidden'` | Same as none (for table border conflict resolution) |

#### Shadow Presets

| Preset | CSS Value | Description |
|--------|-----------|-------------|
| `'none'` | `none` | No shadow |
| `'sm'` | `0 2px 4px rgba(0,0,0,0.1)` | Small subtle shadow |
| `'md'` | `0 4px 16px rgba(0,0,0,0.4)` | Medium shadow (default) |
| `'lg'` | `0 8px 32px rgba(0,0,0,0.5)` | Large prominent shadow |
| `'glow'` | `0 0 30px rgba(255,255,255,0.6)` | White glow effect |

You can also pass a custom CSS box-shadow string instead of a preset.

#### Filter

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `grayscale` | `number` | - | Grayscale filter (0-1) |
| `blur` | `number` | - | Blur in pixels |
| `brightness` | `number` | - | Brightness multiplier (1 = normal) |
| `contrast` | `number` | - | Contrast multiplier (1 = normal) |
| `saturate` | `number` | - | Saturation multiplier (1 = normal) |
| `opacity` | `number` | - | Filter opacity (0-1) |
| `sepia` | `number` | - | Sepia filter (0-1) |
| `hueRotate` | `number` | - | Hue rotation in degrees |
| `invert` | `number` | - | Invert filter (0-1) |
| `dropShadow` | `DropShadowConfig \| string` | - | Drop shadow effect |

#### Outline

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `width` | `number` | `0` | Outline width in pixels |
| `color` | `string` | `'#000'` | Outline color |
| `style` | `string` | `'solid'` | Outline style: `'solid'`, `'dashed'`, `'dotted'`, `'none'` |
| `offset` | `number` | `0` | Outline offset in pixels |

**Example - Vintage photo effect:**
```typescript
styling: {
  default: {
    border: { width: 8, color: '#f5f5dc', radius: 0 },
    shadow: 'lg',
    filter: { sepia: 0.3, contrast: 1.1 }
  },
  hover: {
    filter: { sepia: 0, contrast: 1 }  // Remove effect on hover
  }
}
```

**Example - Polaroid style:**
```typescript
styling: {
  default: {
    border: { width: 0, radius: 4 },
    borderBottom: { width: 40, color: 'white' },
    borderTop: { width: 10, color: 'white' },
    borderLeft: { width: 10, color: 'white' },
    borderRight: { width: 10, color: 'white' },
    shadow: 'md'
  }
}
```

---

## Animations

Controls entrance and interaction animations.

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `duration` | `number` | `600` | Base entry animation duration (ms). Replaces deprecated `animation.entry.timing.duration`. |
| `easing.default` | `string` | `cubic-bezier(...)` | CSS easing string for standard moves. |
| `easing.bounce` | `string` | `cubic-bezier(...)` | CSS easing for entrance bounce. |
| `easing.focus` | `string` | `cubic-bezier(...)` | CSS easing for zoom focus. |
| `queue.enabled` | `boolean` | `true` | Enable staggered entrance. |
| `queue.interval` | `number` | `150` | Time between appearance of each image (ms). |
| `entry` | `EntryAnimationConfig` | *See below* | Entry animation configuration. |
| `idle` | `IdleAnimationConfig` | `{ type: 'none' }` | Idle/ambient animation configuration. |

---

### Entry Animation

Controls how images animate into the gallery when it first loads. Supports 8 different start positions and layout-aware smart defaults.

```typescript
animation: {
  entry: {
    start: {
      position: 'nearest-edge',  // Where images start
      offset: 100,               // Pixels beyond edge
      circular: {                // Only for position: 'circular'
        radius: '120%',          // Circle radius
        distribution: 'even'     // How images are placed on circle
      }
    },
    timing: {
      duration: 600              // Animation duration (ms)
    },
    easing: 'cubic-bezier(0.25, 1, 0.5, 1)'  // CSS easing
  }
}
```

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `start.position` | `string` | `'nearest-edge'` | Starting position for images |
| `start.offset` | `number` | `100` | Pixels beyond edge (for edge-based positions) |
| `start.circular.radius` | `number \| string` | `'120%'` | Circle radius in pixels or % of container diagonal |
| `start.circular.distribution` | `string` | `'even'` | `'even'` (evenly spaced) or `'random'` |
| `timing.duration` | `number` | `600` | **Deprecated.** Use `animation.duration` instead. Will be removed in v1.2. |
| `easing` | `string` | `cubic-bezier(0.25, 1, 0.5, 1)` | CSS easing function |

**Start Position Options:**

| Position | Description | Best For |
|----------|-------------|----------|
| `nearest-edge` | Each image enters from its closest edge | General use, organic feel |
| `top` | All images enter from top edge | Grid layouts, reading order |
| `bottom` | All images enter from bottom edge | Rising effect |
| `left` | All images enter from left edge | Horizontal flow |
| `right` | All images enter from right edge | Horizontal flow |
| `center` | Images scale up from container center | Radial/spiral layouts, burst effect |
| `random-edge` | Each image enters from a random edge | Chaotic, energetic feel |
| `circular` | Images enter from positions on a circle | Dramatic reveal, convergence |

**Layout-Aware Smart Defaults:**

When you don't specify `start.position`, the library automatically chooses the best default based on your layout algorithm:

| Layout Algorithm | Default Entry | Why |
|------------------|---------------|-----|
| `radial` | `center` | Images radiate outward, matching the radial pattern |
| `spiral` | `center` | Spiral emanates from center, so entry should too |
| `grid` | `top` | Natural top-to-bottom reading order |
| `cluster` | `nearest-edge` | Organic grouping feel, images "find" their cluster |
| `random` | `nearest-edge` | Classic scattered photo effect |

**Examples:**

Default behavior (no config needed):
```typescript
// Uses layout-aware defaults automatically
const gallery = new ImageCloud({
  container: 'my-gallery',
  images: [...],
  layout: { algorithm: 'radial' }  // Will use 'center' entry by default
});
```

Center burst:
```typescript
animation: {
  entry: {
    start: { position: 'center' },
    timing: { duration: 500 }
  }
}
```

Cascade from top (great for grids):
```typescript
animation: {
  entry: {
    start: { position: 'top' },
    timing: { duration: 800 },
    easing: 'ease-out'
  }
}
```

Circular entrance with even distribution:
```typescript
animation: {
  entry: {
    start: {
      position: 'circular',
      circular: {
        radius: 500,           // 500px radius
        distribution: 'even'   // Evenly spaced on circle
      }
    },
    timing: { duration: 1000 }
  }
}
```

Circular entrance with percentage radius:
```typescript
animation: {
  entry: {
    start: {
      position: 'circular',
      circular: {
        radius: '150%',        // 150% of container diagonal
        distribution: 'random' // Random positions on circle
      }
    },
    timing: { duration: 1200 }
  }
}
```

Slow dramatic entrance from bottom:
```typescript
animation: {
  entry: {
    start: { position: 'bottom', offset: 200 },
    timing: { duration: 1500 },
    easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)'  // Overshoot easing
  }
}
```

Random edge for chaotic effect:
```typescript
animation: {
  entry: {
    start: { position: 'random-edge' },
    timing: { duration: 600 }
  }
}
```

---

### Entry Paths

Controls the trajectory that images follow during their entry animation. By default, images travel in a straight line (linear). Advanced path types add dynamic motion effects.

```typescript
animation: {
  entry: {
    start: { position: 'nearest-edge' },
    timing: { duration: 600 },
    easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
    path: {
      type: 'bounce',                    // Path type
      bouncePreset: 'playful',           // Optional preset
      bounce: { overshoot: 0.2 }         // Optional overrides
    }
  }
}
```

| Type | Description | Best For |
|------|-------------|----------|
| `linear` | Straight line from start to end (default) | Clean, professional animations |
| `bounce` | Overshoot target, then settle back | Energetic, playful interfaces |
| `elastic` | Spring-like oscillation at end | Organic, natural feel |
| `wave` | Sinusoidal serpentine path | Dreamy, floating atmosphere |

**Bounce Path:**

Images travel past their target position, then settle back. Creates an energetic, playful feel.

```typescript
path: {
  type: 'bounce',
  bouncePreset: 'playful',     // 'energetic' | 'playful' | 'subtle'
  bounce: {
    overshoot: 0.15,           // 0.1-0.3, how far past target
    bounces: 1,                // 1, 2, or 3 bounces
    decayRatio: 0.5            // 0.3-0.7, each bounce reduces by this ratio
  }
}
```

| Preset | Overshoot | Bounces | Feel |
|--------|-----------|---------|------|
| `energetic` | 0.25 | 2 | High energy, attention-grabbing |
| `playful` | 0.15 | 1 | Balanced, friendly |
| `subtle` | 0.08 | 1 | Minimal, professional |

```typescript
animation: {
  entry: {
    start: { position: 'top' },
    timing: { duration: 800 },
    path: { type: 'bounce', bouncePreset: 'energetic' }
  }
}
```

**Elastic Path:**

Images arrive at their target and oscillate like a spring before settling. Creates an organic, physical feel.

```typescript
path: {
  type: 'elastic',
  elasticPreset: 'bouncy',     // 'gentle' | 'bouncy' | 'wobbly' | 'snappy'
  elastic: {
    stiffness: 200,            // 100-500, higher = faster oscillation
    damping: 20,               // 10-50, higher = fewer oscillations
    mass: 1,                   // 0.5-3, higher = more momentum
    oscillations: 3            // 2-5, visible oscillation count
  }
}
```

| Preset | Stiffness | Damping | Oscillations | Feel |
|--------|-----------|---------|--------------|------|
| `gentle` | 150 | 30 | 2 | Soft, subtle spring |
| `bouncy` | 300 | 15 | 4 | Lively, energetic |
| `wobbly` | 180 | 12 | 5 | Jelly-like, playful |
| `snappy` | 400 | 25 | 2 | Quick, responsive |

```typescript
animation: {
  entry: {
    start: { position: 'center' },
    timing: { duration: 1000 },
    path: { type: 'elastic', elasticPreset: 'wobbly' }
  }
}
```

**Wave Path:**

Images follow a sinusoidal serpentine path from start to end. Creates a dreamy, floating atmosphere.

```typescript
path: {
  type: 'wave',
  wavePreset: 'playful',       // 'gentle' | 'playful' | 'serpentine' | 'flutter'
  wave: {
    amplitude: 40,             // 20-100px, wave height
    frequency: 2,              // 1-4, number of complete waves
    decay: true,               // Wave diminishes toward target
    decayRate: 0.8,            // 0.5-1, how fast amplitude decreases
    phase: 0                   // 0-2π, starting phase offset
  }
}
```

| Preset | Amplitude | Frequency | Decay | Feel |
|--------|-----------|-----------|-------|------|
| `gentle` | 30 | 1.5 | yes | Soft, subtle wave |
| `playful` | 50 | 2.5 | yes | Fun, dynamic |
| `serpentine` | 60 | 3 | no | Dramatic snake path |
| `flutter` | 20 | 4 | yes | Light, quick oscillation |

```typescript
animation: {
  entry: {
    start: { position: 'left' },
    timing: { duration: 900 },
    path: { type: 'wave', wavePreset: 'serpentine' }
  }
}
```

Path types work with all start positions:

```typescript
// Bounce from top
animation: {
  entry: {
    start: { position: 'top' },
    path: { type: 'bounce' }
  }
}

// Elastic from center (radial burst with spring)
animation: {
  entry: {
    start: { position: 'center' },
    path: { type: 'elastic', elasticPreset: 'bouncy' }
  }
}

// Wave from circular positions
animation: {
  entry: {
    start: { position: 'circular', circular: { radius: '120%' } },
    path: { type: 'wave', wavePreset: 'gentle' }
  }
}
```

**Performance Notes:**
- **Linear/Arc**: Uses CSS transitions (most efficient)
- **Bounce/Elastic/Wave**: Uses JavaScript animation (requestAnimationFrame)
- All paths are optimized for smooth 60fps animation
- For galleries with 50+ images, consider using linear path

---

### Entry Rotation

Controls how images rotate during their entry animation. By default, images maintain their final rotation throughout the animation. Entry rotation modes add dynamic rotation effects as images fly in.

```typescript
animation: {
  entry: {
    start: { position: 'nearest-edge' },
    timing: { duration: 600 },
    path: { type: 'bounce' },
    rotation: {
      mode: 'spin',                         // Rotation mode
      spinCount: 1,                         // For spin mode
      direction: 'clockwise'                // Spin direction
    }
  }
}
```

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `mode` | `string` | `'none'` | Rotation animation mode |
| `spinCount` | `number` | `1` | Number of full rotations (for spin mode) |
| `direction` | `string` | `'clockwise'` | Spin direction: `'clockwise'`, `'counterclockwise'`, `'auto'`, `'random'` |
| `startRotation` | `number \| { min, max }` | `{ min: -45, max: 45 }` | Starting rotation angle or range (for settle mode) |
| `wobble.amplitude` | `number` | `15` | Maximum wobble angle in degrees |
| `wobble.frequency` | `number` | `3` | Number of wobble oscillations during animation |

| Mode | Description | Best For |
|------|-------------|----------|
| `none` | No rotation change (default) | Clean, professional animations |
| `spin` | Full rotation(s) during entry | Energetic, playful interfaces |
| `settle` | Start tilted, settle to final angle | Photos tumbling onto a table |
| `random` | Random starting rotation | Organic, varied feel |
| `wobble` | Oscillating rotation during entry | Bouncy, spring-like motion |

**Spin Mode:**

Images rotate a specified number of times as they enter. Great for energetic interfaces.

```typescript
rotation: {
  mode: 'spin',
  spinCount: 2,                    // Two full rotations
  direction: 'clockwise'           // Or 'counterclockwise', 'auto', 'random'
}
```

Direction options: `'clockwise'` (default), `'counterclockwise'`, `'auto'` (based on entry angle), `'random'`

**Settle Mode:**

Images start at a tilted angle and settle to their final rotation. Creates a natural "photos falling on table" effect.

```typescript
rotation: {
  mode: 'settle',
  startRotation: { min: -45, max: 45 }   // Random start angle in range
}
```

You can also use a fixed starting angle:
```typescript
rotation: {
  mode: 'settle',
  startRotation: -30                      // All images start at -30°
}
```

**Random Mode:**

Each image starts at a random rotation angle within ±30° of its final position.

```typescript
rotation: {
  mode: 'random'
}
```

**Wobble Mode:**

Images oscillate back and forth as they enter, settling at their final rotation. Works best with bounce, elastic, or wave path types.

```typescript
rotation: {
  mode: 'wobble',
  wobble: {
    amplitude: 15,               // Maximum angle of wobble
    frequency: 3                 // Number of oscillations
  }
}
```

**Examples:**

Spinning entry from top:
```typescript
animation: {
  entry: {
    start: { position: 'top' },
    timing: { duration: 800 },
    path: { type: 'bounce' },
    rotation: {
      mode: 'spin',
      spinCount: 1,
      direction: 'clockwise'
    }
  }
}
```

Tumbling photos effect:
```typescript
animation: {
  entry: {
    start: { position: 'random-edge' },
    timing: { duration: 600 },
    rotation: {
      mode: 'settle',
      startRotation: { min: -60, max: 60 }
    }
  }
}
```

Wobbly elastic entry:
```typescript
animation: {
  entry: {
    start: { position: 'center' },
    timing: { duration: 1000 },
    path: { type: 'elastic', elasticPreset: 'wobbly' },
    rotation: {
      mode: 'wobble',
      wobble: { amplitude: 20, frequency: 4 }
    }
  }
}
```

**Performance Notes:**
- **none/settle/spin/random**: Rotation is interpolated alongside position (efficient)
- **wobble**: Requires JavaScript animation per frame (slightly more CPU)
- For galleries with 50+ images, consider simpler rotation modes

---

### Entry Scale

Controls how images scale during their entry animation. By default, images maintain their final scale throughout the animation (except for 'center' start position which scales from 0). Entry scale modes add dynamic scaling effects as images fly in.

```typescript
animation: {
  entry: {
    start: { position: 'nearest-edge' },
    timing: { duration: 600 },
    path: { type: 'bounce' },
    scale: {
      mode: 'grow',                         // Scale mode
      startScale: 0.3                       // For grow/shrink modes
    }
  }
}
```

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `mode` | `string` | `'none'` | Scale animation mode |
| `startScale` | `number` | `0.3` (grow) / `1.5` (shrink) | Starting scale multiplier 0.1-4.0 (for grow/shrink modes) |
| `range.min` | `number` | `0.5` | Minimum scale for random mode |
| `range.max` | `number` | `1.0` | Maximum scale for random mode |
| `pop.overshoot` | `number` | `1.2` | How much to overshoot final scale (1.05-1.5) |
| `pop.bounces` | `number` | `1` | Number of bounces before settling (1-3) |

| Mode | Description | Best For |
|------|-------------|----------|
| `none` | No scale change (default) | Clean, professional animations |
| `grow` | Start smaller, grow to final size | Images "popping in" |
| `shrink` | Start larger, shrink to final size | Images compressing into place |
| `pop` | Overshoot then settle back | Bouncy, playful effect |
| `random` | Random start scale in range | Organic, varied feel |

**Grow Mode:**
```typescript
scale: {
  mode: 'grow',
  startScale: 0.3                    // Start at 30% of final size (default)
}
```

**Shrink Mode:**
```typescript
scale: {
  mode: 'shrink',
  startScale: 1.5                    // Start at 150% of final size (default)
}
```

**Pop Mode:**

Images reach their final size, overshoot slightly, then bounce back to settle. Works great with bounce or elastic paths.

```typescript
scale: {
  mode: 'pop',
  pop: {
    overshoot: 1.2,                  // Overshoot to 120% (default)
    bounces: 1                       // One bounce (default)
  }
}
```

**Random Mode:**
```typescript
scale: {
  mode: 'random',
  range: {
    min: 0.5,                        // Minimum 50% of final size
    max: 1.0                         // Maximum 100% of final size
  }
}
```

**Examples:**

Growing pop-in effect:
```typescript
animation: {
  entry: {
    start: { position: 'center' },
    timing: { duration: 600 },
    scale: {
      mode: 'grow',
      startScale: 0.2
    }
  }
}
```

Bouncy pop effect:
```typescript
animation: {
  entry: {
    start: { position: 'nearest-edge' },
    timing: { duration: 800 },
    path: { type: 'bounce' },
    scale: {
      mode: 'pop',
      pop: { overshoot: 1.3, bounces: 2 }
    }
  }
}
```

Combined rotation and scale:
```typescript
animation: {
  entry: {
    start: { position: 'circular' },
    timing: { duration: 1000 },
    path: { type: 'elastic' },
    rotation: {
      mode: 'spin',
      spinCount: 1
    },
    scale: {
      mode: 'grow',
      startScale: 0.3
    }
  }
}
```

**Performance Notes:**
- **none/grow/shrink/random**: Scale is interpolated alongside position (efficient)
- **pop**: Requires JavaScript animation per frame (slightly more CPU)
- Combining scale with rotation and path animations works well but uses more CPU
- For galleries with 50+ images, consider simpler scale modes

---

### Idle Animation

Adds continuous ambient animations to gallery images while they are idle (not focused). Animations automatically pause when an image is clicked/focused and resume after the unfocus animation fully completes.

Uses the Web Animations API with `composite: 'add'`, so idle animations layer on top of existing transforms without interfering with entry, focus, or hover effects.

```typescript
animation: {
  idle: {
    type: 'wiggle',       // 'none' | 'wiggle' | 'pulse' | 'blink' | 'spin' | 'custom'
    startDelay: 600,      // ms before idle starts (default: entry animation duration)
    wiggle: { ... },      // wiggle-specific options
    pulse: { ... },       // pulse-specific options
    blink: { ... },       // blink-specific options
    spin: { ... },        // spin-specific options
    custom: (ctx) => ..., // custom animation function
  }
}
```

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `idle.type` | `'none' \| 'wiggle' \| 'pulse' \| 'blink' \| 'spin' \| 'custom'` | `'none'` | Type of idle animation. |
| `idle.startDelay` | `number` | entry duration | Milliseconds to wait after an image appears before starting idle animation. |

**Wiggle** — images gently rock back and forth:

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `idle.wiggle.maxAngle` | `number` | `5` | Maximum rotation angle in degrees (range: 1–30). |
| `idle.wiggle.speed` | `number` | `2000` | Duration of one wiggle cycle in ms (range: 500–8000). |
| `idle.wiggle.sync` | `'random' \| 'together'` | `'random'` | Phase synchronisation across images. |

**Pulse** — images gently scale up and down:

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `idle.pulse.minScale` | `number` | `0.95` | Minimum scale factor during pulse (range: 0.5–1.0). |
| `idle.pulse.maxScale` | `number` | `1.05` | Maximum scale factor during pulse (range: 1.0–2.0). |
| `idle.pulse.speed` | `number` | `2400` | Duration of one pulse cycle in ms (range: 500–8000). |
| `idle.pulse.sync` | `'random' \| 'together'` | `'random'` | Phase synchronisation across images. |

**Blink** — images flash on and off:

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `idle.blink.onRatio` | `number` | `0.7` | Fraction of the cycle the image is visible (range: 0.1–0.99). |
| `idle.blink.speed` | `number` | `3000` | Duration of one blink cycle in ms (range: 500–10000). |
| `idle.blink.style` | `'snap' \| 'fade'` | `'snap'` | Transition style: `snap` for instant cut, `fade` for gradual fade. |

**Spin** — images continuously rotate:

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `idle.spin.speed` | `number` | `4000` | Duration of one full revolution in ms (range: 500–20000). |
| `idle.spin.direction` | `'clockwise' \| 'counterclockwise'` | `'clockwise'` | Rotation direction. |

**Custom** — user-provided animation:

```typescript
idle: {
  type: 'custom',
  custom: ({ element, index, totalImages }) => {
    // Return a Web Animations API Animation object:
    return element.animate([
      { transform: 'rotate(0deg)' },
      { transform: 'rotate(360deg)' }
    ], { duration: 3000, iterations: Infinity });

    // Or return a teardown function:
    // const interval = setInterval(() => { /* ... */ }, 100);
    // return () => clearInterval(interval);
  }
}
```

**Examples:**

Gentle wiggle with random phases:
```javascript
animation: {
  idle: {
    type: 'wiggle',
    wiggle: { maxAngle: 5, speed: 2000, sync: 'random' }
  }
}
```

Breathing pulse (all together):
```javascript
animation: {
  idle: {
    type: 'pulse',
    pulse: { minScale: 0.97, maxScale: 1.03, speed: 3000, sync: 'together' }
  }
}
```

Slow clockwise spin:
```javascript
animation: {
  idle: {
    type: 'spin',
    startDelay: 600,
    spin: { speed: 8000, direction: 'clockwise' }
  }
}
```

---

## Event Callbacks

React to image lifecycle events via callback functions, similar to Swiper.js event hooks. All hooks are observational — they receive context and can drive side effects, but do not affect library behaviour unless explicitly designed to do so (e.g. `onBeforeImageLoad`).

```typescript
imageCloud({
  // ...
  on: {
    // State change
    onImageHover:      ({ element, index, url, layout }) => { /* cursor entered image */ },
    onImageUnhover:    ({ element, index, url, layout }) => { /* cursor left image */ },
    onImageFocus:      ({ element, index, url, layout }) => { /* image focused/zoomed in */ },
    onImageUnfocus:    ({ element, index, url, layout }) => { /* image unfocused/zoomed out */ },

    // Loading lifecycle
    onBeforeImageLoad: ({ url, index, totalImages }) => { /* return URL override or fetch options */ },
    onImageLoaded:     ({ element, url, index, totalImages, loadTime }) => { /* image loaded */ },
    onImageError:      ({ url, index, totalImages }) => { /* image failed to load */ },
    onLoadProgress:    ({ loaded, failed, total, percent }) => { /* per-image progress */ },
    onGalleryReady:    ({ totalImages, failedImages, loadDuration }) => { /* all images displayed */ },

    // Entry animation lifecycle
    onEntryStart:    ({ element, index, from, to, duration }) => { /* animation begins */ },
    onEntryProgress: ({ index, progress, elapsed, current }) => { /* per-rAF frame (JS paths only) */ },
    onEntryComplete: ({ index, startTime, endTime, duration }) => { /* animation ends */ },

    // Layout
    onLayoutComplete: ({ layouts, containerBounds, algorithm, imageCount }) => { /* layout computed */ },
  }
});
```

### State Change Hooks

| Callback | Fired when |
| :--- | :--- |
| `onImageHover` | Cursor enters an image (`mouseenter`) |
| `onImageUnhover` | Cursor leaves an image (`mouseleave`) |
| `onImageFocus` | Image focus animation completes |
| `onImageUnfocus` | Image unfocus animation completes |

All four receive an `ImageStateContext`:

| Field | Type | Description |
| :--- | :--- | :--- |
| `element` | `HTMLElement` | The image element. |
| `index` | `number` | Zero-based index of this image in the gallery. |
| `url` | `string` | Original URL of the image. |
| `layout` | `ImageLayout` | Layout data (`x`, `y`, `rotation`, `scale`, `baseSize`). |

### Loading Lifecycle Hooks

#### `onBeforeImageLoad`

Intercepts each image before its `src` is set. Return a URL override, full `fetch()` options, or nothing.

```typescript
onBeforeImageLoad?: (ctx: BeforeLoadContext) =>
  BeforeLoadResult | void | Promise<BeforeLoadResult | void>;
```

`BeforeLoadContext`:

| Field | Type | Description |
| :--- | :--- | :--- |
| `url` | `string` | Original URL from the loader. |
| `index` | `number` | Zero-based index of this image. |
| `totalImages` | `number` | Total image count. |

`BeforeLoadResult` (all fields optional):

| Field | Type | Description |
| :--- | :--- | :--- |
| `url` | `string` | Override the image URL. |
| `fetch` | `RequestInit` | Full `fetch()` options — headers, credentials, cache, etc. |

**Mode A — URL-only** (return `{ url }`, no `fetch` key): The library sets `img.src = result.url`. Standard browser-cached `<img>` load — zero extra overhead.

```javascript
// CDN size param
onBeforeImageLoad: ({ url }) => ({ url: url + '?w=400&q=80' })

// Proxy
onBeforeImageLoad: ({ url }) => ({ url: `/proxy?src=${encodeURIComponent(url)}` })
```

**Mode B — Fetch mode** (return a `fetch` key): The library calls `fetch(url, result.fetch)`, converts the response to a blob URL, sets `img.src`, then revokes the blob after load. Bypasses browser image cache; requires CORS.

```javascript
// Bearer token auth
onBeforeImageLoad: () => ({
  fetch: { headers: { Authorization: `Bearer ${getToken()}` } }
})

// Async — refresh expired JWT before each load
onBeforeImageLoad: async () => {
  const token = await authClient.getValidToken();
  return { fetch: { headers: { Authorization: `Bearer ${token}` } } };
}
```

#### `onImageLoaded`

Fires after each image successfully loads (before it enters the display queue).

| Field | Type | Description |
| :--- | :--- | :--- |
| `element` | `HTMLImageElement` | The image element (dimensions available). |
| `url` | `string` | Original URL. |
| `index` | `number` | Zero-based index. |
| `totalImages` | `number` | Total image count. |
| `loadTime` | `number` | ms from `src` assignment to `onload`. |

#### `onImageError`

Fires when an image fails to load.

| Field | Type | Description |
| :--- | :--- | :--- |
| `url` | `string` | URL that failed. |
| `index` | `number` | Zero-based index. |
| `totalImages` | `number` | Total image count. |

#### `onLoadProgress`

Fires after each image either loads or errors — useful for progress bars.

| Field | Type | Description |
| :--- | :--- | :--- |
| `loaded` | `number` | Images successfully loaded so far. |
| `failed` | `number` | Images that errored so far. |
| `total` | `number` | Total expected images. |
| `percent` | `number` | `(loaded + failed) / total * 100` |

#### `onGalleryReady`

Fires once, after all images have been displayed (or errored) and the display queue is empty.

| Field | Type | Description |
| :--- | :--- | :--- |
| `totalImages` | `number` | Total image count. |
| `failedImages` | `number` | Count of images that failed to load. |
| `loadDuration` | `number` | ms from first `src` assignment to last image displayed. |

### Entry Animation Hooks

Per-frame lifecycle hooks for entry animations. Hooks are observational — the image always lands at its layout position regardless of what the hook does. `onEntryProgress` fires every rAF frame for JS-animated paths (`bounce`, `elastic`, `wave`) and is not fired for CSS-transitioned paths (`linear` without rotation/scale animation, since the browser compositor owns the interpolation).

| Callback | Fired when |
| :--- | :--- |
| `onEntryStart` | Animation begins (all path types) |
| `onEntryProgress` | Each rAF tick during JS-animated paths only |
| `onEntryComplete` | Animation finishes (all path types) |

`EntryAnimPoint` (used in `from`, `to`, and `current`):

| Field | Type | Description |
| :--- | :--- | :--- |
| `x` | `number` | Horizontal position (px). |
| `y` | `number` | Vertical position (px). |
| `rotation` | `number` | Rotation in degrees. |
| `scale` | `number` | Scale multiplier. |

`EntryStartContext`:

| Field | Type | Description |
| :--- | :--- | :--- |
| `element` | `HTMLElement` | The image element. |
| `index` | `number` | Zero-based gallery index. |
| `totalImages` | `number` | Total image count in this render. |
| `layout` | `ImageLayout` | Computed layout for this image. |
| `from` | `EntryAnimPoint` | Start position/rotation/scale. |
| `to` | `EntryAnimPoint` | Final position/rotation/scale (matches `layout`). |
| `startTime` | `number` | `performance.now()` at animation start. |
| `duration` | `number` | Total animation duration (ms). |

`onEntryProgress` extends `EntryStartContext` with:

| Field | Type | Description |
| :--- | :--- | :--- |
| `progress` | `number` | Linear time fraction `0.0 → 1.0`. |
| `rawProgress` | `number` | Same as `progress`. |
| `elapsed` | `number` | ms since `startTime`. |
| `current` | `EntryAnimPoint` | Current interpolated position/rotation/scale. |

`onEntryComplete`:

| Field | Type | Description |
| :--- | :--- | :--- |
| `element` | `HTMLElement` | The image element. |
| `index` | `number` | Zero-based gallery index. |
| `layout` | `ImageLayout` | Final layout. |
| `startTime` | `number` | `performance.now()` at animation start. |
| `endTime` | `number` | `performance.now()` at animation end. |
| `duration` | `number` | Total animation duration (ms). |

### Layout Hook

#### `onLayoutComplete`

Fires once per gallery render, after the layout algorithm has computed all image positions and before images begin loading. Re-fires on responsive resize if the image height breakpoint changes.

```typescript
onLayoutComplete?: (ctx: LayoutCompleteContext) => void;
```

| Field | Type | Description |
| :--- | :--- | :--- |
| `layouts` | `ImageLayout[]` | Shallow copy of the full computed layout. Do not mutate. |
| `containerBounds` | `ContainerBounds` | Container width and height at layout time. |
| `algorithm` | `LayoutAlgorithm` | The algorithm that produced this layout (e.g. `'radial'`). |
| `imageCount` | `number` | Number of images laid out. |

```javascript
// Example: log all image positions after layout
onLayoutComplete({ layouts, algorithm, imageCount }) {
  console.log(`${algorithm} layout: ${imageCount} images`);
  layouts.forEach((l, i) => console.log(`  #${i}: (${Math.round(l.x)}, ${Math.round(l.y)})`));
}
```

---

## Interaction

Controls user interactions like clicking and zooming.

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `focus.scalePercent` | `number` | `0.8` | Target size as percentage of container. Values 0-1 are fractions (0.8 = 80%), values > 1 are treated as percentages (80 = 80%). |
| `focus.zIndex` | `number` | `1000` | Z-index of the focused image. |
| `focus.animationDuration` | `number` | `600` | Focus/unfocus zoom animation duration (ms). Independent from `animation.duration`. |
| `dragging` | `boolean` | `true` | When `false`, sets `draggable="false"` on each image element, suppressing the browser's native click-drag behavior. |
| `navigation.keyboard` | `boolean` | `true` | When `false`, disables arrow key (← →), Escape, and Enter/Space keyboard navigation. Navigation is scoped to the gallery container — click the container to give it focus first. |
| `navigation.swipe` | `boolean` | `true` | When `false`, disables touch swipe gestures for navigating between focused images. Useful when the gallery is inside a scrollable container. |

**Focus Scaling Behavior:**

The focused image scales to fill a percentage of the container. The image maintains its aspect ratio and is constrained by both dimensions to ensure it fits within the container bounds.

```typescript
// Scale to 80% of container (default)
interaction: {
  focus: {
    scalePercent: 0.8
  }
}

// Using percentage notation (equivalent to 0.75)
interaction: {
  focus: {
    scalePercent: 75
  }
}
```

---

## UI

Controls UI elements shown during loading and interaction.

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `ui.showLoadingSpinner` | `boolean` | `false` | Show a spinner while loading images. |
| `ui.loadingElement` | `string \| HTMLElement` | `undefined` | Custom loading element (ID string or HTMLElement reference). If omitted and `showLoadingSpinner` is true, a default loading element is auto-created inside the container. |
| `ui.errorElement` | `string \| HTMLElement` | `undefined` | Custom error element (ID string or HTMLElement reference). If omitted, a default error element is auto-created inside the container. |
| `ui.showImageCounter` | `boolean` | `false` | Show a "1 of N" counter when an image is focused. Hidden when no image is focused. |
| `ui.counterElement` | `string \| HTMLElement` | `undefined` | Custom counter element (ID string or HTMLElement reference). If omitted and `showImageCounter` is true, a default counter is auto-created inside the container (positioned bottom-center, fixed). |
| `ui.showNavButtons` | `boolean` | `false` | Show prev/next buttons (‹ ›) when an image is focused. Hidden on unfocus. |
| `ui.prevButtonElement` | `string \| HTMLElement` | `undefined` | Custom prev button. If omitted, a default ‹ button is auto-created at left-center of container. |
| `ui.nextButtonElement` | `string \| HTMLElement` | `undefined` | Custom next button. If omitted, a default › button is auto-created at right-center of container. |
| `ui.showFocusOutline` | `boolean` | `false` | Controls the focus ring on the gallery container. When `false` (default), the browser's `:focus` outline is suppressed and a subtle accent outline appears only while an image is focused (indicating keyboard navigation is active). When `true`, the browser default `:focus` outline is always shown. |

**Customising the focus outline:**

When `showFocusOutline: false` (default), the library adds `fbn-ic-suppress-outline` to the container permanently and toggles `fbn-ic-has-focus` while an image is focused. Override the active outline via CSS:

```css
/* Custom focus indicator colour / style */
/* Use a negative outline-offset so the outline draws inside the element */
/* (prevents clipping by parent overflow:hidden) */
.fbn-ic-gallery.fbn-ic-has-focus {
  outline: 3px solid hotpink;
  outline-offset: -6px;
}
```

The default appearance uses the library's accent colour (`#6366f1`). You can also remove the indicator entirely:

```css
.fbn-ic-gallery.fbn-ic-has-focus {
  outline: none;
}
```

---

## Debug

Controls debug output and visual debugging aids. All debug options default to `false`.

```typescript
config: {
  debug: {
    enabled: true,   // General logging (was top-level `debug`)
    centers: true,   // Center position markers (was `layout.debugCenters`)
    loaders: true    // Loader debug output (was `config.loaders.debugLogging`)
  }
}
```

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `config.debug.enabled` | `boolean` | `false` | Enable general debug logging to console. |
| `config.debug.centers` | `boolean` | `false` | Show markers at calculated image center positions. |
| `config.debug.loaders` | `boolean` | `false` | Enable debug output for image loaders. |

**Note:** The old paths (`debug`, `layout.debugCenters`, `config.loaders.debugLogging`) have been removed. Use `config.debug.*` instead.

---

## Complete JSON Reference

All available parameters with example values:

```jsonc
{
  "container": "imageCloud",                    // ID of the container element (string ID or HTMLElement in JS/TS)
  // Debug: use config.debug (see below)

  "images": [                                   // Shorthand: array of image URLs
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg"
  ],

  "loaders": [                                  // Array of loader entries
    {
      "static": {                               // Key-based loader identification
        "sources": [                            // Required
          {
            "urls": [                           // Shape-based: URLs source
              "https://example.com/image1.jpg",
              "https://example.com/image2.jpg"
            ]
          },
          {
            "path": "/images/gallery/",         // Shape-based: Path source
            "files": ["photo1.jpg", "photo2.png"]
          },
          {
            "json": "https://api.example.com/images.json"  // Shape-based: JSON source
          }
        ],
        "validateUrls": true,                   // Default (per-loader override)
        "validationTimeout": 5000,              // Default
        "validationMethod": "head",             // Default. "head" | "simple" | "none"
        "allowedExtensions": ["jpg", "jpeg", "png", "gif", "webp", "bmp"],  // Default
        "debugLogging": false                   // Default
      }
    },
    {
      "googleDrive": {                          // Key-based loader identification
        "apiKey": "YOUR_GOOGLE_API_KEY",        // Required
        "sources": [                            // Required
          {
            "folders": [                        // Shape-based: Folder source
              "https://drive.google.com/drive/folders/FOLDER_ID"
            ],
            "recursive": true                   // Include subfolders
          },
          {
            "files": [                          // Shape-based: Files source
              "https://drive.google.com/file/d/FILE_ID_1",
              "https://drive.google.com/file/d/FILE_ID_2"
            ]
          }
        ],
        "apiEndpoint": "https://www.googleapis.com/drive/v3/files",  // Default
        "allowedExtensions": ["jpg", "jpeg", "png", "gif", "webp", "bmp"],  // Default
        "debugLogging": false                   // Default
      }
    }
  ],

  "config": {
    "loaders": {                                // Shared loader settings
      "validateUrls": true,                     // Default
      "validationTimeout": 5000,                // Default. Timeout in ms
      "validationMethod": "head",               // Default. "head" | "simple" | "none"
      "allowedExtensions": ["jpg", "jpeg", "png", "gif", "webp", "bmp"],  // Default
    },
    "debug": {                                  // Debug configuration
      "enabled": false,                         // Default. General debug logging
      "centers": false,                         // Default. Show center markers
      "loaders": false                          // Default. Loader debug output
    }
  },

  "image": {
    "sizing": {
      "mode": "adaptive",                       // "fixed" | "responsive" | "adaptive"
      // Fixed mode: single height
      "height": 150,                            // number for fixed mode
      // Responsive mode: per-breakpoint heights
      // "height": { "mobile": 100, "tablet": 150, "screen": 200 },
      // Adaptive mode only:
      "minSize": 50,                            // Default. Minimum image height
      "maxSize": 400,                           // Default. Maximum image height
      // All modes:
      "variance": {
        "min": 1.0,                             // Default. Min scale (0.25-1.0)
        "max": 1.0                              // Default. Max scale (1.0-1.75)
      }
    },
    "rotation": {
      "mode": "none",                           // Default. "none" | "random" | "tangent"
      "range": {
        "min": -15,                             // Default. Degrees (-180 to 0)
        "max": 15                               // Default. Degrees (0 to 180)
      }
    }
  },

  "layout": {
    "algorithm": "radial",                      // Default. "radial" | "random" | "grid" | "spiral" | "cluster" | "wave"
    "targetCoverage": 0.6,                      // Default. Target % of container to fill (0-1)
    "densityFactor": 1.0,                       // Default. Multiplier for calculated sizes
    "scaleDecay": 0,                            // Default. 0-1 outer image size reduction (spiral/radial)
    "responsive": {                             // Responsive breakpoints
      "mobile": { "maxWidth": 767 },            // Default. Mobile breakpoint
      "tablet": { "maxWidth": 1199 }            // Default. Tablet breakpoint (screen > tablet)
    },

    "spacing": {
      "padding": 50,                            // Default. Container padding in px
    },

    // Grid algorithm options
    "grid": {
      "columns": "auto",                        // Default. number | "auto"
      "rows": "auto",                           // Default. number | "auto"
      "stagger": "none",                        // Default. "none" | "row" | "column"
      "jitter": 0,                              // Default. 0-1 random offset
      "overlap": 0,                             // Default. 0-1+ size multiplier
      "fillDirection": "row",                   // Default. "row" | "column"
      "alignment": "center",                    // Default. "start" | "center" | "end"
      "gap": 10,                                // Default. Pixels between cells
      "overflowOffset": 0.25                    // Default. 0-0.5 offset for overflow stacking
    },

    // Spiral algorithm options
    "spiral": {
      "spiralType": "golden",                   // Default. "golden" | "archimedean" | "logarithmic"
      "direction": "counterclockwise",          // Default. "clockwise" | "counterclockwise"
      "tightness": 1.0,                         // Default. Spiral arm spacing
      "startAngle": 0                           // Default. Initial angle in radians
    },

    // Cluster algorithm options
    "cluster": {
      "clusterCount": "auto",                   // Default. number | "auto"
      "clusterSpread": 150,                     // Default. Pixels from cluster center
      "clusterSpacing": 200,                    // Default. Min distance between clusters
      "density": "uniform",                     // Default. "uniform" | "varied"
      "overlap": 0.3,                           // Default. 0-1 overlap within clusters
      "distribution": "gaussian"                // Default. "gaussian" | "uniform"
    },

    // Wave algorithm options
    "wave": {
      "rows": 1,                                // Default. Number of wave rows
      "amplitude": 100,                         // Default. Wave height in pixels
      "frequency": 2,                           // Default. Complete waves across width
      "phaseShift": 0,                          // Default. Phase offset in radians
      "synchronization": "offset"               // Default. "offset" | "synchronized" | "alternating"
      // Note: Wave image rotation is controlled via image.rotation.mode = 'tangent'
    }
  },

  "animation": {
    "duration": 600,                            // Default. Animation duration in ms

    "easing": {
      "default": "cubic-bezier(0.4, 0.0, 0.2, 1)",        // Default
      "bounce": "cubic-bezier(0.68, -0.55, 0.265, 1.55)", // Default
      "focus": "cubic-bezier(0.4, 0.0, 0.2, 1)"           // Default
    },

    "queue": {
      "enabled": true,                          // Default
      "interval": 150                           // Default. Delay between each image (ms)
    },

    "entry": {
      "start": {
        "position": "nearest-edge",             // Default. See docs for all options
        "offset": 100,                          // Default. Pixels beyond edge
        "circular": {
          "radius": "120%",                     // Default. Pixels or % of diagonal
          "distribution": "even"                // Default. "even" | "random"
        }
      },
      "timing": {
        "duration": 600                         // Default. Entry animation duration
      },
      "easing": "cubic-bezier(0.25, 1, 0.5, 1)", // Default. Entry animation easing
      "path": {
        "type": "linear",                       // Default. "linear" | "bounce" | "elastic" | "wave"
        "bouncePreset": "playful",              // "energetic" | "playful" | "subtle"
        "elasticPreset": "gentle",              // "gentle" | "bouncy" | "wobbly" | "snappy"
        "wavePreset": "gentle",                 // "gentle" | "playful" | "serpentine" | "flutter"
        "bounce": {
          "overshoot": 0.15,                    // Default. 0.1-0.3
          "bounces": 1,                         // 1, 2, or 3
          "decayRatio": 0.5                     // Default. 0.3-0.7
        },
        "elastic": {
          "stiffness": 200,                     // Default. 100-500
          "damping": 20,                        // Default. 10-50
          "mass": 1,                            // Default. 0.5-3
          "oscillations": 3                     // Default. 2-5
        },
        "wave": {
          "amplitude": 40,                      // Default. 20-100px
          "frequency": 2,                       // Default. 1-4
          "decay": true,                        // Default
          "decayRate": 0.8,                     // Default. 0.5-1
          "phase": 0                            // Default. 0-2π
        }
      },
      "rotation": {
        "mode": "none",                         // Default. "none" | "spin" | "settle" | "random" | "wobble"
        "spinCount": 1,                         // Default. Full rotations for spin mode
        "direction": "clockwise",               // Default. "clockwise" | "counterclockwise" | "auto" | "random"
        "startRotation": {                      // For settle mode
          "min": -45,                           // Default. Min start angle
          "max": 45                             // Default. Max start angle
        },
        "wobble": {
          "amplitude": 15,                      // Default. Max wobble angle in degrees
          "frequency": 3                        // Default. Number of oscillations
        }
      },
      "scale": {
        "mode": "none",                         // Default. "none" | "grow" | "shrink" | "pop" | "random"
        "startScale": 0.3,                      // Default for grow mode. Start scale multiplier
        "range": {                              // For random mode
          "min": 0.5,                           // Default. Min scale
          "max": 1.0                            // Default. Max scale
        },
        "pop": {
          "overshoot": 1.2,                     // Default. How much to overshoot (1.05-1.5)
          "bounces": 1                          // Default. Number of bounces (1-3)
        }
      }
    }
  },

  "interaction": {
    "focus": {
      "scalePercent": 0.8,                      // Default. 0-1 as fraction, 1-100 as percent
      "zIndex": 1000                            // Default
    },
    "navigation": {
      "keyboard": true,                         // Default. Set false to disable keyboard nav
      "swipe": true                             // Default. Set false to disable swipe gestures
    }
  },

  "ui": {
    "showLoadingSpinner": false,                // Default
    "showImageCounter": false                   // Default
  },

  "styling": {
    "default": {
      "className": "",                          // CSS class names (string or array)
      "border": {
        "width": 0,                             // Default. Border width in pixels
        "color": "#000000",                     // Default. Border color
        "radius": 0,                            // Default. Border radius in pixels
        "style": "solid"                        // Default. "solid" | "dashed" | "dotted" | "double" | "none" | "groove" | "ridge" | "inset" | "outset" | "hidden"
      },
      "borderTop": {},                          // Override for top border
      "borderRight": {},                        // Override for right border
      "borderBottom": {},                       // Override for bottom border
      "borderLeft": {},                         // Override for left border
      "shadow": "none",                          // Default. "none" | "sm" | "md" | "lg" | "glow" or CSS
      "filter": {
        "grayscale": 0,                         // 0-1
        "blur": 0,                              // pixels
        "brightness": 1,                        // multiplier
        "contrast": 1,                          // multiplier
        "saturate": 1,                          // multiplier
        "opacity": 1,                           // 0-1
        "sepia": 0,                             // 0-1
        "hueRotate": 0,                         // degrees
        "invert": 0                             // 0-1
      },
      "opacity": 1,                             // Default. 0-1
      "cursor": "pointer",                      // Default. CSS cursor value
      "outline": {
        "width": 0,                             // Default. Outline width in pixels
        "color": "#000000",                     // Default. Outline color
        "style": "solid",                       // Default. "solid" | "dashed" | "dotted" | "none"
        "offset": 0                             // Default. Outline offset in pixels
      },
      "objectFit": "cover",                     // CSS object-fit value
      "aspectRatio": ""                         // CSS aspect-ratio (e.g., "16/9")
    },
    "hover": {
      "shadow": "none"                          // Default. Applied on mouse hover
    },
    "focused": {
      "shadow": "none"                          // Default. Applied when image is clicked/focused
    }
  }
}
```

---

## Complete Examples

### Grid Gallery with Stagger

```typescript
const gallery = new ImageCloud({
  container: 'my-gallery',
  images: [...],
  image: {
    sizing: {
      mode: 'fixed',
      height: 120
    }
  },
  layout: {
    algorithm: 'grid',
    grid: {
      columns: 4,
      stagger: 'row',
      jitter: 0.2,
      overlap: 0.1,
      gap: 15
    }
  }
});
```

### Golden Spiral with Scale Decay

```typescript
const gallery = new ImageCloud({
  container: 'my-gallery',
  images: [...],
  image: {
    sizing: {
      mode: 'fixed',
      height: 100
    }
  },
  layout: {
    algorithm: 'spiral',
    scaleDecay: 0.4,  // Outer images 20% smaller
    spiral: {
      spiralType: 'golden',
      direction: 'counterclockwise',
      tightness: 1.0
    }
  }
});
```

### Clustered Photo Pile

```typescript
const gallery = new ImageCloud({
  container: 'my-gallery',
  images: [...],
  image: {
    sizing: {
      mode: 'fixed',
      height: 90
    },
    rotation: {
      mode: 'random',
      range: { min: -20, max: 20 }  // More rotation for organic feel
    }
  },
  layout: {
    algorithm: 'cluster',
    cluster: {
      clusterCount: 3,
      clusterSpread: 100,
      clusterSpacing: 250,
      overlap: 0.5,
      distribution: 'gaussian'
    }
  }
});
```

### Minimal Grid (No Overlap)

```typescript
const gallery = new ImageCloud({
  container: 'my-gallery',
  images: [...],
  image: {
    rotation: { mode: 'none' }  // No rotation for clean grid
  },
  layout: {
    algorithm: 'grid',
    grid: {
      columns: 'auto',
      rows: 'auto',
      stagger: 'none',
      jitter: 0,
      overlap: 0,
      gap: 20
    }
  }
});
```

### Archimedean Spiral

```typescript
const gallery = new ImageCloud({
  container: 'my-gallery',
  images: [...],
  image: {
    sizing: {
      mode: 'fixed',
      height: 80
    }
  },
  layout: {
    algorithm: 'spiral',
    spiral: {
      spiralType: 'archimedean',
      direction: 'clockwise',
      tightness: 0.8  // Looser spiral
    }
  }
});
```

### Google Drive Loader (Minimal)

```jsonc
{
  "container": "imageCloud",
  "loaders": [{
    "googleDrive": {
      "apiKey": "YOUR_API_KEY",
      "sources": [
        {
          "folders": ["https://drive.google.com/drive/folders/FOLDER_ID"]
        }
      ]
    }
  }]
}
```

### Static Loader (Minimal)

```jsonc
{
  "container": "imageCloud",
  "loaders": [{
    "static": {
      "sources": [
        {
          "urls": [
            "https://example.com/image1.jpg",
            "https://example.com/image2.jpg"
          ]
        }
      ]
    }
  }]
}
```

### Static Loader (Images Shorthand)

```jsonc
{
  "container": "imageCloud",
  "images": [
    "https://example.com/photo1.jpg",
    "https://example.com/photo2.jpg",
    "https://example.com/photo3.jpg"
  ]
}
```

### Static Loader (JSON Endpoint)

```jsonc
{
  "container": "imageCloud",
  "loaders": [{
    "static": {
      "sources": [
        { "json": "https://api.example.com/gallery/images.json" }
      ]
    }
  }]
}
```

### Multiple Loaders (Composite)

```jsonc
{
  "container": "imageCloud",
  "loaders": [
    {
      "googleDrive": {
        "apiKey": "YOUR_API_KEY",
        "sources": [
          {
            "folders": ["https://drive.google.com/drive/folders/FOLDER_ID"]
          }
        ]
      }
    },
    {
      "static": {
        "sources": [
          {
            "urls": [
              "https://example.com/extra1.jpg",
              "https://example.com/extra2.jpg"
            ]
          }
        ]
      }
    }
  ]
}
```

### Entry Animation: Center Burst

```typescript
const gallery = new ImageCloud({
  container: 'my-gallery',
  images: [...],
  image: {
    sizing: { mode: 'fixed', height: 100 }
  },
  layout: {
    algorithm: 'radial'
  },
  animation: {
    entry: {
      start: { position: 'center' },
      timing: { duration: 500 }
    }
  }
});
```

### Entry Animation: Top Cascade (Grid)

```typescript
const gallery = new ImageCloud({
  container: 'my-gallery',
  images: [...],
  image: {
    sizing: { mode: 'fixed', height: 120 }
  },
  layout: {
    algorithm: 'grid',
    grid: { columns: 4, gap: 15 }
  },
  animation: {
    entry: {
      start: { position: 'top' },
      timing: { duration: 800 },
      easing: 'ease-out'
    }
  }
});
```
