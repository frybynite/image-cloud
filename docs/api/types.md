# Types & Interfaces

Core TypeScript types for configuring Image Cloud.

## Import

```typescript
import type {
  ImageCloudOptions,
  ImageLayout,
  LayoutConfig,
  AnimationConfig,
  // ... other types
} from '@frybynite/image-cloud';
```

## Configuration Types

### ImageCloudOptions

Root configuration object passed to the ImageCloud constructor.

```typescript
interface ImageCloudOptions {
  container?: string | HTMLElement;
  loader?: Partial<LoaderConfig>;
  image?: Partial<ImageConfig>;
  layout?: Partial<LayoutConfig>;
  animation?: Partial<AnimationConfig>;
  interaction?: Partial<InteractionConfig>;
  rendering?: Partial<RenderingConfig>;
  styling?: Partial<ImageStylingConfig>;
  debug?: boolean;
}
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `container` | `string \| HTMLElement` | `'imageCloud'` | Target element ID or DOM reference |
| `loader` | `LoaderConfig` | - | Image source configuration |
| `image` | `ImageConfig` | - | Per-image sizing and rotation |
| `layout` | `LayoutConfig` | - | Layout algorithm and spacing |
| `animation` | `AnimationConfig` | - | Entry and transition animations |
| `interaction` | `InteractionConfig` | - | Focus/zoom behavior |
| `rendering` | `RenderingConfig` | - | Responsive breakpoints |
| `styling` | `ImageStylingConfig` | - | Visual styling (borders, shadows) |
| `debug` | `boolean` | `false` | Enable console logging |

---

## Core Data Types

### ImageLayout

Position and transform data for a single image.

```typescript
interface ImageLayout {
  id: number;
  x: number;           // X position (center point)
  y: number;           // Y position (center point)
  rotation: number;    // Degrees (-180 to 180)
  scale: number;       // Size multiplier (typically 0.5-1.5)
  baseSize: number;    // Base height in pixels
  zIndex?: number;
  borderColor?: string;
}
```

### ContainerBounds

Dimensions of the gallery container.

```typescript
interface ContainerBounds {
  width: number;   // Container width in pixels
  height: number;  // Container height in pixels
}
```

---

## Loader Configuration

### LoaderConfig

```typescript
interface LoaderConfig {
  type: 'static' | 'googleDrive' | 'composite';
  static?: StaticLoaderConfig;
  googleDrive?: GoogleDriveLoaderConfig;
  composite?: CompositeLoaderConfig;
}
```

See [Loaders](./loaders.md) for detailed loader configuration.

---

## Image Configuration

### ImageConfig

```typescript
interface ImageConfig {
  sizing?: ImageSizingConfig;
  rotation?: ImageRotationConfig;
}
```

### ImageSizingConfig

```typescript
type SizingMode = 'fixed' | 'responsive' | 'adaptive';

interface ImageSizingConfig {
  mode: SizingMode;                    // Required: sizing mode
  height?: number | FixedModeHeight;   // Fixed/responsive mode: explicit heights
  minSize?: number;                    // Adaptive mode only (default: 50)
  maxSize?: number;                    // Adaptive mode only (default: 400)
  variance?: ImageVarianceConfig;      // Size variance (all modes)
}

interface FixedModeHeight {
  mobile?: number;   // Height for mobile (< 768px)
  tablet?: number;   // Height for tablet (768-1199px)
  screen?: number;   // Height for desktop (>= 1200px)
}

interface ImageVarianceConfig {
  min: number;  // 0.25-1.0 (smaller images)
  max: number;  // 1.0-1.75 (larger images)
}
```

**Sizing Modes:**
- `'adaptive'` - Auto-calculates based on container/image count (default)
- `'fixed'` - Single explicit height (`height: number`)
- `'responsive'` - Per-breakpoint heights (`height: { mobile, tablet, screen }`)

### ImageRotationConfig

```typescript
interface ImageRotationConfig {
  mode: 'none' | 'random' | 'tangent';
  range?: ImageRotationRange;
}

interface ImageRotationRange {
  min: number;  // -180 to 0
  max: number;  // 0 to 180
}
```

---

## Layout Configuration

### LayoutConfig

```typescript
interface LayoutConfig {
  algorithm: 'random' | 'radial' | 'grid' | 'spiral' | 'cluster' | 'wave';
  spacing: { padding: number; minGap: number };
  targetCoverage?: number;    // 0-1 (default: 0.6)
  densityFactor?: number;     // Multiplier (default: 1.0)
  scaleDecay?: number;        // 0-1, outer image size reduction (radial/spiral)
  responsive?: ResponsiveBreakpoints;

  // Algorithm-specific options
  grid?: GridAlgorithmConfig;
  spiral?: SpiralAlgorithmConfig;
  cluster?: ClusterAlgorithmConfig;
  wave?: WaveAlgorithmConfig;
}
```

### ResponsiveBreakpoints

```typescript
interface ResponsiveBreakpoints {
  mobile: { maxWidth: number };   // Default: 767
  tablet: { maxWidth: number };   // Default: 1199
}
```

> **Note:** Image sizing is configured via `image.sizing`, not `layout.sizing`.
> See [ImageSizingConfig](#imagesizingconfig) above.

### Algorithm Configs

See [Layouts](./layouts.md) for algorithm-specific configuration.

---

## Animation Configuration

### AnimationConfig

```typescript
interface AnimationConfig {
  duration: number;           // Milliseconds (default: 600)
  easing: AnimationEasingConfig;
  queue: AnimationQueueConfig;
  entry?: EntryAnimationConfig;
}

interface AnimationEasingConfig {
  default: string;   // CSS easing function
  focus?: string;
  unfocus?: string;
}

interface AnimationQueueConfig {
  interval: number;  // Stagger delay in ms (default: 150)
}
```

### EntryAnimationConfig

```typescript
interface EntryAnimationConfig {
  start: EntryStartConfig;
  timing: EntryTimingConfig;
  easing: string;
  path?: EntryPathConfig;
  rotation?: EntryRotationConfig;
  scale?: EntryScaleConfig;
}
```

### EntryStartConfig

```typescript
interface EntryStartConfig {
  position: 'nearest-edge' | 'top' | 'bottom' | 'left' | 'right' |
            'center' | 'random-edge' | 'circular';
  offset?: number;  // Distance from edge in pixels
}
```

### EntryPathConfig

```typescript
type EntryPathConfig =
  | { type: 'linear' }
  | { type: 'arc'; arcHeight?: number }
  | { type: 'bounce'; preset?: BouncePreset; config?: BouncePathConfig }
  | { type: 'elastic'; preset?: ElasticPreset; config?: ElasticPathConfig }
  | { type: 'wave'; preset?: WavePathPreset; config?: WavePathConfig };
```

**Bounce Presets**: `'energetic'`, `'playful'`, `'subtle'`

**Elastic Presets**: `'gentle'`, `'bouncy'`, `'wobbly'`, `'snappy'`

**Wave Presets**: `'gentle'`, `'playful'`, `'serpentine'`, `'flutter'`

### EntryRotationConfig

```typescript
interface EntryRotationConfig {
  mode: 'none' | 'settle' | 'spin' | 'wobble' | 'random';
  startRotation?: number;
  spinRevolutions?: number;
  wobbleIntensity?: number;
}
```

### EntryScaleConfig

```typescript
interface EntryScaleConfig {
  mode: 'none' | 'grow' | 'shrink' | 'pop' | 'random';
  startScale?: number;
}
```

---

## Interaction Configuration

### InteractionConfig

```typescript
interface InteractionConfig {
  focus: FocusInteractionConfig;
  navigation?: NavigationInteractionConfig;  // Future
  gestures?: GestureInteractionConfig;       // Future
}

interface FocusInteractionConfig {
  scalePercent: number;       // 0-1 (default: 0.8 = 80% of container)
  zIndex: number;             // Stacking order (default: 1000)
  animationDuration?: number; // Override animation duration
}
```

---

## Styling Configuration

### ImageStylingConfig

```typescript
interface ImageStylingConfig {
  default?: ImageStyleState;
  hover?: Partial<ImageStyleState>;    // Inherits from default
  focused?: Partial<ImageStyleState>;  // Inherits from default
}
```

### ImageStyleState

```typescript
interface ImageStyleState {
  className?: string | string[];
  border?: BorderConfig;
  shadow?: ShadowPreset | string;
  filter?: FilterConfig;
  opacity?: number;
  cursor?: string;
  outline?: OutlineConfig;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  aspectRatio?: string;
  clipPath?: ClipPathShape | string | ClipPathConfig;
}
```

### ClipPathConfig

```typescript
interface ClipPathConfig {
  shape: ClipPathShape;
  mode?: 'percent' | 'height-relative';  // default: 'height-relative'
}

type ClipPathShape = 'circle' | 'square' | 'triangle' | 'pentagon' | 'hexagon' | 'octagon' | 'diamond' | 'none';
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `shape` | `ClipPathShape` | - | Predefined geometric shape for cropping |
| `mode` | `'percent' \| 'height-relative'` | `'height-relative'` | Scaling mode: "percent" uses responsive percentage-based coords, "height-relative" scales based on image height for aspect-ratio-aware sizing |

**Clip-Path Shapes:**
- `'circle'` - Circular crop
- `'square'` - Square crop
- `'triangle'` - Triangle crop
- `'pentagon'` - Pentagon crop
- `'hexagon'` - Hexagon crop (honeycomb layouts)
- `'octagon'` - Octagon crop
- `'diamond'` - Diamond/rotated-square crop
- `'none'` - Remove clip-path

**Modes:**
- **Percent**: Uses percentage-based coordinates that scale responsively with image dimensions. Works well for varied aspect ratios.
- **Height-Relative**: Scales shape based on image height for consistent visual sizing across different aspect ratios. Ideal for portrait images.

### BorderConfig

```typescript
interface BorderConfig {
  width?: number;
  color?: string;
  radius?: number;
  style?: 'solid' | 'dashed' | 'dotted' | 'double' | 'none';
}
```

### Shadow Presets

```typescript
type ShadowPreset = 'none' | 'sm' | 'md' | 'lg' | 'glow';
```

Or provide a custom CSS box-shadow string.

### FilterConfig

```typescript
interface FilterConfig {
  grayscale?: number;    // 0-1
  blur?: number;         // Pixels
  brightness?: number;   // 0-2 (1 = normal)
  contrast?: number;     // 0-2 (1 = normal)
  saturate?: number;     // 0-2 (1 = normal)
  opacity?: number;      // 0-1
  sepia?: number;        // 0-1
  hueRotate?: number;    // Degrees
  invert?: number;       // 0-1
  dropShadow?: string;   // CSS drop-shadow value
}
```

---

## Rendering Configuration

### RenderingConfig

```typescript
interface RenderingConfig {
  responsive: ResponsiveRenderingConfig;
  ui: UIRenderingConfig;
}

interface ResponsiveRenderingConfig {
  breakpoints: {
    mobile: number;    // Default: 768px
    tablet?: number;
    desktop?: number;
  };
  mobileDetection?: () => boolean;
}

interface UIRenderingConfig {
  showLoadingSpinner: boolean;  // Default: false
}
```

---

## Enums

### ZoomState

Internal state machine for focus transitions.

```typescript
enum ZoomState {
  IDLE = 'idle',
  FOCUSING = 'focusing',
  FOCUSED = 'focused',
  UNFOCUSING = 'unfocusing',
  CROSS_ANIMATING = 'cross_animating'
}
```

---

## Backwards Compatibility

These aliases are provided for backwards compatibility:

```typescript
type ImageGalleryOptions = ImageCloudOptions;
type GalleryConfig = ImageCloudConfig;
```
