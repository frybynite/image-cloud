# API Reference

This directory contains the API reference for the Image Cloud library.

## Quick Links

| Document | Description |
|----------|-------------|
| [ImageCloud](./ImageCloud.md) | Main class - constructor, methods, lifecycle |
| [Types](./types.md) | Configuration interfaces and data types |
| [Loaders](./loaders.md) | Image source loaders (static, Google Drive, composite) |
| [Layouts](./layouts.md) | Layout placement algorithms |

## Installation

```bash
npm install @frybynite/image-cloud
```

## Basic Import

```typescript
// Main class
import { ImageCloud } from '@frybynite/image-cloud';
import '@frybynite/image-cloud/style.css';

// Import loaders (required — choose what you need)
import '@frybynite/image-cloud/loaders/static';        // For static URLs
// import '@frybynite/image-cloud/loaders/google-drive'; // For Google Drive
// import '@frybynite/image-cloud/loaders/all';          // For all loaders

// Types (for TypeScript)
import type { ImageCloudOptions, ImageLayout } from '@frybynite/image-cloud';
```

**Note:** Loaders are imported as separate bundles to keep the main bundle small. Import only the loaders you use.

## Minimal Example

```typescript
import { ImageCloud } from '@frybynite/image-cloud';
import '@frybynite/image-cloud/loaders/static';

const cloud = new ImageCloud({
  container: 'myCloud',
  images: ['image1.jpg', 'image2.jpg']
});

await cloud.init();
```

**Remember:** Always import the loaders you need before creating an ImageCloud instance.

## Exports Overview

The library exports:

- **ImageCloud** - Main class (`@frybynite/image-cloud`)
- **ImageGallery** - Alias for ImageCloud (backwards compatibility)

### Loaders (Imported Separately)

Loaders are in separate bundles to optimize bundle size. Import only what you need:

- **Static** - `@frybynite/image-cloud/loaders/static` — Load from URLs, paths, or JSON endpoints
- **Google Drive** - `@frybynite/image-cloud/loaders/google-drive` — Load from Google Drive folders
- **Composite** - `@frybynite/image-cloud/loaders/composite` — Combine multiple loaders
- **All** - `@frybynite/image-cloud/loaders/all` — Includes all loaders above

Each loader bundle exports: `GoogleDriveLoader`, `StaticImageLoader`, `CompositeLoader`

### Other Exports

- **Layouts** - `RadialPlacementLayout`, `GridPlacementLayout`, `SpiralPlacementLayout`, `ClusterPlacementLayout`, `RandomPlacementLayout`, `WavePlacementLayout` (imported from main package)
- **Engines** - `AnimationEngine`, `LayoutEngine`, `ZoomEngine`, `EntryAnimationEngine`
- **Config** - `DEFAULT_CONFIG`, `BOUNCE_PRESETS`, `ELASTIC_PRESETS`, `WAVE_PATH_PRESETS`
- **Types** - 70+ TypeScript interfaces and types
