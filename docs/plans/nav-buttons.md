# Plan: Focus Navigation Buttons (`ui.showNavButtons`)

Implemented 2026-03-01.

Adds optional prev/next `<button>` elements that appear when an image is focused and disappear on unfocus — following the exact same pattern as the existing image counter UI.

## Key Design Decisions

- **Single flag** `ui.showNavButtons` + two optional custom element refs (`prevButtonElement`, `nextButtonElement`)
- **`<button>` elements** — correct semantics, accessibility, keyboard-activatable
- **`tabindex="-1"`** on auto-created buttons — prevents tab focus interference
- **`position: absolute`** inside gallery container — buttons belong spatially to the gallery
- **`e.stopPropagation()`** on click handlers — prevents document-level "click outside" from triggering unfocus
- Click-outside handler also checks `.fbn-ic-nav-btn` to avoid premature unfocus
- **Default content**: `‹` / `›` with `aria-label="Previous image"` / `aria-label="Next image"`

## Files Changed

- `src/config/types.ts` — extended UIConfig
- `src/config/defaults.ts` — added `showNavButtons: false`
- `src/ImageCloud.ts` — private fields, setupUI, factory methods, show/hide, lifecycle wiring, destroy
- `src/styles/functionalStyles.ts` — structural CSS
- `src/styles/image-cloud.css` — appearance CSS
- `configurator/index.html` — checkbox + JS config
- `configurator/field-descriptions.json` — description
- `docs/PARAMETERS.md` — three new rows

## Files Created

- `test/fixtures/nav-buttons.html`
- `test/fixtures/nav-buttons-disabled.html`
- `test/e2e/nav-buttons.spec.ts`
