# API Reference

This directory contains the API reference for the Image Cloud library.

## Quick Links

| Document | Description |
|----------|-------------|
| [ImageCloud](./ImageCloud.md) | Main class - constructor, methods, lifecycle |
| [Types](./types.md) | Configuration interfaces and data types |
| [Loaders](./loaders.md) | Image source loaders (static, Google Drive, composite) |
| [Generators](./generators.md) | Layout placement algorithms |

## Installation

```bash
npm install @frybynite/image-cloud
```

## Basic Import

```typescript
// Main class
import { ImageCloud } from '@frybynite/image-cloud';
import '@frybynite/image-cloud/style.css';

// Types (for TypeScript)
import type { ImageCloudOptions, ImageLayout } from '@frybynite/image-cloud';
```

## Minimal Example

```typescript
const cloud = new ImageCloud({
  container: 'myCloud',
  loader: {
    type: 'static',
    static: {
      sources: [{ type: 'urls', urls: ['image1.jpg', 'image2.jpg'] }]
    }
  }
});

await cloud.init();
```

## Exports Overview

The library exports:

- **ImageCloud** - Main class
- **ImageGallery** - Alias for ImageCloud (backwards compatibility)
- **Loaders** - `GoogleDriveLoader`, `StaticImageLoader`, `CompositeLoader`, `ImageFilter`
- **Generators** - `RadialPlacementGenerator`, `GridPlacementGenerator`, `SpiralPlacementGenerator`, `ClusterPlacementGenerator`, `RandomPlacementGenerator`
- **Engines** - `AnimationEngine`, `LayoutEngine`, `ZoomEngine`, `EntryAnimationEngine`
- **Config** - `DEFAULT_CONFIG`, `BOUNCE_PRESETS`, `ELASTIC_PRESETS`, `WAVE_PATH_PRESETS`
- **Types** - 70+ TypeScript interfaces and types
