# ImageCloud Class

The main entry point for creating image cloud galleries.

## Import

```typescript
import { ImageCloud } from '@frybynite/image-cloud';
import '@frybynite/image-cloud/style.css';
```

## Constructor

```typescript
const cloud = new ImageCloud(options?: ImageCloudOptions);
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `options` | `ImageCloudOptions` | No | Configuration object (uses defaults if omitted) |

### Example

```typescript
const cloud = new ImageCloud({
  container: 'gallery',
  loader: {
    type: 'static',
    static: {
      sources: [{ type: 'urls', urls: ['img1.jpg', 'img2.jpg'] }]
    }
  },
  layout: {
    algorithm: 'radial'
  }
});
```

## Methods

### init()

Initialize the gallery - loads images, sets up DOM, starts rendering.

```typescript
async init(): Promise<void>
```

**Must be called** after creating the instance. This is an async method that:
1. Prepares the image loader
2. Creates DOM elements
3. Calculates layout positions
4. Triggers entry animations

```typescript
const cloud = new ImageCloud(options);
await cloud.init();
```

### clearImageCloud()

Clear all images and reset internal state.

```typescript
clearImageCloud(): void
```

Removes all image elements from the DOM and resets the gallery to its initial state. Useful for refreshing the gallery with new images.

```typescript
cloud.clearImageCloud();
// Optionally re-initialize with new config
await cloud.init();
```

### destroy()

Clean up resources and remove event listeners.

```typescript
destroy(): void
```

Call this when removing the gallery to prevent memory leaks. Removes:
- All DOM elements
- Event listeners (keyboard, mouse, resize)
- Internal references

```typescript
// When done with the gallery
cloud.destroy();
```

## Built-in Interactions

The gallery automatically handles these user interactions:

### Keyboard

| Key | Action |
|-----|--------|
| `Escape` | Unfocus current image |
| `ArrowRight` | Navigate to next image |
| `ArrowLeft` | Navigate to previous image |
| `Enter` / `Space` | Focus hovered image |

### Mouse

| Action | Result |
|--------|--------|
| Click image | Focus/zoom the image |
| Click outside | Unfocus current image |
| Hover | Apply hover styling |

### Window

| Event | Behavior |
|-------|----------|
| Resize | Recalculate layout for new dimensions (500ms debounce) |

## Lifecycle

```
┌─────────────────┐
│  new ImageCloud │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    await init() │  ← Loads images, renders gallery
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Interactive   │  ← User can click, zoom, navigate
└────────┬────────┘
         │
         ▼ (optional)
┌─────────────────┐
│ clearImageCloud │  ← Reset for new images
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    destroy()    │  ← Clean up when done
└─────────────────┘
```

## Configuration Reference

See [Types](./types.md) for the full `ImageCloudOptions` interface.

### Quick Config Overview

```typescript
interface ImageCloudOptions {
  container?: string | HTMLElement;   // Target element
  loader?: LoaderConfig;              // Image sources
  layout?: LayoutConfig;              // Algorithm & sizing
  animation?: AnimationConfig;        // Entry animations
  interaction?: InteractionConfig;    // Focus/zoom behavior
  styling?: ImageStylingConfig;       // Borders, shadows, filters
  rendering?: RenderingConfig;        // Responsive settings
  debug?: boolean;                    // Enable debug logging
}
```

## Complete Example

```typescript
import { ImageCloud } from '@frybynite/image-cloud';
import '@frybynite/image-cloud/style.css';

const cloud = new ImageCloud({
  container: 'myGallery',
  loader: {
    type: 'static',
    static: {
      sources: [{
        type: 'urls',
        urls: [
          'https://picsum.photos/400/300',
          'https://picsum.photos/500/350',
          'https://picsum.photos/450/320'
        ]
      }]
    }
  },
  layout: {
    algorithm: 'spiral',
    sizing: {
      base: 200,
      adaptive: { enabled: true, minSize: 100, maxSize: 350 }
    }
  },
  animation: {
    duration: 800,
    entry: {
      path: { type: 'bounce' },
      rotation: { mode: 'wobble' }
    }
  },
  interaction: {
    focus: {
      scalePercent: 0.75,
      zIndex: 1000
    }
  },
  styling: {
    default: {
      border: { width: 3, color: '#fff', radius: 8 },
      shadow: 'md'
    },
    hover: {
      shadow: 'lg',
      border: { color: '#3b82f6' }
    }
  }
});

await cloud.init();

// Later, when removing the gallery
// cloud.destroy();
```
