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

export type StaticSourceType = 'urls' | 'path';

export interface StaticSource {
  type: StaticSourceType;
  urls?: string[];
  basePath?: string;
  files?: string[];
}

export interface StaticLoaderConfig {
  sources: StaticSource[];
  validateUrls?: boolean;
  validationTimeout?: number;
  validationMethod?: 'head' | 'simple' | 'none';
  failOnAllMissing?: boolean;
  allowedExtensions?: string[];
  debugLogging?: boolean;
}

export interface LoaderConfig {
  type: 'googleDrive' | 'static';
  googleDrive?: GoogleDriveLoaderConfig;
  static?: StaticLoaderConfig;
}

// ============================================================================
// Layout Configuration
// ============================================================================

export interface LayoutSizingConfig {
  base: number;
  variance: {
    min: number;
    max: number;
  };
  responsive: ResponsiveHeight[];
}

export interface LayoutRotationConfig {
  enabled: boolean;
  range: {
    min: number;
    max: number;
  };
}

export interface LayoutSpacingConfig {
  padding: number;
  minGap: number;
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

export type LayoutAlgorithm = 'random' | 'radial' | 'grid' | 'spiral' | 'cluster';

export interface LayoutConfig {
  algorithm: LayoutAlgorithm;
  sizing: LayoutSizingConfig;
  rotation: LayoutRotationConfig;
  spacing: LayoutSpacingConfig;
  debugRadials?: boolean;
  grid?: GridAlgorithmConfig;
  spiral?: SpiralAlgorithmConfig;
  cluster?: ClusterAlgorithmConfig;
}

// ============================================================================
// Animation Configuration
// ============================================================================

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
}

// ============================================================================
// Interaction Configuration
// ============================================================================

export interface FocusInteractionConfig {
  scale: number;
  mobileScale: number;
  unfocusedOpacity?: number;
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

export interface GalleryConfig {
  loader: LoaderConfig;
  layout: LayoutConfig;
  animation: AnimationConfig;
  interaction: InteractionConfig;
  rendering: RenderingConfig;
  debug: boolean;
}

export interface ImageGalleryOptions {
  container?: string;
  loader?: Partial<LoaderConfig>;
  layout?: Partial<LayoutConfig>;
  animation?: Partial<AnimationConfig>;
  interaction?: Partial<InteractionConfig>;
  rendering?: Partial<RenderingConfig>;
  debug?: boolean;
}

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
  mobileScale?: number;
  unfocusedOpacity?: number;
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