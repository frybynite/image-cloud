# Image Cloud Library

A TypeScript library for creating interactive image clouds with animated scattered layouts and zoom effects. Supports multiple image sources (Google Drive, static URLs) and layout algorithms.

> [!WARNING]
> All minor versions of this library before 1.0 (e.g., 0.1, 0.2, ...) will include breaking changes during development. Please re-test every time before upgrading until we have published v1.0.

## Features

- ✨ Animated image layouts with smooth transitions
- 🎯 Multiple layout algorithms (radial, grid, spiral, cluster, wave, random)
- 🎬 Rich entry animations (bounce, elastic, wave paths; spin, wobble rotations)
- 🔍 Zoom/focus interactions with keyboard navigation
- 🎨 State-based image styling (borders, shadows, filters for default/hover/focused)
- 📱 Responsive design with adaptive sizing
- 🖼️ Multiple image sources (Google Drive, static URLs, composite loaders)
- 🛠️ Interactive configurator for visual configuration
- 📦 Zero runtime dependencies
- 🔷 Full TypeScript support

## Installation

```bash
npm install @frybynite/image-cloud
```

### CDN

No install needed — load directly from a CDN:

**jsDelivr**
```
https://cdn.jsdelivr.net/npm/@frybynite/image-cloud@0.1.0/dist/image-cloud.js      (ESM)
https://cdn.jsdelivr.net/npm/@frybynite/image-cloud@0.1.0/dist/image-cloud.umd.js  (UMD)
https://cdn.jsdelivr.net/npm/@frybynite/image-cloud@0.1.0/dist/image-cloud-auto-init.js
https://cdn.jsdelivr.net/npm/@frybynite/image-cloud@0.1.0/dist/style.css
```

**unpkg**
```
https://unpkg.com/@frybynite/image-cloud@0.1.0/dist/image-cloud.js      (ESM)
https://unpkg.com/@frybynite/image-cloud@0.1.0/dist/image-cloud.umd.js  (UMD)
https://unpkg.com/@frybynite/image-cloud@0.1.0/dist/image-cloud-auto-init.js
https://unpkg.com/@frybynite/image-cloud@0.1.0/dist/style.css
```

Replace `@0.1.0` with the desired version, or use `@latest` for the most recent release.

## Quick Start

### TypeScript/JavaScript (Programmatic API)

```typescript
import { ImageCloud } from '@frybynite/image-cloud';
import '@frybynite/image-cloud/style.css';

const cloud = new ImageCloud({
  container: 'myCloud',
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

await cloud.init();
```

### HTML (Auto-initialization)

```html
<!DOCTYPE html>
<html>
<body>
  <div
    id="cloud"
    style="width: 100%; height: 100vh"
    data-image-cloud
    data-config='{
      "loader": {
        "type": "static",
        "static": {
          "sources": [{
            "type": "urls",
            "urls": [
              "https://example.com/image1.jpg",
              "https://example.com/image2.jpg",
              "https://example.com/image3.jpg"
            ]
          }]
        }
      },
      "layout": {
        "algorithm": "radial"
      }
    }'
  ></div>

  <!-- No CSS link needed — auto-init injects styles automatically -->
  <script type="module" src="node_modules/@frybynite/image-cloud/dist/image-cloud-auto-init.js"></script>
</body>
</html>
```

## Usage Examples

### Static Images from URLs

```typescript
const cloud = new ImageCloud({
  container: 'cloud',
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

await cloud.init();
```

### Static Images from Local Path

```typescript
const cloud = new ImageCloud({
  container: 'cloud',
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

await cloud.init();
```

### Google Drive Folder

```typescript
const cloud = new ImageCloud({
  container: 'cloud',
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

await cloud.init();
```

### Custom Configuration

```typescript
const cloud = new ImageCloud({
  container: 'cloud',
  loader: {
    type: 'static',
    static: {
      sources: [{ type: 'urls', urls: ['img1.jpg', 'img2.jpg'] }]
    }
  },
  layout: {
    algorithm: 'radial',  // 'radial' | 'grid' | 'spiral' | 'cluster' | 'random'
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

await cloud.init();
```

## Configuration Options

See `docs/PARAMETERS.md` for full documentation of the configuration object.

### ImageCloudOptions

```typescript
interface ImageCloudOptions {
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

### ImageCloud Class

#### Methods

- `init(): Promise<void>` - Initialize the cloud and load images
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
import { PlacementGenerator, ImageLayout, ContainerBounds } from '@frybynite/image-cloud';

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
import { ImageCloud } from '@frybynite/image-cloud';
import '@frybynite/image-cloud/style.css';

function CloudComponent() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cloudRef = useRef<ImageCloud | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      cloudRef.current = new ImageCloud({
        container: containerRef.current.id,
        loader: {
          type: 'static',
          static: {
            sources: [{ type: 'urls', urls: ['img1.jpg', 'img2.jpg'] }]
          }
        }
      });

      cloudRef.current.init();
    }

    return () => {
      cloudRef.current?.destroy();
    };
  }, []);

  return <div id="cloud" ref={containerRef} />;
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

## Examples

Check out the `examples/` directory for various usage patterns:
- `esm-example.html` - Modern ES module usage
- `cdn-umd-example.html` - Traditional script tag / CDN usage
- `typescript-example.ts` - TypeScript examples with React and Vue
- See `examples/README.md` for detailed instructions

Also see:
- `index.html` - Production Google Drive cloud
- `index-static.html` - Static image sources example

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

See [docs/DEVELOPER.md](docs/DEVELOPER.md) for build scripts, testing, and project structure.