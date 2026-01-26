# Cross-Animation Zoom Behavior Implementation Plan

**Status: COMPLETED** (2026-01-25)

## Goal
Replace sequential focus animations with concurrent cross-animation:
- Outgoing and incoming images animate simultaneously
- Interruption during cross-animation gracefully redirects animations
- Maximum 2 images animating at once

## Implementation Phases

### Phase 1: AnimationEngine - Web Animations API

**File:** `src/engines/AnimationEngine.ts`

Add new methods alongside existing ones (keep backwards compatibility):

```typescript
// New types to add to config/types.ts
interface AnimationHandle {
  id: string;
  element: HTMLElement;
  animation: Animation;
  fromState: TransformParams;
  toState: TransformParams;
  startTime: number;
  duration: number;
}

interface AnimationSnapshot {
  x: number;
  y: number;
  rotation: number;
  scale: number;
}
```

New methods:
1. `animateTransformCancellable(element, from, to, duration, easing): AnimationHandle`
2. `cancelAnimation(handle, commitStyle?: boolean): AnimationSnapshot`
3. `getCurrentTransform(element): AnimationSnapshot`
4. `hasActiveAnimation(element): boolean`

Implementation uses `element.animate()` with `fill: 'forwards'` and stores handles in `Map<HTMLElement, AnimationHandle>`.

### Phase 2: ZoomEngine State Machine

**File:** `src/engines/ZoomEngine.ts`

Replace simple `focusData` with state machine:

```typescript
enum ZoomState {
  IDLE,           // No focus, no animations
  FOCUSING,       // Single image animating in
  FOCUSED,        // Stable focused state
  UNFOCUSING,     // Single image animating out
  CROSS_ANIMATING // Two images: one out, one in
}

interface AnimatingImage {
  element: HTMLElement;
  originalState: ImageLayout;
  animationHandle: AnimationHandle;
  direction: 'in' | 'out';
}
```

State transitions:

| From | Event | To |
|------|-------|-----|
| IDLE | click(A) | FOCUSING |
| FOCUSING | complete | FOCUSED |
| FOCUSING | click(B) | cancel A, FOCUSING(B) |
| FOCUSED | click(A) same | UNFOCUSING |
| FOCUSED | click(B) different | CROSS_ANIMATING |
| FOCUSED | ESC | UNFOCUSING |
| CROSS_ANIMATING | click(C) | reset A instantly, redirect B out, start C in |
| CROSS_ANIMATING | complete | FOCUSED |
| CROSS_ANIMATING | ESC | cancel incoming, UNFOCUSING |
| UNFOCUSING | complete | IDLE |

### Phase 3: Position Capture

Use `DOMMatrix` to capture mid-animation position:

```typescript
getCurrentTransform(element: HTMLElement): AnimationSnapshot {
  const matrix = new DOMMatrix(getComputedStyle(element).transform);
  return {
    x: matrix.e + element.offsetWidth / 2,
    y: matrix.f + element.offsetHeight / 2,
    rotation: Math.atan2(matrix.b, matrix.a) * (180 / Math.PI),
    scale: Math.sqrt(matrix.a * matrix.a + matrix.b * matrix.b)
  };
}
```

### Phase 4: Z-Index Management

```typescript
const Z_INDEX = {
  DEFAULT: 'auto',
  UNFOCUSING: 999,   // Outgoing below
  FOCUSING: 1000,    // Incoming above
  FOCUSED: 1000
};
```

### Phase 5: Edge Cases

| Scenario | Handling |
|----------|----------|
| Rapid clicks (A→B→C) | Latest wins, instant reset older animations |
| Click same image animating in | Reverse to unfocus |
| ESC during cross-anim | Cancel incoming, let outgoing complete |
| Click outside | Same as ESC |
| Resize | Cancel all, reset to IDLE |

## Files to Modify

| File | Changes |
|------|---------|
| `src/config/types.ts` | Add AnimationHandle, AnimationSnapshot, ZoomState types |
| `src/engines/AnimationEngine.ts` | Add cancellable animation methods (~50 lines) |
| `src/engines/ZoomEngine.ts` | Replace with state machine (~150 lines rewrite) |
| `src/ImageCloud.ts` | Update click handlers to use new API |
| `test/e2e/interaction.spec.ts` | Add cross-animation tests |

## Testing Strategy

1. **Unit tests** for AnimationEngine cancellation
2. **E2E tests:**
   - Click B while A focused → both animate
   - Click C during cross-animation → proper redirection
   - ESC during cross-animation → cancels correctly
   - Rapid clicks don't break state

## Verification

1. Run `npm run dev` and test manually:
   - Focus image A, click B → watch for simultaneous animations
   - During cross-animation, click C → verify A resets, B reverses, C focuses
   - Press ESC during various states
2. Run `npm test` for E2E tests
3. Check for console errors during rapid clicking
