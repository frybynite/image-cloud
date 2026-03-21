# Image Cloud

A TypeScript library for creating interactive image clouds with animated scattered layouts and zoom effects. Supports multiple image sources (static URLs, JSON endpoints, Google Drive) and layout algorithms.

## Features

- Animated image layouts with smooth transitions
- Multiple layout algorithms (radial, grid, spiral, cluster, wave, random)
- Rich entry animations (bounce, elastic, wave paths; spin, wobble rotations)
- Zoom/focus interactions with keyboard and swipe navigation
- State-based image styling (borders, shadows, filters for default/hover/focused)
- Responsive design with adaptive sizing
- Multiple image sources (static URLs, JSON endpoints, Google Drive, composite loaders)
- Interactive configurator for visual configuration
- Zero runtime dependencies
- Full TypeScript support

## Installation

```bash
npm install @frybynite/image-cloud
```

### CDN

No install needed — load directly from a CDN:

**jsDelivr**
```
https://cdn.jsdelivr.net/npm/@frybynite/image-cloud@latest/dist/image-cloud.js
https://cdn.jsdelivr.net/npm/@frybynite/image-cloud@latest/dist/image-cloud.umd.js
https://cdn.jsdelivr.net/npm/@frybynite/image-cloud@latest/dist/image-cloud-auto-init.js
https://cdn.jsdelivr.net/npm/@frybynite/image-cloud@latest/dist/style.css
```

Replace `@latest` with a specific version (e.g., `@0.10.0`) to pin to that release.

## Quick Start

### TypeScript/JavaScript

```typescript
import { imageCloud } from '@frybynite/image-cloud';
import '@frybynite/image-cloud/style.css';

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

### HTML (Auto-initialization)

```html
<div
  id="cloud"
  style="width: 100%; height: 100vh"
  data-image-cloud
  data-config='{
    "images": [
      "https://images.pexels.com/photos/1261728/pexels-photo-1261728.jpeg?auto=compress&w=600"
    ],
    "layout": { "algorithm": "radial" }
  }'
></div>

<!-- Auto-init injects styles automatically -->
<script type="module" src="https://cdn.jsdelivr.net/npm/@frybynite/image-cloud@latest/dist/image-cloud-auto-init.js"></script>
```

### React

```bash
npm install @frybynite/image-cloud react react-dom
```

```tsx
import { ImageCloud } from '@frybynite/image-cloud/react';
import '@frybynite/image-cloud/style.css';

function App() {
  return (
    <ImageCloud
      style={{ width: '100%', height: '80vh' }}
      loaders={[{
        static: {
          sources: [{
            urls: ['img1.jpg', 'img2.jpg', 'img3.jpg']
          }]
        }
      }]}
      layout={{ algorithm: 'radial' }}
    />
  );
}
```

Props are the same as `ImageCloudOptions` (minus `container`) plus `className` and `style`. Use a ref to access the underlying instance:

```tsx
const ref = useRef<ImageCloudRef>(null);
// ref.current.instance — the core ImageCloud instance
```

### Vue 3

```bash
npm install @frybynite/image-cloud vue
```

```vue
<script setup>
import { ImageCloud } from '@frybynite/image-cloud/vue';
import '@frybynite/image-cloud/style.css';

const options = {
  loaders: [{
    static: {
      sources: [{
        urls: ['img1.jpg', 'img2.jpg', 'img3.jpg']
      }]
    }
  }],
  layout: { algorithm: 'radial' }
};
</script>

<template>
  <ImageCloud :options="options" style="width: 100%; height: 80vh" />
</template>
```

Pass configuration via the `options` prop. Changes to `options` trigger automatic reinit.

### Web Component

```bash
npm install @frybynite/image-cloud
```

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@frybynite/image-cloud@latest/dist/style.css">
<script type="module">
  import '@frybynite/image-cloud/web-component';
</script>

<image-cloud
  style="width: 100%; height: 80vh; display: block"
  images='["img1.jpg", "img2.jpg", "img3.jpg"]'
  layout="radial"
></image-cloud>
```

## Documentation

- **[Parameters](parameters.md)** — Complete configuration reference
- **[Layouts](layouts.md)** — Layout algorithms (radial, grid, spiral, cluster, random, wave)
- **[Loaders](loaders.md)** — Image sources (static URLs, JSON endpoints, Google Drive)
- **[Image Sizing](image_sizing.md)** — Base sizes, variance, responsive/adaptive behavior
- **[API Reference](api/README.md)** — TypeScript API documentation
- **[Developer Guide](developer.md)** — Build scripts, testing, project structure
- **[Changelog](changelog.md)** — Release history

## Interactions

| Input | Action |
|-------|--------|
| Click image | Focus/zoom |
| Click outside | Unfocus |
| Arrow Left / Right | Navigate between focused images |
| Enter / Space | Focus hovered image |
| Escape | Unfocus |
| Swipe left / right | Navigate on touch devices |

## License

MIT — [frybynite](https://github.com/frybynite)
