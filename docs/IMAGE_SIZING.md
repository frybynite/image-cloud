# Image Sizing

This document explains the image sizing configuration in Image Cloud.

## Quick Summary: Sizing Modes

| Mode | Description | Use When |
|------|-------------|----------|
| **Adaptive** (default) | Auto-calculates image height based on container size and image count | You want the library to optimize sizing automatically |
| **Fixed** | Single explicit height for all viewport sizes | You want consistent image sizes regardless of screen size |
| **Responsive** | Different heights for mobile, tablet, and desktop | You want explicit control over sizes at each breakpoint |

## Configuration Structure

```typescript
{
  image: {
    sizing: {
      mode: 'adaptive' | 'fixed' | 'responsive',

      // For fixed mode:
      height: 200,  // Single number in pixels

      // For responsive mode:
      height: {
        mobile: 100,   // Viewport width <= 767px
        tablet: 150,   // Viewport width 768-1199px
        screen: 200    // Viewport width >= 1200px
      },

      // For adaptive mode:
      minSize: 50,     // Minimum height floor (default: 50)
      maxSize: 400,    // Maximum height ceiling (default: 400)

      // For all modes:
      variance: {
        min: 0.8,      // 80% of base height (range: 0.25-1.0)
        max: 1.2       // 120% of base height (range: 1.0-1.75)
      }
    }
  },
  layout: {
    scaleDecay: 0.5    // Progressive size reduction for radial/spiral (0-1)
  }
}
```

## Sizing Modes in Detail

### Adaptive Mode (Default)

Adaptive mode automatically calculates optimal image sizes based on:
- Container dimensions
- Number of images
- Target coverage percentage
- Density factor

```typescript
{
  image: {
    sizing: {
      mode: 'adaptive',
      minSize: 50,    // Won't go smaller than 50px
      maxSize: 400    // Won't go larger than 400px
    }
  },
  layout: {
    targetCoverage: 0.6,   // Aim to fill 60% of container area
    densityFactor: 1.0     // Multiplier for calculated sizes
  }
}
```

**How it works:**
1. Calculates target area based on `targetCoverage` (default: 60% of container)
2. Divides by image count to get area per image
3. Derives height assuming 1.4 aspect ratio (landscape images)
4. Applies `densityFactor` multiplier
5. Clamps result to `[minSize, maxSize]` range

### Fixed Mode

Fixed mode uses a single explicit height for all images, regardless of viewport size.

```typescript
{
  image: {
    sizing: {
      mode: 'fixed',
      height: 200    // All images are 200px tall
    }
  }
}
```

**When to use:** When you want consistent image sizes across all devices.

### Responsive Mode

Responsive mode lets you specify different heights for each viewport breakpoint.

```typescript
{
  image: {
    sizing: {
      mode: 'responsive',
      height: {
        mobile: 100,   // Small screens (width <= 767px)
        tablet: 150,   // Medium screens (width 768-1199px)
        screen: 200    // Large screens (width >= 1200px)
      }
    }
  }
}
```

**Breakpoint thresholds** (configurable via `layout.responsive`):
- **Mobile**: viewport width <= 767px
- **Tablet**: viewport width 768-1199px
- **Screen**: viewport width >= 1200px

**Fallback chain:** If a breakpoint value is not specified:
- Mobile falls back to: tablet → screen
- Tablet falls back to: screen → mobile
- Screen falls back to: tablet → mobile

## Variance

Variance adds random size variation to each image for a more organic look. It applies to all sizing modes.

```typescript
{
  image: {
    sizing: {
      variance: {
        min: 0.8,   // Images can be 80% of base height
        max: 1.2    // Images can be 120% of base height
      }
    }
  }
}
```

**Validation rules:**
- `min`: must be between 0.25 and 1.0
- `max`: must be between 1.0 and 1.75
- Default is `{ min: 1.0, max: 1.0 }` (no variance)

**Formula:** `finalHeight = baseHeight × random(variance.min, variance.max)`

## Scale Decay

Scale decay progressively reduces image size from center to edge. This is a **layout-level** setting that only applies to Radial and Spiral algorithms.

```typescript
{
  layout: {
    algorithm: 'radial',  // or 'spiral'
    scaleDecay: 0.5       // 0-1, higher = more reduction at edges
  }
}
```

**How it works:**
- Center images remain at full size
- Outer images are progressively reduced
- Maximum reduction is 50% at the outermost positions
- Formula: `ringScale = 1 - (normalizedPosition × scaleDecay × 0.5)`

## Sizing Flow

```
┌─────────────────────────────────────┐
│         Determine Base Height       │
├─────────────────────────────────────┤
│ Adaptive: auto-calculate from       │
│           container & image count   │
│ Fixed:    use height value          │
│ Responsive: use breakpoint height   │
└──────────────────┬──────────────────┘
                   ↓
┌─────────────────────────────────────┐
│  Apply Scale Decay (Radial/Spiral)  │
│  ringScale = 1 - (pos × decay × 0.5)│
└──────────────────┬──────────────────┘
                   ↓
┌─────────────────────────────────────┐
│         Apply Variance              │
│  height × random(min, max)          │
└──────────────────┬──────────────────┘
                   ↓
┌─────────────────────────────────────┐
│         Final Image Height          │
└─────────────────────────────────────┘
```

## Examples

### Auto-Sizing with Variance (Scattered Photos)

```typescript
{
  image: {
    sizing: {
      mode: 'adaptive',
      variance: { min: 0.9, max: 1.1 }
    }
  },
  layout: { algorithm: 'radial' }
}
```

### Fixed Height Grid

```typescript
{
  image: {
    sizing: {
      mode: 'fixed',
      height: 180
    }
  },
  layout: { algorithm: 'grid' }
}
```

### Responsive Heights

```typescript
{
  image: {
    sizing: {
      mode: 'responsive',
      height: {
        mobile: 100,
        tablet: 150,
        screen: 200
      }
    }
  }
}
```

### Spiral with Center Emphasis

```typescript
{
  image: {
    sizing: {
      mode: 'adaptive',
      variance: { min: 0.85, max: 1.0 }
    }
  },
  layout: {
    algorithm: 'spiral',
    scaleDecay: 0.6    // Outer images 30% smaller
  }
}
```

### Dense Small Images

```typescript
{
  image: {
    sizing: {
      mode: 'adaptive',
      minSize: 30,
      maxSize: 100
    }
  },
  layout: {
    targetCoverage: 0.8,
    densityFactor: 0.8
  }
}
```

## Customizing Breakpoints

The default breakpoints can be customized:

```typescript
{
  layout: {
    responsive: {
      mobile: { maxWidth: 600 },   // Custom mobile breakpoint
      tablet: { maxWidth: 1024 }   // Custom tablet breakpoint
    }
  }
}
```

## Image Rotation

For complete documentation on image rotation (modes: none, random, tangent), see the rotation section of the main documentation.

Quick reference:
```typescript
{
  image: {
    rotation: {
      mode: 'none' | 'random' | 'tangent',
      range: { min: -15, max: 15 }  // For 'random' mode
    }
  }
}
```
