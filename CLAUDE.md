# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/claude-code) when working with code in this repository.

## IMPORTANT RULES                                                                                                                                              
  - **NEVER commit or push without explicit user approval**                                                                                                       
  - Always ask "Should I commit this?" before any git commit/push    

## Project Overview

Image Cloud is a TypeScript library for creating interactive image galleries with animated scattered layouts and zoom effects. It supports multiple layout algorithms and image sources (Google Drive, static URLs).

## Model Selection

  - Use `opus` model for: planning multi-step features, architectural decisions, debugging complex
  issues
  - Use `haiku` for: quick edits, simple bug fixes, file operations


## Common Commands

```bash
# Development
npm run dev          # Start Vite dev server
npm run build        # Build for production (clean + tsc + vite, all 5 Vite configs)
npm run type-check   # TypeScript type checking without emit
npm run lint:compat  # eslint-plugin-compat check against browserslist targets (src/ only)

# Testing
npm test             # Run Playwright tests
npm run test:headed  # Run tests with browser visible
npm run test:ui      # Run tests with Playwright UI
npm run test:unit    # Node native test runner over test/unit/**/*.test.ts (separate from Playwright's test/unit/*.spec.ts)

# Serving
npm run serve        # Serve on localhost:8080 via Python
npm run preview      # Preview production build

# Release (see Release Process below)
npm run release:patch / release:minor / release:major
```

## Project Structure

- `src/config/` — types (`ImageLoader` interface, etc.) and defaults
- `src/engines/` — `AnimationEngine`, `ZoomEngine`, `LayoutEngine`, `EntryAnimationEngine`, `IdleAnimationEngine`, `SwipeEngine`, `PathAnimator` — see `docs/architecture.md` for responsibilities
- `src/layouts/` — the 7 placement algorithms (see Key Concepts)
- `src/loaders/` — `GoogleDriveLoader`, `StaticImageLoader`, `CompositeLoader` (combines loaders), `ImageFilter` (extension filtering)
- `src/react/`, `src/vue/`, `src/web-component/` — framework wrappers, each with its own Vite config and package.json export subpath; `react`/`vue` are optional peer deps, don't assume installed
- `src/image-cloud-auto-init.ts` — separate entry point/export (`/auto-init`), own Vite config
- `configurator/` — standalone static HTML app (not a separate package), loads `../dist/style.css` so run `npm run build` first, then `npm run serve` and browse to `/configurator/`. Field descriptions live in `configurator/field-descriptions.json`, keyed via `data-desc-key`/`data-path`/`data-label` attributes — see `docs/configurator.md`
- `docs/` — `architecture.md` (engine/loader internals), `parameters.md`, `configurator.md`, `image_sizing.md`, `developer.md`, `changelog.md`, `backlog.md`, `api/` (reference docs), `plans/` (excluded from mkdocs nav)
- `scripts/` — `release.sh`, `build.sh`, `build-site.sh`, `screenshot-layouts.mjs`, `test-package.sh` (see `scripts/README.md`)
- `test-published/` — scratch package for testing the published npm tarball, has its own `node_modules`/`package.json` — exclude from repo-wide greps
- `worktrees/` — active git worktrees; don't touch unless asked
- MkDocs (Python, `mkdocs.yml`/`requirements.txt`) builds the docs site separately from the npm toolchain; `site/` is generated output. Versions are pinned (`mkdocs==1.6.1`, `mkdocs-material==9.7.3`) — MkDocs 2.0 is incompatible with Material for MkDocs, don't casually upgrade

## Key Concepts

- **Adaptive Sizing**: Images automatically resize based on container dimensions and image count (`docs/image_sizing.md`)
- **Responsive Breakpoints**: Image sizes adjust at viewport breakpoints (set maximums)
- **Placement Layouts**: 7 algorithms in `src/layouts/` — Radial, Grid, Spiral, Cluster, Wave, Honeycomb, Random — each implements a consistent placement interface
- **ImageLoader Interface**: Loaders implement `prepare()` (async fetch) and `access()` (sync get)

## Configuration

See `docs/parameters.md` for full configuration reference and `docs/architecture.md` for engine/loader internals.

## Code Style

- TypeScript with strict mode enabled
- CSS classes prefixed with `fbn-ic-` (e.g., `fbn-ic-gallery`, `fbn-ic-image`)
- ESM modules (type: "module" in package.json), no monorepo/workspaces — single package `@frybynite/image-cloud` with multiple `exports` subpaths (react/vue/web-component/loaders/auto-init)
- Vite for bundling, outputs UMD and ESM formats
- `eslint-plugin-compat` enforces the `browserslist` targets (Chrome87+, Firefox78+, Safari14+, Edge88+) — no Prettier config in this repo
- No git hooks (no Husky/pre-commit) — lint/type-check/tests are not auto-enforced on commit, run them manually

## Testing

Tests use Playwright. Test files are in `test/` directory with config at `test/playwright.config.ts`.
After running all tests, if one or more tests fail follow up by running each individually to eliminate issues with parallel runs.

- Two Playwright projects: `chromium` and `mobile` (iPhone 13 emulation). The `mobile` project `testIgnore`s several desktop-only/pixel-position-dependent specs (google-drive-loader, visual-regression, configurator-*, api-hooks, all `layout*` specs) — add new desktop-only specs to that ignore list too.
- `webServer` auto-starts `npm run dev` on port 5173 — tests run against the dev server, not `dist/`.
- Visual regression snapshots are OS-locked (filenames end `-chromium-darwin.png`) and only run/update correctly on macOS — CI runs them in a dedicated `macos-latest` job. Don't run `test:update-snapshots` on Linux/other OS.
- Google Drive loader tests require a `GOOGLE_DRIVE_API_KEY` env var — see `test/README.md`.
- CI (`.github/workflows/publish-npm.yml`) only runs on `v*` tag pushes or manual dispatch — there is no automated test gate on regular branch pushes/PRs, so run tests locally before asking to release.

## Release Process

`scripts/release.sh` (via `npm run release:patch|minor|major`): checks clean working tree, bumps `package.json` version, builds, runs tests, commits, and tags `vX.Y.Z`. It does **not** push or publish — those are separate manual steps (`git push && git push --tags`; actual `npm publish` happens in CI when the tag is pushed, via `.github/workflows/publish-npm.yml`, which also runs CodeQL and `npm audit`). `publish-pages.yml` then rebuilds the docs site + configurator + examples and deploys to GitHub Pages.

## Examples

Put `examples/` folder, keep a reference to the key ones in the 'index.html'

## Remember

- Any time a new layout, style, etc. is created we must update the examples/ and the configurator/
- **⛔ CRITICAL: NEVER commit or push without my explicit approval. ASK FIRST.**       
- ** CRITICAL: whever a new package version number if changed, made CONFIRM WITH ME FIRST BEFORE CONTINUING TO CHECK IN **
- When a parameter name, location, value, default, etc. is changed:
  - update the Parameters.md file
  - update configurator labels, values, help text.
  - configurator help text should include defaults
- Planning: all planning docs should be created in docs/plans/ directory, NOT the .claude/plans directory. Give them a relevant name.
- When releasing a new version, update docs/changelog.md (newest entries at top).
