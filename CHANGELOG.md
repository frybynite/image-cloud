# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

## [0.3.7] - 2026-02-14

### Breaking Changes
- Consolidate debug parameters under `config.debug` namespace; old paths (`debug`, `layout.debugRadials`, `layout.debugCenters`, `config.loaders.debugLogging`) removed
- Remove `debugRadials` feature entirely (type, generator code, configurator, docs)

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
