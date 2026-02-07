# Loader Configuration Simplification (Breaking Change)

## Context

The loader config is the most verbose part of the ImageCloud API. Even the simplest case (a list of URLs) requires 3 levels of nesting. This plan proposes flattening the config structure as a clean breaking change — no backward compatibility shim.

## Current Pain Points

### 1. Redundant nesting — type name repeated as property key
```javascript
loader: { type: 'static', static: { urls: [...] } }
loader: { type: 'googleDrive', googleDrive: { apiKey: '...', sources: [...] } }
```

### 2. Too deep for simple cases
```javascript
// 3 levels just to pass URLs: loader → static → urls
loader: { type: 'static', static: { urls: ['url1', 'url2'] } }
```

### 3. Composite adds yet another wrapper
```javascript
loader: { type: 'composite', composite: { loaders: [ { type: 'static', static: { ... } } ] } }
```

### 4. Google Drive common case is verbose
```javascript
sources: [{ type: 'folder', folders: ['https://drive.google.com/...'], recursive: true }]
```

### 5. Defaults carry dead config
`defaults.ts` defines defaults for *both* `googleDrive` and `static` keys regardless of which type is active.

---

## Proposed New Config: Before/After

### Core idea: flatten `{ type: 'X', X: { config } }` into `{ type: 'X', ...config }`

### Static URLs (most common case)

**Before:**
```javascript
loader: {
  type: 'static',
  static: { urls: ['url1', 'url2'] }
}
```

**After:**
```javascript
loader: {
  type: 'static',
  urls: ['url1', 'url2']
}
```

**Or, top-level shorthand (no loader block at all):**
```javascript
new ImageCloud({
  container: 'imageCloud',
  urls: ['url1', 'url2']
})
```

### Static with sources and options

**Before:**
```javascript
loader: {
  type: 'static',
  static: {
    sources: [
      { type: 'urls', urls: ['url1'] },
      { type: 'path', basePath: '/img/', files: ['a.jpg'] },
      { type: 'json', url: '/api/images.json' }
    ],
    validateUrls: true,
    validationMethod: 'head'
  }
}
```

**After:**
```javascript
loader: {
  type: 'static',
  sources: [
    { type: 'urls', urls: ['url1'] },
    { type: 'path', basePath: '/img/', files: ['a.jpg'] },
    { type: 'json', url: '/api/images.json' }
  ],
  validateUrls: true,
  validationMethod: 'head'
}
```

### Google Drive

**Before:**
```javascript
loader: {
  type: 'googleDrive',
  googleDrive: {
    apiKey: 'KEY',
    sources: [
      { type: 'folder', folders: ['https://drive.google.com/...'], recursive: true }
    ]
  }
}
```

**After (flattened):**
```javascript
loader: {
  type: 'googleDrive',
  apiKey: 'KEY',
  sources: [
    { type: 'folder', folders: ['https://drive.google.com/...'], recursive: true }
  ]
}
```

**After (with `folders` shorthand):**
```javascript
loader: {
  type: 'googleDrive',
  apiKey: 'KEY',
  folders: ['https://drive.google.com/...']
  // auto-expands to sources: [{ type: 'folder', folders: [...], recursive: true }]
}
```

### Composite — array replaces explicit composite type

**Before:**
```javascript
loader: {
  type: 'composite',
  composite: {
    loaders: [
      { type: 'static', static: { urls: ['url1'] } },
      { type: 'googleDrive', googleDrive: { apiKey: 'KEY', sources: [...] } }
    ]
  }
}
```

**After (array = composite):**
```javascript
loader: [
  { type: 'static', urls: ['url1'] },
  { type: 'googleDrive', apiKey: 'KEY', sources: [...] }
]
```

---

## New Type System

### Old types (removed)
```typescript
// GONE: LoaderConfig with optional keys for every loader type
interface LoaderConfig {
  type: 'googleDrive' | 'static' | 'composite';
  googleDrive?: GoogleDriveLoaderConfig;
  static?: StaticLoaderConfig;
  composite?: CompositeLoaderConfigJson;
}
// GONE: CompositeLoaderConfigJson
```

### New types
```typescript
// Clean discriminated union — each variant carries only its own properties
interface StaticLoaderConfig {
  type: 'static';
  sources?: StaticSource[];
  urls?: string[];                // shorthand for sources: [{ type: 'urls', urls }]
  validateUrls?: boolean;
  validationTimeout?: number;
  validationMethod?: 'head' | 'simple' | 'none';
  failOnAllMissing?: boolean;
  allowedExtensions?: string[];
  debugLogging?: boolean;
}

interface GoogleDriveLoaderConfig {
  type: 'googleDrive';
  apiKey: string;
  sources?: GoogleDriveSource[];
  folders?: string[];             // shorthand for sources: [{ type: 'folder', folders, recursive: true }]
  apiEndpoint?: string;
  allowedExtensions?: string[];
  debugLogging?: boolean;
}

// Single loader = one of these
type SingleLoaderConfig = StaticLoaderConfig | GoogleDriveLoaderConfig;

// loader property accepts single OR array (array = composite)
type LoaderInput = SingleLoaderConfig | SingleLoaderConfig[];

// ImageCloudOptions
interface ImageCloudOptions {
  container?: string | HTMLElement;
  urls?: string[];           // top-level shorthand → static loader
  loader?: LoaderInput;
  // ... rest unchanged
}
```

### What the `type` discriminant buys us
- TypeScript narrows properly: `if (config.type === 'static')` gives you `StaticLoaderConfig`
- No `!` non-null assertions needed (unlike today's `config.static!`)
- JSON configs are self-describing — `type` tells you what the object is

---

## What Stays the Same

- **ImageLoader interface** — loader classes unaffected
- **Loader class internals** — `StaticImageLoader`, `GoogleDriveLoader`, `CompositeLoader` constructors take the same inner config shapes they always did
- **Static source types** — `{ type: 'urls' | 'path' | 'json', ... }` within `sources[]`
- **Google Drive source types** — `{ type: 'folder' | 'files', ... }`
- **`type` field required on loaders** (except top-level `urls` shorthand)

## What Gets Simpler Without Backward Compat

| Area | With backward compat | Without |
|------|---------------------|---------|
| Types | Old `LoaderConfig` kept as internal, new types added alongside | Old types replaced entirely with clean discriminated union |
| Normalization | Shim function detects old vs new format | Not needed — just extract `type` and route |
| `mergeConfig()` defaults | Must carry defaults for all loader types | Defaults only for the selected type |
| `createLoaderFromConfig()` | `config.static!` with non-null assertions | Direct property access, TypeScript narrows cleanly |
| `CompositeLoaderConfigJson` | Kept for legacy `type: 'composite'` | Removed from public API entirely |
| Code paths | Two formats to reason about forever | One format |

---

## Open Questions for Discussion

1. **Top-level `urls` shorthand** — Is `new ImageCloud({ container: 'id', urls: [...] })` worth it? Removes loader config entirely for the most common case. Tradeoff: another way to do the same thing.

2. **Google Drive `folders` shorthand** — `folders: [...]` auto-wraps as `sources: [{ type: 'folder', folders: [...], recursive: true }]`. Good convenience or unnecessary sugar?

3. **`loader: ['url1', 'url2']` string array** — Should loader accept a raw string array as ultra-shorthand? Or is top-level `urls` enough?

4. **Shared loader properties** — `allowedExtensions` and `debugLogging` appear on both loader types. Worth promoting to a shared base, or leave them where they are?

---

## Implementation

### Files to modify

| File | Change |
|------|--------|
| `src/config/types.ts` | Replace `LoaderConfig` with discriminated union. Add `type` to `StaticLoaderConfig` and `GoogleDriveLoaderConfig`. Add `folders?` shorthand to GDrive config. Remove `CompositeLoaderConfigJson`. Add `urls?` and `LoaderInput` to `ImageCloudOptions`. |
| `src/config/defaults.ts` | Simplify loader defaults — no longer need all three sub-objects. Update `mergeConfig()` to work with flattened configs. |
| `src/ImageCloud.ts` | Update `createLoaderFromConfig()` — extract config directly from flattened union instead of `config.static!`. Handle array → CompositeLoader. Handle top-level `urls`. |
| `src/loaders/StaticImageLoader.ts` | Constructor may need minor update if `type` field is now present on its config (strip `type` before using). |
| `src/loaders/GoogleDriveLoader.ts` | Same — handle `folders` shorthand expansion in constructor. Strip `type`. |
| `src/index.ts` | Export updated types |
| `docs/LOADERS.md` | Rewrite all examples with new format |
| `docs/PARAMETERS.md` | Update loader parameter tables |
| `examples/*.html` (~15 files) | Update all loader configs to new format |
| `configurator/index.html` | Update `buildConfig()` output |
| `test/fixtures/*.html` (~15 files) | Update all loader configs |
| Tests | New tests for shorthand expansion, array→composite, top-level urls |

### Sequence
1. Update types in `types.ts` (breaking change to the type system)
2. Update `defaults.ts` merge logic
3. Update `ImageCloud.ts` factory and constructor
4. Update loader constructors to handle `type` field and shorthands
5. Run tests — fix all breakages (fixtures use old format)
6. Update all examples
7. Update docs
8. Update configurator

### Verification
- `npm run type-check` passes
- `npm test` passes (all Playwright tests)
- `npm run build` succeeds
- Manual check: each example loads correctly in browser
- Configurator generates valid config and preview works
