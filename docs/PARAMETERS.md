# Configuration Parameters Reference

Complete reference for all configuration options in the Image Gallery library.

## Table of Contents

- [Layout Configuration](#layout-configuration)
  - [Layout Algorithms](#layout-algorithms)
  - [Grid Algorithm](#grid-algorithm)
  - [Spiral Algorithm](#spiral-algorithm)
  - [Cluster Algorithm](#cluster-algorithm)
  - [Radial Algorithm](#radial-algorithm)
  - [Random Algorithm](#random-algorithm)
- [Sizing Configuration](#sizing-configuration)
- [Complete Examples](#complete-examples)

---

## Layout Configuration

The `layout` section controls how images are positioned within the container.

```typescript
layout: {
  algorithm: 'radial' | 'random' | 'grid' | 'spiral' | 'cluster',
  sizing: LayoutSizingConfig,
  rotation: LayoutRotationConfig,
  spacing: LayoutSpacingConfig,
  // Algorithm-specific options
  grid?: GridAlgorithmConfig,
  spiral?: SpiralAlgorithmConfig,
  cluster?: ClusterAlgorithmConfig
}
```

### Base Layout Options

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `algorithm` | `string` | `'radial'` | Layout algorithm to use |
| `sizing.base` | `number` | `200` | Base image height in pixels |
| `rotation.enabled` | `boolean` | `true` | Enable random rotation |
| `rotation.range.min` | `number` | `-15` | Minimum rotation in degrees |
| `rotation.range.max` | `number` | `15` | Maximum rotation in degrees |
| `spacing.padding` | `number` | `50` | Padding from container edges |
| `spacing.minGap` | `number` | `20` | Minimum gap between images |

---

## Layout Algorithms

### Grid Algorithm

Clean rows and columns with optional stagger and jitter for organic feel.

```typescript
layout: {
  algorithm: 'grid',
  grid: {
    columns: 'auto',      // number | 'auto'
    rows: 'auto',         // number | 'auto'
    stagger: 'none',      // 'none' | 'row' | 'column'
    jitter: 0,            // 0-1, random position variance
    overlap: 0,           // 0-1+, image overlap factor
    fillDirection: 'row', // 'row' | 'column'
    alignment: 'center',  // 'start' | 'center' | 'end'
    gap: 10               // pixels between cells
  }
}
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `columns` | `number \| 'auto'` | `'auto'` | Fixed column count or auto-calculate |
| `rows` | `number \| 'auto'` | `'auto'` | Fixed row count or auto-calculate |
| `stagger` | `string` | `'none'` | Offset pattern: `'none'`, `'row'` (brick pattern), `'column'` |
| `jitter` | `number` | `0` | Random offset within cells (0 = none, 1 = max) |
| `overlap` | `number` | `0` | Image size multiplier (0 = fit cell, 0.5 = 50% larger, 1.0 = 2x) |
| `fillDirection` | `string` | `'row'` | Primary fill direction: `'row'` or `'column'` |
| `alignment` | `string` | `'center'` | Incomplete row alignment: `'start'`, `'center'`, `'end'` |
| `gap` | `number` | `10` | Space between cells in pixels |

**Visual characteristics:**
- Clean, organized, professional
- Great for galleries, portfolios, product displays
- `stagger: 'row'` gives a brick/masonry feel
- `jitter` + `overlap` creates a "scattered on table" look

---

### Spiral Algorithm

Images placed along a spiral path emanating from the center.

```typescript
layout: {
  algorithm: 'spiral',
  spiral: {
    spiralType: 'golden',        // 'golden' | 'archimedean' | 'logarithmic'
    direction: 'counterclockwise', // 'clockwise' | 'counterclockwise'
    tightness: 1.0,              // spacing between spiral arms
    scaleDecay: 0,               // 0-1, outer images smaller
    startAngle: 0                // initial rotation offset in radians
  }
}
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `spiralType` | `string` | `'golden'` | Spiral pattern type |
| `direction` | `string` | `'counterclockwise'` | Spiral rotation direction |
| `tightness` | `number` | `1.0` | How tightly wound (higher = tighter) |
| `scaleDecay` | `number` | `0` | Size reduction for outer images (0 = none, 1 = 50% smaller at edge) |
| `startAngle` | `number` | `0` | Starting angle offset in radians |

**Spiral Types:**
- `'golden'` - Fibonacci/sunflower pattern, optimal distribution
- `'archimedean'` - Constant spacing between arms (r = a + bθ)
- `'logarithmic'` - Self-similar, appears in nature (r = ae^bθ)

**Visual characteristics:**
- Eye naturally drawn to center
- Organic, nature-inspired feel (shells, sunflowers, galaxies)
- Works well with 10-50+ images
- Center images have highest z-index

---

### Cluster Algorithm

Organic groupings like photos scattered on a table.

```typescript
layout: {
  algorithm: 'cluster',
  cluster: {
    clusterCount: 'auto',     // number | 'auto'
    clusterSpread: 150,       // pixels, how far images spread from center
    clusterSpacing: 200,      // pixels, minimum distance between clusters
    density: 'uniform',       // 'uniform' | 'varied'
    overlap: 0.3,             // 0-1, overlap within clusters
    distribution: 'gaussian'  // 'gaussian' | 'uniform'
  }
}
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `clusterCount` | `number \| 'auto'` | `'auto'` | Number of groupings (auto aims for ~8 images per cluster) |
| `clusterSpread` | `number` | `150` | How far images spread from cluster center |
| `clusterSpacing` | `number` | `200` | Minimum distance between cluster centers |
| `density` | `string` | `'uniform'` | `'uniform'` = same tightness, `'varied'` = random spread per cluster |
| `overlap` | `number` | `0.3` | Overlap within clusters (0 = minimal, 1 = heavy stacking) |
| `distribution` | `string` | `'gaussian'` | Image spread pattern within cluster |

**Distribution Types:**
- `'gaussian'` - Most images near center, fewer at edges (natural pile)
- `'uniform'` - Even spread within cluster radius

**Visual characteristics:**
- Organic, natural, casual feel
- Creates visual "islands" of content
- Good for 15-100+ images
- Images closer to cluster center have higher z-index

---

### Radial Algorithm

Concentric rings emanating from center (built-in).

```typescript
layout: {
  algorithm: 'radial',
  debugRadials: false  // Show colored borders per ring
}
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `debugRadials` | `boolean` | `false` | Color-code images by ring for debugging |

**Visual characteristics:**
- Center image prominently featured
- Elliptical rings (wider than tall)
- Automatic ring calculation based on image count
- Great for hero/featured content

---

### Random Algorithm

Randomly scattered images with no structure (built-in).

```typescript
layout: {
  algorithm: 'random'
}
```

No algorithm-specific options. Uses base `sizing` and `rotation` config.

**Visual characteristics:**
- Chaotic, energetic feel
- Images randomly positioned within padding bounds
- Size variance applied per image
- Good for creative/artistic displays

---

## Sizing Configuration

Controls image sizing behavior.

```typescript
layout: {
  sizing: {
    base: 200,           // Base height in pixels
    variance: {
      min: 1.0,          // Minimum scale multiplier
      max: 1.0           // Maximum scale multiplier
    },
    responsive: [
      { minWidth: 1200, height: 225 },
      { minWidth: 768, height: 180 },
      { minWidth: 0, height: 100 }
    ],
    adaptive: {
      enabled: true,
      minSize: 50,
      maxSize: 400,
      targetCoverage: 0.6,
      densityFactor: 1.0,
      overflowBehavior: 'minimize'
    }
  }
}
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `base` | `number` | `200` | Base image height in pixels |
| `variance.min` | `number` | `1.0` | Minimum size multiplier |
| `variance.max` | `number` | `1.0` | Maximum size multiplier |
| `responsive` | `array` | See above | Breakpoint-based height overrides |
| `adaptive.enabled` | `boolean` | `true` | Enable auto-sizing |
| `adaptive.minSize` | `number` | `50` | Minimum image height |
| `adaptive.maxSize` | `number` | `400` | Maximum image height |
| `adaptive.targetCoverage` | `number` | `0.6` | Target % of container to fill |
| `adaptive.overflowBehavior` | `string` | `'minimize'` | `'minimize'` or `'truncate'` |

---

## Complete Examples

### Grid Gallery with Stagger

```typescript
const gallery = new ImageGallery({
  container: 'my-gallery',
  loader: {
    type: 'static',
    static: {
      sources: [{ type: 'urls', urls: [...] }]
    }
  },
  layout: {
    algorithm: 'grid',
    sizing: { base: 120 },
    grid: {
      columns: 4,
      stagger: 'row',
      jitter: 0.2,
      overlap: 0.1,
      gap: 15
    }
  }
});
```

### Golden Spiral with Scale Decay

```typescript
const gallery = new ImageGallery({
  container: 'my-gallery',
  loader: { ... },
  layout: {
    algorithm: 'spiral',
    sizing: { base: 100 },
    spiral: {
      spiralType: 'golden',
      direction: 'counterclockwise',
      tightness: 1.0,
      scaleDecay: 0.4  // Outer images 20% smaller
    }
  }
});
```

### Clustered Photo Pile

```typescript
const gallery = new ImageGallery({
  container: 'my-gallery',
  loader: { ... },
  layout: {
    algorithm: 'cluster',
    sizing: { base: 90 },
    rotation: {
      enabled: true,
      range: { min: -20, max: 20 }  // More rotation for organic feel
    },
    cluster: {
      clusterCount: 3,
      clusterSpread: 100,
      clusterSpacing: 250,
      overlap: 0.5,
      distribution: 'gaussian'
    }
  }
});
```

### Minimal Grid (No Overlap)

```typescript
const gallery = new ImageGallery({
  container: 'my-gallery',
  loader: { ... },
  layout: {
    algorithm: 'grid',
    rotation: { enabled: false },
    grid: {
      columns: 'auto',
      rows: 'auto',
      stagger: 'none',
      jitter: 0,
      overlap: 0,
      gap: 20
    }
  }
});
```

### Archimedean Spiral

```typescript
const gallery = new ImageGallery({
  container: 'my-gallery',
  loader: { ... },
  layout: {
    algorithm: 'spiral',
    sizing: { base: 80 },
    spiral: {
      spiralType: 'archimedean',
      direction: 'clockwise',
      tightness: 0.8  // Looser spiral
    }
  }
});
```
