# Layouts

Placement layouts calculate image positions within the gallery container. Each implements a different layout algorithm.

## Import

```typescript
import {
  RadialPlacementLayout,
  GridPlacementLayout,
  SpiralPlacementLayout,
  ClusterPlacementLayout,
  RandomPlacementLayout,
  WavePlacementLayout
} from '@frybynite/image-cloud';
```

## PlacementLayout Interface

All layouts implement this interface:

```typescript
interface PlacementLayout {
  generate(
    imageCount: number,
    containerBounds: ContainerBounds,
    options?: Partial<LayoutConfig>
  ): ImageLayout[];
}

interface ContainerBounds {
  width: number;
  height: number;
}

interface ImageLayout {
  id: number;
  x: number;        // Center X position
  y: number;        // Center Y position
  rotation: number; // Degrees
  scale: number;    // Size multiplier
  baseSize: number;
}
```

---

## Using Layouts

### Via Configuration (Recommended)

```typescript
const cloud = new ImageCloud({
  layout: {
    algorithm: 'radial',  // 'radial' | 'grid' | 'spiral' | 'cluster' | 'random' | 'wave'
    // Algorithm-specific options...
  }
});
```

### Direct Usage

```typescript
import { RadialPlacementLayout } from '@frybynite/image-cloud';

const layout = new RadialPlacementLayout();
const layouts = layout.generate(
  10,                          // image count
  { width: 1200, height: 800 }, // container bounds
  { /* layout options */ }
);
```

---

## Available Algorithms

### Radial

Arranges images in concentric rings from the center.

```typescript
layout: {
  algorithm: 'radial'
}
```

**Best for**: Focal point galleries, organized circular arrangements

**Behavior**:
- Images radiate outward from center
- Optional `scaleDecay` makes outer images smaller
- Uses `targetCoverage` to determine ring count

### Grid

Arranges images in rows and columns with optional variations.

```typescript
layout: {
  algorithm: 'grid',
  grid: {
    columns: 'auto',           // Number or 'auto'
    rows: 'auto',              // Number or 'auto'
    stagger: 0,                // Offset alternate rows (pixels)
    jitter: { x: 0, y: 0 },    // Random position offset
    overlap: 0,                // Allow overlap (0-1)
    fillDirection: 'row',      // 'row' | 'column'
    alignment: 'center',       // 'start' | 'center' | 'end'
    gap: { x: 20, y: 20 }      // Spacing between cells
  }
}
```

**Best for**: Structured layouts, photo grids

**Options**:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `columns` | `number \| 'auto'` | `'auto'` | Number of columns |
| `rows` | `number \| 'auto'` | `'auto'` | Number of rows |
| `stagger` | `number` | `0` | Offset alternate rows |
| `jitter` | `{ x, y }` | `{ x: 0, y: 0 }` | Random position variation |
| `overlap` | `number` | `0` | Allow image overlap (0-1) |
| `fillDirection` | `'row' \| 'column'` | `'row'` | Fill order |
| `alignment` | `'start' \| 'center' \| 'end'` | `'center'` | Alignment in container |
| `gap` | `{ x, y }` | `{ x: 20, y: 20 }` | Cell spacing |

### Spiral

Arranges images along spiral paths.

```typescript
layout: {
  algorithm: 'spiral',
  spiral: {
    spiralType: 'golden',      // 'golden' | 'archimedean' | 'logarithmic'
    direction: 'clockwise',    // 'clockwise' | 'counterclockwise'
    tightness: 1.0,            // Spiral tightness (0.5-2.0)
    scaleDecay: 0,             // Shrink outer images (0-1)
    startAngle: 0              // Starting angle in degrees
  }
}
```

**Best for**: Dynamic, flowing layouts

**Options**:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `spiralType` | `string` | `'golden'` | Spiral mathematical formula |
| `direction` | `string` | `'clockwise'` | Rotation direction |
| `tightness` | `number` | `1.0` | How tightly wound (0.5-2.0) |
| `scaleDecay` | `number` | `0` | Scale reduction for outer images |
| `startAngle` | `number` | `0` | Starting angle in degrees |

**Spiral Types**:
- `golden` - Golden ratio spiral (natural, organic)
- `archimedean` - Even spacing spiral
- `logarithmic` - Exponentially growing spiral

### Cluster

Groups images into clusters.

```typescript
layout: {
  algorithm: 'cluster',
  cluster: {
    clusterCount: 'auto',      // Number or 'auto'
    clusterSpread: 0.8,        // Cluster radius (0-1)
    density: 'medium',         // 'loose' | 'medium' | 'tight'
    overlap: 0.1,              // Allow overlap (0-1)
    distribution: 'random'     // 'random' | 'grid' | 'radial'
  }
}
```

**Best for**: Grouped content, category-based layouts

**Options**:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `clusterCount` | `number \| 'auto'` | `'auto'` | Number of clusters |
| `clusterSpread` | `number` | `0.8` | Cluster radius relative to container |
| `density` | `string` | `'medium'` | How tightly packed |
| `overlap` | `number` | `0.1` | Allow image overlap |
| `distribution` | `string` | `'random'` | How clusters are positioned |

### Wave

Arranges images in sinusoidal wave patterns.

```typescript
layout: {
  algorithm: 'wave',
  wave: {
    rows: 'auto',              // Number of wave rows
    amplitude: 50,             // Wave height in pixels
    frequency: 1,              // Wave cycles across width
    phaseShift: 0,             // Starting phase offset
    synchronization: 'in-phase' // 'in-phase' | 'anti-phase' | 'progressive'
  }
}
```

**Best for**: Rhythmic, undulating layouts

**Options**:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `rows` | `number \| 'auto'` | `'auto'` | Number of wave rows |
| `amplitude` | `number` | `50` | Wave peak height |
| `frequency` | `number` | `1` | Waves per container width |
| `phaseShift` | `number` | `0` | Phase offset in radians |
| `synchronization` | `string` | `'in-phase'` | Row wave relationship |

### Random

Places images at random positions.

```typescript
layout: {
  algorithm: 'random'
}
```

**Best for**: Casual, scattered aesthetics

**Behavior**:
- Random positions within container bounds
- Respects padding and minimum gap settings
- Uses `targetCoverage` to control density

---

## Common Layout Options

These options apply to all algorithms:

```typescript
layout: {
  algorithm: 'radial',

  // Sizing
  sizing: {
    base: 200,                    // Fallback base height
    responsive: [
      { minWidth: 1200, height: 225 },
      { minWidth: 768, height: 180 },
      { minWidth: 0, height: 100 }
    ],
    adaptive: {
      enabled: true,
      minSize: 50,
      maxSize: 400
    }
  },

  // Spacing
  spacing: {
    padding: 50,     // Container edge padding
    minGap: 20       // Minimum gap between images
  },

  // Coverage
  targetCoverage: 0.6,  // Target 60% container coverage
  densityFactor: 1.0    // Multiplier for image count
}
```

---

## Creating Custom Layouts

Implement the `PlacementLayout` interface:

```typescript
import type {
  PlacementLayout,
  ImageLayout,
  ContainerBounds,
  LayoutConfig
} from '@frybynite/image-cloud';

class DiagonalLayout implements PlacementLayout {
  generate(
    imageCount: number,
    bounds: ContainerBounds,
    options?: Partial<LayoutConfig>
  ): ImageLayout[] {
    const layouts: ImageLayout[] = [];
    const baseSize = options?.sizing?.base || 200;

    for (let i = 0; i < imageCount; i++) {
      const progress = i / (imageCount - 1 || 1);

      layouts.push({
        id: i,
        x: bounds.width * progress,
        y: bounds.height * progress,
        rotation: 0,
        scale: 1,
        baseSize
      });
    }

    return layouts;
  }
}
```

Currently, custom layouts must be used via the `CompositeLoader` pattern or by extending the library internals. Native support for registering custom layouts is planned.
