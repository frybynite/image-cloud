# Configuration Parameters

The Image Cloud library offers a flexible configuration system to customize every aspect of the gallery, from image loading to animation dynamics.

## Table of Contents

- [Pattern-Based Configuration](#pattern-based-configuration)
- [Loader Configuration](#1-loader-configuration-loader)
- [Layout Configuration](#2-layout-configuration-layout)
  - [Layout Algorithms](#layout-algorithms)
  - [Grid Algorithm](#grid-algorithm)
  - [Spiral Algorithm](#spiral-algorithm)
  - [Cluster Algorithm](#cluster-algorithm)
  - [Radial Algorithm](#radial-algorithm)
  - [Random Algorithm](#random-algorithm)
- [Sizing Configuration](#sizing-layoutsizing)
- [Animation Configuration](#3-animation-configuration-animation)
- [Entry Animation](#entry-animation)
- [Interaction Configuration](#4-interaction-configuration-interaction)
- [Rendering Configuration](#5-rendering-configuration-rendering)
- [Complete JSON Reference](#complete-json-reference)
- [Complete Examples](#complete-examples)

---

## Pattern-Based Configuration

Initialize the gallery using the `ImageGalleryOptions` structure.

```typescript
const gallery = new ImageGallery({
  container: 'my-gallery-id', // optional, defaults to 'imageCloud'
  loader: { ... },
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
| `type` | `'googleDrive' \| 'static'` | `'googleDrive'` | The primary source type for images. |
| `googleDrive` | `GoogleDriveLoaderConfig` | *See below* | Configuration for Google Drive loading. |
| `static` | `StaticLoaderConfig` | *See below* | Configuration for static image loading. |

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

### 2. Layout Configuration (`layout`)

Controls the positioning and sizing of images.

```typescript
layout: {
  algorithm: 'radial' | 'random' | 'grid' | 'spiral' | 'cluster',
  sizing: LayoutSizingConfig,
  rotation: LayoutRotationConfig,
  spacing: LayoutSpacingConfig,
  // Algorithm-specific options
  grid?: GridAlgorithmConfig,
  spiral?: SpiralAlgorithmConfig,
  cluster?: ClusterAlgorithmConfig
}
```

#### Base Layout Options

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `algorithm` | `string` | `'radial'` | Layout algorithm: `'radial'`, `'random'`, `'grid'`, `'spiral'`, `'cluster'` |
| `debugRadials` | `boolean` | `false` | Visualize the radial layout structure (debug). |
| `sizing` | `LayoutSizingConfig` | *See below* | Configuration for image dimensions. |
| `rotation` | `LayoutRotationConfig` | *See below* | Configuration for image rotation. |
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

## Sizing (`layout.sizing`)

Controls image sizing behavior.

```typescript
layout: {
  sizing: {
    base: 200,           // Base height in pixels
    variance: {
      min: 1.0,          // Minimum scale multiplier
      max: 1.0           // Maximum scale multiplier
    },
    responsive: [
      { minWidth: 1200, height: 225 },
      { minWidth: 768, height: 180 },
      { minWidth: 0, height: 100 }
    ],
    adaptive: {
      enabled: true,
      minSize: 50,
      maxSize: 400,
      targetCoverage: 0.6,
      densityFactor: 1.0,
      overflowBehavior: 'minimize'
    }
  }
}
```

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `base` | `number` | `200` | Base height of images in pixels. |
| `variance.min` | `number` | `1.0` | Minimum size multiplier. |
| `variance.max` | `number` | `1.0` | Maximum size multiplier. |
| `responsive` | `ResponsiveHeight[]` | *See above* | Array of `{ minWidth, height }` objects for responsive sizing. |
| `adaptive.enabled` | `boolean` | `true` | Enable auto-sizing |
| `adaptive.minSize` | `number` | `50` | Minimum image height |
| `adaptive.maxSize` | `number` | `400` | Maximum image height |
| `adaptive.targetCoverage` | `number` | `0.6` | Target % of container to fill |
| `adaptive.overflowBehavior` | `string` | `'minimize'` | `'minimize'` or `'truncate'` |

#### Rotation (`layout.rotation`)

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `enabled` | `boolean` | `true` | Whether images should be rotated. |
| `range.min` | `number` | `-15` | Minimum rotation degrees. |
| `range.max` | `number` | `15` | Maximum rotation degrees. |

#### Spacing (`layout.spacing`)

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `padding` | `number` | `50` | Padding from container edges (px). |
| `minGap` | `number` | `20` | Minimum space between images (px). |

### 3. Animation Configuration (`animation`)

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
const gallery = new ImageGallery({
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

### 4. Interaction Configuration (`interaction`)

Controls user interactions like clicking and zooming.

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `focus.scale` | `number` | `2.5` | Scale factor when an image is clicked. |
| `focus.mobileScale` | `number` | `2.0` | Scale factor on mobile devices. |
| `focus.unfocusedOpacity`| `number` | `0.3` | Opacity of non-selected images. |
| `focus.zIndex` | `number` | `1000` | Z-index of the focused image. |

### 5. Rendering Configuration (`rendering`)

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
    }
  },

  "layout": {
    "algorithm": "radial",                      // Default. "radial" | "random" | "grid" | "spiral" | "cluster"
    "debugRadials": false,                      // Default

    "sizing": {
      "base": 200,                              // Default. Base image size in px
      "variance": {
        "min": 1.0,                             // Default. Min scale multiplier
        "max": 1.0                              // Default. Max scale multiplier
      },
      "responsive": [                           // Default
        { "minWidth": 1200, "height": 225 },
        { "minWidth": 768, "height": 180 },
        { "minWidth": 0, "height": 100 }
      ],
      "adaptive": {
        "enabled": true,                        // Default
        "minSize": 50,                          // Default
        "maxSize": 400,                         // Default
        "targetCoverage": 0.6,                  // Default
        "densityFactor": 1.0,                   // Default
        "overflowBehavior": "minimize"          // Default. "minimize" | "truncate"
      }
    },

    "rotation": {
      "enabled": true,                          // Default
      "range": {
        "min": -15,                             // Default. Degrees
        "max": 15                               // Default. Degrees
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
      "easing": "cubic-bezier(0.25, 1, 0.5, 1)" // Default. Entry animation easing
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
const gallery = new ImageGallery({
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
const gallery = new ImageGallery({
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
const gallery = new ImageGallery({
  container: 'my-gallery',
  loader: { ... },
  layout: {
    algorithm: 'cluster',
    sizing: { base: 90 },
    rotation: {
      enabled: true,
      range: { min: -20, max: 20 }  // More rotation for organic feel
    },
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
const gallery = new ImageGallery({
  container: 'my-gallery',
  loader: { ... },
  layout: {
    algorithm: 'grid',
    rotation: { enabled: false },
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
const gallery = new ImageGallery({
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

### Entry Animation: Center Burst

```typescript
const gallery = new ImageGallery({
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
const gallery = new ImageGallery({
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
const gallery = new ImageGallery({
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
