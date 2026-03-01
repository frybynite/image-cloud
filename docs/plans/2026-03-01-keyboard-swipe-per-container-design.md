# Design: Per-Container Keyboard & Swipe Navigation

**Date:** 2026-03-01
**Status:** Approved

## Summary

Implement `interaction.navigation.keyboard` and `interaction.navigation.swipe` config flags so each gallery instance independently controls whether it responds to keyboard and touch-swipe navigation. Add a side-by-side example demonstrating the per-container behaviour.

## Background

Both flags exist in `src/config/types.ts` and `src/config/defaults.ts` as stubs (`undefined`). The keyboard listener is currently attached to `document` (shared across all instances), and `SwipeEngine` is always initialised.

## Changes

### `src/ImageCloud.ts`

- Add `tabindex="0"` to `containerEl` during `init()` so it is keyboard-focusable
- Move the `keydown` listener from `document` to `containerEl`
- Guard listener registration: skip if `interaction.navigation?.keyboard === false`
- Guard `new SwipeEngine(...)`: skip (leave `this.swipeEngine = null`) if `interaction.navigation?.swipe === false`

### `src/config/defaults.ts`

Change both stubs from `undefined` to `true`:
```ts
keyboard: true,
swipe: true,
```

### `configurator/index.html`

Add a **Navigation** control group inside the Interaction accordion, between Focus Behavior and Allow Image Dragging:

```
Navigation
  [✓] Keyboard navigation    (default: on)
  [✓] Swipe gestures         (default: on)
```

Emit `interaction.navigation.keyboard = false` / `interaction.navigation.swipe = false` only when unchecked (same pattern as `interaction.dragging`).

### `configurator/field-descriptions.json`

Add tooltip entries:
- `interaction.navigation.keyboard` — "Enable arrow key and Escape navigation. Scoped to the gallery container. Default: true"
- `interaction.navigation.swipe` — "Enable touch swipe gestures to navigate between focused images. Default: true"

### `examples/keyboard-navigation-demo.html`

Side-by-side page with two 50%-width gallery containers:
- **Left**: keyboard enabled (default), labelled "Keyboard ON"
- **Right**: `interaction.navigation: { keyboard: false }`, labelled "Keyboard OFF"

Instructions at top: "Click inside a gallery to focus it, then use ← → arrow keys."

### `index.html`

Add link to `examples/keyboard-navigation-demo.html` in the examples list.

## Testing

Manual: open the example, click left gallery, verify arrow keys navigate; click right gallery, verify arrow keys do nothing.

Automated: existing keyboard navigation tests should continue to pass; scoping change should not break them since tests interact with a single container.
