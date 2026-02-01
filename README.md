![Image Cloud Banner](https://raw.githubusercontent.com/frybynite/image-cloud/main/images/image-cloud-banner.png)

# Image Cloud Library

A TypeScript library for creating interactive image clouds with animated scattered layouts and zoom effects. Supports multiple image sources (Google Drive, static URLs) and layout algorithms.

> [!WARNING]
> ⚠️ All minor versions of this library before 1.0 (e.g., 0.1, 0.2, ...) will include breaking changes during development. Please re-test every time before upgrading until we have published v1.0.

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
https://cdn.jsdelivr.net/npm/@frybynite/image-cloud@latest/dist/image-cloud.js      (ESM)
https://cdn.jsdelivr.net/npm/@frybynite/image-cloud@latest/dist/image-cloud.umd.js  (UMD)
https://cdn.jsdelivr.net/npm/@frybynite/image-cloud@latest/dist/image-cloud-auto-init.js
https://cdn.jsdelivr.net/npm/@frybynite/image-cloud@latest/dist/style.css
```

**unpkg**
```
https://unpkg.com/@frybynite/image-cloud@latest/dist/image-cloud.js      (ESM)
https://unpkg.com/@frybynite/image-cloud@latest/dist/image-cloud.umd.js  (UMD)
https://unpkg.com/@frybynite/image-cloud@latest/dist/image-cloud-auto-init.js
https://unpkg.com/@frybynite/image-cloud@latest/dist/style.css
```

Replace `@latest` with a specific version (e.g., `@0.2.1`) to pin to that release.

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
            'https://images.pexels.com/photos/1261728/pexels-photo-1261728.jpeg?auto=compress&w=600',
            'https://images.pexels.com/photos/3225517/pexels-photo-3225517.jpeg?auto=compress&w=600',
            'https://images.pexels.com/photos/1402787/pexels-photo-1402787.jpeg?auto=compress&w=600'
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
              "https://images.pexels.com/photos/1261728/pexels-photo-1261728.jpeg?auto=compress&w=600",
              "https://images.pexels.com/photos/3225517/pexels-photo-3225517.jpeg?auto=compress&w=600",
              "https://images.pexels.com/photos/1402787/pexels-photo-1402787.jpeg?auto=compress&w=600"
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
  <script type="module" src="https://cdn.jsdelivr.net/npm/@frybynite/image-cloud@latest/dist/image-cloud-auto-init.js"></script>
</body>
</html>
```

## Getting Started

For detailed configuration, see the documentation in the `docs/` folder:

1. **[Loaders](docs/LOADERS.md)** — Configure image sources (static URLs, local paths, Google Drive folders)
2. **[Layout Generators](docs/GENERATORS.md)** — Choose and customize layout algorithms (radial, grid, spiral, cluster, random)
3. **[Image Sizing](docs/IMAGE_SIZING.md)** — Control base sizes, variance, and responsive/adaptive behavior
4. **[Full Parameter Reference](docs/PARAMETERS.md)** — Complete configuration options for animation, interaction, styling, and more
5. **[API Reference](docs/api/README.md)** — TypeScript API documentation for the ImageCloud class, types, loaders, and generators

### Using the Configurator

The easiest way to create a custom configuration is with the interactive Configurator tool:

- **Online**: [Image Cloud Configurator](https://frybynite.github.io/image-cloud/configurator/index.html)
- **Local**: Run a local server from the `configurator/` directory

The Configurator lets you visually adjust all settings and exports a ready-to-use JSON configuration.

## Events & Interactions

### Mouse

- **Click image**: Focus/zoom the image
- **Click outside**: Unfocus current image
- **Hover**: Apply hover styling

### Keyboard

- **Arrow Right**: Navigate to next image (when focused)
- **Arrow Left**: Navigate to previous image (when focused)
- **Enter / Space**: Focus hovered image
- **Escape**: Unfocus current image

### Window

- **Resize**: Responsive layout adjustment (debounced)

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