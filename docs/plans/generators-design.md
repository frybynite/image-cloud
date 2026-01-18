# Generator Brainstorming & Design

## Selected for Implementation (This Round)
1. **Spiral** - Golden ratio spiral emanating outward
2. **Grid** - Clean rows and columns with optional stagger
3. **Cluster** - Organic clumps with natural spacing

## Future Consideration

### Visual Variety Generators
- **Honeycomb** - Hexagonal tessellation pattern
- **Mosaic** - Variable-sized tiles fitting together
- **Burst/Explosion** - Images radiating outward with velocity falloff
- **Wave** - Sinusoidal arrangement along curves
- **Scatter with Physics** - Random with collision avoidance
- **Flow/Stream** - Images follow a curved path

### Content Organization Generators (Think About Later)
- Timeline layouts
- Category/hierarchy-based arrangements
- Relationship/connection-based positioning

---

## Design: Spiral Generator

**Concept:** Images placed along a golden spiral (Fibonacci spiral), creating a naturally pleasing arrangement that draws the eye toward the center.

**Algorithm:**
- Start at center, place first image
- Each subsequent image moves outward along a logarithmic spiral
- Angle increment based on golden angle (~137.5°) for optimal distribution
- Radius grows with each placement: `r = a + b * θ` (Archimedean) or `r = a * e^(b*θ)` (logarithmic)
- Scale can optionally decrease as images move outward (center emphasis)

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

---

## Design: Grid Generator

**Concept:** Classic rows and columns - the most predictable and orderly layout. Highly configurable with options for staggering to soften the rigid feel.

**Algorithm:**
- Calculate optimal cell size based on image count and container dimensions
- Place images left-to-right, top-to-bottom (or configurable direction)
- Optional stagger: offset every other row/column by half a cell
- Optional jitter: small random offset within each cell for organic feel

**Overlap behavior:**
Grid supports overlap through two mechanisms:

1. **Scale-based overlap:** When `baseSize` exceeds the calculated cell size, images naturally overlap their neighbors. This is controlled by the existing `baseSize` config.

2. **Explicit overlap factor:** A multiplier on image size relative to cell size.
   - `overlap: 0` → images fit exactly in cells (no overlap)
   - `overlap: 0.5` → images are 50% larger than cells (moderate overlap)
   - `overlap: 1.0` → images are 2x cell size (heavy overlap, polaroid-stack feel)

**Configuration options:**
```typescript
interface GridConfig {
  columns: number | 'auto';     // Fixed columns or auto-calculate
  rows: number | 'auto';        // Fixed rows or auto-calculate
  stagger: 'none' | 'row' | 'column';  // Offset pattern
  jitter: number;               // 0-1, random position variance within cell
  overlap: number;              // 0-1+, how much images exceed cell bounds
  fillDirection: 'row' | 'column';     // Primary fill direction
  alignment: 'start' | 'center' | 'end';  // How to align incomplete rows
  gap: number;                  // Space between cells (before overlap applied)
}
```

**Visual characteristics:**
- Clean, organized, professional
- Great for galleries, portfolios, product displays
- Stagger mode gives a brick/masonry feel
- Jitter + overlap creates a "scattered on a table" look while maintaining structure
- Works well with any image count

---

## Design: Cluster Generator

**Concept:** Images form organic groupings - like stones on a beach, leaves fallen from a tree, or photos casually grouped on a table. Unlike random (which scatters everywhere) or grid (which is rigid), cluster creates natural-feeling clumps with breathing room between them.

**Algorithm:**
- Generate N cluster centers (random or based on config)
- For each image, assign to a cluster (round-robin or weighted by cluster size)
- Position images around their cluster center using gaussian/normal distribution
- Images within a cluster overlap naturally; clusters themselves have spacing
- Optional: vary cluster density (some tight, some loose)

**Overlap behavior:**
- **Within-cluster overlap:** Controlled by `overlap` factor which increases image size AND pulls images closer to cluster center
- `overlap: 0` → images sized to minimize overlap
- `overlap: 0.5` → moderate pile-up effect
- `overlap: 1.0` → heavy stacking, like a pile of photos
- **Between-cluster:** Clusters stay separated via `clusterSpacing`

**Configuration options:**
```typescript
interface ClusterConfig {
  clusterCount: number | 'auto';  // Number of groupings
  clusterSpread: number;          // How far images spread from cluster center
  clusterSpacing: number;         // Minimum distance between cluster centers
  density: 'uniform' | 'varied';  // All clusters same tightness, or varied
  overlap: number;                // 0-1, overlap within clusters
  distribution: 'gaussian' | 'uniform';  // How images spread within cluster
}
```

**Visual characteristics:**
- Organic, natural, casual feel
- Creates visual "islands" of content
- Good for 15-100+ images
- Pairs well with zoom/pan interactions (explore different clusters)
- Distinct from random: has intentional grouping rather than pure chaos

---

## Implementation Approach

**Files to create:**
- `src/generators/SpiralPlacementGenerator.ts`
- `src/generators/GridPlacementGenerator.ts`
- `src/generators/ClusterPlacementGenerator.ts`

**Files to modify:**
- `src/config/types.ts` - Add new algorithm types and config interfaces
- `src/engines/LayoutEngine.ts` - Register new generators in algorithm switch
- `src/index.ts` - Export new generators

**Implementation order:**
1. Grid (simplest algorithm, good baseline)
2. Spiral (mathematical but well-documented pattern)
3. Cluster (most complex, depends on random distribution)

**Verification:**
- Add each generator to the demo pages
- Test with varying image counts (5, 20, 50, 100)
- Verify overlap behavior at different settings
- Check boundary handling (images stay within container)
