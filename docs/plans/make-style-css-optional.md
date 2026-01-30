# Plan: Make style.css Optional

## Goal
Allow the library to work without requiring users to link `style.css`. Functional CSS will be injected automatically, making the external CSS file optional (for visual enhancements only).

## Summary

Move essential functional CSS into JavaScript and inject it automatically during `ImageCloud.init()`. Always inject - no configuration option needed.

---

## Files to Modify

| File | Action | Impact |
|------|--------|--------|
| `src/styles/functionalStyles.ts` | **CREATE** | New file ~50 lines |
| `src/ImageCloud.ts` | **MODIFY** | Add 2 lines (import + call) |
| `src/index.ts` | **MODIFY** | Add 1 export line |

---

## Implementation Details

### 1. Create `src/styles/functionalStyles.ts`

```typescript
/**
 * Minimal functional CSS required for the library to work.
 * Injected automatically - no external CSS file needed.
 */
export const FUNCTIONAL_CSS = `
.fbn-ic-gallery {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  perspective: 1000px;
}

.fbn-ic-image {
  position: absolute;
  cursor: pointer;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.6s cubic-bezier(0.4, 0, 0.2, 1),
    filter 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    border 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    outline 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    z-index 0s 0.6s;
  will-change: transform;
  user-select: none;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.fbn-ic-image.fbn-ic-focused {
  z-index: 1000;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.6s cubic-bezier(0.4, 0, 0.2, 1),
    filter 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    border 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    outline 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    z-index 0s 0s;
  will-change: auto;
}

.fbn-ic-hidden {
  display: none !important;
}
`;

/**
 * Inject functional styles into document head.
 * Idempotent - safe to call multiple times.
 */
export function injectFunctionalStyles(): void {
  if (typeof document === 'undefined') return;
  const id = 'fbn-ic-functional-styles';
  if (document.getElementById(id)) return;
  const style = document.createElement('style');
  style.id = id;
  style.textContent = FUNCTIONAL_CSS;
  document.head.appendChild(style);
}
```

### 2. Update `src/ImageCloud.ts`

Add import at top:
```typescript
import { injectFunctionalStyles } from './styles/functionalStyles';
```

Add call at start of `init()` method:
```typescript
async init(): Promise<void> {
  try {
    injectFunctionalStyles();
    // ... rest of existing init code
```

### 3. Update `src/index.ts`

Add export:
```typescript
export { injectFunctionalStyles, FUNCTIONAL_CSS } from './styles/functionalStyles';
```

---

## What Works Without style.css

| Feature | Status |
|---------|--------|
| Gallery layout | ✅ Works |
| Image positioning | ✅ Works |
| Click to zoom/focus | ✅ Works |
| Keyboard navigation | ✅ Works |
| Smooth transitions | ✅ Works |
| Entry animations | ✅ Works |
| Responsive resizing | ✅ Works |

## What Requires style.css (Optional)

| Feature | Without CSS |
|---------|-------------|
| Loading spinner | No spinner (still functional) |
| Error message styling | Plain text (still functional) |
| Default image shadows | No shadows (configure via `styling`) |
| Default border-radius | Square corners (configure via `styling`) |
| CSS custom properties | Not available (theming) |

---

## Backward Compatibility

| Scenario | Impact |
|----------|--------|
| User links style.css | ✅ No change - idempotent |
| User uses auto-init | ✅ No change - already injects full CSS |
| User uses programmatic API without CSS | ✅ NOW WORKS |

**Style ID Separation:**
- Functional styles: `id="fbn-ic-functional-styles"`
- Auto-init full styles: `id="fbn-ic-styles"`

Both coexist without conflict.

---

## Bundle Size Impact

| Metric | Value |
|--------|-------|
| Added JS (minified + gzipped) | ~250 bytes |
| Trade-off | Saves 1 CSS network request |

---

## Verification

1. `npm run build`
2. `npm test`
3. Manual test: Create HTML with NO style.css, verify gallery works
