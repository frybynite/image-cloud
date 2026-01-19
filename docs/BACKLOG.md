# Backlog

Future enhancements and feature ideas for Image Cloud.

## Planned

### React Component
Create a React wrapper component for the Image Cloud library.

**Scope:**
- `<ImageCloud />` component with props mapping to configuration
- TypeScript support with proper prop types
- Ref forwarding for imperative access to gallery instance
- Cleanup on unmount
- Example usage in docs

**Considerations:**
- Publish as separate package (`@image-cloud/react`) or include in main package
- Support for React 18+ features (concurrent rendering, Suspense)
- SSR compatibility

### Simplify Initialization Process
Reduce boilerplate and complexity for clients getting started with the library.

**Ideas:**
- Single-line initialization with sensible defaults
- Auto-detect container element
- Shorthand config options for common use cases
- Factory functions for common configurations (e.g., `ImageCloud.fromUrls([...])`)
- Reduce required nesting in config object
- Better error messages for missing/invalid config

---

## Ideas

*Future feature ideas to explore*

- Vue component wrapper
- Web Component wrapper
- Additional layout algorithms (honeycomb, wave, physics-based)
- Drag-to-reorder functionality
- Lightbox mode
- Thumbnail navigation
- Keyboard navigation
- Touch gesture improvements
