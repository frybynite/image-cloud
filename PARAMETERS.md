# Configuration Parameters

The Image Cloud library offers a flexible configuration system to customize every aspect of the gallery, from image loading to animation dynamics.

## Pattern-Based Configuration

Initialize the gallery using the `ImageGalleryOptions` structure.

```typescript
const gallery = new ImageGallery({
  container: 'my-gallery-id', // optional, defaults to 'imageCloud'
  loader: { ... },
  layout: { ... },
  animation: { ... },
  interaction: { ... },
  rendering: { ... },
  debug: false
});
```

### 1. Loader Configuration (`loader`)

Controls how images are fetched and validated.

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `type` | `'googleDrive' \| 'static'` | `'googleDrive'` | The primary source type for images. |
| `googleDrive` | `GoogleDriveLoaderConfig` | *See below* | Configuration for Google Drive loading. |
| `static` | `StaticLoaderConfig` | *See below* | Configuration for static image loading. |

#### Google Drive Config (`loader.googleDrive`)

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `apiKey` | `string` | `''` | **Required.** Your Google Drive API Key. |
| `sources` | `GoogleDriveSource[]` | `[]` | **Required.** Array of folder or file sources. |
| `apiEndpoint` | `string` | `'https://www.googleapis.com/drive/v3/files'` | Google Drive API endpoint. |
| `allowedExtensions` | `string[]` | `['jpg', 'jpeg', ...]` | Allowed image file extensions. |
| `debugLogging` | `boolean` | `false` | Enable debug logs for the loader. |

**Google Drive Source Objects:**
*   **Folder:** `{ type: 'folder', folders: string[], recursive?: boolean }`
*   **Files:** `{ type: 'files', files: string[] }`

#### Static Loader Config (`loader.static`)

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `sources` | `StaticSource[]` | `[]` | **Required.** Array of static sources. |
| `validateUrls` | `boolean` | `true` | Check if image URLs exist before loading. |
| `validationTimeout` | `number` | `5000` | Timeout (ms) for URL validation. |
| `validationMethod` | `'head' \| 'simple' \| 'none'` | `'head'` | Method used to validate URLs. |
| `failOnAllMissing` | `boolean` | `true` | Throw error if no images are found. |
| `allowedExtensions` | `string[]` | `['jpg', 'jpeg', ...]` | Allowed image file extensions. |

**Static Source Objects:**
*   **URLs:** `{ type: 'urls', urls: string[] }`
*   **Path:** `{ type: 'path', basePath: string, files: string[] }`

### 2. Layout Configuration (`layout`)

Controls the positioning and sizing of images.

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `algorithm` | `'random' \| 'radial'` | `'radial'` | The placement algorithm to use. |
| `debugRadials` | `boolean` | `false` | Visualize the radial layout structure (debug). |
| `sizing` | `LayoutSizingConfig` | *See below* | Configuration for image dimensions. |
| `rotation` | `LayoutRotationConfig` | *See below* | Configuration for image rotation. |
| `spacing` | `LayoutSpacingConfig` | *See below* | Configuration for margins and gaps. |

#### Sizing (`layout.sizing`)

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `base` | `number` | `200` | Base height of images in pixels. |
| `variance.min` | `number` | `1.0` | Minimum size multiplier. |
| `variance.max` | `number` | `1.0` | Maximum size multiplier. |
| `responsive` | `ResponsiveHeight[]` | *See defaults* | Array of `{ minWidth, height }` objects for responsive sizing. |

#### Rotation (`layout.rotation`)

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `enabled` | `boolean` | `true` | Whether images should be rotated. |
| `range.min` | `number` | `-15` | Minimum rotation degrees. |
| `range.max` | `number` | `15` | Maximum rotation degrees. |

#### Spacing (`layout.spacing`)

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `padding` | `number` | `50` | Padding from container edges (px). |
| `minGap` | `number` | `20` | Minimum space between images (px). |

### 3. Animation Configuration (`animation`)

Controls entrance and interaction animations.

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `duration` | `number` | `600` | Base animation duration (ms). |
| `easing.default` | `string` | `cubic-bezier(...)` | CSS easing string for standard moves. |
| `easing.bounce` | `string` | `cubic-bezier(...)` | CSS easing for entrance bounce. |
| `easing.focus` | `string` | `cubic-bezier(...)` | CSS easing for zoom focus. |
| `queue.enabled` | `boolean` | `true` | Enable staggered entrance. |
| `queue.interval` | `number` | `150` | Time between appearance of each image (ms). |

### 4. Interaction Configuration (`interaction`)

Controls user interactions like clicking and zooming.

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `focus.scale` | `number` | `2.5` | Scale factor when an image is clicked. |
| `focus.mobileScale` | `number` | `2.0` | Scale factor on mobile devices. |
| `focus.unfocusedOpacity`| `number` | `0.3` | Opacity of non-selected images. |
| `focus.zIndex` | `number` | `1000` | Z-index of the focused image. |

### 5. Rendering Configuration (`rendering`)

Controls UI elements and responsiveness.

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `ui.showLoadingSpinner` | `boolean` | `false` | Show a spinner while loading images. |
| `responsive.breakpoints`| `object` | `{ mobile: 768 }`| Breakpoint definitions. |

### 6. Debug (`debug`)

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `debug` | `boolean` | `false` | Enable global debug logging. |

---

## Example

```typescript
const gallery = new ImageGallery({
  container: 'my-gallery',
  loader: {
    type: 'static',
    static: {
      sources: [
        { type: 'urls', urls: ['img1.jpg', 'img2.jpg'] }
      ]
    }
  },
  layout: {
    algorithm: 'radial',
    spacing: {
      padding: 100,
      minGap: 30
    }
  },
  animation: {
    duration: 800,
    queue: {
      interval: 100
    }
  },
  debug: true
});
```
