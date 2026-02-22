# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

## [0.7.3] - 2026-02-22

### Removed
- **Removed unused `rendering.ui` stubs**: `showThumbnails` and `theme` properties from configuration types, defaults, and backlog. These features were never implemented and have been removed after review to keep the codebase clean.

### Reviewed
- **Skipped test review**: Confirmed that the "spinner is visible during slow image loading" test (`test/e2e/loading-spinner.spec.ts:41`) remains skipped due to timing unreliability. Other spinner tests provide adequate coverage; `loading-spinner-slow.html` is available for manual testing.

## [0.7.2] - 2026-02-22

### Changed
- **Wave Layout Demo**: Added "1 Row" option to wave layout selector and made it the default for better initial display of the wave algorithm

### Fixed
- **Layout Algorithms Demo**: Fixed CSS selector in layout-algorithms.html that was looking for non-existent `.image-cloud` class combined with `.fbn-ic-gallery`. The `.image-cloud` class is not applied by JavaScript and should not be in the CSS selector.
- **Layout Algorithms container height**: Increased container height from 400px to 500px to provide adequate space for image layouts without excessive empty space

### Removed
- **Removed unnecessary class="image-cloud" attribute** from all example files. This class is not used by the library (not referenced in JavaScript or CSS) and was cargo-cult code.

## [0.7.1] - 2026-02-22

### Fixed
- **Vite build config**: Removed stale external dependencies from rollupOptions that referenced non-existent loader subpath bundles (`@frybynite/image-cloud/loaders/static`, `google-drive`, `composite`) from v0.6.0 loader-split approach. Build configuration now accurately reflects unified bundle architecture.

## [0.7.0] - 2026-02-22

### Changed
- **Reverted loader-split architecture** to unified bundle approach for stability and simplicity. After v0.6.0 attempted to split loaders into separate bundles for bundle size optimization, this reversion consolidates all loaders back into the main bundle.
- **Removed LoaderRegistry pattern** — loaders are now included in the main bundle and don't require dynamic registration via separate bundle imports
- **Simplified API**: Removed separate loader subpath exports (`@frybynite/image-cloud/loaders/static`, etc.). Users now import only from main package: `import { ImageCloud } from '@frybynite/image-cloud'`
- **Build simplification**: Removed separate vite build configurations for individual loader bundles. Single unified build now outputs main ESM, UMD, React, Vue, and Web Component variants

### Removed
- Removed all references to separate loader bundle imports from documentation (README, PARAMETERS, LOADERS, API guides, examples)
- Removed "Bundle Size Optimization" section explaining the loader registry pattern
- Removed LoaderRegistry class and related infrastructure

### Fixed
- Stability: Unified architecture eliminates module resolution complexity and circular dependency risks from loader-split approach
- All 589 tests passing with faster execution (4.1 minutes vs 11.5+ minutes in split architecture)

## [0.6.5] - 2026-02-22

### Fixed
- **Loader Registry Pattern**: Fixed critical issue where loader bundles were creating their own LoaderRegistry instances instead of using the shared instance from the main bundle. Now loaders properly register when imported, making all examples work on GitHub Pages. Export LoaderRegistry from main package and have loader bundles import from main package instead of relative paths.

## [0.6.4] - 2026-02-22

### Changed
- **Example CDN URLs**: Updated all example files to use `@0.6.3` (latest version) for consistent and immediate CDN availability on GitHub Pages

## [0.6.3] - 2026-02-22

### Changed
- **Example CDN URLs**: Updated all example files to use `@0.6.2` instead of `@latest` for consistent and immediate CDN availability on GitHub Pages

## [0.6.2] - 2026-02-22

### Fixed
- **Google Drive example**: Restored API key and folder ID to make the example functional on GitHub Pages

## [0.6.1] - 2026-02-22

### Fixed
- **GitHub action npm audit**: Changed to only audit production dependencies, preventing dev-only vulnerabilities from blocking releases
- **Example files on GitHub Pages**: Added loader subpath imports to importmaps in all example HTML files so dynamic loader imports resolve to CDN URLs
- All 11 example files now work correctly when served from static hosts

## [0.6.0] - 2026-02-21

### Added
- **Bundle size reduction**: Loaders are now in separate npm subpath exports for optimal tree-shaking and bundle size control
  - Main package: `@frybynite/image-cloud` (~30KB gzipped, no loaders)
  - Static loader: `@frybynite/image-cloud/loaders/static` (~2.3KB gzipped)
  - Google Drive loader: `@frybynite/image-cloud/loaders/google-drive` (~1.8KB gzipped)
  - Composite loader: `@frybynite/image-cloud/loaders/composite` (<1KB gzipped)
  - All-in-one: `@frybynite/image-cloud/loaders/all` (~5KB gzipped)
- Loader Registry Pattern: Loaders self-register when their bundles are imported via a centralized `LoaderRegistry` class
- Comprehensive npm package import tests (18 tests) validating all export paths and usage patterns across browsers
- Demo fixture showing separate loader/layout bundle imports in action
- Updated documentation (README, PARAMETERS, LOADERS, API, examples) to reflect separate loader imports and bundle size benefits

### Changed
- **Breaking change**: Loaders must now be imported separately. Users importing loaders must add `import '@frybynite/image-cloud/loaders/static'` (or the loader they need) before using that loader.

## [0.5.2] - 2026-02-18

### Fixed
- **Security: resolved 10 npm vulnerabilities** — upgraded `vite-plugin-dts` to 5.0.0-beta.6, which includes patched dependencies (ajv ≥8.18.0, minimatch ≥10.2.1) to fix ReDoS vulnerabilities in dev dependencies. Reduces vulnerability count from 10 (4 high, 6 moderate) to 0.

## [0.5.1] - 2026-02-19

### Fixed
- **ZoomEngine: wrong animation start position when interrupting mid-animation** — `cancelAnimation()` returned raw `matrix.e/f` values (centering offset already baked in); `buildDimensionZoomTransform` then added another `translate(-50%, -50%)`, doubling the centering and causing the reversed animation to start from an entirely wrong location. New `captureMidAnimationState()` helper captures width/height and pure positional offset *before* cancelling, and commits them to inline styles to prevent visual snap. Affects Esc during zoom-in, arrow-key navigation during zoom-in, and all cross-animation redirect paths.
- **ZoomEngine: Esc pressed twice during unfocus restarts animation** — second `unfocusImage()` call while state was already `UNFOCUSING` fell through to the normal-unfocus path, cancelled the running animation, and restarted it from the fully-focused position. Added early-return guard for `ZoomState.UNFOCUSING`.

## [0.5.0] - 2026-02-14

### Added
- React wrapper component (`@frybynite/image-cloud/react`) — `<ImageCloud>` with forwardRef, useImperativeHandle for instance access, auto-reinit on prop changes
- Vue 3 wrapper component (`@frybynite/image-cloud/vue`) — `<ImageCloud>` using defineComponent + Composition API, deep watch for reinit
- Web Component (`@frybynite/image-cloud/web-component`) — `<image-cloud>` custom element with `config`, `images`, `layout` observed attributes, auto-registration, custom events
- Subpath exports: `./react`, `./vue`, `./web-component` with TypeScript declarations
- Optional peer dependencies for React (>=18) and Vue (>=3.3)
- Example HTML files for each wrapper (`examples/react-example.html`, `vue-example.html`, `web-component-example.html`)
- Playwright e2e tests for Web Component (5 tests across chromium/mobile)
- Framework Wrappers section in PARAMETERS.md documentation

## [0.4.2] - 2026-02-14

### Removed
- Remove `animation.entry.timing.stagger` config option (redundant with `animation.queue.interval` which already staggers image entry)
- Remove stagger control from configurator
- Remove stagger from docs, field descriptions, and test fixtures

## [0.4.1] - 2026-02-14

### Removed
- Remove `failOnAllMissing` feature (unused stub in types, defaults, adapter, docs)

### Fixed
- Fix two flaky image-counter e2e tests with proper animation-complete waits (replace `waitForTimeout` with `waitForFunction` opacity checks)

## [0.4.0] - 2026-02-14

### Breaking Changes
- Rename `src/generators/` directory to `src/layouts/`
- Rename all `*PlacementGenerator` classes to `*PlacementLayout` (e.g., `RadialPlacementGenerator` → `RadialPlacementLayout`)
- Rename `PlacementGenerator` interface to `PlacementLayout`
- Export `WavePlacementLayout` (previously missing from public exports)

### Changed
- Internal field `generator` renamed to `placementLayout` in LayoutEngine
- Internal method `initGenerator()` renamed to `initLayout()` in LayoutEngine
- Rename `docs/GENERATORS.md` to `docs/LAYOUTS.md`
- Rename `docs/api/generators.md` to `docs/api/layouts.md`
- Updated all documentation references to use "layouts" terminology

## [0.3.7] - 2026-02-14

### Breaking Changes
- Consolidate debug parameters under `config.debug` namespace; old paths (`debug`, `layout.debugRadials`, `layout.debugCenters`, `config.loaders.debugLogging`) removed
- Remove `debugRadials` feature entirely (type, layout code, configurator, docs)

### Added
- "Config" accordion in configurator with Loaders and Debug sub-sections
- Expose shared loader config (`validateUrls`, `validationMethod`, `validationTimeout`, `allowedExtensions`) in configurator
- Field descriptions for `config.loaders.*` options

### Fixed
- Debug border application order bug where default styles overwrote debug borders

## [0.3.6] - 2026-02-13

- Version bump release

## [0.3.5] - 2026-02-13

- Add showImageCounter implementation plan and design doc
- Mark loading text issue as resolved in backlog
- Update backlog with rendering stub issues and spinner idea

## [0.3.4] - 2026-02-13

- Version bump release

## [0.3.3] - 2026-02-13

- Version bump release

## [0.3.2] - 2026-02-13

- Fix data-path issue in configurator
- Documentation updates for data-path and structure proposal

## [0.3.1] - 2026-02-13

- Refactor configurator to separate `data-desc-key` from `data-path` attributes

## [0.3.0] - 2026-02-07

### Breaking Changes

- Redesign loader configuration API — loaders are now configured via a new structure (see [LOADERS.md](docs/LOADERS.md))

### Other

- Clean up backlog — remove resolved items

## [0.2.9] - 2026-02-07

- Add JSON source type to static loader
- Add URLs shorthand for static loader configuration
- Update CodeQL action to v4

## [0.2.8] - 2026-02-02

- Add security scanning (CodeQL) to publish workflow

## [0.2.7] - 2026-02-01

- Fix swipe gesture `touch-action` CSS for iframe compatibility

## [0.2.6] - 2026-02-01

- Add swipe gesture navigation for focused images
- Mark auto-init export issue and invert option as completed in backlog

## [0.2.5] - 2026-02-01

- Add invert filter control to configurator
- Update and reorder README examples sections

## [0.2.4] - 2026-02-01

- Add banner image to README
- Add favicon and brand icons
- Fix multi-gallery test CSS override issue
- Update entry animations plan

## [0.2.3] - 2026-02-01

- Add outline controls with visibility toggle to configurator

## [0.2.2] - 2026-02-01

- Add custom shadow controls with per-state configuration to configurator
- Update CDN URLs to `@latest` and mark packaging complete
- Add Detailed Style Examples link to index page

## [0.2.1] - 2026-01-31

- Fix example container height CSS
- Add cursor control to configurator
- Update documentation with new sizing configuration and responsive sizing mode

## [0.2.0] - 2026-01-31

### Breaking Changes

- Revised image sizing approach with responsive breakpoints

### Other

- Auto-inject functional CSS; rename `gallery.css` to `image-cloud.css`
- Simplify configurator path labels for focus, entry animation, sizing, and rotation fields
- Update all examples to use jsDelivr CDN

## [0.1.3] - 2026-01-29

- Remove debug `console.log` statements
- Update examples to use Pexels images and jsDelivr CDN

## [0.1.2] - 2026-01-29

- Fix npm publish workflow (`NODE_AUTH_TOKEN` restore)

## [0.1.1] - 2026-01-29

- Add API reference documentation
- Add test-published directory for visual deployment testing
- Fix npm publish authentication (OIDC and token-based)

## [0.1.0] - 2026-01-29

### Initial Release

- Interactive image cloud with animated scattered layouts and zoom effects
- Layout algorithms: radial, grid, spiral, cluster, wave, random
- Entry animations: bounce, elastic, wave paths; spin, settle, wobble rotations
- Entry scale animations: grow, shrink, pop, random modes
- Click-to-zoom with keyboard navigation (arrow keys, Enter/Space, Escape)
- State-based image styling (borders, shadows, filters for default/hover/focused)
- Image sources: static URLs, Google Drive folders, composite loaders
- Adaptive sizing based on container dimensions and image count
- Interactive configurator with live preview and JSON export
- CSS class prefix `fbn-ic-` for library compatibility
- Comprehensive Playwright E2E test suite
- npm package with ESM, UMD, and auto-init bundles
- CDN support via jsDelivr and unpkg
- Full TypeScript support with strict mode
- Zero runtime dependencies
