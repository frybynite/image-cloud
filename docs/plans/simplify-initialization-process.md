# Simplify Initialization Process

## Problem
Getting started with Image Cloud requires two steps:
```
  const cloud = new ImageCloud({ container: 'id', images: [...] });
  await cloud.init();
```
And error messages (e.g. `Container #foo not found`) are descriptive but not actionable.

## Solution

### 1. Factory function
Add a top-level async factory function as the recommended entry point:
```
  export async function imageCloud(options: ImageCloudOptions): Promise<ImageCloud>
```

This constructs the instance and calls init() internally, enabling single-line usage:
```
  const cloud = await imageCloud({ container: 'myGallery', images: ['url1', 'url2'] });
```

The ImageCloud class remains exported for power users who need access to the lifecycle.

### 2. Improved error messages
Make errors actionable by including the remediation step in the message text.

### 3. No other changes
- `images: [...]` shorthand already exists and covers the loader boilerplate case
- Container auto-detection is deferred (unclear UX)
- Config nesting is acceptable as-is

## Files Changed
- src/index.ts — add imageCloud() export
- src/ImageCloud.ts — improve 3 error messages
- src/image-cloud-auto-init.ts — improve 2 error messages
- docs/PARAMETERS.md — document factory function at top of Getting Started
- README.md — update Getting Started section
- examples/getting-started-example.html — new example
