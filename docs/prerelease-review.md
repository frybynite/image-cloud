# Pre-Release Review

Items identified during a pre-1.0 readiness review. See [backlog.md](backlog.md) for general feature backlog.

---

## 🟡 Should Fix Before 1.0

- [ ] **Radial layout has extra border on the edges** — small visual defect in a key layout


- [ ] **README: Remove pre-1.0 breaking-changes warning banner**

---

## 🟠 Accessibility (Should Address for 1.0)

- [ ] **Images have no accessible descriptions**
  `<img>` elements are created without `alt` text and there is no `role` on images or the gallery container. Screen readers cannot navigate or describe gallery content. At minimum:
  - Container should have `role="region"` + `aria-label`
  - Images should have `role="img"` + `alt` (filename or index as fallback)
  - Focused image state should announce via `aria-live` or `aria-label` update

- [ ] **Nav buttons have `tabindex="-1"` but are visually clickable**
  Prev/Next buttons cannot be tab-focused. Arrow keys work for keyboard nav, but the visible buttons are not keyboard-accessible — inconsistent UX.

---

## 🔵 Consider / Nice to Have

- [ ] **No `CONTRIBUTING.md`**
  Important signal for an open-source 1.0. Should cover: dev setup, running tests, PR process, issue reporting. The existing `developer.md` has build info but is written for internal context, not contributors.

- [ ] **Loader API design question (v2.0 deferred — revisit before committing to 1.0)**
  The nested `{ type: 'static', static: { urls: [...] } }` structure is explicitly planned for a breaking change in v2.0. Worth re-evaluating before locking it in: publishing 1.0 with a known-awkward API that will require migration is a long-term commitment. Options: fix it now, or clearly document the v2.0 migration path.

- [x] **No browser support matrix**
  No documented statement of which browsers/versions are supported. Uses Web Animations API, CSS transforms, `IntersectionObserver`, `TouchEvent` — all modern, but users expect to know this for a stable 1.0. Add to README and/or docs.

- [x] **`docs/plans/api-integrations.md` is a completed plan still sitting in `docs/plans/`**
  All other planning docs were cleaned up in v0.10.3. This one is also done — delete it for consistency.

- [x] **No `engines` field in `package.json`**
  No declared Node version requirement. Minor, but best practice for published packages.

---

## ✅ Already in Good Shape

- Zero TypeScript errors — strict mode, `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns` all enabled
- 917/920 tests passing (99.7%) with comprehensive E2E and unit coverage
- Zero runtime dependencies — clean bundle
- Full API documentation — `parameters.md` is thorough, `architecture.md` added
- CI/CD — CodeQL analysis, Dependabot, npm provenance publish, tag/version verification
- MIT `LICENSE` present
- React, Vue 3, Web Component wrappers complete with tests
- `destroy()` lifecycle method implemented — important for SPA usage
- `package.json` metadata complete — description, keywords, homepage, repository, bugs URL all set
- CDN distribution configured (jsDelivr + unpkg)
- Interactive configurator published to GitHub Pages
