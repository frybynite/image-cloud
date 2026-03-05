# Backlog

Future enhancements and feature ideas for Image Cloud.

---

## Pre-Release

Items to address before releasing v1.0. See [prerelease-review.md](prerelease-review.md) for the full list.

---

## Active Issues

- [ ] Fix: "applies rotation transforms" test fails in layout.spec.ts:38 — radial layout images may not be receiving rotation transforms
- [ ] Radial layout has some extra border on the edges that we could take out.
- [ ] Investigate: Grid jitter appears to produce more offset than expected - even small jitter values seem to have an outsized visual impact.
- [ ] Fix: After an image returns from focused state, hover styles are not re-applied if the cursor is already over the image — requires the user to move the mouse off and back on to trigger hover.
---

## Planned

### ~~Simplify Initialization Process~~ ✅ v0.10.0
- `imageCloud()` factory function for single-expression initialization
- Actionable error messages for missing container, no loaders, and missing `data-config`

---

## Future Major Version (v2.0)

### Loader Config Simplification (Breaking Change)

**Key idea:** Flatten the nested `{ type: 'X', X: { config } }` loader structure into a clean discriminated union `{ type: 'X', ...config }`. Array notation replaces the explicit `composite` type.

**Before:**
```javascript
loader: { type: 'static', static: { urls: ['url1', 'url2'] } }
loader: { type: 'googleDrive', googleDrive: { apiKey: 'KEY', sources: [...] } }
loader: { type: 'composite', composite: { loaders: [...] } }
```

**After:**
```javascript
loader: { type: 'static', urls: ['url1', 'url2'] }
loader: { type: 'googleDrive', apiKey: 'KEY', sources: [...] }
loader: [{ type: 'static', urls: [...] }, { type: 'googleDrive', apiKey: 'KEY', sources: [...] }]
```

**Optional top-level shorthand:** `new ImageCloud({ container: 'id', urls: [...] })` — no loader config at all.

**Benefit:** Eliminates redundant type-name-as-key nesting, enables proper TypeScript discriminated union narrowing (no more `config.static!` non-null assertions), cleans up defaults to only carry config for the active loader type.

**Files affected:** `src/config/types.ts`, `src/config/defaults.ts`, `src/ImageCloud.ts`, `src/loaders/StaticImageLoader.ts`, `src/loaders/GoogleDriveLoader.ts`, `src/index.ts`, `docs/LOADERS.md`, `docs/parameters.md`, `examples/*.html`, `configurator/index.html`, `test/fixtures/*.html`.

**Note:** Deliberately deferred — clean break with no backward compatibility shim, targeting a v2.0 release. Full spec preserved in git history (`docs/plans/loader-redesign.md`).


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
- Auth/credential hooks for static loader fetch options (e.g., custom headers, bearer tokens for authenticated image endpoints — applies to JSON source and URL validation)
- Additional layout algorithms (physics-based)
- Lightbox mode
- Consider `scaleDecay` for cluster layout - larger images at cluster centers, smaller at edges to create focal points within each group.
- Custom entry easing — allow user-supplied cubic-bezier curves for entry animations, beyond the current preset path types (linear, bounce, elastic, wave)
- Radial layout: if a radial expects 10 images but only gets 7, spread images further along the outer radial to fill the ring and look like a complete external radius.
- Add border-image support to functionality and configurator.
- Consider using SVG for clip path in order to support borders.

---

## Completed

- [x] Publish docs to GitHub Pages with MkDocs — Material theme, full nav, configurator/examples published alongside, CI pipeline verified (v0.10.1)
- [x] Swipe gestures: Testing in test/fixtures/interactions.html in mobile mode, sometimes swipes get images out of order, centering becomes a problem
- [x] Swipe gestures: Swipes inside an iframe don't work consistently
- [x] Consolidate debug parameters under `config.debug` namespace — unified `config.debug.enabled`, `config.debug.centers`, `config.debug.loaders`. Old paths (`debug`, `layout.debugCenters`, `config.loaders.debugLogging`) removed (breaking change). Per-loader `debugLogging` retained as override. `debugRadials` removed entirely.
- [x] Swipe gesture navigation - Left/right swipe gestures on touch devices navigate between focused images (SwipeEngine with drag feedback, threshold detection, horizontal angle filtering).
- [x] Fix "Loading images..." text still visible after gallery loads (fbn-ic-hidden class not hiding element properly) — resolved by auto-creating loading elements inside the container (v0.3.3)
- [x] Fix: Hitting Esc while an image is already animating out causes a secondary animation.
- [x] Review skipped test: "spinner is visible during slow image loading" (`test/e2e/loading-spinner.spec.ts:41`) — Confirmed: test remains skipped due to timing unreliability. Other spinner tests provide adequate coverage; `loading-spinner-slow.html` available for manual testing.
- [x] Security: Set up Dependabot for dependency vulnerability scanning
- [x] Security: Set up CodeQL for code security analysis
- [x] Packaging & Distribution Strategy - CDN deployment (unpkg/jsdelivr), simplified README examples, separate auto-init bundle.
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
- [x] Configurator: Enhanced shadow configuration - added "Custom..." option to shadow dropdown with individual controls for x-offset, y-offset, blur, color, and opacity. Preset values are copied when switching from preset to custom.
- [x] Drop shadow filter option - available via `filter.dropShadow` configuration with x, y, blur, and color parameters.
- [x] Fix: Duplicate images on desktop-to-mobile resize - race condition resolved.
- [x] Re-evaluate layout: sizing, adaptive sizing, spacing - reviewed and updated sizing configuration.
- [x] Review style.css for overlap between styling and functionality - CSS now provides functional layout rules plus optional styling defaults; JS applies config-driven inline styles that override defaults.
- [x] Add border offset for default/hover/focused states.
- [x] Fix skipped test "initializes multiple galleries on same page" - library CSS was overriding fixture's 50% width causing galleries to stack vertically; IntersectionObserver wouldn't fire for off-screen gallery.
- [x] Invert option for image default/hover/focused states.
- [x] Fix auto-init export - subpath `./auto-init` now exported in package.json and `autoInitialize` exported from module.
- [x] Granular border control (top/bottom/left/right) - per-side border overrides in library and configurator with side selector UI.
- [x] Configurator: Separated `data-path` into `data-desc-key` (full canonical path for tooltip lookup) and `data-path` (context-aware partial path for eye-toggle display). Cleaned up duplicated keys in field-descriptions.json.
- [x] Dragging window between screens triggers re-animation — this is just the way it's going to work.
- [x] Configurator: Separated image size & rotation from style into distinct sections.
- [x] Image counter (`showImageCounter`) — displays "N of M" when an image is focused, hidden on unfocus. Supports custom element via `counterElement` config. Auto-created at bottom-center with fixed positioning.
- [x] Renamed `generators/` directory to `layouts/` and all `*PlacementGenerator` classes to `*PlacementLayout` — aligned internal naming with the public-facing `layout` configuration key.
- [x] React component wrapper — `<ImageCloud>` component with props, ref forwarding, auto-cleanup. Ships as `@frybynite/image-cloud/react` subpath export.
- [x] Vue 3 component wrapper — `<ImageCloud>` component using Composition API with deep watch for reinit. Ships as `@frybynite/image-cloud/vue` subpath export.
- [x] Web Component wrapper — `<image-cloud>` custom element with `config`, `images`, `layout` attributes. Ships as `@frybynite/image-cloud/web-component` subpath export.
- [x] Focus navigation buttons — optional prev/next UI buttons shown when an image is focused (`ui.showNavButtons`). Visible only during navigation, user-styleable via CSS. Configured via the `ui` section.
