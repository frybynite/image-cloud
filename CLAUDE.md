# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/claude-code) when working with code in this repository.

## IMPORTANT RULES                                                                                                                                              
  - **NEVER commit or push without explicit user approval**                                                                                                       
  - Always ask "Should I commit this?" before any git commit/push    

## Project Overview

Image Cloud is a TypeScript library for creating interactive image galleries with animated scattered layouts and zoom effects. It supports multiple layout algorithms and image sources (Google Drive, static URLs).

## Common Commands

```bash
# Development
npm run dev          # Start Vite dev server
npm run build        # Build for production (clean + tsc + vite)
npm run type-check   # TypeScript type checking without emit

# Testing
npm test             # Run Playwright tests
npm run test:headed  # Run tests with browser visible
npm run test:ui      # Run tests with Playwright UI

# Serving
npm run serve        # Serve on localhost:8080 via Python
npm run preview      # Preview production build
```

## Architecture

```
src/
├── ImageCloud.ts      # Main entry point - orchestrates loaders, engines, layouts
├── index.ts             # Public exports
├── config/
│   ├── types.ts         # TypeScript interfaces and types
│   └── defaults.ts      # Default configuration values
├── engines/
│   ├── LayoutEngine.ts  # Calculates positions, manages adaptive sizing
│   ├── AnimationEngine.ts # Handles fly-in animations
│   └── ZoomEngine.ts    # Click-to-zoom functionality
├── layouts/             # Layout algorithms
│   ├── RadialPlacementLayout.ts
│   ├── GridPlacementLayout.ts
│   ├── SpiralPlacementLayout.ts
│   ├── ClusterPlacementLayout.ts
│   ├── WavePlacementLayout.ts
│   └── RandomPlacementLayout.ts
└── loaders/
    ├── GoogleDriveLoader.ts  # Loads images from Google Drive folders
    ├── StaticImageLoader.ts  # Loads images from static URLs, paths, or JSON endpoints
    └── CompositeLoader.ts    # Combines multiple loaders
```

## Key Concepts

- **Adaptive Sizing**: Images automatically resize based on container dimensions and image count
- **Responsive Breakpoints**: Image sizes adjust at viewport breakpoints (set maximums)
- **Placement Layouts**: Each layout implements a placement algorithm with consistent interface
- **ImageLoader Interface**: Loaders implement `prepare()` (async fetch) and `access()` (sync get)

## Configuration

See `docs/PARAMETERS.md` for full configuration reference. Key config structure:
```typescript
{
  container: 'elementId',
  images: ['url1', 'url2'],  // or loaders: [{ static: {...} }, { googleDrive: {...} }]
  layout: { algorithm: 'radial' | 'grid' | 'spiral' | 'cluster' | 'random', ... },
  sizing: { base, variance, responsive, adaptive }
}
```


## Code Style

- TypeScript with strict mode enabled
- CSS classes prefixed with `fbn-ic-` (e.g., `fbn-ic-gallery`, `fbn-ic-image`)
- ESM modules (type: "module" in package.json)
- Vite for bundling, outputs UMD and ESM formats

## Testing

Tests use Playwright. Test files are in `test/` directory with config at `test/playwright.config.ts`.

## Examples

Located in `examples/` folder:
- `index.html` - Google Drive gallery
- `index-static.html` - Static URL gallery
- `layout-algorithms.html` - Compare all layout algorithms

## Remember

- Any time a new layout, style, etc. is created we must update the examples/ and the configurator/
- **⛔ CRITICAL: NEVER commit or push without my explicit approval. ASK FIRST.**       
- ** CRITICAL: whever a new package version number if changed, made CONFIRM WITH ME FIRST BEFORE CONTINUING TO CHECK IN **
- When a parameter name, location, value, default, etc. is changed:
  - update the Parameters.md file
  - update configurator labels, values, help text.
  - configurator help text should include defaults
- Planning: all planning docs should be created in docs/plans/ directory.
- When releasing a new version, update CHANGELOG.md (newest entries at top).
