# Image Sizing

This document explains how image sizes are determined across different layout algorithms.

## Overview

Image sizing flows through several stages before reaching the layout generators:

```
responsive breakpoint height (ceiling)
         ↓
adaptive.targetCoverage → calculate area per image → base height
         ↓
adaptive.densityFactor → multiply height
         ↓
clamp to [adaptive.minSize, adaptive.maxSize]
         ↓
if overflow: minimize (shrink) or truncate (fewer images)
         ↓
final height → layout generators
```

## Configuration Parameters

### Image Size Constraints

These parameters control how big individual images render:

| Parameter | Default | Description |
|-----------|---------|-------------|
| `layout.sizing.base` | 200 | Base image height in pixels (fallback) |
| `layout.sizing.variance.min` | 1.0 | Minimum scale multiplier (Random layout only) |
| `layout.sizing.variance.max` | 1.0 | Maximum scale multiplier (Random layout only) |
| `layout.sizing.responsive` | [] | Height ceiling per viewport breakpoint |
| `layout.sizing.adaptive.minSize` | 50 | Floor constraint on height |
| `layout.sizing.adaptive.maxSize` | 400 | Ceiling constraint on height |
| `layout.sizing.adaptive.densityFactor` | 1.0 | Fine-tuning multiplier on calculated height |

### Layout Density

These parameters control how images fill the available space:

| Parameter | Default | Description |
|-----------|---------|-------------|
| `layout.sizing.adaptive.enabled` | true | Enable adaptive sizing algorithm |
| `layout.sizing.adaptive.targetCoverage` | 0.6 | Target percentage of container to fill (0.0-1.0) |
| `layout.sizing.adaptive.overflowBehavior` | 'minimize' | How to handle overflow: 'minimize' (shrink below minSize) or 'truncate' (show fewer images) |

## How Each Layout Calculates Size

### Radial

Uses the base size directly. All images are the same size. The base size is used to calculate ring spacing, but doesn't vary per image.

- **Uses base directly:** Yes
- **Calculates own size:** No
- **Varies per image:** No

### Grid

Calculates its own size based on the container. It divides the available space into cells (based on columns, rows, and gaps), then uses the cell size as the image size. If an adaptive/fixed height is provided, it caps images to the smaller of the two values. All images are uniform within the grid.

- **Uses base directly:** No
- **Calculates own size:** Yes (cell-based)
- **Varies per image:** No

### Spiral

Starts with the base size, then shrinks images as they move outward from center. The `scaleDecay` parameter controls how much smaller outer images become (up to 50% reduction). Images near the center are larger; images at the edge are smaller.

- **Uses base directly:** Yes
- **Calculates own size:** No
- **Varies per image:** Yes (via `scaleDecay`)

### Cluster

Uses the base size, then applies an overlap multiplier uniformly to all images. Higher overlap settings make images slightly larger (while also positioning them closer together). All images are the same size.

- **Uses base directly:** Yes
- **Calculates own size:** No
- **Varies per image:** No (uniform overlap multiplier)

### Wave

Uses the base size directly. All images are the same size. Wave parameters only affect positioning along the sine curve, not image dimensions.

- **Uses base directly:** Yes
- **Calculates own size:** No
- **Varies per image:** No

### Random

Uses the base size as an anchor, then randomly scales each image between `variance.min` and `variance.max`. Each image can be a different size within that range.

- **Uses base directly:** Yes
- **Calculates own size:** No
- **Varies per image:** Yes (via `variance`)

## Summary Table

| Layout | Uses Base Directly | Calculates Own Size | Varies Per Image |
|--------|-------------------|---------------------|------------------|
| Radial | Yes | No | No |
| Grid | No | Yes (cell-based) | No |
| Spiral | Yes | No | Yes (scaleDecay) |
| Cluster | Yes | No | No |
| Wave | Yes | No | No |
| Random | Yes | No | Yes (variance) |

Grid is the only layout that calculates size from container/layout geometry. The others use the provided base/fixed height, with Spiral and Random applying per-image scale variations.
