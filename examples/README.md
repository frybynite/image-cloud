# Image Cloud Examples

This directory contains various examples demonstrating different ways to use the Image Cloud library.

## Examples

### 1. ESM Example (`esm-example.html`)

Demonstrates modern ES module usage in the browser.

**Usage:**
```bash
# Serve the project directory
npx serve ..
# Open http://localhost:3000/examples/esm-example.html
```

**Features:**
- Uses ES6 modules (`<script type="module">`)
- Direct import from `dist/image-cloud.js`
- Random layout configuration
- Static image sources from URLs

### 2. UMD/CDN Example (`cdn-umd-example.html`)

Shows how to use the library via script tag without module system (CDN-style).

**Usage:**
```bash
# Serve the project directory
npx serve ..
# Open http://localhost:3000/examples/cdn-umd-example.html
```

**Features:**
- Traditional script tag loading
- Access via global `window.ImageCloud`
- Works in older browsers
- Radial layout configuration

### 3. TypeScript Example (`typescript-example.ts`)

Comprehensive TypeScript usage examples for various frameworks.

**Includes:**
- Basic TypeScript usage
- Full type safety with interfaces
- Google Drive integration
- React component example
- Vue 3 Composition API example

**Usage:**
```typescript
import { ImageCloud } from '@frybynite/image-cloud';
import '@frybynite/image-cloud/style.css';

const cloud = new ImageCloud({
    containerId: 'cloud',
    loaderType: 'static',
    staticLoader: {
        sources: [{ type: 'urls', urls: ['img1.jpg'] }]
    }
});

await cloud.init();
```

## Parent Directory Examples

### Main Cloud (`../google-drive-loader-example.html`)

Production Google Drive cloud with auto-initialization.

**Features:**
- Google Drive API integration
- Auto-initialization from data attributes
- Production-ready setup

### Static Cloud (`../static-loader-example.html`)

Cloud demonstrating static image loading with mixed sources.

**Features:**
- Mixed URL and local path sources
- Static loader configuration
- Auto-initialization

## Running Examples

### Option 1: Using a local server

```bash
# From the project root
npm install -g serve
serve .

# Open browser to:
# http://localhost:3000/examples/esm-example.html
# http://localhost:3000/examples/cdn-umd-example.html
# http://localhost:3000/google-drive-loader-example.html
# http://localhost:3000/static-loader-example.html
```

### Option 2: Using Python

```bash
# From the project root
python -m http.server 8000

# Open browser to:
# http://localhost:8000/examples/esm-example.html
```

### Option 3: Using VS Code Live Server

1. Install "Live Server" extension in VS Code
2. Right-click any HTML file
3. Select "Open with Live Server"

## Testing Different Configurations

### Random Layout
```javascript
config: {
    layout: {
        type: 'random',
        baseImageSize: 200,
        rotationRange: 15
    }
}
```

### Radial Layout
```javascript
config: {
    layout: {
        type: 'radial',
        baseImageSize: 200,
        rotationRange: 10
    }
}
```

### Custom Animation
```javascript
config: {
    animation: {
        duration: 1000,
        queueInterval: 200
    }
}
```

### Zoom Settings
```javascript
config: {
    zoom: {
        focusScale: 3.5,
        mobileScale: 2.5
    }
}
```

## Notes

- Make sure the library is built (`npm run build`) before running examples
- All examples load from `../dist/` directory
- Static image URLs may have CORS restrictions
- Google Drive examples require a valid API key
