# Swipe Gesture Navigation Design

Add swipe-left/swipe-right gestures as an alternative to keyboard navigation for focused images.

## Core Behavior

**Activation:**
- Only when an image is currently focused (`currentFocusIndex !== null`)
- Touch events on the gallery container element
- Horizontal movement must be dominant (angle check allows vertical scrolling through)

**Gesture detection:**
- Track `touchstart`, `touchmove`, `touchend` events
- Trigger navigation when either:
  - Horizontal distance ≥ 50px, OR
  - Velocity ≥ 0.5px/ms with distance ≥ 20px (fast flick)
- Swipe left → next image
- Swipe right → previous image

**Edge behavior:**
- Wrap around (first ↔ last), matching keyboard navigation

## Visual Feedback

**During drag:**
- Focused image follows finger horizontally with damped translation (0.3x of drag distance)
- Background overlay stays in place

**On release:**
- Threshold met: Image transitions out in swipe direction, next image transitions in
- Threshold not met: Image animates back to center (~150ms ease-out)

## Implementation

### New File: `src/engines/SwipeEngine.ts`

```typescript
class SwipeEngine {
  // Constructor takes container element and navigation callbacks
  // Tracks: startX, startY, startTime, currentX, isDragging

  enable(): void    // Start listening to touch events
  disable(): void   // Stop listening (when no image focused)
  destroy(): void   // Cleanup all listeners
}
```

### ZoomEngine Changes

Add methods for drag offset during swipe:
- `setDragOffset(offset: number)` - Apply temporary translateX to focused image
- `clearDragOffset(animate: boolean)` - Reset offset, optionally animated

### ImageCloud.ts Integration

- Instantiate SwipeEngine alongside other engines
- Pass callbacks that invoke `navigateToNextImage()` / `navigateToPreviousImage()`
- SwipeEngine calls ZoomEngine offset methods during drag

### Constants

```typescript
const SWIPE_THRESHOLD_PX = 50;
const SWIPE_VELOCITY_THRESHOLD = 0.5; // px/ms
const SWIPE_MIN_DISTANCE_FOR_VELOCITY = 20;
const DRAG_DAMPING = 0.3;
const SNAP_BACK_DURATION_MS = 150;
const HORIZONTAL_ANGLE_THRESHOLD = 30; // degrees from horizontal
```

## No Configuration

Hardcoded sensible defaults for initial implementation. Configuration options can be added later if needed.
