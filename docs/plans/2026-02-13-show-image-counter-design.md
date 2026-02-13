# Design: showImageCounter

## Summary

Add an image counter ("3 of 12") that appears when an image is focused, positioned at the bottom-center of the viewport. Follows the same auto-create pattern as loading/error elements — auto-created by default, or user provides a custom element via config.

## Config

```typescript
// UIRenderingConfig additions
showImageCounter?: boolean;       // default: false (stub already exists)
counterElement?: string | HTMLElement;  // custom element (ID string or reference)
```

When `showImageCounter: true` and no `counterElement` provided, auto-create inside the container.

## Default Counter Element

Auto-created HTML:
```html
<div class="fbn-ic-counter fbn-ic-hidden">1 of 12</div>
```

## Styles

**`functionalStyles.ts`** (auto-injected, required):
```css
.fbn-ic-counter {
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 10001;
    pointer-events: none;
}
```

**`image-cloud.css`** (optional theming):
```css
.fbn-ic-counter {
    background: rgba(0, 0, 0, 0.6);
    color: #fff;
    padding: 6px 16px;
    border-radius: 16px;
    font-family: system-ui, sans-serif;
    font-size: 14px;
}
```

## Behavior

- **On image focus** (`handleImageClick`): remove `fbn-ic-hidden`, set text to `"{index} of {total}"` (1-based)
- **On navigation** (arrow keys, swipe): update text to new index
- **On unfocus** (Escape, click outside): add `fbn-ic-hidden`

## Custom Element Support

Same pattern as `loadingElement`:
- `counterElement: 'myCounter'` — resolve by ID
- `counterElement: someHTMLElement` — use reference directly
- Library toggles `fbn-ic-hidden` and sets `textContent` — user controls styling
- `counterElAutoCreated` flag tracks whether to clean up on `destroy()`

## Cleanup

- `destroy()` removes auto-created counter (if `counterElAutoCreated` is true)
- `clearImageCloud()` preserves it (selective removal of `.fbn-ic-image, .fbn-ic-debug-center` only)
