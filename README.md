![Image Cloud Banner](https://raw.githubusercontent.com/frybynite/image-cloud/main/images/image-cloud-banner.png)

# Image Cloud Library

A TypeScript library for creating interactive image clouds with animated scattered layouts and zoom effects. Supports multiple image sources (static URLs, JSON endpoints, Google Drive) and layout algorithms.

## Features

- ✨ Animated image layouts with smooth transitions
- 🎯 Multiple layout algorithms (radial, grid, spiral, cluster, wave, honeycomb, random)
- 🎬 Rich entry animations (bounce, elastic, wave paths; spin, wobble rotations)
- 🔍 Zoom/focus interactions with keyboard, swipe, and mouse wheel navigation
- 🎨 State-based image styling (borders, shadows, filters for default/hover/focused)
- 📱 Responsive design with adaptive sizing
- 🖼️ Multiple image sources (static URLs, JSON endpoints, Google Drive, composite loaders)
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
https://cdn.jsdelivr.net/npm/@frybynite/image-cloud@latest/dist/image-cloud.js              (Main - ESM)
https://cdn.jsdelivr.net/npm/@frybynite/image-cloud@latest/dist/image-cloud.umd.js          (Main - UMD)
https://cdn.jsdelivr.net/npm/@frybynite/image-cloud@latest/dist/image-cloud-auto-init.js    (Auto-init)
https://cdn.jsdelivr.net/npm/@frybynite/image-cloud@latest/dist/style.css
```

**unpkg**
```
https://unpkg.com/@frybynite/image-cloud@latest/dist/image-cloud.js              (Main - ESM)
https://unpkg.com/@frybynite/image-cloud@latest/dist/image-cloud.umd.js          (Main - UMD)
https://unpkg.com/@frybynite/image-cloud@latest/dist/image-cloud-auto-init.js    (Auto-init)
https://unpkg.com/@frybynite/image-cloud@latest/dist/style.css
```

Replace `@latest` with a specific version (e.g., `@0.5.1`) to pin to that release.

## Quick Start

### TypeScript/JavaScript (Programmatic API)

```typescript
import { imageCloud } from '@frybynite/image-cloud';
import '@frybynite/image-cloud/style.css';

// Single-expression initialization — imageCloud() constructs and calls init() for you
const cloud = await imageCloud({
  container: 'myCloud',
  images: [
    'https://images.pexels.com/photos/1261728/pexels-photo-1261728.jpeg?auto=compress&w=600',
    'https://images.pexels.com/photos/3225517/pexels-photo-3225517.jpeg?auto=compress&w=600',
    'https://images.pexels.com/photos/1402787/pexels-photo-1402787.jpeg?auto=compress&w=600'
  ],
  layout: {
    algorithm: 'radial'
  }
});
```

> For advanced lifecycle control (e.g. deferred init, re-use), the `ImageCloud` class is also exported and still works as before:
> ```typescript
> const cloud = new ImageCloud({ container: 'myCloud', images: [...] });
> await cloud.init();
> ```

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
      "images": [
        "https://images.pexels.com/photos/1261728/pexels-photo-1261728.jpeg?auto=compress&w=600",
        "https://images.pexels.com/photos/3225517/pexels-photo-3225517.jpeg?auto=compress&w=600",
        "https://images.pexels.com/photos/1402787/pexels-photo-1402787.jpeg?auto=compress&w=600"
      ],
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

Full documentation is available at **[frybynite.github.io/image-cloud](https://frybynite.github.io/image-cloud/)**

- **[Loaders](https://frybynite.github.io/image-cloud/loaders/)** — Configure image sources (static URLs, JSON endpoints, Google Drive)
- **[Layouts](https://frybynite.github.io/image-cloud/layouts/)** — Layout algorithms (radial, grid, spiral, cluster, wave, honeycomb, random)
- **[Image Sizing](https://frybynite.github.io/image-cloud/image_sizing/)** — Base sizes, variance, and responsive/adaptive behavior
- **[Parameters](https://frybynite.github.io/image-cloud/parameters/)** — Complete configuration reference
- **[API Reference](https://frybynite.github.io/image-cloud/api/)** — TypeScript API documentation

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

### Touch

- **Swipe left / right**: Navigate between focused images

### Window

- **Resize**: Responsive layout adjustment (debounced)

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile: iOS Safari 12+, Chrome Android

## Examples

Live examples are published at [frybynite.github.io/image-cloud/examples/](https://frybynite.github.io/image-cloud/examples/):

- [Static URLs Shorthand](https://frybynite.github.io/image-cloud/examples/static-urls-shorthand-example.html) - Simplest setup: direct URL array
- [Static Loader](https://frybynite.github.io/image-cloud/examples/static-loader-example.html) - Static image URLs
- [Static JSON Source](https://frybynite.github.io/image-cloud/examples/static-json-source-example.html) - Load images from a JSON endpoint
- [Google Drive](https://frybynite.github.io/image-cloud/examples/google-drive-loader-example.html) - Google Drive folder source
- [Auto-Init](https://frybynite.github.io/image-cloud/examples/auto-init-example.html) - Zero-JS setup using data attributes
- [ESM Module](https://frybynite.github.io/image-cloud/examples/esm-example.html) - ES module usage
- [CDN/UMD](https://frybynite.github.io/image-cloud/examples/cdn-umd-example.html) - CDN script tag usage
- [Iframe Embed](https://frybynite.github.io/image-cloud/examples/iframe-example.html) - Embedded in an iframe
- [Layout Algorithms](https://frybynite.github.io/image-cloud/examples/layout-algorithms.html) - Compare all layout algorithms
- [Entry Animations](https://frybynite.github.io/image-cloud/examples/entry-animations.html) - Entry animation styles
- [Keyboard Navigation](https://frybynite.github.io/image-cloud/examples/keyboard-navigation-demo.html) - Per-container keyboard navigation
- [Image Style Demo](https://frybynite.github.io/image-cloud/examples/image-style-demo.html) - Borders, shadows, and filters
- [Detailed Styling](https://frybynite.github.io/image-cloud/examples/styling/index.html) - In-depth styling examples

## Changelog

See [Changelog](https://frybynite.github.io/image-cloud/changelog/) for a full list of changes across all versions.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

See the [Developer Guide](https://frybynite.github.io/image-cloud/developer/) for build scripts, testing, and project structure.

## License

MIT

## Author

[frybynite](https://github.com/frybynite)