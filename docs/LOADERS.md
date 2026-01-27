# Image Loaders

Image Cloud supports multiple image sources through configurable loaders.

## Table of Contents

- [Google Drive Loader](#google-drive-loader)
  - [Setting Up a Google API Key](#setting-up-a-google-api-key)
  - [Configuration Options](#google-drive-configuration-options)
  - [Source Types](#google-drive-source-types)
  - [Domain Restrictions](#domain-restrictions)
- [Static Loader](#static-loader)
  - [Configuration Options](#static-loader-configuration-options)
  - [Source Types](#static-source-types)
  - [URL Validation](#url-validation)
- [Composite Loader](#composite-loader)
- [Common Options](#common-options)

---

## Google Drive Loader

Load images from public Google Drive folders using the Google Drive API.

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
loader: {
  type: 'googleDrive',
  googleDrive: {
    apiKey: 'YOUR_API_KEY',           // Required: Google API key
    sources: [...],                    // Required: Array of sources
    allowedExtensions: ['jpg', 'png'], // Optional: Filter by extension
    debugLogging: false                // Optional: Enable debug output
  }
}
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiKey` | `string` | - | **Required.** Your Google API key |
| `sources` | `GoogleDriveSource[]` | - | **Required.** Array of folder or file sources |
| `allowedExtensions` | `string[]` | All images | Filter images by file extension |
| `debugLogging` | `boolean` | `false` | Log debug information to console |

### Google Drive Source Types

#### Folder Source

Load all images from a folder (optionally recursive):

```javascript
{
  type: 'folder',
  folders: [
    'https://drive.google.com/drive/folders/FOLDER_ID?usp=sharing'
  ],
  recursive: true  // Include subfolders (default: true)
}
```

#### Files Source

Load specific files by URL or ID:

```javascript
{
  type: 'files',
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
  loader: {
    type: 'googleDrive',
    googleDrive: {
      apiKey: 'AIzaSy...',
      sources: [
        {
          type: 'folder',
          folders: ['https://drive.google.com/drive/folders/1ABC...?usp=sharing'],
          recursive: true
        }
      ]
    }
  }
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

## Static Loader

Load images from direct URLs or local file paths.

### Static Loader Configuration Options

```typescript
loader: {
  type: 'static',
  static: {
    sources: [...],                      // Required: Array of sources
    validateUrls: true,                  // Optional: Verify URLs exist
    validationTimeout: 5000,             // Optional: Timeout in ms
    validationMethod: 'head',            // Optional: 'head', 'simple', or 'none'
    failOnAllMissing: true,              // Optional: Fail if all URLs invalid
    allowedExtensions: ['jpg', 'png'],   // Optional: Filter by extension
    debugLogging: false                  // Optional: Enable debug output
  }
}
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `sources` | `StaticSource[]` | - | **Required.** Array of URL or path sources |
| `validateUrls` | `boolean` | `true` | Check if URLs are accessible before loading |
| `validationTimeout` | `number` | `5000` | Timeout for URL validation (ms) |
| `validationMethod` | `string` | `'head'` | `'head'` (HTTP HEAD), `'simple'` (img load), `'none'` |
| `failOnAllMissing` | `boolean` | `true` | Throw error if all URLs fail validation |
| `allowedExtensions` | `string[]` | All images | Filter images by file extension |
| `debugLogging` | `boolean` | `false` | Log debug information to console |

### Static Source Types

#### URLs Source

Load from direct image URLs:

```javascript
{
  type: 'urls',
  urls: [
    'https://example.com/image1.jpg',
    'https://example.com/image2.png',
    '/local/path/image3.jpg'
  ]
}
```

#### Path Source

Load from a base path with file names:

```javascript
{
  type: 'path',
  basePath: '/images/gallery/',
  files: ['photo1.jpg', 'photo2.jpg', 'photo3.png']
}
```

### URL Validation

The static loader can validate URLs before attempting to display them:

- **`'head'`** (default): Sends HTTP HEAD request - fast but may not work with all servers
- **`'simple'`**: Creates an Image element to test loading - works universally but slower
- **`'none'`**: Skip validation - fastest but broken images won't be filtered

### Complete Static Loader Example

```javascript
const gallery = new ImageCloud({
  container: 'imageCloud',
  loader: {
    type: 'static',
    static: {
      sources: [
        {
          type: 'urls',
          urls: [
            'https://images.pexels.com/photos/1266810/pexels-photo-1266810.jpeg?w=800',
            'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'
          ]
        },
        {
          type: 'path',
          basePath: '/assets/photos/',
          files: ['vacation1.jpg', 'vacation2.jpg', 'vacation3.jpg']
        }
      ],
      validateUrls: true,
      validationMethod: 'simple'
    }
  }
});

gallery.init();
```

---

## Composite Loader

Combine multiple loaders to pull images from different sources into a single gallery.

```javascript
const gallery = new ImageCloud({
  container: 'imageCloud',
  loader: {
    type: 'composite',
    composite: {
      loaders: [
        {
          type: 'googleDrive',
          googleDrive: {
            apiKey: 'YOUR_API_KEY',
            sources: [{ type: 'folder', folders: ['https://drive.google.com/...'] }]
          }
        },
        {
          type: 'static',
          static: {
            sources: [{ type: 'urls', urls: ['https://example.com/extra.jpg'] }]
          }
        }
      ],
      debugLogging: false
    }
  }
});

gallery.init();
```

---

## Common Options

These options are available for all loader types:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `allowedExtensions` | `string[]` | `['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg']` | Filter images by extension |
| `debugLogging` | `boolean` | `false` | Output debug information to console |
