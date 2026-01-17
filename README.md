# Image Gallery Library

A TypeScript image gallery library with animated layouts and zoom effects. Supports both Google Drive and static image sources with radial and random placement strategies.

## Features

- ✨ Animated image layouts with smooth transitions
- 🎯 Radial and random placement algorithms
- 🔍 Zoom/focus interactions
- 📱 Responsive design with breakpoint support
- 🖼️ Multiple image sources (Google Drive, static URLs, local paths)
- 🎨 Fully customizable configuration
- 📦 Zero runtime dependencies
- 🔷 Full TypeScript support

## Installation

```bash
npm install @frybynite/image-gallery
```

## Quick Start

### TypeScript/JavaScript (Programmatic API)

```typescript
import { ImageGallery } from '@frybynite/image-gallery';
import '@frybynite/image-gallery/style.css';

const gallery = new ImageGallery({
  container: 'myGallery',
  loader: {
    type: 'static',
    static: {
      sources: [
        {
          type: 'urls',
          urls: [
            'https://example.com/image1.jpg',
            'https://example.com/image2.jpg',
            'https://example.com/image3.jpg'
          ]
        }
      ]
    }
  },
  layout: {
    algorithm: 'radial'
  }
});

await gallery.init();
```

### HTML (Auto-initialization)

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="node_modules/@frybynite/image-gallery/dist/style.css">
</head>
<body>
  <!-- Note: Data attributes for auto-init need to be updated to match new structure if using complex config -->
  <div id="gallery"
       data-image-gallery="true"
       data-config='{"loader":{"type":"static","static":{"sources":[{"type":"urls","urls":["img1.jpg"]}]}}}'>
  </div>

  <script type="module">
    import { autoInitialize } from '@frybynite/image-gallery/auto-init';
  </script>
</body>
</html>
```

### CDN Usage

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="https://unpkg.com/@frybynite/image-gallery/dist/style.css">
</head>
<body>
  <div id="gallery"></div>

  <script src="https://unpkg.com/@frybynite/image-gallery/dist/image-gallery.umd.js"></script>
  <script>
    const { ImageGallery } = window.ImageGallery;
    const gallery = new ImageGallery({
      container: 'gallery',
      loader: {
        type: 'static',
        static: {
          sources: [{ type: 'urls', urls: ['image1.jpg', 'image2.jpg'] }]
        }
      }
    });
    gallery.init();
  </script>
</body>
</html>
```

## Usage Examples

### Static Images from URLs

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
            'https://picsum.photos/400/300',
            'https://picsum.photos/500/350',
            'https://picsum.photos/450/320'
          ]
        }
      ]
    }
  }
});

await gallery.init();
```

### Static Images from Local Path

```typescript
const gallery = new ImageGallery({
  container: 'gallery',
  loader: {
    type: 'static',
    static: {
      sources: [
        {
          type: 'path',
          basePath: '/images',
          files: ['photo1.jpg', 'photo2.jpg', 'photo3.jpg']
        }
      ]
    }
  }
});

await gallery.init();
```

### Google Drive Folder

```typescript
const gallery = new ImageGallery({
  container: 'gallery',
  loader: {
    type: 'googleDrive',
    googleDrive: {
      apiKey: 'YOUR_GOOGLE_API_KEY',
      sources: [
        {
          type: 'folder',
          folders: ['YOUR_FOLDER_ID']
        }
      ]
    }
  }
});

await gallery.init();
```

### Custom Configuration

```typescript
const gallery = new ImageGallery({
  container: 'gallery',
  loader: {
    type: 'static',
    static: {
      sources: [{ type: 'urls', urls: ['img1.jpg', 'img2.jpg'] }]
    }
  },
  layout: {
    algorithm: 'radial',  // or 'random'
    sizing: {
      base: 250
    },
    rotation: {
      range: { max: 20, min: -20 }
    },
    spacing: {
      padding: 60
    }
  },
  animation: {
    duration: 800,
    queue: {
      interval: 200
    }
  },
  interaction: {
    focus: {
      scale: 3.0,
      zIndex: 1000
    }
  }
});

await gallery.init();
```

## Configuration Options

See `PARAMETERS.md` for full documentation of the configuration object.

### ImageGalleryOptions

```typescript
interface ImageGalleryOptions {
  container?: string;              // HTML element ID (default: 'imageCloud')
  loader?: Partial<LoaderConfig>;
  layout?: Partial<LayoutConfig>;
  animation?: Partial<AnimationConfig>;
  interaction?: Partial<InteractionConfig>;
  rendering?: Partial<RenderingConfig>;
  debug?: boolean;
}
```

## API Reference

### ImageGallery Class

#### Methods

- `init(): Promise<void>` - Initialize the gallery and load images
- `clearImageCloud(): void` - Clear all images and reset state
- `destroy(): void` - Clean up resources and event listeners

### Events & Interactions

- **Click image**: Focus/zoom the image
- **Click outside**: Unfocus current image
- **ESC key**: Unfocus current image
- **Window resize**: Responsive layout adjustment

## Advanced Usage

### Custom Placement Generator

```typescript
import { PlacementGenerator, ImageLayout, ContainerBounds } from '@frybynite/image-gallery';

class CustomGenerator implements PlacementGenerator {
  generate(count: number, bounds: ContainerBounds): ImageLayout[] {
    // Your custom layout algorithm
    return layouts;
  }
}
```

### React Integration

```tsx
import { useEffect, useRef } from 'react';
import { ImageGallery } from '@frybynite/image-gallery';
import '@frybynite/image-gallery/style.css';

function GalleryComponent() {
  const containerRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<ImageGallery | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      galleryRef.current = new ImageGallery({
        container: containerRef.current.id,
        loader: {
          type: 'static',
          static: {
            sources: [{ type: 'urls', urls: ['img1.jpg', 'img2.jpg'] }]
          }
        }
      });

      galleryRef.current.init();
    }

    return () => {
      galleryRef.current?.destroy();
    };
  }, []);

  return <div id="gallery" ref={containerRef} />;
}
```

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile: iOS Safari 12+, Chrome Android

## License

MIT

## Author

[frybynite](https://github.com/frybynite)

## Build Scripts

The project includes comprehensive build automation:

```bash
# Development
npm run dev              # Start dev server
npm run serve            # Serve on http://localhost:8080
npm run type-check       # Check types only

# Building
npm run build            # Full production build
npm run build:prod       # Build with validation
npm run build:watch      # Watch mode
npm run clean            # Remove dist/

# Releasing
npm run release:patch    # 0.1.0 → 0.1.1
npm run release:minor    # 0.1.0 → 0.2.0
npm run release:major    # 0.1.0 → 1.0.0
```

See `scripts/README.md` for detailed documentation.

## Examples

Check out the `examples/` directory for various usage patterns:
- `esm-example.html` - Modern ES module usage
- `cdn-umd-example.html` - Traditional script tag / CDN usage
- `typescript-example.ts` - TypeScript examples with React and Vue
- See `examples/README.md` for detailed instructions

Also see:
- `index.html` - Production Google Drive gallery
- `index-static.html` - Static image sources example

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.