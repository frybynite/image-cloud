# Image Configuration

This document explains the image sizing and rotation configuration in Image Cloud.

## Configuration Structure

Image configuration is organized under the `image` section:

```typescript
{
  image: {
    sizing: {
      baseHeight?: number | {        // Optional - if not set, layouts auto-calculate
        default: number,             // Base height for large screens
        tablet?: number,             // Height for tablet
        mobile?: number              // Height for mobile
      },
      variance?: {
        min: number,                 // > 0.1 and < 1 (e.g., 0.8)
        max: number                  // > 1 and < 2 (e.g., 1.2)
      },
      scaleDecay?: number            // For Radial/Spiral - progressive size reduction (0-1)
    },
    rotation: {
      mode: 'none' | 'random' | 'tangent',  // default: 'none'
      range?: {
        min: number,                 // Negative degrees (-180 to 0)
        max: number                  // Positive degrees (0 to 180)
      }
    }
  },
  layout: {
    algorithm: 'radial' | 'grid' | 'spiral' | 'cluster' | 'wave' | 'random',
    targetCoverage?: number,         // 0-1, for auto-sizing when baseHeight not set (default: 0.6)
    densityFactor?: number,          // Controls spacing density (default: 1.0)
    spacing: { padding, minGap },
    // ... algorithm-specific configs
  }
}
```

## Image Sizing

### Base Height

The `baseHeight` determines the starting height for images:

1. **If `baseHeight` is set** - Use this value directly (with responsive variants if provided)
2. **If `baseHeight` is not set** - Layout auto-calculates based on `targetCoverage`

```typescript
// Simple fixed height
image: {
  sizing: {
    baseHeight: 200  // All viewports use 200px
  }
}

// Responsive height
image: {
  sizing: {
    baseHeight: {
      default: 200,   // Desktop
      tablet: 150,    // Tablet (uses rendering.responsive.breakpoints.tablet)
      mobile: 100     // Mobile (uses rendering.responsive.breakpoints.mobile)
    }
  }
}
```

### Variance

Variance allows random size variation for a more organic look:

```typescript
image: {
  sizing: {
    variance: {
      min: 0.8,  // 80% of base height
      max: 1.2   // 120% of base height
    }
  }
}
```

**Validation Rules:**
- `min` must be > 0.1 and < 1.0 (values outside this range are ignored)
- `max` must be > 1.0 and < 2.0 (values outside this range are ignored)
- All layouts apply variance after determining the base height

### Scale Decay

Scale decay progressively reduces image size from center to edge (Radial and Spiral layouts only):

```typescript
image: {
  sizing: {
    scaleDecay: 0.5  // 0-1, higher = more reduction at edges
  }
}
```

- Center images stay at full size
- Edge images can be reduced by up to 50%
- Minimum floor: 5% of original calculated size

## Image Rotation

### Rotation Mode

```typescript
image: {
  rotation: {
    mode: 'none' | 'random' | 'tangent'
  }
}
```

| Mode | Description | Applicable Layouts |
|------|-------------|-------------------|
| `none` | No rotation (default) | All |
| `random` | Random rotation within range | All |
| `tangent` | Align to curve tangent | Wave, Spiral |

### Rotation Range

For `random` mode, specify the rotation range in degrees:

```typescript
image: {
  rotation: {
    mode: 'random',
    range: {
      min: -15,  // Counter-clockwise limit
      max: 15    // Clockwise limit
    }
  }
}
```

**Validation Rules:**
- `min` must be >= -180 and <= 0
- `max` must be >= 0 and <= 180
- Invalid values are ignored, defaults used instead

## How Each Layout Uses Image Config

### Radial

- Uses `baseHeight` if set, otherwise auto-calculates
- Applies `variance` to each image
- Applies `scaleDecay` (outer rings get smaller)
- Supports `random` rotation mode

### Grid

- Uses `baseHeight` if set, otherwise calculates cell-based size
- Applies `variance` for non-uniform grid look
- Rotation only applied when grid has `jitter` > 0
- Supports `random` rotation mode

### Spiral

- Uses `baseHeight` if set, otherwise auto-calculates
- Applies `variance` to each image
- Applies `scaleDecay` (outer spiral positions get smaller)
- Supports `random` and `tangent` rotation modes

### Cluster

- Uses `baseHeight` if set, otherwise auto-calculates
- Applies `variance` to each image within clusters
- Supports `random` rotation mode

### Wave

- Uses `baseHeight` if set, otherwise auto-calculates
- Applies `variance` to each image
- Supports `random` and `tangent` rotation modes

### Random

- Uses `baseHeight` if set, otherwise auto-calculates
- Applies `variance` to each image
- Supports `random` rotation mode

## Layout-Level Configuration

These parameters affect how layouts calculate sizes when `baseHeight` is not set:

| Parameter | Default | Description |
|-----------|---------|-------------|
| `layout.targetCoverage` | 0.6 | Target percentage of container to fill (0.0-1.0) |
| `layout.densityFactor` | 1.0 | Multiplier for calculated sizes |
| `layout.sizing.adaptive.enabled` | true | Enable adaptive sizing |
| `layout.sizing.adaptive.minSize` | 50 | Minimum image height floor |
| `layout.sizing.adaptive.maxSize` | 400 | Maximum image height ceiling |

## Sizing Flow

```
image.sizing.baseHeight (if set)
    OR
auto-calculate using layout.targetCoverage
         ↓
apply layout.densityFactor
         ↓
clamp to [adaptive.minSize, adaptive.maxSize]
         ↓
apply scaleDecay (Radial/Spiral only)
         ↓
apply variance
         ↓
minimum floor: 5% of calculated size
         ↓
final image height
```

## Migration from Previous API

The previous `layout.rotation` and `layout.sizing.variance` configs are still supported for backward compatibility but deprecated:

```typescript
// Old format (deprecated)
{
  layout: {
    rotation: { enabled: true, range: { min: -15, max: 15 } },
    sizing: { variance: { min: 0.8, max: 1.2 } }
  }
}

// New format (recommended)
{
  image: {
    rotation: { mode: 'random', range: { min: -15, max: 15 } },
    sizing: { variance: { min: 0.8, max: 1.2 } }
  }
}
```

## Examples

### Classic Scattered Photos

```typescript
{
  image: {
    rotation: { mode: 'random', range: { min: -15, max: 15 } },
    sizing: { variance: { min: 0.9, max: 1.1 } }
  },
  layout: { algorithm: 'radial' }
}
```

### Clean Grid

```typescript
{
  image: {
    rotation: { mode: 'none' }
  },
  layout: { algorithm: 'grid' }
}
```

### Spiral with Decay

```typescript
{
  image: {
    rotation: { mode: 'tangent' },
    sizing: { scaleDecay: 0.5 }
  },
  layout: { algorithm: 'spiral' }
}
```

### Fixed Responsive Heights

```typescript
{
  image: {
    sizing: {
      baseHeight: { default: 200, tablet: 150, mobile: 100 }
    }
  }
}
```
