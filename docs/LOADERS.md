# Image Loaders

Image Cloud supports multiple image sources through configurable loaders.

## Table of Contents

- [Quick Start — `images` shorthand](#quick-start--images-shorthand)
- [Static Loader](#static-loader)
  - [Configuration Options](#static-loader-configuration-options)
  - [Source Types](#static-source-types)
  - [URL Validation](#url-validation)
- [Google Drive Loader](#google-drive-loader)
  - [Setting Up a Google API Key](#setting-up-a-google-api-key)
  - [Configuration Options](#google-drive-configuration-options)
  - [Source Types](#google-drive-source-types)
  - [Domain Restrictions](#domain-restrictions)
- [Multiple Loaders (Composite)](#multiple-loaders-composite)
- [Shared Loader Config](#shared-loader-config)

---

## Quick Start — `images` shorthand

The simplest way to load images — pass a top-level `images` array:

```javascript
const gallery = new ImageCloud({
  container: 'imageCloud',
  images: [
    'https://images.pexels.com/photos/1266810/pexels-photo-1266810.jpeg?w=800',
    'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?w=800',
    'https://images.pexels.com/photos/1287460/pexels-photo-1287460.jpeg?w=800'
  ]
});

gallery.init();
```

The `images` shorthand is prepended as the first static loader entry. You can combine `images` with explicit `loaders` — the shorthand images come first.

---

## Static Loader

Load images from direct URLs, local file paths, or JSON endpoints. The static loader is the recommended loader for most use cases.

### Static Loader Configuration Options

```typescript
loaders: [{
  static: {
    sources: [...],                      // Required: Array of sources
    validateUrls: true,                  // Optional: Verify URLs exist
    validationTimeout: 5000,             // Optional: Timeout in ms
    validationMethod: 'head',            // Optional: 'head', 'simple', or 'none'
    failOnAllMissing: true,              // Optional: Fail if all URLs invalid
    allowedExtensions: ['jpg', 'png'],   // Optional: Filter by extension
    debugLogging: false                  // Optional: Enable debug output
  }
}]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `sources` | `StaticSource[]` | `[]` | Array of URL, path, or JSON sources. Required. |
| `validateUrls` | `boolean` | `true` | Check if URLs are accessible before loading |
| `validationTimeout` | `number` | `5000` | Timeout for URL validation (ms) |
| `validationMethod` | `string` | `'head'` | `'head'` (HTTP HEAD), `'simple'` (URL format check), `'none'` |
| `failOnAllMissing` | `boolean` | `true` | Throw error if all URLs fail validation |
| `allowedExtensions` | `string[]` | All images | Filter images by file extension |
| `debugLogging` | `boolean` | `false` | Log debug information to console |

### Static Source Types

Sources are identified by shape (which key is present), not by a `type` field.

#### URLs Source

Load from direct image URLs (identified by the `urls` key):

```javascript
{
  urls: [
    'https://images.pexels.com/photos/1266810/pexels-photo-1266810.jpeg?w=800',
    'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?w=800'
  ]
}
```

#### Path Source

Load from a base path with file names (identified by the `path` key):

```javascript
{
  path: '/images/gallery/',
  files: ['photo1.jpg', 'photo2.jpg', 'photo3.png']
}
```

#### JSON Source

Load image URLs from a JSON endpoint (identified by the `json` key):

```javascript
{
  json: '/api/gallery/images.json'
}
```

The endpoint must return JSON with the shape `{ "images": ["url1", "url2", ...] }`. The fetch uses a 10-second timeout via `AbortController`.

### URL Validation

The static loader can validate URLs before attempting to display them:

- **`'head'`** (default): Sends HTTP HEAD request for same-origin URLs. Cross-origin URLs are assumed valid.
- **`'simple'`**: Basic URL format check only.
- **`'none'`**: Skip validation — fastest but broken images won't be filtered.

### Complete Static Loader Example

```javascript
const gallery = new ImageCloud({
  container: 'imageCloud',
  loaders: [{
    static: {
      sources: [
        {
          urls: [
            'https://images.pexels.com/photos/1266810/pexels-photo-1266810.jpeg?w=800',
            'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'
          ]
        },
        {
          path: '/assets/photos/',
          files: ['vacation1.jpg', 'vacation2.jpg', 'vacation3.jpg']
        },
        {
          json: '/api/gallery/images.json'
        }
      ]
    }
  }],
  config: {
    loaders: {
      validateUrls: true,
      validationMethod: 'simple'
    }
  }
});

gallery.init();
```

---

## Google Drive Loader

Load images from public Google Drive folders using the Google Drive API.

[! WARNING] ⚠️
Using a Google Drive API key can result in a security risk that gives anyone who can reference your key access to shared folders. The risk is low if you're not sharing folders, but it is not zero. Also you will likely get a notification from Google when a key is found to be exposed. Make sure your key is restricted to Google Drive, don't share anything publicly unless your understand the risk. Create a Google Drive space that only shares this content as an option. Use this feature with the caution it deserves.

### Setting Up a Google API Key

1. **Create a Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Click "Select a project" → "New Project"
   - Enter a project name and click "Create"

2. **Enable the Google Drive API**
   - In your project, go to "APIs & Services" → "Library"
   - Search for "Google Drive API"
   - Click on it and press "Enable"

3. **Create an API Key**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "API Key"
   - Copy the generated API key

4. **Restrict Your API Key (Recommended)**
   - Click on your API key to edit it
   - Under "Application restrictions", select "HTTP referrers"
   - Add your allowed domains:
     - `localhost` (for development)
     - `localhost:*` (for any port)
     - `yourdomain.com/*` (for production)
     - `*.yourdomain.com/*` (for subdomains)
   - Under "API restrictions", select "Restrict key" and choose "Google Drive API"
   - Click "Save"

5. **Make Your Google Drive Folder Public**
   - In Google Drive, right-click your folder
   - Select "Share" → "General access" → "Anyone with the link"
   - Copy the folder URL

### Google Drive Configuration Options

```typescript
loaders: [{
  googleDrive: {
    apiKey: 'YOUR_API_KEY',           // Required: Google API key
    sources: [...],                    // Required: Array of sources
    allowedExtensions: ['jpg', 'png'], // Optional: Filter by extension
    debugLogging: false                // Optional: Enable debug output
  }
}]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiKey` | `string` | - | **Required.** Your Google API key |
| `sources` | `GoogleDriveSource[]` | - | **Required.** Array of folder or file sources |
| `allowedExtensions` | `string[]` | All images | Filter images by file extension |
| `debugLogging` | `boolean` | `false` | Log debug information to console |

> **Note:** The `validateUrls`, `validationTimeout`, `validationMethod`, and `failOnAllMissing` options from `config.loaders` do not apply to the Google Drive loader. The Drive API confirms file existence when listing folder contents, so URLs are already validated. Additionally, Google Drive image proxy URLs (`lh3.googleusercontent.com`) do not support cross-origin HEAD requests due to CORS restrictions, making browser-side validation impossible.

### Google Drive Source Types

Sources are identified by shape (which key is present).

#### Folder Source

Load all images from a folder (identified by the `folders` key):

```javascript
{
  folders: [
    'https://drive.google.com/drive/folders/FOLDER_ID?usp=sharing'
  ],
  recursive: true  // Include subfolders (default: true)
}
```

#### Files Source

Load specific files by URL or ID (identified by the `files` key):

```javascript
{
  files: [
    'https://drive.google.com/file/d/FILE_ID/view',
    'FILE_ID_2',
    'FILE_ID_3'
  ]
}
```

### Complete Google Drive Example

```javascript
const gallery = new ImageCloud({
  container: 'imageCloud',
  loaders: [{
    googleDrive: {
      apiKey: 'AIzaSy...',
      sources: [
        {
          folders: ['https://drive.google.com/drive/folders/1ABC...?usp=sharing'],
          recursive: true
        }
      ]
    }
  }]
});

gallery.init();
```

### Domain Restrictions

When hosting on a website (not localhost), your API key must be configured to allow requests from that domain:

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → "APIs & Services" → "Credentials"
2. Edit your API key
3. Under "HTTP referrers", add your domain (e.g., `yourdomain.github.io/*`)

Without this, you'll see CORS errors and the loader will fail.

---

## Multiple Loaders (Composite)

Use the `loaders` array with multiple entries to pull images from different sources into a single gallery. Composite behavior is implicit — no wrapper needed.

```javascript
const gallery = new ImageCloud({
  container: 'imageCloud',
  loaders: [
    {
      googleDrive: {
        apiKey: 'YOUR_API_KEY',
        sources: [{ folders: ['https://drive.google.com/...'] }]
      }
    },
    {
      static: {
        sources: [{ urls: ['https://images.pexels.com/photos/1054218/pexels-photo-1054218.jpeg?w=800'] }]
      }
    }
  ]
});

gallery.init();
```

All loaders are prepared in parallel. If one loader fails, others continue (failed loader contributes 0 images). URLs are combined in the order loaders appear in the array.

You can also combine the `images` shorthand with explicit `loaders`:

```javascript
const gallery = new ImageCloud({
  container: 'imageCloud',
  images: ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg'],
  loaders: [{
    googleDrive: {
      apiKey: 'YOUR_API_KEY',
      sources: [{ folders: ['https://drive.google.com/...'] }]
    }
  }]
});
```

The `images` URLs appear first, followed by images from the explicit loaders.

---

## Shared Loader Config

Use `config.loaders` to set defaults that apply to all loaders. Individual loader entries can override these settings.

```javascript
const gallery = new ImageCloud({
  container: 'imageCloud',
  images: ['img1.jpg', 'img2.jpg'],
  config: {
    loaders: {
      validateUrls: true,            // Default: true
      validationTimeout: 5000,       // Default: 5000
      validationMethod: 'head',      // Default: 'head'
      failOnAllMissing: true,        // Default: true
      allowedExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'],
      debugLogging: false            // Default: false
    }
  }
});
```

**Config merge order:** `config.loaders` (shared defaults) → individual loader entry overrides → final config passed to loader constructor.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `validateUrls` | `boolean` | `true` | Check if URLs are accessible before loading |
| `validationTimeout` | `number` | `5000` | Timeout for URL validation (ms) |
| `validationMethod` | `string` | `'head'` | `'head'`, `'simple'`, or `'none'` |
| `failOnAllMissing` | `boolean` | `true` | Throw error if all URLs fail validation |
| `allowedExtensions` | `string[]` | `['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp']` | Filter images by extension |
| `debugLogging` | `boolean` | `false` | Output debug information to console |
