# Entry Animations Design

## Overview

Allow users to customize how images animate into the gallery. Currently, images fly in from the nearest screen edge along a straight path. This plan explores giving users control over:

1. **Starting Position** - Where images originate
2. **Animation Path** - The trajectory images follow
3. **Speed & Easing** - Timing and acceleration curves

## Current Implementation

Located in `src/ImageGallery.ts` lines 377-400:
- Calculates nearest edge (left, right, top, bottom)
- Starts image off-screen beyond that edge
- Animates along a straight line to final position
- Uses fixed easing: `cubic-bezier(0.25, 1, 0.5, 1)`

---

## 1. Starting Position

### Options

| Option | Description |
|--------|-------------|
| `nearest-edge` | Current behavior - closest screen edge (default) |
| `top` | Always from top |
| `bottom` | Always from bottom |
| `left` | Always from left |
| `right` | Always from right |
| `center` | Fade/scale in from center of container |
| `random-edge` | Random edge per image |
| `random` | Random position anywhere off-screen |
| `circular` | Points distributed around a circle (configurable radius) |
| `origin-point` | Specific x,y coordinate |
| `behind` | Scale up from z-axis (depth illusion) |

### Proposed Configuration

```typescript
interface EntryStartConfig {
  position: 'nearest-edge' | 'top' | 'bottom' | 'left' | 'right'
          | 'center' | 'random-edge' | 'random' | 'circular'
          | 'origin-point' | 'behind';

  // For 'origin-point' - relative to container (0-1) or absolute pixels
  origin?: {
    x: number | string;  // e.g., 0.5 or "50%" or 200
    y: number | string;
  };

  // For 'circular' - defines the circle images start from
  circular?: {
    center?: { x: number | string; y: number | string };  // default: container center
    radius: number | string;  // pixels or '120%' of container diagonal
    distribution?: 'even' | 'random';  // how images are placed on circle
  };

  // How far off-screen to start (for edge positions)
  offset?: number;  // pixels beyond edge, default 100
}
```

### Design Questions

1. **Per-image or global?** Should each image be able to have its own start position, or is this a gallery-wide setting?
   - Recommendation: Gallery-wide default with optional per-image override

2. **Should `nearest-edge` consider layout algorithm?** For example, radial layout might look better with all images coming from center.

---

## 2. Animation Path

### Path Types

| Type | Description | Use Case |
|------|-------------|----------|
| `linear` | Straight line (current) | Clean, professional |
| `arc` | Curved path | Playful, organic |
| `bezier` | Custom bezier curve | Full control |
| `spiral` | Spiral inward | Dramatic entrance |
| `bounce` | Overshoot and settle | Energetic, fun |
| `elastic` | Spring-like oscillation | Playful |
| `wave` | Sinusoidal path | Floating, dreamy |

### Defining Custom Paths

**Option A: Named Presets**
```typescript
path: 'linear' | 'arc-gentle' | 'arc-dramatic' | 'spiral-in' | 'bounce' | 'wave'
```

**Option B: Bezier Control Points**
```typescript
path: {
  type: 'bezier';
  // Control points as percentage of total distance
  controlPoints: [
    { x: 0.25, y: 0.1 },   // First control point
    { x: 0.75, y: -0.1 }   // Second control point
  ];
}
```

**Option C: Keyframe Waypoints**
```typescript
path: {
  type: 'keyframes';
  // Points along the path (0 = start, 1 = end)
  points: [
    { at: 0, offset: { x: 0, y: 0 } },
    { at: 0.3, offset: { x: 50, y: -30 } },  // Curve up
    { at: 0.7, offset: { x: 20, y: 10 } },   // Curve down
    { at: 1, offset: { x: 0, y: 0 } }        // Land at final
  ];
}
```

### Proposed Configuration

```typescript
interface EntryPathConfig {
  type: 'linear' | 'arc' | 'bezier' | 'keyframes' | 'preset';

  // For 'arc'
  arcIntensity?: number;  // 0-1, how curved (0.3 = gentle, 0.8 = dramatic)
  arcDirection?: 'auto' | 'clockwise' | 'counterclockwise';

  // For 'bezier' - control points relative to start->end vector
  controlPoints?: Array<{ x: number; y: number }>;

  // For 'keyframes' - explicit waypoints
  keyframes?: Array<{ at: number; offset: { x: number; y: number } }>;

  // For 'preset'
  preset?: 'bounce' | 'elastic' | 'spiral' | 'wave' | 'swoosh';
}
```

### Implementation Approach

**CSS vs JavaScript Animation:**

| Approach | Pros | Cons |
|----------|------|------|
| CSS `@keyframes` | GPU accelerated, smooth | Limited path control |
| CSS `offset-path` | True path following | Limited browser support |
| Web Animations API | Good control, performant | More complex |
| JavaScript RAF loop | Full control | More CPU, harder to sync |

**Recommendation:** Use Web Animations API with fallback to CSS transforms. This gives us keyframe control while maintaining performance.

```typescript
// Example using Web Animations API
element.animate([
  { transform: 'translate(-200px, 0) rotate(5deg)', offset: 0 },
  { transform: 'translate(-50px, -30px) rotate(2deg)', offset: 0.4 },
  { transform: 'translate(0, 0) rotate(0deg)', offset: 1 }
], {
  duration: 800,
  easing: 'cubic-bezier(0.25, 1, 0.5, 1)'
});
```

---

## 3. Speed & Easing

### Duration Options

```typescript
interface EntryTimingConfig {
  // Base duration in ms
  duration: number;  // default: 600

  // Variation per image
  durationVariance?: {
    min: number;  // multiplier, e.g., 0.8
    max: number;  // multiplier, e.g., 1.2
  };

  // Stagger between images
  stagger: number;  // ms between each image start, default: 150

  // Stagger pattern
  staggerPattern?: 'sequential' | 'random' | 'distance-from-center';
}
```

### Easing Options

| Preset | CSS Equivalent | Feel |
|--------|----------------|------|
| `ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | Smooth deceleration |
| `ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` | Gentle start and end |
| `bounce` | `cubic-bezier(0.68, -0.55, 0.265, 1.55)` | Overshoot and settle |
| `elastic` | Custom spring physics | Wobbly settle |
| `snap` | `cubic-bezier(0.5, 0, 0, 1)` | Quick snap into place |
| `gentle` | `cubic-bezier(0.25, 0.1, 0.25, 1)` | Very soft |

```typescript
interface EntryEasingConfig {
  // Named preset or custom bezier
  easing: string | 'ease-out' | 'bounce' | 'elastic' | 'snap' | 'gentle';

  // For elastic/spring physics
  spring?: {
    stiffness: number;   // 100-500
    damping: number;     // 10-50
    mass: number;        // 0.5-3
  };
}
```

---

## 4. Entry Rotation

Images can rotate as they animate into their final position, adding a dynamic "tumbling" or "spinning" effect.

### Rotation Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| `none` | No rotation during entry (default) | Clean, professional |
| `settle` | Start rotated, settle to final rotation | Natural, organic feel |
| `spin` | Full rotation(s) during flight | Dramatic, playful |
| `wobble` | Oscillate rotation during entry | Bouncy, energetic |
| `random` | Random start rotation per image | Scattered, casual |

### Proposed Configuration

```typescript
interface EntryRotationConfig {
  // Master toggle / mode
  mode: 'none' | 'settle' | 'spin' | 'wobble' | 'random';

  // Starting rotation in degrees (for 'settle' mode)
  // Can be fixed or a range for per-image variance
  startRotation?: number | { min: number; max: number };

  // For 'spin' mode - number of full rotations
  spinCount?: number;  // e.g., 1 = 360°, 0.5 = 180°

  // Spin direction
  direction?: 'clockwise' | 'counterclockwise' | 'auto' | 'random';
  // 'auto' = based on entry direction (left->right = clockwise)

  // For 'wobble' mode
  wobble?: {
    amplitude: number;   // degrees of oscillation, e.g., 15
    frequency: number;   // oscillations during entry, e.g., 2
    decay: boolean;      // reduce amplitude as it settles
  };
}
```

### Rotation Behavior by Mode

**`settle` Mode:**
- Image starts at `startRotation` degrees
- Animates to its final layout rotation (from placement layout)
- Creates a "falling into place" effect

```typescript
// Example: Images tumble in from random angles
rotation: {
  mode: 'settle',
  startRotation: { min: -45, max: 45 },
  direction: 'auto'
}
```

**`spin` Mode:**
- Image completes full rotation(s) during flight
- Adds to any layout rotation at the end
- Good for dramatic entrances

```typescript
// Example: Images spin once as they fly in
rotation: {
  mode: 'spin',
  spinCount: 1,
  direction: 'clockwise'
}
```

**`wobble` Mode:**
- Image oscillates back and forth during entry
- Amplitude decreases as it approaches final position
- Creates an energetic, bouncy feel

```typescript
// Example: Images wobble into place
rotation: {
  mode: 'wobble',
  wobble: {
    amplitude: 20,
    frequency: 3,
    decay: true
  }
}
```

**`random` Mode:**
- Each image gets a random start rotation
- Settles to final layout rotation
- Quick way to add variety

```typescript
// Example: Casual scattered entrance
rotation: {
  mode: 'random'
  // Defaults to ±30° range
}
```

### Interaction with Layout Rotation

Placement layouts can assign a final rotation to each image (e.g., `layout.rotation`). Entry rotation works *in addition to* this:

1. **Start rotation** = `entryRotation.startRotation` (or calculated for spin/wobble)
2. **End rotation** = `layout.rotation` (from placement layout)
3. **Animation** = interpolate from start to end during entry

If layout rotation is 0° and entry mode is `settle` with `startRotation: 30`, the image rotates from 30° → 0°.

If layout rotation is -5° and entry mode is `settle` with `startRotation: 30`, the image rotates from 30° → -5°.

### Implementation Notes

- Rotation is applied via CSS `transform: rotate()` combined with translate
- For `wobble` mode, use JavaScript animation (not CSS) to calculate oscillation
- Consider combining with path animation for complex effects:
  - Arc path + settle rotation = swooping tumble
  - Bounce path + wobble rotation = energetic bounce

### Example Configurations

**Tumbling Photos:**
```typescript
entry: {
  start: { position: 'top' },
  path: { type: 'arc', arcIntensity: 0.2 },
  rotation: {
    mode: 'settle',
    startRotation: { min: -30, max: 30 }
  },
  timing: { duration: 800, stagger: 100 }
}
```

**Dramatic Spin Entrance:**
```typescript
entry: {
  start: { position: 'center' },
  path: { type: 'linear' },
  rotation: {
    mode: 'spin',
    spinCount: 1,
    direction: 'random'
  },
  timing: { duration: 1000, stagger: 50 }
}
```

**Bouncy Wobble:**
```typescript
entry: {
  start: { position: 'bottom' },
  path: { type: 'preset', preset: 'bounce' },
  rotation: {
    mode: 'wobble',
    wobble: { amplitude: 15, frequency: 2, decay: true }
  },
  timing: { duration: 900, stagger: 80 }
}
```

---

## Combined Configuration

```typescript
interface EntryAnimationConfig {
  start: EntryStartConfig;
  path: EntryPathConfig;
  timing: EntryTimingConfig;
  easing: EntryEasingConfig;
  rotation?: EntryRotationConfig;
}

// In main config
animation: {
  entry: EntryAnimationConfig;
  // ... existing focus/unfocus config
}
```

### Example Configurations

**Gentle Float (default-like)**
```typescript
entry: {
  start: { position: 'nearest-edge', offset: 100 },
  path: { type: 'linear' },
  timing: { duration: 600, stagger: 150 },
  easing: { easing: 'ease-out' }
}
```

**Playful Bounce**
```typescript
entry: {
  start: { position: 'bottom' },
  path: { type: 'arc', arcIntensity: 0.3 },
  timing: { duration: 800, stagger: 100 },
  easing: { easing: 'bounce' }
}
```

**Dramatic Burst**
```typescript
entry: {
  start: { position: 'center' },
  path: { type: 'linear' },
  timing: { duration: 400, stagger: 50, staggerPattern: 'distance-from-center' },
  easing: { easing: 'snap' }
}
```

**Spiral Galaxy**
```typescript
entry: {
  start: { position: 'origin-point', origin: { x: '50%', y: '50%' } },
  path: { type: 'preset', preset: 'spiral' },
  timing: { duration: 1200, stagger: 80 },
  easing: { easing: 'ease-in-out' }
}
```

---

## Implementation Phases

### Phase 1: Foundation ✅ COMPLETE
- [x] Create `EntryAnimationEngine` class (`src/engines/EntryAnimationEngine.ts` - 673 lines)
- [x] Refactor current animation out of `ImageGallery.ts` (now in dedicated engine files)
- [x] Add configuration types to `types.ts` (EntryAnimationConfig, EntryStartConfig, EntryPathConfig, etc.)
- [x] Add defaults to `defaults.ts`

### Phase 2: Start Positions ✅ COMPLETE
- [x] Implement all start position options (8 types: nearest-edge, top, bottom, left, right, center, random-edge, circular)
- [x] Add offset configuration
- [x] Test with different layouts (layout-aware defaults implemented per algorithm)

### Phase 3: Path Types ✅ MOSTLY COMPLETE
- [x] Implement linear (refactor current)
- [ ] Implement arc paths (partially - mentioned in types but implementation unclear)
- [x] Implement preset paths (bounce, elastic)
- [x] **BONUS:** Implement wave path (not in original plan)
- [ ] Consider bezier/keyframe for future (deferred)

### Phase 4: Timing & Easing 🟡 PARTIALLY COMPLETE
- [ ] Add duration variance
- [ ] Add stagger patterns (basic stagger implemented, patterns like 'sequential', 'random', 'distance-from-center' not done)
- [x] Implement easing presets (CSS easing support)
- [x] Consider spring physics (implemented via elastic path with stiffness/damping/mass)

### Phase 5: Entry Rotation ✅ COMPLETE
- [x] Implement `settle` mode (start rotated, animate to final)
- [x] Implement `spin` mode (full rotations during flight)
- [x] Implement `wobble` mode (oscillating rotation)
- [x] Implement `random` mode (random start rotation)
- [x] Integrate rotation with existing path animations

### Phase 5b: Entry Scale ✅ COMPLETE (BONUS - not in original plan)
- [x] Implement `grow` mode (start smaller, grow to final)
- [x] Implement `shrink` mode (start larger, shrink to final)
- [x] Implement `pop` mode (bounce/overshoot effect on scale)
- [x] Implement `random` mode (random start scale)

### Phase 6: Polish 🟡 PARTIALLY COMPLETE
- [ ] Performance optimization (needs review)
- [ ] Add debug visualization for paths
- [x] Documentation and examples (this plan document)
- [ ] Unit tests
- [ ] Configurator UI integration

---

## Open Questions

1. **Should path and easing be separate?** Some "paths" like bounce are really easing effects. Should we merge them?
   - *Current approach: Kept separate. Path controls trajectory, easing controls timing curve.*

2. **Per-image customization?** How deep should per-image control go? Could get complex.

3. ~~**Layout-aware defaults?** Should radial layout default to center-out, grid to top-down, etc.?~~
   - ✅ **RESOLVED:** Implemented layout-aware defaults (radial→center, spiral→center, grid→top, cluster→nearest-edge, wave→left)

4. **Exit animations?** Should we also support exit animations for when images are removed/refreshed?

5. **Interaction with resize?** When window resizes and images reposition, should they re-animate or just move?

6. **Rotation + Path combinations?** Some path/rotation combos may look odd (e.g., spin + spiral). Should we warn or restrict certain combinations?

7. **Rotation performance?** Wobble mode requires JS animation. Should we offer a CSS-only fallback for simpler rotation effects?
   - *Current approach: Uses requestAnimationFrame for complex animations (bounce, elastic, wave, wobble). Simple modes use CSS transitions.*

---

## References

- [Web Animations API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API)
- [CSS offset-path](https://developer.mozilla.org/en-US/docs/Web/CSS/offset-path)
- [Framer Motion](https://www.framer.com/motion/) - inspiration for spring physics
- [GSAP](https://greensock.com/gsap/) - path animation reference
