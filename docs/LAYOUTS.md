# Layouts

## Quick Start: Importing Layouts

⚠️ **IMPORTANT:** Layouts are no longer bundled with the core. You must import them explicitly:

```javascript
import { ImageCloud } from '@frybynite/image-cloud';
import '@frybynite/image-cloud/layouts/radial.js';  // Import the layout you need

const gallery = new ImageCloud({
  container: 'gallery',
  layout: { algorithm: 'radial' }
});
```

### Import Options

**Single Layout (Recommended for Production):**
```javascript
// Import only what you use — other layouts are tree-shaken by your bundler
import '@frybynite/image-cloud/layouts/radial.js';
import '@frybynite/image-cloud/layouts/grid.js';
```

**All Layouts:**
```javascript
// Use when multiple layouts are needed in the same app
import '@frybynite/image-cloud/layouts/all.js';
```

**Auto-Init Bundle (CDN/Script Tag):**
```html
<!-- Auto-init already includes all layouts -->
<script src="https://cdn.example.com/image-cloud/auto-init.js"></script>
```

### Available Subpath Exports

- `@frybynite/image-cloud/layouts/radial.js`
- `@frybynite/image-cloud/layouts/grid.js`
- `@frybynite/image-cloud/layouts/spiral.js`
- `@frybynite/image-cloud/layouts/cluster.js`
- `@frybynite/image-cloud/layouts/wave.js`
- `@frybynite/image-cloud/layouts/random.js`
- `@frybynite/image-cloud/layouts/all.js` (includes all 6 layouts)

---

## Implemented

### Radial
Concentric rings emanating from center. Images placed in circles at increasing radii.

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
