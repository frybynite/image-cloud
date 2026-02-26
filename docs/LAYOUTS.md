# Layouts

## Implemented

### Radial
Concentric rings emanating from center. Images placed in elliptical rings at increasing radii.

**Configuration options:**
```typescript
interface RadialConfig {
  tightness: number;  // Ring spacing (0.3-2.0, default: 1.0). Higher = tighter rings.
}
```

**Visual characteristics:**
- Center image prominently featured at highest z-index
- Rings spread outward with a horizontal oval shape (1.5× wider than tall)
- Ring spacing independent of image size (controlled by `tightness`, not `densityFactor`)
- Works well with 5–30 images

### Spiral
Golden ratio spiral emanating outward. Images placed along a logarithmic spiral using the golden angle (~137.5°) for optimal distribution.

**Configuration options:**
```typescript
interface SpiralConfig {
  spiralType: 'golden' | 'archimedean' | 'logarithmic';
  direction: 'clockwise' | 'counterclockwise';
  tightness: number;      // How tightly wound (spacing between arms)
  scaleDecay: number;     // 0 = no decay, 1 = outer images much smaller
  startAngle: number;     // Initial rotation offset
}
```

**Visual characteristics:**
- Eye naturally drawn to center
- Organic, nature-inspired feel (shells, sunflowers, galaxies)
- Works well with 10-50+ images
- Distinct from radial because it's one continuous arm, not concentric rings

### Grid
Clean rows and columns with optional stagger. Supports alignment options (start, center, end).

**Configuration options:**
```typescript
interface GridConfig {
  columns: number | 'auto';     // Fixed or auto-calculate
  rows: number | 'auto';        // Fixed or auto-calculate
  stagger: 'none' | 'row' | 'column';  // Brick pattern offset
  jitter: number;               // 0-1, random position variance
  overlap: number;              // 0-1+, image size multiplier
  fillDirection: 'row' | 'column';
  alignment: 'start' | 'center' | 'end';
  gap: number;                  // Pixels between cells
  overflowOffset: number;       // 0-0.5, offset for overflow stacking
}
```

**Visual characteristics:**
- Clean, organized, professional
- Great for galleries, portfolios, product displays
- `stagger: 'row'` gives a brick/masonry feel
- `jitter` + `overlap` creates a "scattered on table" look

**Overflow Mode:**

When both `columns` and `rows` are fixed and image count exceeds available cells:
- Extra images are distributed across cells with positional offsets
- Offset pattern: bottom-right, upper-left, upper-right, bottom-left, then left, right, up, down
- Overflow images render **below** base images (lower z-index) creating a "flow under" effect
- `overflowOffset` controls offset distance as percentage of cell size (default: 0.25 = 25%)

### Cluster
Organic clumps with natural spacing. Images grouped into clusters positioned around the container.

### Random
Scattered placement with collision avoidance.

---

## Future Ideas

### Visual Variety Layouts
- **Honeycomb** - Hexagonal tessellation pattern
- **Mosaic** - Variable-sized tiles fitting together
- **Burst/Explosion** - Images radiating outward with velocity falloff
- **Wave** - Sinusoidal arrangement along curves
- **Scatter with Physics** - Random with collision avoidance and physics simulation
- **Flow/Stream** - Images follow a curved path

### Content Organization Layouts
- **Timeline** - Chronological arrangement
- **Category/Hierarchy** - Group by metadata or categories
- **Relationship/Connection** - Position based on relationships between images
