# Image Cloud Examples

This directory contains various examples demonstrating different ways to use the Image Cloud library.

## Important: Loader Imports

**All examples require loader imports.** The main Image Cloud package does not include loaders — they are imported separately to keep the bundle small:

```typescript
import '@frybynite/image-cloud/loaders/static';        // For static URLs/paths
import '@frybynite/image-cloud/loaders/google-drive';  // For Google Drive
import '@frybynite/image-cloud/loaders/all';           // For all loaders
```

See the examples below for how each type uses loaders.

## Examples

### Basic Usage

#### ESM Example (`esm-example.html`)
Modern ES module usage in the browser.
- Uses ES6 modules (`<script type="module">`)
- Direct import from `dist/image-cloud.js`
- **Requires loader import** (e.g., `@frybynite/image-cloud/loaders/static`)

#### UMD/CDN Example (`cdn-umd-example.html`)
Traditional script tag without module system (CDN-style).
- Access via global `window.ImageCloud`
- Works in older browsers

#### Auto-Init Example (`auto-init-example.html`)
HTML data attribute initialization.
- No JavaScript required
- Configuration via `data-config` attribute

### Loaders

Loaders are imported as separate bundles. Choose the loaders you need for your gallery.

#### Static Loader Example (`static-loader-example.html`)
Load images from static URLs, paths, or JSON endpoints.
- Requires: `import '@frybynite/image-cloud/loaders/static'`
- URL-based image sources
- Local path configuration
- JSON endpoint support

#### Google Drive Loader Example (`google-drive-loader-example.html`)
Load images from Google Drive folders.
- Requires: `import '@frybynite/image-cloud/loaders/google-drive'`
- Google Drive API integration
- Requires valid API key
- Folder or file-based sources

### Layout & Animation

#### Layout Algorithms (`layout-algorithms.html`)
Compare all available layout algorithms side-by-side.
- Radial, grid, spiral, cluster, wave, random

#### Entry Animations (`entry-animations.html`)
Demonstrates entry animation styles.
- Bounce, elastic, wave paths
- Spin, wobble rotations

### Styling

#### Image Style Demo (`image-style-demo.html`)
Demonstrates image styling options.
- Borders, shadows, filters
- Default, hover, and focused states

#### Styling Directory (`styling/`)
Additional styling examples and demos.

### Other

#### Iframe Example (`iframe-example.html`)
Embedding the gallery in an iframe.

#### TypeScript Example (`typescript-example.ts`)
Comprehensive TypeScript usage examples.
- Basic TypeScript usage
- Full type safety with interfaces
- React component example
- Vue 3 Composition API example

## Running Examples

### Option 1: Using npm dev server

```bash
# From the project root
npm run dev

# Open browser to:
# http://localhost:5173/examples/esm-example.html
# http://localhost:5173/examples/cdn-umd-example.html
# etc.
```

### Option 2: Using a local server

```bash
# From the project root
npx serve .

# Open browser to:
# http://localhost:3000/examples/esm-example.html
```

### Option 3: Using Python

```bash
# From the project root
python -m http.server 8000

# Open browser to:
# http://localhost:8000/examples/esm-example.html
```

### Option 4: Using VS Code Live Server

1. Install "Live Server" extension in VS Code
2. Right-click any HTML file
3. Select "Open with Live Server"

## Quick Configuration Examples

### Layout Options
```javascript
layout: {
    algorithm: 'radial',  // radial, grid, spiral, cluster, wave, random
    rotationRange: 15
}
```

### Animation Options
```javascript
animation: {
    duration: 600,
    queue: {
        enabled: true,
        interval: 100
    }
}
```

### Zoom Settings
```javascript
zoom: {
    scale: 0.8,
    mobileScale: 0.9
}
```

## Notes

- **All examples must import loaders** — this is not done automatically
- Examples can load from jsDelivr CDN or local dist files
- Static image URLs may have CORS restrictions
- Google Drive examples require a valid API key
- You can import individual loaders (`@frybynite/image-cloud/loaders/static`) or all loaders at once (`@frybynite/image-cloud/loaders/all`)
- Loaders are provided as separate bundles to minimize bundle size — only import what you need
