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
// Factory function (recommended)
import { imageCloud } from '@frybynite/image-cloud';
import '@frybynite/image-cloud/style.css';

// Main class (for advanced lifecycle control)
import { ImageCloud } from '@frybynite/image-cloud';

// Types (for TypeScript)
import type { ImageCloudOptions, ImageLayout } from '@frybynite/image-cloud';
```

## Minimal Example

```typescript
import { imageCloud } from '@frybynite/image-cloud';

// Single-expression initialization
const cloud = await imageCloud({
  container: 'myCloud',
  images: ['image1.jpg', 'image2.jpg']
});

await cloud.init();
```

## Exports Overview

The library exports:

- **ImageCloud** - Main class (`@frybynite/image-cloud`)
- **ImageGallery** - Alias for ImageCloud (backwards compatibility)

### Loaders

- **StaticImageLoader** — Load from URLs, paths, or JSON endpoints
- **GoogleDriveLoader** — Load from Google Drive folders
- **CompositeLoader** — Combine multiple loaders

### Other Exports

- **Layouts** - `RadialPlacementLayout`, `GridPlacementLayout`, `SpiralPlacementLayout`, `ClusterPlacementLayout`, `RandomPlacementLayout`, `WavePlacementLayout` (imported from main package)
- **Engines** - `AnimationEngine`, `LayoutEngine`, `ZoomEngine`, `EntryAnimationEngine`
- **Config** - `DEFAULT_CONFIG`, `BOUNCE_PRESETS`, `ELASTIC_PRESETS`, `WAVE_PATH_PRESETS`
- **Types** - 70+ TypeScript interfaces and types
