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

## Combined Configuration

```typescript
interface EntryAnimationConfig {
  start: EntryStartConfig;
  path: EntryPathConfig;
  timing: EntryTimingConfig;
  easing: EntryEasingConfig;
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

### Phase 1: Foundation
- [ ] Create `EntryAnimationEngine` class
- [ ] Refactor current animation out of `ImageGallery.ts`
- [ ] Add configuration types to `types.ts`
- [ ] Add defaults to `defaults.ts`

### Phase 2: Start Positions
- [ ] Implement all start position options
- [ ] Add offset configuration
- [ ] Test with different layouts

### Phase 3: Path Types
- [ ] Implement linear (refactor current)
- [ ] Implement arc paths
- [ ] Implement preset paths (bounce, elastic)
- [ ] Consider bezier/keyframe for future

### Phase 4: Timing & Easing
- [ ] Add duration variance
- [ ] Add stagger patterns
- [ ] Implement easing presets
- [ ] Consider spring physics (future)

### Phase 5: Polish
- [ ] Performance optimization
- [ ] Add debug visualization for paths
- [ ] Documentation and examples
- [ ] Unit tests

---

## Open Questions

1. **Should path and easing be separate?** Some "paths" like bounce are really easing effects. Should we merge them?

2. **Per-image customization?** How deep should per-image control go? Could get complex.

3. **Layout-aware defaults?** Should radial layout default to center-out, grid to top-down, etc.?

4. **Exit animations?** Should we also support exit animations for when images are removed/refreshed?

5. **Interaction with resize?** When window resizes and images reposition, should they re-animate or just move?

---

## References

- [Web Animations API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API)
- [CSS offset-path](https://developer.mozilla.org/en-US/docs/Web/CSS/offset-path)
- [Framer Motion](https://www.framer.com/motion/) - inspiration for spring physics
- [GSAP](https://greensock.com/gsap/) - path animation reference
