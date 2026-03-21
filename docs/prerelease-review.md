# Pre-Release Review

Items identified during a pre-1.0 readiness review. See [backlog.md](backlog.md) for general feature backlog.

---

## 🟡 Should Fix Before 1.0

- [ ] **Radial layout has extra border on the edges** — small visual defect in a key layout

- [x] **README: Remove pre-1.0 breaking-changes warning banner**

---

## 🔵 Consider / Nice to Have

- [ ] **No `CONTRIBUTING.md`**
  Important signal for an open-source 1.0. Should cover: dev setup, running tests, PR process, issue reporting. The existing `developer.md` has build info but is written for internal context, not contributors.

---

## ✅ Already in Good Shape

- Zero TypeScript errors — strict mode, `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns` all enabled
- 933/938 tests passing (99.5%) with comprehensive E2E and unit coverage
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
