# Configuration Parameters

The Image Cloud library offers a flexible configuration system to customize every aspect of the gallery, from image loading to animation dynamics.

## Table of Contents

- [Pattern-Based Configuration](#pattern-based-configuration)
- [Loader Configuration](#1-loader-configuration-loader)
  - [Google Drive Loader](#google-drive-config-loadergoogledrive)
  - [Static Loader](#static-loader-config-loaderstatic)
  - [Composite Loader](#composite-loader-programmatic-only)
- [Image Configuration](#2-image-configuration-image)
- [Layout Configuration](#3-layout-configuration-layout)
  - [Layout Algorithms](#layout-algorithms)
  - [Grid Algorithm](#grid-algorithm)
  - [Spiral Algorithm](#spiral-algorithm)
  - [Cluster Algorithm](#cluster-algorithm)
  - [Wave Algorithm](#wave-algorithm)
  - [Radial Algorithm](#radial-algorithm)
  - [Random Algorithm](#random-algorithm)
- [Animation Configuration](#4-animation-configuration-animation)
- [Entry Animation](#entry-animation)
- [Entry Animation Paths](#entry-animation-paths)
- [Interaction Configuration](#5-interaction-configuration-interaction)
- [Rendering Configuration](#6-rendering-configuration-rendering)
- [Complete JSON Reference](#complete-json-reference)
- [Complete Examples](#complete-examples)

---

## Pattern-Based Configuration

Initialize the gallery using the `ImageCloudOptions` structure.

```typescript
const gallery = new ImageCloud({
  container: 'my-gallery-id', // optional, defaults to 'imageCloud'
  loader: { ... },
  image: { ... },
  layout: { ... },
  animation: { ... },
  interaction: { ... },
  rendering: { ... },
  debug: false
});
```

### 1. Loader Configuration (`loader`)

Controls how images are fetched and validated.

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `type` | `'googleDrive' \| 'static' \| 'composite'` | `'googleDrive'` | The primary source type for images. |
| `googleDrive` | `GoogleDriveLoaderConfig` | *See below* | Configuration for Google Drive loading. |
| `static` | `StaticLoaderConfig` | *See below* | Configuration for static image loading. |
| `composite` | `CompositeLoaderConfig` | *See below* | Configuration for combining multiple loaders. |

#### Google Drive Config (`loader.googleDrive`)

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `apiKey` | `string` | `''` | **Required.** Your Google Drive API Key. |
| `sources` | `GoogleDriveSource[]` | `[]` | **Required.** Array of folder or file sources. |
| `apiEndpoint` | `string` | `'https://www.googleapis.com/drive/v3/files'` | Google Drive API endpoint. |
| `allowedExtensions` | `string[]` | `['jpg', 'jpeg', ...]` | Allowed image file extensions. |
| `debugLogging` | `boolean` | `false` | Enable debug logs for the loader. |

**Google Drive Source Objects:**
*   **Folder:** `{ type: 'folder', folders: string[], recursive?: boolean }`
*   **Files:** `{ type: 'files', files: string[] }`

#### Static Loader Config (`loader.static`)

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `sources` | `StaticSource[]` | `[]` | **Required.** Array of static sources. |
| `validateUrls` | `boolean` | `true` | Check if image URLs exist before loading. |
| `validationTimeout` | `number` | `5000` | Timeout (ms) for URL validation. |
| `validationMethod` | `'head' \| 'simple' \| 'none'` | `'head'` | Method used to validate URLs. |
| `failOnAllMissing` | `boolean` | `true` | Throw error if no images are found. |
| `allowedExtensions` | `string[]` | `['jpg', 'jpeg', ...]` | Allowed image file extensions. |

**Static Source Objects:**
*   **URLs:** `{ type: 'urls', urls: string[] }`
*   **Path:** `{ type: 'path', basePath: string, files: string[] }`

#### Composite Loader (`loader.composite`)

The `CompositeLoader` combines multiple loaders of any type and loads them in parallel. This is useful for combining images from different sources (e.g., Google Drive + static URLs).

```typescript
const gallery = new ImageCloud({
  container: 'my-gallery',
  loader: {
    type: 'composite',
    composite: {
      loaders: [
        {
          type: 'googleDrive',
          googleDrive: {
            apiKey: 'YOUR_API_KEY',
            sources: [{ type: 'folder', folders: ['https://drive.google.com/...'] }]
          }
        },
        {
          type: 'static',
          static: {
            sources: [{ type: 'urls', urls: ['https://example.com/image1.jpg'] }]
          }
        }
      ],
      debugLogging: false
    }
  }
});
```

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `loaders` | `LoaderConfig[]` | *Required* | Array of loader configurations (googleDrive, static, or nested composite). |
| `debugLogging` | `boolean` | `false` | Enable debug logs for the composite loader. |

**Behavior:**
- All loaders are prepared in parallel using `Promise.all()`
- If one loader fails, others continue (failed loader contributes 0 images)
- URLs are combined in the order loaders appear in the array
- Supports nesting (composite loaders can contain other composite loaders)

**Programmatic Usage:**

You can also create a CompositeLoader directly for more control:

```typescript
import { CompositeLoader, GoogleDriveLoader, StaticImageLoader, ImageFilter } from '@frybynite/image-cloud';

const compositeLoader = new CompositeLoader({
  loaders: [
    new GoogleDriveLoader({ apiKey: '...', sources: [...] }),
    new StaticImageLoader({ sources: [...] })
  ]
});

await compositeLoader.prepare(new ImageFilter());
console.log(compositeLoader.imageURLs());  // Combined URLs
```

### 2. Image Configuration (`image`)

Controls image-specific sizing and rotation behavior. This is the recommended way to configure image properties.

```typescript
image: {
  sizing: {
    baseHeight?: number | {        // Optional - if not set, layouts auto-calculate
      default: number,             // Base height for large screens
      tablet?: number,             // Height for tablet
      mobile?: number              // Height for mobile
    },
    variance?: {
      min: number,                 // > 0.1 and < 1 (e.g., 0.8)
      max: number                  // > 1 and < 2 (e.g., 1.2)
    },
    scaleDecay?: number            // For Radial/Spiral - progressive size reduction (0-1)
  },
  rotation: {
    mode: 'none' | 'random' | 'tangent',  // default: 'none'
    range?: {
      min: number,                 // Negative degrees (-180 to 0)
      max: number                  // Positive degrees (0 to 180)
    }
  }
}
```

#### Image Sizing (`image.sizing`)

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `baseHeight` | `number \| ResponsiveBaseHeight` | *auto* | Base image height. If not set, layouts auto-calculate based on `targetCoverage`. |
| `variance.min` | `number` | `1.0` | Minimum size multiplier. Must be > 0.1 and < 1.0. |
| `variance.max` | `number` | `1.0` | Maximum size multiplier. Must be > 1.0 and < 2.0. |
| `scaleDecay` | `number` | `0` | Progressive size reduction for Radial/Spiral layouts (0-1). |

**Responsive baseHeight:**
```typescript
image: {
  sizing: {
    baseHeight: {
      default: 200,   // Desktop
      tablet: 150,    // Tablet (uses rendering.responsive.breakpoints.tablet)
      mobile: 100     // Mobile (uses rendering.responsive.breakpoints.mobile)
    }
  }
}
```

#### Image Rotation (`image.rotation`)

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
  rotation: { mode: 'tangent' },
  sizing: { scaleDecay: 0.5 }
},
layout: { algorithm: 'spiral' }
```

---

### 3. Layout Configuration (`layout`)

Controls the positioning and sizing of images.

```typescript
layout: {
  algorithm: 'radial' | 'random' | 'grid' | 'spiral' | 'cluster' | 'wave',
  targetCoverage?: number,         // 0-1, for auto-sizing when baseHeight not set (default: 0.6)
  densityFactor?: number,          // Controls spacing density (default: 1.0)
  sizing: LayoutSizingConfig,
  spacing: LayoutSpacingConfig,
  // Algorithm-specific options
  grid?: GridAlgorithmConfig,
  spiral?: SpiralAlgorithmConfig,
  cluster?: ClusterAlgorithmConfig,
  wave?: WaveAlgorithmConfig
}
```

#### Base Layout Options

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `algorithm` | `string` | `'radial'` | Layout algorithm: `'radial'`, `'random'`, `'grid'`, `'spiral'`, `'cluster'`, `'wave'` |
| `targetCoverage` | `number` | `0.6` | Target percentage of container to fill (0.0-1.0) when `image.sizing.baseHeight` is not set |
| `densityFactor` | `number` | `1.0` | Multiplier for calculated sizes and spacing |
| `debugRadials` | `boolean` | `false` | Visualize the radial layout structure (debug). |
| `sizing` | `LayoutSizingConfig` | *See below* | Configuration for image dimensions. |
| `spacing` | `LayoutSpacingConfig` | *See below* | Configuration for margins and gaps. |

---

## Layout Algorithms

### Grid Algorithm

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
    gap: 10               // pixels between cells
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

**Visual characteristics:**
- Clean, organized, professional
- Great for galleries, portfolios, product displays
- `stagger: 'row'` gives a brick/masonry feel
- `jitter` + `overlap` creates a "scattered on table" look

---

### Spiral Algorithm

Images placed along a spiral path emanating from the center.

```typescript
layout: {
  algorithm: 'spiral',
  spiral: {
    spiralType: 'golden',        // 'golden' | 'archimedean' | 'logarithmic'
    direction: 'counterclockwise', // 'clockwise' | 'counterclockwise'
    tightness: 1.0,              // spacing between spiral arms
    scaleDecay: 0,               // 0-1, outer images smaller
    startAngle: 0                // initial rotation offset in radians
  }
}
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `spiralType` | `string` | `'golden'` | Spiral pattern type |
| `direction` | `string` | `'counterclockwise'` | Spiral rotation direction |
| `tightness` | `number` | `1.0` | How tightly wound (higher = tighter) |
| `scaleDecay` | `number` | `0` | Size reduction for outer images (0 = none, 1 = 50% smaller at edge) |
| `startAngle` | `number` | `0` | Starting angle offset in radians |

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

### Cluster Algorithm

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

### Wave Algorithm

Images positioned along flowing sine wave curves with extensive configuration.

```typescript
layout: {
  algorithm: 'wave',
  wave: {
    rows: 3,                      // number of wave rows
    amplitude: 100,               // wave height in pixels
    frequency: 2,                 // complete waves across width
    phaseShift: Math.PI / 3,      // phase offset between rows (radians)
    synchronization: 'offset',    // 'offset' | 'synchronized' | 'alternating'
    orientation: 'follow'         // 'follow' | 'upright'
  }
}
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `rows` | `number` | `1` | Number of horizontal wave rows to create |
| `amplitude` | `number` | `100` | Height of wave oscillation in pixels |
| `frequency` | `number` | `2` | Number of complete wave cycles across container width |
| `phaseShift` | `number` | `0` | Phase offset between rows in radians (only for 'offset' sync) |
| `synchronization` | `string` | `'offset'` | How waves align: `'offset'` (staggered), `'synchronized'` (peaks align), `'alternating'` (opposite directions) |
| `orientation` | `string` | `'follow'` | Image rotation: `'follow'` (tilt with wave curve), `'upright'` (no wave-based rotation) |

**Synchronization Modes:**
- `'offset'` - Each row is shifted horizontally by `phaseShift`, creating a flowing, staggered pattern
- `'synchronized'` - All rows have peaks at the same horizontal positions, creating vertical alignment
- `'alternating'` - Adjacent rows go opposite directions (180° phase shift), creating a woven pattern

**Orientation Modes:**
- `'follow'` - Images rotate to follow the wave tangent, creating a flowing, dynamic effect
- `'upright'` - Images remain horizontally oriented (standard rotation config still applies)

**Visual characteristics:**
- Flowing, rhythmic, dynamic feel
- Creates horizontal movement across the display
- Works well with 10-50+ images
- Great for timeline-like displays or artistic presentations
- `follow` orientation creates natural flow along curves
- Multiple synchronization modes offer varied aesthetics

**Examples:**

Single gentle wave:
```typescript
wave: {
  rows: 1,
  amplitude: 80,
  frequency: 1.5,
  orientation: 'follow'
}
```

Tightly packed alternating waves:
```typescript
wave: {
  rows: 5,
  amplitude: 120,
  frequency: 3,
  synchronization: 'alternating',
  orientation: 'follow'
}
```

Synchronized waves (vertical columns):
```typescript
wave: {
  rows: 4,
  amplitude: 100,
  frequency: 2,
  synchronization: 'synchronized',
  orientation: 'upright'
}
```

---

### Radial Algorithm

Concentric rings emanating from center (built-in).

```typescript
layout: {
  algorithm: 'radial',
  debugRadials: false  // Show colored borders per ring
}
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `debugRadials` | `boolean` | `false` | Color-code images by ring for debugging |

**Visual characteristics:**
- Center image prominently featured
- Elliptical rings (wider than tall)
- Automatic ring calculation based on image count
- Great for hero/featured content

---

### Random Algorithm

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

## Layout Sizing (`layout.sizing`)

Controls image sizing behavior at the layout level.

```typescript
layout: {
  sizing: {
    base: 200,           // Base height in pixels (fallback)
    responsive: [
      { minWidth: 1200, height: 225 },
      { minWidth: 768, height: 180 },
      { minWidth: 0, height: 100 }
    ],
    adaptive: {
      enabled: true,
      minSize: 50,
      maxSize: 400
    }
  }
}
```

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `base` | `number` | `200` | Base height of images in pixels. |
| `responsive` | `ResponsiveHeight[]` | *See above* | Array of `{ minWidth, height }` objects for responsive sizing. |
| `adaptive.enabled` | `boolean` | `true` | Enable auto-sizing |
| `adaptive.minSize` | `number` | `50` | Minimum image height |
| `adaptive.maxSize` | `number` | `400` | Maximum image height |

> **Note:** For image-specific sizing like `variance`, `baseHeight`, and `scaleDecay`, see [Image Configuration](#2-image-configuration-image).

#### Spacing (`layout.spacing`)

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `padding` | `number` | `50` | Padding from container edges (px). |
| `minGap` | `number` | `20` | Minimum space between images (px). |

### 4. Animation Configuration (`animation`)

Controls entrance and interaction animations.

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `duration` | `number` | `600` | Base animation duration (ms). |
| `easing.default` | `string` | `cubic-bezier(...)` | CSS easing string for standard moves. |
| `easing.bounce` | `string` | `cubic-bezier(...)` | CSS easing for entrance bounce. |
| `easing.focus` | `string` | `cubic-bezier(...)` | CSS easing for zoom focus. |
| `queue.enabled` | `boolean` | `true` | Enable staggered entrance. |
| `queue.interval` | `number` | `150` | Time between appearance of each image (ms). |
| `entry` | `EntryAnimationConfig` | *See below* | Entry animation configuration. |

---

## Entry Animation

Controls how images animate into the gallery when it first loads. Supports 8 different start positions and layout-aware smart defaults.

### Configuration Structure

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
      duration: 600,             // Animation duration (ms)
      stagger: 150               // Delay between images (ms)
    },
    easing: 'cubic-bezier(0.25, 1, 0.5, 1)'  // CSS easing
  }
}
```

### Parameters

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `start.position` | `string` | `'nearest-edge'` | Starting position for images |
| `start.offset` | `number` | `100` | Pixels beyond edge (for edge-based positions) |
| `start.circular.radius` | `number \| string` | `'120%'` | Circle radius in pixels or % of container diagonal |
| `start.circular.distribution` | `string` | `'even'` | `'even'` (evenly spaced) or `'random'` |
| `timing.duration` | `number` | `600` | Animation duration in milliseconds |
| `timing.stagger` | `number` | `150` | Delay between each image's animation start |
| `easing` | `string` | `cubic-bezier(0.25, 1, 0.5, 1)` | CSS easing function |

### Start Position Options

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

### Layout-Aware Smart Defaults

When you don't specify `start.position`, the library automatically chooses the best default based on your layout algorithm:

| Layout Algorithm | Default Entry | Why |
|------------------|---------------|-----|
| `radial` | `center` | Images radiate outward, matching the radial pattern |
| `spiral` | `center` | Spiral emanates from center, so entry should too |
| `grid` | `top` | Natural top-to-bottom reading order |
| `cluster` | `nearest-edge` | Organic grouping feel, images "find" their cluster |
| `random` | `nearest-edge` | Classic scattered photo effect |

### Examples

**Default behavior (no config needed):**
```typescript
// Uses layout-aware defaults automatically
const gallery = new ImageCloud({
  container: 'my-gallery',
  loader: { ... },
  layout: { algorithm: 'radial' }  // Will use 'center' entry by default
});
```

**Center burst with fast stagger:**
```typescript
animation: {
  entry: {
    start: { position: 'center' },
    timing: { duration: 500, stagger: 50 }
  }
}
```

**Cascade from top (great for grids):**
```typescript
animation: {
  entry: {
    start: { position: 'top' },
    timing: { duration: 800, stagger: 100 },
    easing: 'ease-out'
  }
}
```

**Circular entrance with even distribution:**
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
    timing: { duration: 1000, stagger: 80 }
  }
}
```

**Circular entrance with percentage radius:**
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
    timing: { duration: 1200, stagger: 60 }
  }
}
```

**Slow dramatic entrance from bottom:**
```typescript
animation: {
  entry: {
    start: { position: 'bottom', offset: 200 },
    timing: { duration: 1500, stagger: 200 },
    easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)'  // Overshoot easing
  }
}
```

**Random edge for chaotic effect:**
```typescript
animation: {
  entry: {
    start: { position: 'random-edge' },
    timing: { duration: 600, stagger: 80 }
  }
}
```

---

## Entry Animation Paths

Controls the trajectory that images follow during their entry animation. By default, images travel in a straight line (linear). Advanced path types add dynamic motion effects.

### Configuration Structure

```typescript
animation: {
  entry: {
    start: { position: 'nearest-edge' },
    timing: { duration: 600, stagger: 150 },
    easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
    path: {
      type: 'bounce',                    // Path type
      bouncePreset: 'playful',           // Optional preset
      bounce: { overshoot: 0.2 }         // Optional overrides
    }
  }
}
```

### Path Types

| Type | Description | Best For |
|------|-------------|----------|
| `linear` | Straight line from start to end (default) | Clean, professional animations |
| `bounce` | Overshoot target, then settle back | Energetic, playful interfaces |
| `elastic` | Spring-like oscillation at end | Organic, natural feel |
| `wave` | Sinusoidal serpentine path | Dreamy, floating atmosphere |

### Bounce Path

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

**Presets:**

| Preset | Overshoot | Bounces | Feel |
|--------|-----------|---------|------|
| `energetic` | 0.25 | 2 | High energy, attention-grabbing |
| `playful` | 0.15 | 1 | Balanced, friendly |
| `subtle` | 0.08 | 1 | Minimal, professional |

**Example - Energetic bounce:**
```typescript
animation: {
  entry: {
    start: { position: 'top' },
    timing: { duration: 800 },
    path: { type: 'bounce', bouncePreset: 'energetic' }
  }
}
```

### Elastic Path

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

**Presets:**

| Preset | Stiffness | Damping | Feel |
|--------|-----------|---------|------|
| `gentle` | 150 | 30 | Soft, subtle spring |
| `bouncy` | 300 | 15 | Lively, energetic |
| `wobbly` | 180 | 12 | Jelly-like, playful |
| `snappy` | 400 | 25 | Quick, responsive |

**Example - Wobbly elastic:**
```typescript
animation: {
  entry: {
    start: { position: 'center' },
    timing: { duration: 1000 },
    path: { type: 'elastic', elasticPreset: 'wobbly' }
  }
}
```

### Wave Path

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

**Presets:**

| Preset | Amplitude | Frequency | Decay | Feel |
|--------|-----------|-----------|-------|------|
| `gentle` | 30 | 1.5 | yes | Soft, subtle wave |
| `playful` | 50 | 2.5 | yes | Fun, dynamic |
| `serpentine` | 60 | 3 | no | Dramatic snake path |
| `flutter` | 20 | 4 | yes | Light, quick oscillation |

**Example - Serpentine wave:**
```typescript
animation: {
  entry: {
    start: { position: 'left' },
    timing: { duration: 900 },
    path: { type: 'wave', wavePreset: 'serpentine' }
  }
}
```

### Combining with Start Positions

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

### Performance Notes

- **Linear/Arc**: Uses CSS transitions (most efficient)
- **Bounce/Elastic/Wave**: Uses JavaScript animation (requestAnimationFrame)
- All paths are optimized for smooth 60fps animation
- For galleries with 50+ images, consider using linear path or longer stagger times

---

### 5. Interaction Configuration (`interaction`)

Controls user interactions like clicking and zooming.

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `focus.scale` | `number` | `2.5` | Scale factor when an image is clicked. |
| `focus.mobileScale` | `number` | `2.0` | Scale factor on mobile devices. |
| `focus.unfocusedOpacity`| `number` | `0.3` | Opacity of non-selected images. |
| `focus.zIndex` | `number` | `1000` | Z-index of the focused image. |

### 6. Rendering Configuration (`rendering`)

Controls UI elements and responsiveness.

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `ui.showLoadingSpinner` | `boolean` | `false` | Show a spinner while loading images. |
| `responsive.breakpoints`| `object` | `{ mobile: 768 }`| Breakpoint definitions. |

### 6. Debug (`debug`)

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `debug` | `boolean` | `false` | Enable global debug logging. |

---

## Complete JSON Reference

All available parameters with example values:

```jsonc
{
  "container": "imageCloud",                    // ID of the container element
  "debug": false,                               // Default. Enable debug logging

  "loader": {
    "type": "googleDrive",                      // Default. "googleDrive" | "static"

    "googleDrive": {
      "apiKey": "YOUR_GOOGLE_API_KEY",          // Required
      "sources": [                              // Required
        {
          "type": "folder",                     // Load from folder(s)
          "folders": [
            "https://drive.google.com/drive/folders/FOLDER_ID"
          ],
          "recursive": true                     // Include subfolders
        },
        {
          "type": "files",                      // Load specific files
          "files": [
            "https://drive.google.com/file/d/FILE_ID_1",
            "https://drive.google.com/file/d/FILE_ID_2"
          ]
        }
      ],
      "apiEndpoint": "https://www.googleapis.com/drive/v3/files",  // Default
      "allowedExtensions": ["jpg", "jpeg", "png", "gif", "webp", "bmp"],  // Default
      "debugLogging": false                     // Default
    },

    "static": {
      "sources": [                              // Required
        {
          "type": "urls",                       // Direct image URLs
          "urls": [
            "https://example.com/image1.jpg",
            "https://example.com/image2.jpg"
          ]
        },
        {
          "type": "path",                       // Base path + filenames
          "basePath": "/images/gallery/",
          "files": ["photo1.jpg", "photo2.png"]
        }
      ],
      "validateUrls": true,                     // Default
      "validationTimeout": 5000,                // Default. Timeout in ms
      "validationMethod": "head",               // Default. "head" | "simple" | "none"
      "failOnAllMissing": true,                 // Default
      "allowedExtensions": ["jpg", "jpeg", "png", "gif", "webp", "bmp"],  // Default
      "debugLogging": false                     // Default
    },

    "composite": {
      "loaders": [                              // Required. Array of loader configs
        {
          "type": "googleDrive",
          "googleDrive": { /* ... */ }
        },
        {
          "type": "static",
          "static": { /* ... */ }
        }
      ],
      "debugLogging": false                     // Default
    }
  },

  "image": {
    "sizing": {
      "baseHeight": 200,                        // Optional. number or responsive object
      "variance": {
        "min": 1.0,                             // Default. Min scale (0.1-1.0)
        "max": 1.0                              // Default. Max scale (1.0-2.0)
      },
      "scaleDecay": 0                           // Default. For Radial/Spiral (0-1)
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
    "debugRadials": false,                      // Default

    "sizing": {
      "base": 200,                              // Default. Base image size in px
      "responsive": [                           // Default
        { "minWidth": 1200, "height": 225 },
        { "minWidth": 768, "height": 180 },
        { "minWidth": 0, "height": 100 }
      ],
      "adaptive": {
        "enabled": true,                        // Default
        "minSize": 50,                          // Default
        "maxSize": 400                          // Default
      }
    },

    "spacing": {
      "padding": 50,                            // Default. Container padding in px
      "minGap": 20                              // Default. Min gap between images
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
      "gap": 10                                 // Default. Pixels between cells
    },

    // Spiral algorithm options
    "spiral": {
      "spiralType": "golden",                   // Default. "golden" | "archimedean" | "logarithmic"
      "direction": "counterclockwise",          // Default. "clockwise" | "counterclockwise"
      "tightness": 1.0,                         // Default. Spiral arm spacing
      "scaleDecay": 0,                          // Default. 0-1 outer image size reduction
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
      "phaseShift": 0,                           // Default. Phase offset in radians
      "synchronization": "offset",              // Default. "offset" | "synchronized" | "alternating"
      "orientation": "follow"                   // Default. "follow" | "upright"
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
        "duration": 600,                        // Default. Entry animation duration
        "stagger": 150                          // Default. Delay between images
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
      }
    }
  },

  "interaction": {
    "focus": {
      "scale": 2.5,                             // Default
      "mobileScale": 2.0,                       // Default
      "unfocusedOpacity": 0.3,                  // Default
      "zIndex": 1000                            // Default
    }
  },

  "rendering": {
    "responsive": {
      "breakpoints": {
        "mobile": 768                           // Default
      }
    },

    "ui": {
      "showLoadingSpinner": false               // Default
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
  loader: {
    type: 'static',
    static: {
      sources: [{ type: 'urls', urls: [...] }]
    }
  },
  layout: {
    algorithm: 'grid',
    sizing: { base: 120 },
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
  loader: { ... },
  layout: {
    algorithm: 'spiral',
    sizing: { base: 100 },
    spiral: {
      spiralType: 'golden',
      direction: 'counterclockwise',
      tightness: 1.0,
      scaleDecay: 0.4  // Outer images 20% smaller
    }
  }
});
```

### Clustered Photo Pile

```typescript
const gallery = new ImageCloud({
  container: 'my-gallery',
  loader: { ... },
  image: {
    rotation: {
      mode: 'random',
      range: { min: -20, max: 20 }  // More rotation for organic feel
    }
  },
  layout: {
    algorithm: 'cluster',
    sizing: { base: 90 },
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
  loader: { ... },
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
  loader: { ... },
  layout: {
    algorithm: 'spiral',
    sizing: { base: 80 },
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
  "loader": {
    "type": "googleDrive",
    "googleDrive": {
      "apiKey": "YOUR_API_KEY",
      "sources": [
        {
          "type": "folder",
          "folders": ["https://drive.google.com/drive/folders/FOLDER_ID"]
        }
      ]
    }
  }
}
```

### Static Loader (Minimal)

```jsonc
{
  "container": "imageCloud",
  "loader": {
    "type": "static",
    "static": {
      "sources": [
        {
          "type": "urls",
          "urls": [
            "https://example.com/image1.jpg",
            "https://example.com/image2.jpg"
          ]
        }
      ]
    }
  }
}
```

### Composite Loader (Multiple Sources)

```jsonc
{
  "container": "imageCloud",
  "loader": {
    "type": "composite",
    "composite": {
      "loaders": [
        {
          "type": "googleDrive",
          "googleDrive": {
            "apiKey": "YOUR_API_KEY",
            "sources": [
              {
                "type": "folder",
                "folders": ["https://drive.google.com/drive/folders/FOLDER_ID"]
              }
            ]
          }
        },
        {
          "type": "static",
          "static": {
            "sources": [
              {
                "type": "urls",
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
  }
}
```

### Entry Animation: Center Burst

```typescript
const gallery = new ImageCloud({
  container: 'my-gallery',
  loader: {
    type: 'static',
    static: {
      sources: [{ type: 'urls', urls: [...] }]
    }
  },
  layout: {
    algorithm: 'radial',
    sizing: { base: 100 }
  },
  animation: {
    entry: {
      start: { position: 'center' },
      timing: { duration: 500, stagger: 50 }
    }
  }
});
```

### Entry Animation: Top Cascade (Grid)

```typescript
const gallery = new ImageCloud({
  container: 'my-gallery',
  loader: { ... },
  layout: {
    algorithm: 'grid',
    sizing: { base: 120 },
    grid: { columns: 4, gap: 15 }
  },
  animation: {
    entry: {
      start: { position: 'top' },
      timing: { duration: 800, stagger: 100 },
      easing: 'ease-out'
    }
  }
});
```

### Entry Animation: Circular Entrance

```typescript
const gallery = new ImageCloud({
  container: 'my-gallery',
  loader: { ... },
  layout: {
    algorithm: 'radial',
    sizing: { base: 90 }
  },
  animation: {
    entry: {
      start: {
        position: 'circular',
        circular: {
          radius: '120%',        // 120% of container diagonal
          distribution: 'even'   // Evenly distributed on circle
        }
      },
      timing: { duration: 1000, stagger: 80 }
    }
  }
});
```

### Entry Animation: JSON Format

```jsonc
{
  "container": "imageCloud",
  "loader": {
    "type": "static",
    "static": {
      "sources": [
        {
          "type": "urls",
          "urls": ["https://example.com/image1.jpg", "https://example.com/image2.jpg"]
        }
      ]
    }
  },
  "layout": {
    "algorithm": "spiral",
    "sizing": { "base": 100 }
  },
  "animation": {
    "entry": {
      "start": {
        "position": "center"
      },
      "timing": {
        "duration": 600,
        "stagger": 100
      },
      "easing": "cubic-bezier(0.25, 1, 0.5, 1)"
    }
  }
}
```

### Flowing Wave Layout

```typescript
const gallery = new ImageCloud({
  container: 'my-gallery',
  loader: { ... },
  image: {
    rotation: { mode: 'tangent' }  // Images tilt along wave curve
  },
  layout: {
    algorithm: 'wave',
    sizing: { base: 120 },
    wave: {
      rows: 4,
      amplitude: 100,
      frequency: 2.5,
      synchronization: 'offset',
      orientation: 'follow'
    }
  },
  animation: {
    entry: {
      start: { position: 'left' },  // Enter from left for flow effect
      timing: { duration: 800, stagger: 80 }
    }
  }
});
```

### Alternating Wave Pattern

```typescript
const gallery = new ImageCloud({
  container: 'my-gallery',
  loader: { ... },
  layout: {
    algorithm: 'wave',
    sizing: { base: 90 },
    wave: {
      rows: 5,
      amplitude: 120,
      frequency: 3,
      synchronization: 'alternating',  // Woven pattern
      orientation: 'follow'
    }
  }
});
```
