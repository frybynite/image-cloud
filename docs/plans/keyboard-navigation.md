# Keyboard Navigation Feature - Brainstorming & Design

## Overview

Add keyboard navigation to allow users to move between images using arrow keys when an image is focused.

---

## Proposed Key Bindings

| Key | Action | Notes |
|-----|--------|-------|
| **Left Arrow** | Navigate to previous image | Layout-specific logic |
| **Right Arrow** | Navigate to next image | Layout-specific logic |
| **Escape** | Unfocus current image | Already implemented |
| **Up Arrow** | Navigate up (grid/wave only) | Optional - grid layouts benefit |
| **Down Arrow** | Navigate down (grid/wave only) | Optional - grid layouts benefit |
| **Home** | Jump to first image | Optional - quick access |
| **End** | Jump to last image | Optional - quick access |
| **Enter/Space** | Focus hovered image (when none focused) | Optional - accessibility |

### Minimal MVP
- Left/Right arrows + Escape (already exists)
- Simple index-based navigation for all layouts

### Enhanced Version
- Layout-aware navigation (spatial vs index-based)
- Up/Down for grid-like layouts
- Home/End for quick jumps

---

## Navigation Strategies Per Layout

### Option A: Universal Index-Based (Simple)

All layouts use the same logic:
- **Next**: `currentIndex + 1` (wrap to 0 at end)
- **Previous**: `currentIndex - 1` (wrap to last at 0)

**Pros:**
- Simple implementation
- Consistent behavior across layouts
- Predictable for users

**Cons:**
- May not feel natural for some layouts (cluster, random)
- Index order doesn't always match visual position

### Option B: Layout-Specific Navigation (Advanced)

Each layout determines what "next" and "previous" mean based on spatial relationships:

#### Grid Layout
```
Navigation: Cardinal directions
Left/Right: Move within row
Up/Down: Move between rows (same column)

[0] [1] [2] [3]
[4] [5] [6] [7]    At [5]: Left→[4], Right→[6], Up→[1], Down→[9]
[8] [9] [10][11]
```

#### Wave Layout
```
Navigation: Same as grid (row-based structure)
Left/Right: Move along wave within row
Up/Down: Move to adjacent row

Row 0: ~~~~~[0]~~~[1]~~~[2]~~~
Row 1: ~~~[3]~~~[4]~~~[5]~~~~~
```

#### Radial Layout
```
Navigation: Angular progression
Left: Counter-clockwise to previous angle
Right: Clockwise to next angle
(Or: Left/Right move between rings)

       [2]
    [6]   [3]
  [5]  [0]  [4]    At [0] (center): any direction goes to ring 1
    [8]   [7]
       [1]
```

#### Spiral Layout
```
Navigation: Follow spiral path
Left: Inward (toward center)
Right: Outward (away from center)

Index order naturally follows the spiral from center outward.
```

#### Cluster Layout
```
Navigation: Proximity-based search
Left/Right: Find nearest image in that general direction

No inherent structure - use spatial search:
- Find all images to the left of current
- Select the closest one
```

#### Random Layout
```
Navigation: Same as cluster (proximity-based)
No structure - pure spatial search required
```

### Option C: Hybrid Approach (Recommended)

- **Grid, Wave**: Cardinal direction navigation (Up/Down/Left/Right)
- **Radial, Spiral**: Index-based following natural order (Left/Right only)
- **Cluster, Random**: Index-based as fallback, spatial search as enhancement

---

## Implementation Architecture

### New Components

```
src/
├── engines/
│   └── KeyboardNavigationEngine.ts   # New file
├── navigation/
│   ├── NavigationStrategy.ts         # Interface for strategies
│   ├── IndexNavigationStrategy.ts    # Simple index-based
│   ├── GridNavigationStrategy.ts     # Grid/Wave cardinal nav
│   └── SpatialNavigationStrategy.ts  # Cluster/Random proximity
```

### KeyboardNavigationEngine Interface

```typescript
interface KeyboardNavigationEngine {
  // Enable/disable keyboard navigation
  enable(): void;
  disable(): void;

  // Navigation actions
  navigateNext(): void;
  navigatePrevious(): void;
  navigateUp(): void;      // Grid/Wave only
  navigateDown(): void;    // Grid/Wave only
  navigateToFirst(): void;
  navigateToLast(): void;

  // State
  isEnabled(): boolean;
  getCurrentIndex(): number | null;
}
```

### Integration Points

1. **ImageCloud.ts** - Add keyboard listener in `setupEventListeners()`
2. **ZoomEngine** - Already has `focusImage()` and state management
3. **Config** - Enable via `interaction.navigation.keyboard: true`

### State to Track

```typescript
interface NavigationState {
  enabled: boolean;
  currentIndex: number | null;  // Index of focused image
  layouts: ImageLayout[];       // Reference for position lookups
  algorithm: string;            // Current layout algorithm
}
```

---

## Edge Cases to Handle

1. **No image focused** - Arrow keys do nothing (or focus first image?)
2. **During animation** - Queue navigation or ignore until stable?
3. **Wrap around** - End of list wraps to beginning?
4. **Single image** - Navigation has no effect
5. **Layout change** - Reset navigation state
6. **Rapid key presses** - Debounce or queue?

### Recommended Behaviors

| Scenario | Behavior |
|----------|----------|
| No focus + arrow key | Do nothing (require click first) |
| During FOCUSING animation | Queue the navigation |
| During CROSS_ANIMATING | Queue or ignore |
| At first image + Left | Wrap to last image |
| At last image + Right | Wrap to first image |
| Rapid keys | Process each, let cross-animation handle smoothly |

---

## Configuration Options

```typescript
interface KeyboardNavigationConfig {
  enabled: boolean;           // Master toggle
  wrapAround: boolean;        // Wrap at ends (default: true)
  strategy: 'index' | 'spatial' | 'auto';  // Navigation mode
  keys: {
    next: string[];           // Default: ['ArrowRight']
    previous: string[];       // Default: ['ArrowLeft']
    up?: string[];            // Default: ['ArrowUp']
    down?: string[];          // Default: ['ArrowDown']
    first?: string[];         // Default: ['Home']
    last?: string[];          // Default: ['End']
    unfocus: string[];        // Default: ['Escape']
  };
}
```

---

## Questions to Resolve

1. **Up/Down arrows for non-grid layouts?**
   - Option A: Ignore (only Left/Right work)
   - Option B: Map to same as Left/Right
   - Option C: Use for something else (zoom level?)

2. **Behavior when no image is focused?**
   - Option A: Arrow keys do nothing
   - Option B: Arrow keys focus first/last image
   - Option C: Arrow keys focus image nearest to center

3. **Animation during navigation?**
   - Option A: Smooth cross-animation (current focus → new focus)
   - Option B: Instant switch (no animation)
   - Option C: Configurable

4. **Accessibility considerations?**
   - ARIA attributes for focused state
   - Screen reader announcements
   - Focus trap within gallery?

---

## Implementation Phases

### Phase 1: MVP
- Left/Right arrow navigation
- Simple index-based for all layouts
- Wrap-around at ends
- Uses existing cross-animation

### Phase 2: Enhanced Navigation
- Up/Down for grid-based layouts
- Home/End for quick jumps
- Configuration options

### Phase 3: Layout-Specific Intelligence
- Spatial navigation for cluster/random
- Ring-based navigation for radial
- Tangential navigation for spiral

### Phase 4: Accessibility
- ARIA attributes
- Screen reader support
- Configurable key bindings

---

## Testing Plan

1. **Unit tests** - Navigation strategy logic
2. **E2E tests** - Keyboard interaction flows
   - Arrow key navigation cycles through images
   - Escape unfocuses
   - Wrap-around works correctly
   - Navigation during animation handled gracefully
3. **Manual testing** - Each layout algorithm
4. **Accessibility testing** - Screen reader compatibility

---

## Design Decisions (Resolved)

- [x] **Arrow keys**: Left/Right only (Up/Down deferred to future enhancement)
- [x] **No focus behavior**: Do nothing - require click to focus first
- [x] **Wrap around**: Yes, continuous cycling at ends
- [x] Spatial navigation for cluster/random - deferred, using index-based for all layouts

---

## Status: IMPLEMENTED

---

## Final Implementation Plan

### Scope
- Left/Right arrow navigation between images
- Index-based navigation for all layout types
- Wrap around at ends
- Escape to unfocus (already implemented)

### Files to Modify

1. **src/ImageCloud.ts**
   - Add `currentFocusIndex: number | null` to track focused image index
   - Expand keyboard listener in `setupEventListeners()` to handle ArrowLeft/ArrowRight
   - Add `navigateToImage(index: number)` method
   - Update `handleImageClick()` to set `currentFocusIndex`

2. **src/config/types.ts**
   - Update `NavigationInteractionConfig` with keyboard options

3. **src/config/defaults.ts**
   - Set `navigation.keyboard: true` as default (or false?)

4. **test/e2e/keyboard-navigation.spec.ts** (new file)
   - Test arrow key navigation
   - Test wrap-around behavior
   - Test no-op when unfocused

### Implementation Steps

1. Add `currentFocusIndex` state tracking to ImageCloud
2. Update `handleImageClick()` to set index when focusing
3. Add ArrowLeft/ArrowRight handlers that:
   - Check if an image is focused (`currentFocusIndex !== null`)
   - Calculate next/previous index with wrap-around
   - Call `zoomEngine.focusImage()` with new image element and layout
4. Reset `currentFocusIndex` to null on unfocus (ESC or click outside)
5. Add E2E tests

### Verification

1. Run dev server: `npm run dev`
2. Open configurator
3. Click an image to focus
4. Press Right arrow - should animate to next image
5. Press Left arrow - should animate to previous image
6. Navigate to last image, press Right - should wrap to first
7. Navigate to first image, press Left - should wrap to last
8. Press Escape - should unfocus
9. Press arrows when unfocused - should do nothing
10. Run tests: `npm test`
