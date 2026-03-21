# Pre-Release Review

Items identified during a pre-1.0 readiness review. See [backlog.md](backlog.md) for general feature backlog.

---

## ✅ Already in Good Shape

- Zero TypeScript errors — strict mode, `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns` all enabled
- 938 tests passing (3 skipped, 0 failing when run individually) with comprehensive E2E and unit coverage — 3 mobile tests show intermittent failures under parallel load but pass reliably when isolated
- Zero runtime dependencies — clean bundle
- Full API documentation — `parameters.md` is thorough, `architecture.md` added
- CI/CD — CodeQL analysis, Dependabot, npm provenance publish, tag/version verification
- MIT `LICENSE` present
- React, Vue 3, Web Component wrappers complete with tests
- `destroy()` lifecycle method implemented — important for SPA usage
- `package.json` metadata complete — description, keywords, homepage, repository, bugs URL all set
- CDN distribution configured (jsDelivr + unpkg)
- Interactive configurator published to GitHub Pages
- Accessibility: `role="region"` + `aria-label` on container, `alt` text on images, `aria-live` focus announcements, nav buttons keyboard-accessible
- `CONTRIBUTING.md` added for open-source contributors
- Zero TODO/FIXME/HACK comments in `src/` — clean source code
- README polished — no pre-release warnings, full Quick Start, CDN links, full feature list, events/interactions, browser support, examples

---

## 🔴 Must Do Before 1.0 Release

- **Version bump**: `package.json` is currently `0.11.3` — must be changed to `1.0.0` before tagging
- **Changelog entry**: `docs/changelog.md` needs a `[1.0.0]` entry summarizing what 1.0 represents (stability policy, stable API, etc.)

---

## 🟡 Should Do Before 1.0 Release

- **SECURITY.md missing**: No security policy at repo root. Public npm packages should document how to report vulnerabilities responsibly. Minimal content: supported versions, how to report, expected response time.

- **Debug artifacts leak into production bundle** (`src/` code, not guarded by `debug.enabled`):
  - `window.__gridOverflowDebug = {...}` in `GridPlacementLayout.ts:130` — pollutes `window` object in every production deployment; tests in `layout-grid.spec.ts` read it directly from `window`
  - `img.dataset.onloadCalled = 'true'` in `ImageCloud.ts:1011` — writes a debug attribute on every `<img>` element; tests in `height-relative-centering.spec.ts` rely on it
  - `(window as any).DEBUG_CLIPPATH` check in `ImageCloud.ts:1012` — undocumented debug flag checked on every image load; test sets it via `page.evaluate`
  - **Resolution options**: remove the window/DOM pollution and refactor the two tests that depend on them to use observable side-effects (layout positions, computed styles) instead; or guard under `config.debug.enabled` so they are stripped in production builds

- **GitHub issue/PR templates missing**: `.github/ISSUE_TEMPLATE/` directory doesn't exist. For an open-source 1.0 release, standard bug report / feature request / PR templates reduce friction for contributors.

---

## 🟢 Accepted Known Issues (Tracked in Backlog)

These are known issues that won't block 1.0 but are tracked for follow-up:

- **Radial layout extra border on edges** (`backlog.md`): Slight extra border visible on outer radial images. Visual-only, moved to backlog.
