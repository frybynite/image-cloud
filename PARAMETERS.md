# ImageGallery Parameters Documentation

Complete reference for all parameters accepted by the ImageGallery class.

## Table of Contents

- [Current Structure Overview](#current-structure-overview)
- [Top-Level Parameters (ImageGalleryOptions)](#top-level-parameters-imagegalleryoptions)
- [Configuration Object (config)](#configuration-object-config)
- [Animation Configuration](#animation-configuration)
- [Layout Configuration](#layout-configuration)
- [Zoom Configuration](#zoom-configuration)
- [UI Configuration](#ui-configuration)
- [Google Drive Configuration](#google-drive-configuration)
- [Static Loader Configuration](#static-loader-configuration)
- [Breakpoints Configuration](#breakpoints-configuration)
- [Loader Configuration](#loader-configuration)
- [Current Organization Issues](#current-organization-issues)
- [Usage Examples](#usage-examples)

---

## Current Structure Overview

```typescript
interface ImageGalleryOptions {
  // Basic setup
  containerId?: string;
  loaderType?: 'googleDrive' | 'static';

  // Google Drive specific
  folderUrl?: string;
  googleDrive?: { apiKey: string };

  // Static loader specific
  staticLoader?: { sources: StaticSource[] };

  // All other configuration
  config?: Partial<GalleryConfig>;
}
```

### Issues with Current Structure

1. **Split Loader Configuration**: Loader settings are split between:
   - Top-level: `loaderType`, `folderUrl`, `googleDrive`, `staticLoader`
   - Nested: `config.loader`, `config.googleDrive`

2. **Inconsistent Nesting**: Some loader options are top-level, others are deeply nested

3. **Duplicate Paths**: Google Drive settings exist in two places:
   - `options.googleDrive.apiKey`
   - `config.googleDrive.apiKey/apiEndpoint/imageExtensions`

4. **Unclear Hierarchy**: Not obvious which settings belong together

---

## Top-Level Parameters (ImageGalleryOptions)

### `containerId`
- **Type**: `string`
- **Default**: `'imageCloud'`
- **Description**: HTML element ID where the gallery will be rendered
- **Example**: `'myGallery'`

### `loaderType`
- **Type**: `'googleDrive' | 'static'`
- **Default**: `'googleDrive'`
- **Description**: Which image loader to use
- **Example**: `'static'`

### `folderUrl`
- **Type**: `string`
- **Required for**: Google Drive loader
- **Description**: URL to Google Drive folder containing images
- **Example**: `'https://drive.google.com/drive/folders/YOUR_FOLDER_ID'`

### `googleDrive`
- **Type**: `{ apiKey: string }`
- **Required for**: Google Drive loader
- **Description**: Google Drive API credentials
- **Example**:
  ```typescript
  { apiKey: 'AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXX' }
  ```

### `staticLoader`
- **Type**: `{ sources: StaticSource[] }`
- **Required for**: Static loader
- **Description**: Configuration for static image sources
- **Example**:
  ```typescript
  {
    sources: [
      {
        type: 'urls',
        urls: [
          'https://images.pexels.com/photos/1000366/pexels-photo-1000366.jpeg',
          'https://images.pexels.com/photos/1591373/pexels-photo-1591373.jpeg'
        ]
      }
    ]
  }
  ```

#### StaticSource Types

**URLs Source**:
```typescript
{
  type: 'urls',
  urls: string[]  // Array of image URLs
}
```

**Path Source**:
```typescript
{
  type: 'path',
  basePath: string,    // Base directory path
  files: string[]      // Array of filenames
}
```

### `config`
- **Type**: `Partial<GalleryConfig>`
- **Description**: All other gallery configuration options
- **See**: [Configuration Object](#configuration-object-config)

---

## Configuration Object (config)

All settings under the `config` parameter.

### Structure

```typescript
interface GalleryConfig {
  animation: AnimationConfig;
  ui: UIConfig;
  layout: LayoutConfig;
  zoom: ZoomConfig;
  googleDrive: GoogleDriveConfig;
  breakpoints: BreakpointConfig;
  loader: LoaderConfig;
  debugLogging: boolean;
  isMobile: () => boolean;
}
```

---

## Animation Configuration

Controls animation timing and easing.

### `config.animation`

```typescript
interface AnimationConfig {
  duration: number;        // Animation duration in milliseconds
  easing: string;          // CSS easing function
  bounceEasing: string;    // CSS easing for bounce effects
  queueInterval: number;   // Delay between image insertions (ms)
}
```

### Defaults

```typescript
{
  duration: 600,
  easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
  bounceEasing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  queueInterval: 150
}
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `duration` | number | 600 | Animation duration in milliseconds |
| `easing` | string | `cubic-bezier(0.4, 0.0, 0.2, 1)` | CSS easing function for smooth animations |
| `bounceEasing` | string | `cubic-bezier(0.68, -0.55, 0.265, 1.55)` | CSS easing for bounce effects |
| `queueInterval` | number | 150 | Milliseconds between processing queue items |

### Example

```typescript
config: {
  animation: {
    duration: 800,
    easing: 'ease-in-out',
    queueInterval: 200
  }
}
```

---

## Layout Configuration

Controls image placement, sizing, and positioning.

### `config.layout`

```typescript
interface LayoutConfig {
  type: 'random' | 'radial';
  debugRadials: boolean;
  rotationRange: number;
  minRotation: number;
  maxRotation: number;
  sizeVarianceMin: number;
  sizeVarianceMax: number;
  baseImageSize: number;
  responsiveHeights: ResponsiveHeight[];
  padding: number;
  minSpacing: number;
}
```

### Defaults

```typescript
{
  type: 'radial',
  debugRadials: false,
  rotationRange: 15,
  minRotation: -15,
  maxRotation: 15,
  sizeVarianceMin: 1.0,
  sizeVarianceMax: 1.0,
  baseImageSize: 200,
  responsiveHeights: [
    { minWidth: 1200, height: 225 },
    { minWidth: 768, height: 180 },
    { minWidth: 0, height: 100 }
  ],
  padding: 50,
  minSpacing: 20
}
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `type` | `'random' \| 'radial'` | `'radial'` | Layout algorithm to use |
| `debugRadials` | boolean | false | Show debug radial lines (radial layout only) |
| `rotationRange` | number | 15 | Rotation variance in ± degrees |
| `minRotation` | number | -15 | Minimum rotation angle in degrees |
| `maxRotation` | number | 15 | Maximum rotation angle in degrees |
| `sizeVarianceMin` | number | 1.0 | Minimum size multiplier |
| `sizeVarianceMax` | number | 1.0 | Maximum size multiplier |
| `baseImageSize` | number | 200 | Base image height in pixels |
| `responsiveHeights` | ResponsiveHeight[] | See defaults | Responsive height breakpoints |
| `padding` | number | 50 | Padding from viewport edges in pixels |
| `minSpacing` | number | 20 | Minimum spacing between images in pixels |

### ResponsiveHeight

```typescript
interface ResponsiveHeight {
  minWidth: number;  // Viewport width threshold
  height: number;    // Image height for this breakpoint
}
```

### Example

```typescript
config: {
  layout: {
    type: 'radial',
    baseImageSize: 250,
    rotationRange: 20,
    padding: 60,
    responsiveHeights: [
      { minWidth: 1400, height: 300 },
      { minWidth: 1024, height: 200 },
      { minWidth: 0, height: 150 }
    ]
  }
}
```

---

## Zoom Configuration

Controls image focus/zoom behavior.

### `config.zoom`

```typescript
interface ZoomConfig {
  focusScale: number;
  mobileScale: number;
  unfocusedOpacity?: number;
  focusZIndex: number;
}
```

### Defaults

```typescript
{
  focusScale: 2.5,
  mobileScale: 2.0,
  unfocusedOpacity: 0.3,
  focusZIndex: 1000
}
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `focusScale` | number | 2.5 | Scale multiplier when image is focused |
| `mobileScale` | number | 2.0 | Scale multiplier for mobile devices |
| `unfocusedOpacity` | number | 0.3 | Opacity of unfocused images (optional) |
| `focusZIndex` | number | 1000 | Z-index when image is focused |

### Example

```typescript
config: {
  zoom: {
    focusScale: 3.0,
    mobileScale: 2.5,
    unfocusedOpacity: 0.4
  }
}
```

---

## UI Configuration

General UI settings.

### `config.ui`

```typescript
interface UIConfig {
  showLoadingSpinner: boolean;
}
```

### Defaults

```typescript
{
  showLoadingSpinner: false
}
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `showLoadingSpinner` | boolean | false | Show loading spinner during image load |

### Example

```typescript
config: {
  ui: {
    showLoadingSpinner: true
  }
}
```

---

## Google Drive Configuration

Advanced Google Drive API settings.

### `config.googleDrive`

```typescript
interface GoogleDriveConfig {
  apiKey: string;
  apiEndpoint: string;
  imageExtensions: string[];
}
```

### Defaults

```typescript
{
  apiKey: '',  // Set via options.googleDrive.apiKey
  apiEndpoint: 'https://www.googleapis.com/drive/v3/files',
  imageExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp']
}
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `apiKey` | string | '' | Google Drive API key |
| `apiEndpoint` | string | `'https://www.googleapis.com/drive/v3/files'` | Google Drive API endpoint |
| `imageExtensions` | string[] | `['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp']` | Allowed image file extensions |

### Example

```typescript
config: {
  googleDrive: {
    imageExtensions: ['jpg', 'png', 'webp']
  }
}
```

**Note**: The `apiKey` is typically set via `options.googleDrive.apiKey` at the top level, not here.

---

## Static Loader Configuration

Advanced static loader settings.

### `config.loader.static`

```typescript
interface StaticLoaderConfig {
  validateUrls: boolean;
  validationTimeout: number;
  validationMethod: 'head' | 'simple' | 'none';
  failOnAllMissing: boolean;
  imageExtensions: string[];
}
```

### Defaults

```typescript
{
  validateUrls: true,
  validationTimeout: 5000,
  validationMethod: 'head',
  failOnAllMissing: true,
  imageExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp']
}
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `validateUrls` | boolean | true | Validate image URLs before loading |
| `validationTimeout` | number | 5000 | URL validation timeout in milliseconds |
| `validationMethod` | `'head' \| 'simple' \| 'none'` | `'head'` | Validation method (HEAD request, simple check, or none) |
| `failOnAllMissing` | boolean | true | Fail if all images are missing |
| `imageExtensions` | string[] | `['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp']` | Allowed image file extensions |

### Example

```typescript
config: {
  loader: {
    static: {
      validateUrls: false,
      imageExtensions: ['jpg', 'png']
    }
  }
}
```

---

## Breakpoints Configuration

Responsive breakpoint settings.

### `config.breakpoints`

```typescript
interface BreakpointConfig {
  mobile: number;
}
```

### Defaults

```typescript
{
  mobile: 768
}
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `mobile` | number | 768 | Viewport width threshold for mobile devices (pixels) |

### Example

```typescript
config: {
  breakpoints: {
    mobile: 640
  }
}
```

---

## Loader Configuration

Internal loader type configuration.

### `config.loader`

```typescript
interface LoaderConfig {
  type: 'googleDrive' | 'static';
  static: StaticLoaderConfig;
}
```

### Defaults

```typescript
{
  type: 'googleDrive',
  static: { /* See Static Loader Configuration */ }
}
```

**Note**: The `loader.type` is typically set via `options.loaderType` at the top level.

---

## Current Organization Issues

### 1. Split Loader Configuration

**Problem**: Loader settings are scattered across multiple locations:

```typescript
// Top-level (user-facing)
{
  loaderType: 'static',
  staticLoader: { sources: [...] },
  googleDrive: { apiKey: '...' },
  folderUrl: '...'
}

// Nested in config (advanced settings)
{
  config: {
    loader: {
      type: 'static',
      static: { validateUrls: true, ... }
    },
    googleDrive: {
      apiKey: '...',
      apiEndpoint: '...',
      imageExtensions: [...]
    }
  }
}
```

### 2. Duplicate API Key Paths

Google Drive API key can be set in two places:
- `options.googleDrive.apiKey`
- `config.googleDrive.apiKey`

### 3. Inconsistent Depth

- Basic loader selection: Top-level (`loaderType`)
- Advanced loader settings: Nested 3 levels deep (`config.loader.static.validateUrls`)

### 4. Unclear Relationship

Not obvious that these are related:
- `folderUrl` (top-level)
- `googleDrive` (top-level)
- `config.googleDrive` (nested)

---

## Usage Examples

### Minimal Example (Static Images)

```typescript
const gallery = new ImageGallery({
  containerId: 'gallery',
  loaderType: 'static',
  staticLoader: {
    sources: [{
      type: 'urls',
      urls: [
        'https://images.pexels.com/photos/1000366/pexels-photo-1000366.jpeg',
        'https://images.pexels.com/photos/1591373/pexels-photo-1591373.jpeg',
        'https://images.pexels.com/photos/1612461/pexels-photo-1612461.jpeg'
      ]
    }]
  }
});
```

### With Custom Layout

```typescript
const gallery = new ImageGallery({
  containerId: 'gallery',
  loaderType: 'static',
  staticLoader: {
    sources: [{
      type: 'urls',
      urls: [
        'https://images.pexels.com/photos/1000366/pexels-photo-1000366.jpeg',
        'https://images.pexels.com/photos/1591373/pexels-photo-1591373.jpeg'
      ]
    }]
  },
  config: {
    layout: {
      type: 'radial',
      baseImageSize: 250,
      rotationRange: 20
    }
  }
});
```

### Google Drive Example

```typescript
const gallery = new ImageGallery({
  containerId: 'gallery',
  loaderType: 'googleDrive',
  folderUrl: 'https://drive.google.com/drive/folders/YOUR_FOLDER_ID',
  googleDrive: {
    apiKey: 'YOUR_API_KEY'
  },
  config: {
    layout: { type: 'radial' }
  }
});
```

### Full Configuration Example

```typescript
const gallery = new ImageGallery({
  containerId: 'gallery',
  loaderType: 'static',
  staticLoader: {
    sources: [{
      type: 'path',
      basePath: '/images',
      files: ['photo1.jpg', 'photo2.jpg', 'photo3.jpg']
    }]
  },
  config: {
    animation: {
      duration: 800,
      easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
      queueInterval: 200
    },
    layout: {
      type: 'radial',
      baseImageSize: 250,
      rotationRange: 15,
      padding: 60,
      responsiveHeights: [
        { minWidth: 1200, height: 300 },
        { minWidth: 768, height: 200 },
        { minWidth: 0, height: 150 }
      ]
    },
    zoom: {
      focusScale: 3.0,
      mobileScale: 2.0,
      unfocusedOpacity: 0.4
    },
    ui: {
      showLoadingSpinner: true
    },
    breakpoints: {
      mobile: 640
    },
    debugLogging: true
  }
});
```

---

## Proposed Reorganization Approach

### Pattern-Based Grouping

Group all configuration by functional patterns, creating clear separation of concerns:

```typescript
{
  container: 'gallery',

  loader: {
    type: 'static',
    static: {
      sources: [...],
      validate: true,
      timeout: 5000
    }
  },

  layout: { ... },
  animation: { ... },
  interaction: { ... },
  rendering: { ... }
}
```

This approach is detailed in the [Comprehensive Reorganization Proposal](#comprehensive-reorganization-proposal) below.

---

## Comprehensive Reorganization Proposal

### Pattern-Based Architecture

This proposal reorganizes parameters around clear functional patterns, eliminating duplication and providing intuitive grouping.

### Core Patterns Identified

1. **Loader Pattern**: Data acquisition and validation
2. **Layout Pattern**: Spatial organization and positioning
3. **Animation Pattern**: Timing, transitions, and motion
4. **Interaction Pattern**: User input and focus behavior
5. **Rendering Pattern**: Visual output and responsive behavior
6. **Configuration Pattern**: Meta-settings and utilities

---

### Proposed Structure

```typescript
interface ImageGalleryOptions {
  // Core setup
  container?: string;

  // Loader Pattern: All data sourcing in one place
  loader: LoaderConfig;

  // Layout Pattern: Spatial organization
  layout?: LayoutConfig;

  // Animation Pattern: Motion and timing
  animation?: AnimationConfig;

  // Interaction Pattern: User behavior
  interaction?: InteractionConfig;

  // Rendering Pattern: Visual output
  rendering?: RenderingConfig;

  // Configuration Pattern: Meta-settings
  debug?: boolean;
  customMobileDetection?: () => boolean;
}
```

---

### Pattern 1: Loader (Data Acquisition)

**Philosophy**: All data sourcing configuration in one place, regardless of source type.

```typescript
interface LoaderConfig {
  type: 'googleDrive' | 'static' | 'custom';

  // Google Drive specific
  googleDrive?: {
    apiKey: string;
    apiEndpoint?: string;
    allowedExtensions?: string[];
    sources: GoogleDriveSource[];
  };

  // Static loader specific
  static?: {
    sources: StaticSource[];
    validateUrls?: boolean;
    validationTimeout?: number;
    validationMethod?: 'head' | 'simple' | 'none';
    failOnAllMissing?: boolean;
    allowedExtensions?: string[];
  };

  // Custom loader (future extensibility)
  custom?: {
    fetchImages: () => Promise<ImageData[]>;
  };
}

// Google Drive source types
type GoogleDriveSource =
  | {
      type: 'folder';
      folders: string[];      // Array of Google Drive folder URLs
      recursive: boolean;     // Whether to include subfolders
    }
  | {
      type: 'files';
      files: string[];        // Array of Google Drive file URLs
    };

// Static source types
type StaticSource =
  | {
      type: 'urls';
      urls: string[];         // Array of image URLs
    }
  | {
      type: 'path';
      basePath: string;       // Base directory path
      files: string[];        // Array of filenames
    };
```

**Benefits**:
- All loader configuration in one place
- Clear separation by loader type
- No duplicate API key paths
- Easy to add new loader types
- Flexible source combinations (multiple folders + individual files)
- Recursive folder traversal control

**Example Usage**:
```typescript
// Google Drive - Multiple folders with recursion + individual files
loader: {
  type: 'googleDrive',
  googleDrive: {
    apiKey: 'YOUR_API_KEY',
    apiEndpoint: 'https://www.googleapis.com/drive/v3/files',
    allowedExtensions: ['jpg', 'png', 'webp'],
    sources: [
      {
        type: 'folder',
        folders: [
          'https://drive.google.com/drive/folders/FOLDER_ID_1',
          'https://drive.google.com/drive/folders/FOLDER_ID_2'
        ],
        recursive: true
      },
      {
        type: 'files',
        files: [
          'https://drive.google.com/file/d/FILE_ID_1/view',
          'https://drive.google.com/file/d/FILE_ID_2/view'
        ]
      }
    ]
  }
}

// Google Drive - Single folder, non-recursive
loader: {
  type: 'googleDrive',
  googleDrive: {
    apiKey: 'YOUR_API_KEY',
    sources: [
      {
        type: 'folder',
        folders: ['https://drive.google.com/drive/folders/FOLDER_ID'],
        recursive: false
      }
    ]
  }
}

// Static - URLs
loader: {
  type: 'static',
  static: {
    sources: [
      {
        type: 'urls',
        urls: [
          'https://images.pexels.com/photos/1000366/pexels-photo-1000366.jpeg',
          'https://images.pexels.com/photos/1591373/pexels-photo-1591373.jpeg'
        ]
      }
    ],
    validateUrls: true
  }
}

// Static - Path-based
loader: {
  type: 'static',
  static: {
    sources: [
      {
        type: 'path',
        basePath: '/images/vacation',
        files: ['beach.jpg', 'sunset.jpg', 'ocean.jpg']
      }
    ]
  }
}
```

---

### Pattern 2: Layout (Spatial Organization)

**Philosophy**: Everything related to how images are positioned in space.

```typescript
interface LayoutConfig {
  // Algorithm selection
  algorithm: 'radial' | 'random' | 'grid' | 'masonry';

  // Size configuration
  sizing: {
    base: number;                    // Base image height
    variance: {
      min: number;                   // Size multiplier min
      max: number;                   // Size multiplier max
    };
    responsive: ResponsiveHeight[];
  };

  // Rotation configuration
  rotation: {
    enabled: boolean;                // Default: true
    range: number;                   // Default: 15 (± degrees)
    min?: number;                    // Override range with explicit min/max
    max?: number;
  };

  // Spacing configuration
  spacing: {
    padding: number;                 // From edges
    minGap: number;                  // Between images
  };

  // Algorithm-specific settings
  radial?: {
    debugVisualization: boolean;
  };

  grid?: {
    columns: number | 'auto';
    gap: number;
  };
}
```

**Default Values**:
```typescript
{
  algorithm: 'radial',
  sizing: {
    base: 200,
    variance: { min: 1.0, max: 1.0 },
    responsive: [
      { minWidth: 1200, height: 225 },
      { minWidth: 768, height: 180 },
      { minWidth: 0, height: 100 }
    ]
  },
  rotation: {
    enabled: true,
    range: 15
  },
  spacing: {
    padding: 50,
    minGap: 20
  },
  radial: {
    debugVisualization: false
  }
}
```

**Benefits**:
- Clear grouping of size, rotation, spacing
- Algorithm-specific settings separated
- Intuitive hierarchy
- Easy to add new algorithms

**Example Usage**:
```typescript
layout: {
  algorithm: 'radial',
  sizing: {
    base: 200,
    variance: { min: 1.0, max: 1.5 },
    responsive: [
      { minWidth: 1200, height: 250 },
      { minWidth: 768, height: 180 }
    ]
  },
  rotation: {
    enabled: true,
    range: 15
  },
  spacing: {
    padding: 50,
    minGap: 20
  },
  radial: {
    debugVisualization: false
  }
}
```

---

### Pattern 3: Animation (Motion & Timing)

**Philosophy**: All timing and motion configuration together.

```typescript
interface AnimationConfig {
  // Global timing
  duration: number;                  // Base animation duration (ms)

  // Easing functions
  easing: {
    default: string;                 // Standard easing
    bounce: string;                  // Bounce effects
    focus: string;                   // Focus transitions
  };

  // Queue management
  queue: {
    enabled: boolean;
    interval: number;                // Stagger delay between items (ms)
    maxConcurrent?: number;          // Limit simultaneous animations
  };

  // Performance
  performance: {
    useGPU: boolean;                 // Hardware acceleration
    reduceMotion: 'respect' | 'ignore';  // Respect prefers-reduced-motion
  };
}
```

**Benefits**:
- All timing in one place
- Clear easing organization
- Performance considerations included
- Accessibility support built-in

**Example Usage**:
```typescript
animation: {
  duration: 600,
  easing: {
    default: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    focus: 'ease-out'
  },
  queue: {
    enabled: true,
    interval: 150,
    maxConcurrent: 5
  },
  performance: {
    useGPU: true,
    reduceMotion: 'respect'
  }
}
```

---

### Pattern 4: Interaction (User Behavior)

**Philosophy**: All user interaction and focus behavior unified.

```typescript
interface InteractionConfig {
  // Focus/zoom behavior
  focus: {
    enabled: boolean;
    scale: number;                   // Desktop scale multiplier
    mobileScale: number;             // Mobile scale multiplier
    zIndex: number;                  // Focused z-index

    // Unfocused state
    unfocusedOpacity?: number;       // Dim other images
    unfocusedBlur?: number;          // Blur amount (px)

    // Behavior
    clickToFocus: boolean;
    escapeToUnfocus: boolean;
    clickOutsideToUnfocus: boolean;
  };

  // Navigation
  navigation?: {
    keyboard: boolean;               // Arrow key navigation
    swipe: boolean;                  // Touch swipe
    mouseWheel: boolean;             // Scroll through images
  };

  // Gestures
  gestures?: {
    pinchToZoom: boolean;
    doubleTapToFocus: boolean;
  };
}
```

**Benefits**:
- All interaction logic together
- Clear focus behavior
- Future-proof for new interactions
- Separate mobile/desktop controls

**Example Usage**:
```typescript
interaction: {
  focus: {
    enabled: true,
    scale: 2.5,
    mobileScale: 2.0,
    zIndex: 1000,
    unfocusedOpacity: 0.3,
    clickToFocus: true,
    escapeToUnfocus: true,
    clickOutsideToUnfocus: true
  },
  navigation: {
    keyboard: true,
    swipe: true,
    mouseWheel: false
  }
}
```

---

### Pattern 5: Rendering (Visual Output)

**Philosophy**: Everything about how the gallery is displayed to the user.

```typescript
interface RenderingConfig {
  // Responsive behavior
  responsive: {
    breakpoints: {
      mobile: number;
      tablet?: number;
      desktop?: number;
    };
    mobileDetection?: () => boolean;
  };

  // UI elements
  ui: {
    showLoadingSpinner: boolean;
    showImageCounter: boolean;
    showThumbnails: boolean;
    theme?: 'light' | 'dark' | 'auto';
  };

  // Performance
  performance: {
    lazyLoad: boolean;
    preloadCount: number;            // Images to preload ahead
    imageQuality?: 'low' | 'medium' | 'high';
  };

  // Accessibility
  accessibility: {
    altTextGenerator?: (image: ImageData) => string;
    ariaLabels: boolean;
    focusRingEnabled: boolean;
  };
}
```

**Benefits**:
- All visual output together
- Responsive settings unified
- Accessibility first-class citizen
- Performance controls explicit

**Example Usage**:
```typescript
rendering: {
  responsive: {
    breakpoints: {
      mobile: 768,
      tablet: 1024,
      desktop: 1440
    }
  },
  ui: {
    showLoadingSpinner: true,
    showImageCounter: false,
    theme: 'auto'
  },
  performance: {
    lazyLoad: true,
    preloadCount: 3
  },
  accessibility: {
    ariaLabels: true,
    focusRingEnabled: true
  }
}
```

---

### Pattern 6: Configuration (Meta-Settings)

**Philosophy**: Settings about the gallery instance itself.

```typescript
interface ConfigurationSettings {
  debug: boolean;                    // Enable debug logging
  customMobileDetection?: () => boolean;
  errorHandling?: {
    onLoadError?: (error: Error) => void;
    onValidationError?: (errors: ValidationError[]) => void;
    throwOnError: boolean;
  };
}
```

**Benefits**:
- Clear separation of meta-settings
- Extensible error handling
- Simple boolean for common case

---

### Complete Example with New Structure

```typescript
const gallery = new ImageGallery({
  container: 'gallery',

  loader: {
    type: 'static',
    static: {
      sources: [
        {
          type: 'urls',
          urls: [
            'https://images.pexels.com/photos/1000366/pexels-photo-1000366.jpeg',
            'https://images.pexels.com/photos/1591373/pexels-photo-1591373.jpeg',
            'https://images.pexels.com/photos/1612461/pexels-photo-1612461.jpeg'
          ]
        }
      ],
      validateUrls: true,
      validationTimeout: 5000
    }
  },

  layout: {
    algorithm: 'radial',
    sizing: {
      base: 200,
      variance: { min: 1.0, max: 1.5 },
      responsive: [
        { minWidth: 1200, height: 250 },
        { minWidth: 768, height: 180 },
        { minWidth: 0, height: 120 }
      ]
    },
    rotation: {
      enabled: true,
      range: 15
    },
    spacing: {
      padding: 50,
      minGap: 20
    }
  },

  animation: {
    duration: 600,
    easing: {
      default: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      focus: 'ease-out'
    },
    queue: {
      enabled: true,
      interval: 150
    },
    performance: {
      useGPU: true,
      reduceMotion: 'respect'
    }
  },

  interaction: {
    focus: {
      enabled: true,
      scale: 2.5,
      mobileScale: 2.0,
      zIndex: 1000,
      unfocusedOpacity: 0.3,
      clickToFocus: true,
      escapeToUnfocus: true,
      clickOutsideToUnfocus: true
    },
    navigation: {
      keyboard: true,
      swipe: true,
      mouseWheel: false
    }
  },

  rendering: {
    responsive: {
      breakpoints: {
        mobile: 768
      }
    },
    ui: {
      showLoadingSpinner: true,
      showImageCounter: false,
      theme: 'auto'
    },
    performance: {
      lazyLoad: true,
      preloadCount: 3
    },
    accessibility: {
      ariaLabels: true,
      focusRingEnabled: true
    }
  },

  debug: false
});
```

---

### Migration Strategy

#### Phase 1: Dual Support
- Support both old and new structure
- Add deprecation warnings for old paths
- Document migration guide

#### Phase 2: Adapter Pattern
```typescript
class LegacyOptionsAdapter {
  static convert(oldOptions: OldImageGalleryOptions): ImageGalleryOptions {
    return {
      container: oldOptions.containerId,
      loader: this.convertLoader(oldOptions),
      layout: this.convertLayout(oldOptions.config?.layout),
      // ... etc
    };
  }
}
```

#### Phase 3: Remove Legacy
- Major version bump (2.0.0)
- Remove old structure support
- Keep adapter as separate utility for users

---

### Comparison: Old vs New

#### Old Structure Issues
```typescript
{
  // Loader settings scattered
  loaderType: 'static',                    // Top-level
  staticLoader: { sources: [...] },        // Top-level
  folderUrl: '...',                        // Top-level
  googleDrive: { apiKey: '...' },          // Top-level

  config: {
    loader: { type: '...', static: {...} }, // Nested
    googleDrive: { apiKey: '...' }          // Duplicate!
  }
}
```

#### New Structure Benefits
```typescript
{
  // All loader settings together
  loader: {
    type: 'static',
    static: {
      sources: [...],
      validateUrls: true
    }
  }
  // Clear, no duplication
}
```

---

### Pattern Benefits Summary

| Pattern | Key Benefit | Example |
|---------|-------------|---------|
| **Loader** | Single source of truth for data | No more split config |
| **Layout** | Logical grouping of spatial concerns | Size + rotation + spacing together |
| **Animation** | All timing centralized | Easy to adjust animation feel |
| **Interaction** | User behavior isolated | Clear focus behavior control |
| **Rendering** | Visual output unified | Responsive + UI + performance |
| **Configuration** | Meta-settings separated | Debug/error handling clear |

---

### Future Extensibility

The pattern-based approach makes it easy to add new features:

```typescript
// Adding a new loader type
loader: {
  type: 'instagram',
  instagram: {
    accessToken: '...',
    hashtag: '#vacation'
  }
}

// Adding a new layout algorithm
layout: {
  algorithm: 'masonry',
  masonry: {
    columns: 'auto',
    gap: 20
  }
}

// Adding new interaction modes
interaction: {
  focus: { ... },
  carousel: {
    enabled: true,
    autoPlay: true,
    interval: 3000
  }
}
```

---

**Generated**: 2026-01-16
**Version**: 0.1.0
