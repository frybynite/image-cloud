# Backlog

Future enhancements and feature ideas for Image Cloud.

## Active Issues

- [ ] Radial layout has some extra border on the edges that we could take out.
- [ ] Fix "Loading images..." text still visible after gallery loads (fbn-ic-hidden class not hiding element properly)
- [ ] Discuss custom fly-in animations - allow configurable entrance animation styles for images.
- [ ] Fix: Dragging window between screens triggers re-animation even when staying within same breakpoint.
- [ ] Fix: Duplicate images still appearing when resizing window from desktop to mobile size (race condition not fully resolved).
- [ ] Re-evaluate layout: sizing, adaptive sizing, spacing.
- [ ] Investigate: Grid jitter appears to produce more offset than expected - even small jitter values seem to have an outsized visual impact.
- [ ] Review failing test: "unfocusing restores default state" - Escape key doesn't restore border to default state after unfocus.
- [ ] Review failing test: "handles empty styling config" - Default shadow not being applied when styling config is empty.
- [ ] Fix auto-init export: README shows `import { autoInitialize } from '@frybynite/image-cloud/auto-init'` but this subpath is not exported in package.json and `autoInitialize` is not exported from main entry point.
- [ ] Fix: Hitting Esc while an image is already animating out causes a secondary animation.
- [ ] Review style.css for overlap between styling and functionality — identify CSS that can be removed while maintaining functionality.
---

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

### Packaging & Distribution Strategy
Discuss and decide on packaging strategies for different consumption patterns.

**Topics:**
- CDN deployment: publish to unpkg/jsdelivr so users can reference a single URL (e.g., `https://unpkg.com/@frybynite/image-cloud/dist/image-cloud-auto-init.js`)
- Simplify README examples to avoid `node_modules/` paths
- Evaluate whether auto-init and main library need different distribution strategies
- Consider a lightweight CDN-only bundle with no npm dependency required

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

- Enhance `styling.hover` and `styling.focused` with additional style options:
  - Note: `opacity` already works via `ImageStyleState.opacity` and `filter.opacity`
  - `transform` - scale, rotate, translateX/Y for hover lift/grow effects
  - `transition` - duration, timing, delay for per-state transition control
  - `mixBlendMode` - multiply, screen, overlay for interesting overlap effects
  - `zIndex` - bring hovered/focused images to front
  - `backdropFilter` - frosted glass effects behind images
  - `transformOrigin` - control where scale/rotate originates
- Vue component wrapper
- Web Component wrapper
- Additional layout algorithms (honeycomb, physics-based)
- Drag-to-reorder functionality
- Lightbox mode
- Thumbnail navigation
- Touch gesture improvements
- For options like image border where the border can be applied overall, or separately to top, bottom, left, right - list all the options available and discuss how we can give them overall control.

---

## Completed

- [x] Fix image centering - images now correctly center on their layout positions (using pixel-based translate transforms).
- [x] Replace random image placement with a more organized layout.
- [x] Reorganize images on window resize to ensure they stay within the visible screen area.
- [x] Render images progressively as they load instead of waiting for all to complete.
- [x] Create an image queue loader: fetch images, add to queue, and process queue every 250ms to float images in one by one.
- [x] Ensure initial image placement keeps (x + width) and (y + height) within screen bounds.
- [x] Animate images floating into position from a nearby border upon loading.
- [x] Ensure focused image is perfectly centered in the screen.
- [x] Dynamically adjust default image height based on window width for better mobile/small screen display.
- [x] Dynamically adjust default image height based on window height for better mobile/small screen display. Consider for <iframe>
- [x] Create a grid layout with a small overlap where the starting image starts in the center.
- [x] The radial layout seems to load more images on the right of the page. Also there is a lot of overlap. Also some images are partially off the screen on the left.
- [x] Tweak scaling and position on different window sizes
- [x] Change page title to "Resume Certifications Gallery"
- [x] Move google drive API key out of config.js and into a parameter passed the outermost method.
- [x] In smaller context windows we need more discrete control over the size of the image and the "full view" size.
- [x] Add ability to fully style images (border, border-color, shadow, border-radius, etc.) through config options or stylesheet.
- [x] Interactive configurator page - visual tool for choosing gallery settings, previewing layouts in real-time, and generating the JSON configuration.
- [x] Wave layout algorithm - images positioned along flowing sine wave curves with configurable rows, amplitude, frequency, phase shift, synchronization modes, and orientation options.
- [x] Grid overflow mode - when grid rows × columns < image count, extra images distribute across cells with offset patterns (bottom-right, upper-left, upper-right, bottom-left, then cardinals). Overflow images render below base images with lower z-index. Z-index properly restored after focus/unfocus cycles.
- [x] Fix: Rotation configuration in configurator - min/max rotation controls appear but rotation behavior needs investigation.
- [x] Fix: Configurator double refresh on text field changes - gallery refreshes on each keystroke (oninput) and again on blur (onchange), causing unnecessary re-renders. Fixed by tracking last applied config and skipping refresh when config unchanged.
- [x] Keyboard navigation - Left/Right arrow keys navigate between focused images with wrap-around. Escape unfocuses.
- [x] Blurry images on zoom: CSS transform scale() scales rendered pixels, not source images. When images render at ~150-200px and zoom to 80% of container, they're scaled 3-4x causing blurriness. Fix: change ZoomEngine to resize actual image dimensions instead of using transform scale.
- [x] Support multiple loaders - allow a list of loaders in addition to one loader (e.g., combine Google Drive and static sources). (Implemented via CompositeLoader class)
