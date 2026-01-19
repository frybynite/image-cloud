# Layout Generators

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

### Cluster
Organic clumps with natural spacing. Images grouped into clusters positioned around the container.

### Random
Scattered placement with collision avoidance.

---

## Future Ideas

### Visual Variety Generators
- **Honeycomb** - Hexagonal tessellation pattern
- **Mosaic** - Variable-sized tiles fitting together
- **Burst/Explosion** - Images radiating outward with velocity falloff
- **Wave** - Sinusoidal arrangement along curves
- **Scatter with Physics** - Random with collision avoidance and physics simulation
- **Flow/Stream** - Images follow a curved path

### Content Organization Generators
- **Timeline** - Chronological arrangement
- **Category/Hierarchy** - Group by metadata or categories
- **Relationship/Connection** - Position based on relationships between images
