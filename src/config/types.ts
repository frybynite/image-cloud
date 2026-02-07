/**
 * Type definitions for Image Gallery Library
 */

// ============================================================================
// Core Data Types
// ============================================================================

export interface ImageLayout {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  baseSize: number;
  zIndex?: number;
  borderColor?: string;
}

export interface ContainerBounds {
  width: number;
  height: number;
}

export interface ResponsiveHeight {
  minWidth: number;
  height: number;
}

export interface TransformParams {
  x?: number;
  y?: number;
  rotation?: number;
  scale?: number;
}

// ============================================================================
// Loader Configuration
// ============================================================================

export type GoogleDriveSourceType = 'folder' | 'files';

export interface GoogleDriveFolderSource {
  type: 'folder';
  folders: string[];
  recursive?: boolean;
}

export interface GoogleDriveFilesSource {
  type: 'files';
  files: string[];
}

export type GoogleDriveSource = GoogleDriveFolderSource | GoogleDriveFilesSource;

export interface GoogleDriveLoaderConfig {
  apiKey: string;
  sources: GoogleDriveSource[];
  apiEndpoint?: string;
  allowedExtensions?: string[];
  debugLogging?: boolean;
}

export type StaticSourceType = 'urls' | 'path' | 'json';

export interface StaticSource {
  type: StaticSourceType;
  urls?: string[];
  basePath?: string;
  files?: string[];
  url?: string;            // For 'json' source type: JSON endpoint URL
}

export interface StaticLoaderConfig {
  sources?: StaticSource[];
  urls?: string[];          // Shorthand: auto-wrapped as sources: [{ type: 'urls', urls: [...] }]
  validateUrls?: boolean;
  validationTimeout?: number;
  validationMethod?: 'head' | 'simple' | 'none';
  failOnAllMissing?: boolean;
  allowedExtensions?: string[];
  debugLogging?: boolean;
}

export interface CompositeLoaderConfigJson {
  loaders: LoaderConfig[];
  debugLogging?: boolean;
}

export interface LoaderConfig {
  type: 'googleDrive' | 'static' | 'composite';
  googleDrive?: GoogleDriveLoaderConfig;
  static?: StaticLoaderConfig;
  composite?: CompositeLoaderConfigJson;
}

// ============================================================================
// Image Configuration (sizing and rotation)
// ============================================================================

/**
 * Sizing mode:
 * - 'fixed': single explicit height for all breakpoints
 * - 'responsive': different heights per breakpoint (mobile/tablet/screen)
 * - 'adaptive': auto-calculates based on container size and image count
 */
export type SizingMode = 'fixed' | 'responsive' | 'adaptive';

/**
 * Fixed mode height configuration with responsive breakpoints
 * At least one of mobile, tablet, or screen is required
 */
export interface FixedModeHeight {
  mobile?: number;             // Height for mobile viewports (< responsive.mobile.maxWidth)
  tablet?: number;             // Height for tablet viewports (< responsive.tablet.maxWidth)
  screen?: number;             // Height for desktop/large screens (>= responsive.tablet.maxWidth)
}

/**
 * Legacy responsive base height configuration (kept for backward compatibility)
 */
export interface ResponsiveBaseHeight {
  default: number;             // Base height for large screens
  tablet?: number;             // Height for tablet
  mobile?: number;             // Height for mobile
}

/**
 * Image variance configuration
 * Controls random size variation applied to images
 */
export interface ImageVarianceConfig {
  min: number;                 // 0.25-1 (e.g., 0.8)
  max: number;                 // 1-1.75 (e.g., 1.2)
}

/**
 * Image sizing configuration
 */
export interface ImageSizingConfig {
  mode: SizingMode;                              // Required: 'fixed', 'responsive', or 'adaptive'
  height?: number | FixedModeHeight;             // Fixed/responsive mode: explicit heights
  minSize?: number;                              // Adaptive mode only: minimum image height (default: 50)
  maxSize?: number;                              // Adaptive mode only: maximum image height (default: 400)
  variance?: ImageVarianceConfig;                // Size variance (min: 0.25-1, max: 1-1.75)
}

/**
 * Image rotation mode
 */
export type ImageRotationMode = 'none' | 'random' | 'tangent';

/**
 * Image rotation range configuration
 */
export interface ImageRotationRange {
  min: number;                 // Negative degrees (-180 to 0)
  max: number;                 // Positive degrees (0 to 180)
}

/**
 * Image rotation configuration
 */
export interface ImageRotationConfig {
  mode: ImageRotationMode;     // default: 'none'
  range?: ImageRotationRange;  // Range for random mode
}

/**
 * Combined image configuration
 */
export interface ImageConfig {
  sizing?: ImageSizingConfig;
  rotation?: ImageRotationConfig;
}

// ============================================================================
// Layout Configuration
// ============================================================================

export interface AdaptiveSizingResult {
  height: number;                // Calculated image height
}

/**
 * Responsive breakpoints configuration for layout
 * Defines viewport width thresholds for mobile and tablet
 */
export interface ResponsiveBreakpoints {
  mobile: { maxWidth: number };   // Default: 767
  tablet: { maxWidth: number };   // Default: 1199
  // screen is implicitly > tablet.maxWidth
}

// Legacy responsive height uses the existing ResponsiveHeight interface (minWidth, height)

export interface LayoutSpacingConfig {
  padding: number;
  minGap: number;
}

// Legacy interface kept for backward compatibility in LayoutEngine
export interface LegacyLayoutRotationConfig {
  enabled: boolean;
  range: {
    min: number;
    max: number;
  };
}

// ============================================================================
// Algorithm-Specific Configuration
// ============================================================================

export interface GridAlgorithmConfig {
  columns: number | 'auto';
  rows: number | 'auto';
  stagger: 'none' | 'row' | 'column';
  jitter: number;
  overlap: number;
  fillDirection: 'row' | 'column';
  alignment: 'start' | 'center' | 'end';
  gap: number;
  overflowOffset: number;  // 0-0.5, percentage of cell size for stacking overflow images (default: 0.25)
}

export interface SpiralAlgorithmConfig {
  spiralType: 'golden' | 'archimedean' | 'logarithmic';
  direction: 'clockwise' | 'counterclockwise';
  tightness: number;
  scaleDecay: number;
  startAngle: number;
}

export interface ClusterAlgorithmConfig {
  clusterCount: number | 'auto';
  clusterSpread: number;
  clusterSpacing: number;
  density: 'uniform' | 'varied';
  overlap: number;
  distribution: 'gaussian' | 'uniform';
}

export interface WaveAlgorithmConfig {
  rows: number;
  amplitude: number;
  frequency: number;
  phaseShift: number;
  synchronization: 'offset' | 'synchronized' | 'alternating';
  // Note: Image rotation along wave is now controlled via image.rotation.mode = 'tangent'
}

export type LayoutAlgorithm = 'random' | 'radial' | 'grid' | 'spiral' | 'cluster' | 'wave';

export interface LayoutConfig {
  algorithm: LayoutAlgorithm;
  spacing: LayoutSpacingConfig;
  scaleDecay?: number;           // For Radial/Spiral - progressive size reduction (0-1, default: 0)
  responsive?: ResponsiveBreakpoints;  // Viewport width breakpoints (mobile/tablet)
  targetCoverage?: number;       // 0-1, for adaptive sizing (default: 0.6)
  densityFactor?: number;        // Controls center point spacing (default: 1.0)
  debugRadials?: boolean;
  debugCenters?: boolean;        // Show markers at calculated image center positions
  grid?: GridAlgorithmConfig;
  spiral?: SpiralAlgorithmConfig;
  cluster?: ClusterAlgorithmConfig;
  wave?: WaveAlgorithmConfig;
}

// ============================================================================
// Animation Configuration
// ============================================================================

// Entry Path Types
export type EntryPathType = 'linear' | 'arc' | 'bounce' | 'elastic' | 'wave';

export interface BouncePathConfig {
  overshoot: number;        // 0.1-0.3, how far past target (default: 0.15)
  bounces: 1 | 2 | 3;       // number of bounces before settling (default: 1)
  decayRatio: number;       // 0.3-0.7, each bounce is this % of previous (default: 0.5)
}

export type BouncePreset = 'energetic' | 'playful' | 'subtle';

export interface ElasticPathConfig {
  stiffness: number;        // 100-500, higher = faster oscillation (default: 200)
  damping: number;          // 10-50, higher = fewer oscillations (default: 20)
  mass: number;             // 0.5-3, higher = slower, more momentum (default: 1)
  oscillations: number;     // 2-5, visible oscillation count (default: 3)
}

export type ElasticPreset = 'gentle' | 'bouncy' | 'wobbly' | 'snappy';

export interface WavePathConfig {
  amplitude: number;        // 20-100px, wave height (default: 40)
  frequency: number;        // 1-4, number of complete waves (default: 2)
  decay: boolean;           // true = wave diminishes toward target (default: true)
  decayRate: number;        // 0.5-1, how fast amplitude decreases (default: 0.8)
  phase: number;            // 0-2π, starting phase offset (default: 0)
}

export type WavePathPreset = 'gentle' | 'playful' | 'serpentine' | 'flutter';

export interface EntryPathConfig {
  type: EntryPathType;
  // Preset shortcuts (type-specific)
  bouncePreset?: BouncePreset;
  elasticPreset?: ElasticPreset;
  wavePreset?: WavePathPreset;
  // Type-specific detailed configs (override presets)
  bounce?: Partial<BouncePathConfig>;
  elastic?: Partial<ElasticPathConfig>;
  wave?: Partial<WavePathConfig>;
}

// Entry Rotation Types
export type EntryRotationMode = 'none' | 'settle' | 'spin' | 'wobble' | 'random';

export interface EntryRotationConfig {
  mode: EntryRotationMode;
  startRotation?: number | { min: number; max: number };  // For 'settle' mode
  spinCount?: number;                                      // For 'spin' mode (default: 1)
  direction?: 'clockwise' | 'counterclockwise' | 'auto' | 'random';  // For 'spin' mode
  wobble?: {
    amplitude: number;    // degrees of oscillation (default: 15)
    frequency: number;    // oscillations during animation (default: 3)
    decay: boolean;       // whether oscillation diminishes (default: true)
  };
}

// Entry Scale Types
export type EntryScaleMode = 'none' | 'grow' | 'shrink' | 'pop' | 'random';

export interface EntryScalePopConfig {
  overshoot: number;      // How much to overshoot final scale (1.1-1.5, default: 1.2)
  bounces: number;        // Number of bounces before settling (1-3, default: 1)
}

export interface EntryScaleConfig {
  mode: EntryScaleMode;
  startScale?: number;                        // Fixed start scale for grow/shrink (0.1-4.0)
  range?: { min: number; max: number };       // Random range for 'random' mode
  pop?: EntryScalePopConfig;                  // Config for 'pop' mode
}

export type EntryStartPosition =
  | 'nearest-edge'
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'center'
  | 'random-edge'
  | 'circular';

export interface EntryCircularConfig {
  radius?: number | string;  // pixels or percentage like '120%', default: '120%' of container diagonal
  distribution?: 'even' | 'random';  // default: 'even'
}

export interface EntryStartConfig {
  position: EntryStartPosition;
  offset?: number;  // pixels beyond edge, default: 100
  circular?: EntryCircularConfig;
}

export interface EntryTimingConfig {
  duration: number;  // default: 600ms
  stagger: number;   // default: 150ms
}

export interface EntryAnimationConfig {
  start: EntryStartConfig;
  timing: EntryTimingConfig;
  easing: string;  // CSS easing, default: 'cubic-bezier(0.25, 1, 0.5, 1)'
  path?: EntryPathConfig;  // Animation path type (linear, bounce, elastic, wave)
  rotation?: EntryRotationConfig;  // Entry rotation animation
  scale?: EntryScaleConfig;  // Entry scale animation
}

export interface AnimationEasingConfig {
  default: string;
  bounce: string;
  focus: string;
}

export interface AnimationQueueConfig {
  enabled: boolean;
  interval: number;
  maxConcurrent?: number;
}

export interface AnimationPerformanceConfig {
  useGPU?: boolean;
  reduceMotion?: boolean;
}

export interface AnimationConfig {
  duration: number;
  easing: AnimationEasingConfig;
  queue: AnimationQueueConfig;
  performance?: AnimationPerformanceConfig;
  entry?: EntryAnimationConfig;
}

// ============================================================================
// Interaction Configuration
// ============================================================================

export interface FocusInteractionConfig {
  scalePercent: number;           // Percentage of container (0-1 as fraction, 1-100 as percent)
  zIndex: number;
  animationDuration?: number;
}

export interface NavigationInteractionConfig {
  keyboard?: boolean;
  swipe?: boolean;
  mouseWheel?: boolean;
}

export interface GestureInteractionConfig {
  pinchToZoom?: boolean;
  doubleTapToFocus?: boolean;
}

export interface InteractionConfig {
  focus: FocusInteractionConfig;
  navigation?: NavigationInteractionConfig;
  gestures?: GestureInteractionConfig;
}

// ============================================================================
// Rendering Configuration
// ============================================================================

export interface ResponsiveRenderingConfig {
  breakpoints: {
    mobile: number;
    tablet?: number;
    desktop?: number;
  };
  mobileDetection: () => boolean;
}

export interface UIRenderingConfig {
  showLoadingSpinner: boolean;
  showImageCounter?: boolean;
  showThumbnails?: boolean;
  theme?: 'light' | 'dark' | 'auto';
}

export interface PerformanceRenderingConfig {
  lazyLoad?: boolean;
  preloadCount?: number;
  imageQuality?: 'auto' | 'high' | 'medium' | 'low';
}

export interface RenderingConfig {
  responsive: ResponsiveRenderingConfig;
  ui: UIRenderingConfig;
  performance?: PerformanceRenderingConfig;
}

// ============================================================================
// Main Gallery Configuration
// ============================================================================

export interface ImageCloudConfig {
  loader: LoaderConfig;
  image: ImageConfig;
  layout: LayoutConfig;
  animation: AnimationConfig;
  interaction: InteractionConfig;
  rendering: RenderingConfig;
  styling?: ImageStylingConfig;
  debug: boolean;
}

// Backwards compatibility alias
export type GalleryConfig = ImageCloudConfig;

export interface ImageCloudOptions {
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

// Backwards compatibility alias
export type ImageGalleryOptions = ImageCloudOptions;

// ============================================================================
// Legacy Configuration Types (for backward compatibility)
// ============================================================================

export interface LegacyLayoutConfig {
  baseImageSize?: number;
  rotationRange?: { min: number; max: number };
  type?: 'random' | 'radial';
  debugRadials?: boolean;
  sizeVarianceMin?: number;
  sizeVarianceMax?: number;
  responsiveHeights?: ResponsiveHeight[];
  padding?: number;
  minSpacing?: number;
  minRotation?: number;
  maxRotation?: number;
}

export interface LegacyAnimationConfig {
  duration?: number;
  queueInterval?: number;
  easing?: string;
  bounceEasing?: string;
}

export interface LegacyZoomConfig {
  focusScale?: number;
  mobileScale?: number;     // Deprecated: use scaleTo/scalePercent instead
  focusZIndex?: number;
}

export interface LegacyConfig {
  layout?: LegacyLayoutConfig;
  animation?: LegacyAnimationConfig;
  zoom?: LegacyZoomConfig;
  debugLogging?: boolean;
  googleDrive?: {
    apiKey?: string;
    apiEndpoint?: string;
    imageExtensions?: string[];
  };
  loader?: {
    type?: 'googleDrive' | 'static';
    static?: StaticLoaderConfig;
  };
  breakpoints?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  isMobile?: () => boolean;
  ui?: {
    showLoadingSpinner?: boolean;
  };
}

export interface LegacyImageGalleryOptions {
  containerId?: string;
  loaderType?: 'googleDrive' | 'static';
  folderUrl?: string;
  googleDrive?: {
    apiKey?: string;
  };
  staticLoader?: StaticLoaderConfig;
  config?: LegacyConfig;
}

// ============================================================================
// Interface Dependencies
// ============================================================================

export interface PlacementGenerator {
  generate(
    imageCount: number,
    containerBounds: ContainerBounds,
    options?: Partial<LayoutConfig>
  ): ImageLayout[];
}

/**
 * ImageFilter interface for filtering images by extension
 * Implemented by the ImageFilter class in loaders/ImageFilter.ts
 */
export interface IImageFilter {
  isAllowed(filename: string): boolean;
  getAllowedExtensions(): string[];
}

/**
 * ImageLoader interface with consistent lifecycle pattern:
 * 1. Constructor - Initialize with required parameters, throw if missing
 * 2. prepare(filter) - Async discovery of images, accepts filter
 * 3. imagesLength() - Return count of images (after prepare)
 * 4. imageURLs() - Return ordered list of URLs (after prepare)
 */
export interface ImageLoader {
  /**
   * Async preparation - discovers images and applies filter
   * Succeeds even if 0 images found (gallery handles empty state)
   * @param filter - Filter to apply to discovered images
   */
  prepare(filter: IImageFilter): Promise<void>;

  /**
   * Get the number of discovered images
   * @throws Error if called before prepare() completes
   */
  imagesLength(): number;

  /**
   * Get the ordered list of image URLs
   * @throws Error if called before prepare() completes
   */
  imageURLs(): string[];

  /**
   * Check if the loader has been prepared
   */
  isPrepared(): boolean;
}

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  parents?: string[];
}

export interface GoogleDriveResponse {
  files: GoogleDriveFile[];
  nextPageToken?: string;
}

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// ============================================================================
// Image Styling Configuration
// ============================================================================

export type ShadowPreset = 'none' | 'sm' | 'md' | 'lg' | 'glow';

export type BorderStyle =
  | 'solid'      // Most common - continuous line
  | 'dashed'     // Series of dashes
  | 'dotted'     // Series of dots
  | 'double'     // Two parallel lines
  | 'none'       // No border
  | 'groove'     // 3D carved into page
  | 'ridge'      // 3D raised from page
  | 'inset'      // 3D embedded look
  | 'outset'     // 3D raised look
  | 'hidden';    // Same as none (for table border conflict resolution)

export interface BorderConfig {
  width?: number;             // pixels, default: 0
  color?: string;             // CSS color, default: '#000'
  radius?: number;            // pixels, default: 8
  style?: BorderStyle;        // default: 'solid'
}

export interface DropShadowConfig {
  x: number;
  y: number;
  blur: number;
  color: string;
}

export interface FilterConfig {
  grayscale?: number;    // 0-1
  blur?: number;         // pixels
  brightness?: number;   // multiplier (1 = normal)
  contrast?: number;     // multiplier
  saturate?: number;     // multiplier
  opacity?: number;      // 0-1
  sepia?: number;        // 0-1
  hueRotate?: number;    // degrees
  invert?: number;       // 0-1
  dropShadow?: DropShadowConfig | string;
}

export interface OutlineConfig {
  width?: number;        // pixels
  color?: string;        // CSS color
  style?: BorderStyle;   // reuses BorderStyle type
  offset?: number;       // pixels
}

export interface ImageStyleState {
  // CSS class names (space-separated string or array)
  className?: string | string[];

  // Border (shorthand applies to all sides)
  border?: BorderConfig;
  borderTop?: Partial<BorderConfig>;
  borderRight?: Partial<BorderConfig>;
  borderBottom?: Partial<BorderConfig>;
  borderLeft?: Partial<BorderConfig>;

  // Per-corner border radius (overrides border.radius for specific corners)
  borderRadiusTopLeft?: number;
  borderRadiusTopRight?: number;
  borderRadiusBottomRight?: number;
  borderRadiusBottomLeft?: number;

  // Shadow (preset name or custom CSS string)
  shadow?: ShadowPreset | string;

  // Filters
  filter?: FilterConfig;

  // Other properties
  opacity?: number;           // 0-1
  cursor?: string;            // CSS cursor value
  outline?: OutlineConfig;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  aspectRatio?: string;       // e.g., '16/9', '1/1'
}

export interface ImageStylingConfig {
  default?: ImageStyleState;
  hover?: Partial<ImageStyleState>;    // inherits from default
  focused?: Partial<ImageStyleState>;  // inherits from default
}

// ============================================================================
// Focus Animation Types (Cross-Animation Support)
// ============================================================================

/**
 * State machine states for zoom/focus animations
 */
export enum ZoomState {
  IDLE = 'idle',                     // No focus, no animations
  FOCUSING = 'focusing',             // Single image animating in
  FOCUSED = 'focused',               // Stable focused state
  UNFOCUSING = 'unfocusing',         // Single image animating out
  CROSS_ANIMATING = 'cross_animating' // Two images: one out, one in
}

/**
 * Handle for a cancellable animation using Web Animations API
 */
export interface AnimationHandle {
  id: string;
  element: HTMLElement;
  animation: Animation;
  fromState: TransformParams;
  toState: TransformParams;
  startTime: number;
  duration: number;
}

/**
 * Snapshot of an element's current transform state
 * Used for capturing position mid-animation
 */
export interface AnimationSnapshot {
  x: number;
  y: number;
  rotation: number;
  scale: number;
}

/**
 * Tracks an image that is currently animating
 */
export interface AnimatingImage {
  element: HTMLElement;
  originalState: ImageLayout;
  animationHandle: AnimationHandle;
  direction: 'in' | 'out';
  originalWidth?: number;
  originalHeight?: number;
}