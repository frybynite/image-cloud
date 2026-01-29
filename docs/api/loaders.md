# Loaders

Loaders discover and provide image URLs to the gallery. The library includes three loader types.

## Import

```typescript
import {
  StaticImageLoader,
  GoogleDriveLoader,
  CompositeLoader,
  ImageFilter
} from '@frybynite/image-cloud';
```

## Loader Interface

All loaders implement this interface:

```typescript
interface ImageLoader {
  prepare(filter: IImageFilter): Promise<void>;
  imagesLength(): number;
  imageURLs(): string[];
  isPrepared(): boolean;
}
```

| Method | Description |
|--------|-------------|
| `prepare(filter)` | Async - discover images and apply filter |
| `imagesLength()` | Get count of discovered images |
| `imageURLs()` | Get array of image URLs |
| `isPrepared()` | Check if loader has been prepared |

---

## StaticImageLoader

Load images from static URLs or local paths.

### Configuration

```typescript
interface StaticLoaderConfig {
  sources: StaticSource[];
  validateUrls?: boolean;           // Default: true
  validationTimeout?: number;       // Default: 5000ms
  validationMethod?: 'head' | 'simple' | 'none';
  failOnAllMissing?: boolean;       // Default: true
  allowedExtensions?: string[];     // Default: jpg, jpeg, png, gif, webp, bmp
  debugLogging?: boolean;
}
```

### Source Types

**URLs Source** - Direct image URLs:

```typescript
{
  type: 'urls',
  urls: [
    'https://example.com/image1.jpg',
    'https://example.com/image2.png'
  ]
}
```

**Path Source** - Base path + filenames:

```typescript
{
  type: 'path',
  basePath: '/images/gallery',
  files: ['photo1.jpg', 'photo2.jpg', 'photo3.jpg']
}
```

### Usage via Config

```typescript
const cloud = new ImageCloud({
  loader: {
    type: 'static',
    static: {
      sources: [
        { type: 'urls', urls: ['img1.jpg', 'img2.jpg'] }
      ],
      validateUrls: true
    }
  }
});
```

### Direct Usage

```typescript
import { StaticImageLoader, ImageFilter } from '@frybynite/image-cloud';

const loader = new StaticImageLoader({
  sources: [
    { type: 'urls', urls: ['img1.jpg', 'img2.jpg'] }
  ]
});

await loader.prepare(new ImageFilter());
console.log(loader.imageURLs()); // ['img1.jpg', 'img2.jpg']
```

---

## GoogleDriveLoader

Load images from Google Drive folders or files.

### Prerequisites

1. A Google Cloud project with Drive API enabled
2. An API key with Drive API access
3. Publicly shared folders/files (or appropriate OAuth for private files)

### Configuration

```typescript
interface GoogleDriveLoaderConfig {
  apiKey: string;                   // Required
  sources: GoogleDriveSource[];     // Required
  apiEndpoint?: string;             // Default: Google Drive API v3
  allowedExtensions?: string[];     // Default: jpg, jpeg, png, gif, webp, bmp
  debugLogging?: boolean;
}
```

### Source Types

**Folder Source** - Load all images from folders:

```typescript
{
  type: 'folder',
  folders: [
    'https://drive.google.com/drive/folders/FOLDER_ID',
    // or just the folder ID
    '1abc123DEF456'
  ],
  recursive: true  // Default: true
}
```

**Files Source** - Load specific files:

```typescript
{
  type: 'files',
  files: [
    'https://drive.google.com/file/d/FILE_ID/view',
    // or just the file ID
    '1xyz789ABC123'
  ]
}
```

### Usage via Config

```typescript
const cloud = new ImageCloud({
  loader: {
    type: 'googleDrive',
    googleDrive: {
      apiKey: 'YOUR_API_KEY',
      sources: [
        {
          type: 'folder',
          folders: ['https://drive.google.com/drive/folders/FOLDER_ID']
        }
      ]
    }
  }
});
```

### Direct Usage

```typescript
import { GoogleDriveLoader, ImageFilter } from '@frybynite/image-cloud';

const loader = new GoogleDriveLoader({
  apiKey: 'YOUR_API_KEY',
  sources: [{ type: 'folder', folders: ['FOLDER_ID'] }]
});

await loader.prepare(new ImageFilter());
console.log(loader.imagesLength()); // Number of images found
```

### Helper Methods

```typescript
// Extract folder ID from URL
const id = loader.extractFolderId('https://drive.google.com/drive/folders/abc123');
// Returns: 'abc123'

// Generate direct URLs from file IDs
const urls = loader.manualImageUrls(['fileId1', 'fileId2']);
// Returns: ['https://drive.google.com/uc?id=fileId1', ...]
```

---

## CompositeLoader

Combine multiple loaders into one.

### Configuration

```typescript
interface CompositeLoaderConfig {
  loaders: ImageLoader[];
  debugLogging?: boolean;
}
```

### Usage via Config

```typescript
const cloud = new ImageCloud({
  loader: {
    type: 'composite',
    composite: {
      loaders: [
        new StaticImageLoader({
          sources: [{ type: 'urls', urls: ['local1.jpg', 'local2.jpg'] }]
        }),
        new GoogleDriveLoader({
          apiKey: 'YOUR_API_KEY',
          sources: [{ type: 'folder', folders: ['FOLDER_ID'] }]
        })
      ]
    }
  }
});
```

### Direct Usage

```typescript
import {
  CompositeLoader,
  StaticImageLoader,
  GoogleDriveLoader,
  ImageFilter
} from '@frybynite/image-cloud';

const composite = new CompositeLoader({
  loaders: [
    new StaticImageLoader({ sources: [{ type: 'urls', urls: ['a.jpg'] }] }),
    new GoogleDriveLoader({ apiKey: 'KEY', sources: [{ type: 'folder', folders: ['ID'] }] })
  ]
});

await composite.prepare(new ImageFilter());
// URLs are combined, preserving loader order
console.log(composite.imageURLs());
```

---

## ImageFilter

Filter images by file extension.

```typescript
import { ImageFilter } from '@frybynite/image-cloud';

// Default extensions: jpg, jpeg, png, gif, webp, bmp
const filter = new ImageFilter();

// Custom extensions
const customFilter = new ImageFilter(['jpg', 'png']);

// Check if a filename is allowed
filter.isAllowed('photo.jpg');  // true
filter.isAllowed('doc.pdf');    // false

// Get allowed extensions
filter.getAllowedExtensions();  // ['jpg', 'jpeg', 'png', ...]
```

---

## Creating Custom Loaders

Implement the `ImageLoader` interface:

```typescript
import type { ImageLoader, IImageFilter } from '@frybynite/image-cloud';

class MyCustomLoader implements ImageLoader {
  private urls: string[] = [];
  private prepared = false;

  async prepare(filter: IImageFilter): Promise<void> {
    // Fetch your images
    const allUrls = await this.fetchFromMySource();

    // Apply filter
    this.urls = allUrls.filter(url => {
      const filename = url.split('/').pop() || '';
      return filter.isAllowed(filename);
    });

    this.prepared = true;
  }

  imagesLength(): number {
    return this.urls.length;
  }

  imageURLs(): string[] {
    return this.urls;
  }

  isPrepared(): boolean {
    return this.prepared;
  }

  private async fetchFromMySource(): Promise<string[]> {
    // Your implementation
    return [];
  }
}
```

Use with CompositeLoader or pass directly to ImageCloud:

```typescript
const cloud = new ImageCloud({
  loader: {
    type: 'composite',
    composite: {
      loaders: [new MyCustomLoader()]
    }
  }
});
```
