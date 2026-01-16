/**
 * Type definitions for Image Gallery Library
 */

// ============================================================================
// Configuration Types
// ============================================================================

export interface AnimationConfig {
  duration: number;
  easing: string;
  bounceEasing: string;
  queueInterval: number;
}

export interface UIConfig {
  showLoadingSpinner: boolean;
}

export interface ResponsiveHeight {
  minWidth: number;
  height: number;
}

export interface LayoutConfig {
  type: 'random' | 'radial';
  debugRadials: boolean;
  rotationRange: number;
  minRotation: number;
  maxRotation: number;
  sizeVarianceMin: number;
  sizeVarianceMax: number;
  baseImageSize: number;
  responsiveHeights: ResponsiveHeight[];
  padding: number;
  minSpacing: number;
}

export interface ZoomConfig {
  focusScale: number;
  mobileScale: number;
  unfocusedOpacity?: number;
  focusZIndex: number;
}

export interface GoogleDriveConfig {
  apiKey: string;
  apiEndpoint: string;
  imageExtensions: string[];
}

export interface BreakpointConfig {
  mobile: number;
}

export interface StaticLoaderConfig {
  validateUrls: boolean;
  validationTimeout: number;
  validationMethod: 'head' | 'simple' | 'none';
  failOnAllMissing: boolean;
  imageExtensions: string[];
}

export interface LoaderConfig {
  type: 'googleDrive' | 'static';
  static: StaticLoaderConfig;
}

export interface GalleryConfig {
  animation: AnimationConfig;
  ui: UIConfig;
  layout: LayoutConfig;
  zoom: ZoomConfig;
  googleDrive: GoogleDriveConfig;
  breakpoints: BreakpointConfig;
  debugLogging: boolean;
  loader: LoaderConfig;
  isMobile: () => boolean;
}

// ============================================================================
// Placement Generator Types
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

export interface PlacementGenerator {
  generate(
    imageCount: number,
    containerBounds: ContainerBounds,
    options?: Partial<LayoutConfig>
  ): ImageLayout[];
}

// ============================================================================
// Image Loader Types
// ============================================================================

export type StaticSourceType = 'urls' | 'path';

export interface StaticSource {
  type: StaticSourceType;
  urls?: string[];
  basePath?: string;
  files?: string[];
}

export interface ImageLoader {
  loadImagesFromFolder(source: string | StaticSource[]): Promise<string[]>;
}

// ============================================================================
// Google Drive API Types
// ============================================================================

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

// ============================================================================
// Public API Types
// ============================================================================

export interface ImageGalleryOptions {
  containerId?: string;
  folderUrl?: string;
  loaderType?: 'googleDrive' | 'static';
  googleDrive?: {
    apiKey: string;
  };
  staticLoader?: {
    sources: StaticSource[];
  };
  config?: Partial<GalleryConfig>;
}

// ============================================================================
// Transform Types
// ============================================================================

export interface TransformParams {
  x?: number;
  y?: number;
  rotation?: number;
  scale?: number;
}

export interface AnimationOptions {
  duration?: number;
  easing?: string;
}

// ============================================================================
// Deep Partial Type (for config merging)
// ============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// ============================================================================
// NEW PATTERN-BASED CONFIGURATION (v0.2.0+)
// ============================================================================

// ----------------------------------------------------------------------------
// Loader Configuration
// ----------------------------------------------------------------------------

/**
 * Google Drive source types for loading images
 */
export type GoogleDriveSourceType = 'folder' | 'files';

/**
 * Google Drive folder source configuration
 */
export interface GoogleDriveFolderSource {
  type: 'folder';
  folders: string[];  // Array of folder URLs or IDs
  recursive?: boolean;  // Whether to load images from subfolders (default: true)
}

/**
 * Google Drive files source configuration
 */
export interface GoogleDriveFilesSource {
  type: 'files';
  files: string[];  // Array of file URLs or IDs
}

/**
 * Union type for Google Drive sources
 */
export type GoogleDriveSource = GoogleDriveFolderSource | GoogleDriveFilesSource;

/**
 * Google Drive loader configuration
 */
export interface GoogleDriveLoaderConfig {
  apiKey: string;
  sources: GoogleDriveSource[];  // Array of folder and/or file sources
  apiEndpoint?: string;
  allowedExtensions?: string[];
  debugLogging?: boolean;
}

/**
 * Static loader configuration (updated structure)
 */
export interface NewStaticLoaderConfig {
  sources: StaticSource[];  // Array of static sources
  validateUrls?: boolean;
  validationTimeout?: number;
  validationMethod?: 'head' | 'simple' | 'none';
  failOnAllMissing?: boolean;
  allowedExtensions?: string[];
  debugLogging?: boolean;
}

/**
 * Unified loader configuration
 */
export interface NewLoaderConfig {
  type: 'googleDrive' | 'static';
  googleDrive?: GoogleDriveLoaderConfig;
  static?: NewStaticLoaderConfig;
}

// ----------------------------------------------------------------------------
// Layout Configuration
// ----------------------------------------------------------------------------

/**
 * Layout sizing configuration
 */
export interface LayoutSizingConfig {
  base: number;  // Base image size in pixels
  variance: {
    min: number;  // Minimum size variance multiplier
    max: number;  // Maximum size variance multiplier
  };
  responsive: ResponsiveHeight[];  // Responsive height breakpoints
}

/**
 * Layout rotation configuration
 */
export interface LayoutRotationConfig {
  enabled: boolean;  // Whether rotation is enabled
  range: {
    min: number;  // Minimum rotation in degrees
    max: number;  // Maximum rotation in degrees
  };
}

/**
 * Layout spacing configuration
 */
export interface LayoutSpacingConfig {
  padding: number;  // Padding from viewport edges
  minGap: number;  // Minimum spacing between images
}

/**
 * New pattern-based layout configuration
 */
export interface NewLayoutConfig {
  algorithm: 'random' | 'radial';  // Layout algorithm
  sizing: LayoutSizingConfig;
  rotation: LayoutRotationConfig;
  spacing: LayoutSpacingConfig;
  debugRadials?: boolean;  // Debug visualization for radial layout
}

// ----------------------------------------------------------------------------
// Animation Configuration
// ----------------------------------------------------------------------------

/**
 * Animation easing configuration
 */
export interface AnimationEasingConfig {
  default: string;  // Default easing function
  bounce: string;  // Bounce easing function
  focus: string;  // Focus/zoom easing function
}

/**
 * Animation queue configuration
 */
export interface AnimationQueueConfig {
  enabled: boolean;  // Whether queue is enabled
  interval: number;  // Interval between queue items (ms)
  maxConcurrent?: number;  // STUB: Max concurrent animations
}

/**
 * Animation performance configuration
 */
export interface AnimationPerformanceConfig {
  useGPU?: boolean;  // STUB: Force GPU acceleration
  reduceMotion?: boolean;  // STUB: Respect prefers-reduced-motion
}

/**
 * New pattern-based animation configuration
 */
export interface NewAnimationConfig {
  duration: number;  // Animation duration in milliseconds
  easing: AnimationEasingConfig;
  queue: AnimationQueueConfig;
  performance?: AnimationPerformanceConfig;
}

// ----------------------------------------------------------------------------
// Interaction Configuration
// ----------------------------------------------------------------------------

/**
 * Focus/zoom interaction configuration
 */
export interface FocusInteractionConfig {
  scale: number;  // Scale factor when focused
  mobileScale: number;  // Scale factor on mobile devices
  unfocusedOpacity?: number;  // Opacity of unfocused images
  zIndex: number;  // Z-index for focused image
  animationDuration?: number;  // Override animation duration for focus
}

/**
 * Navigation interaction configuration (STUB)
 */
export interface NavigationInteractionConfig {
  keyboard?: boolean;  // STUB: Keyboard navigation
  swipe?: boolean;  // STUB: Swipe navigation
  mouseWheel?: boolean;  // STUB: Mouse wheel navigation
}

/**
 * Gesture interaction configuration (STUB)
 */
export interface GestureInteractionConfig {
  pinchToZoom?: boolean;  // STUB: Pinch to zoom
  doubleTapToFocus?: boolean;  // STUB: Double tap to focus
}

/**
 * New pattern-based interaction configuration
 */
export interface NewInteractionConfig {
  focus: FocusInteractionConfig;
  navigation?: NavigationInteractionConfig;  // STUB
  gestures?: GestureInteractionConfig;  // STUB
}

// ----------------------------------------------------------------------------
// Rendering Configuration
// ----------------------------------------------------------------------------

/**
 * Responsive rendering configuration
 */
export interface ResponsiveRenderingConfig {
  breakpoints: {
    mobile: number;  // Mobile breakpoint in pixels
    tablet?: number;  // STUB: Tablet breakpoint
    desktop?: number;  // STUB: Desktop breakpoint
  };
  mobileDetection: () => boolean;  // Function to detect mobile
}

/**
 * UI rendering configuration
 */
export interface UIRenderingConfig {
  showLoadingSpinner: boolean;
  showImageCounter?: boolean;  // STUB: Show image counter
  showThumbnails?: boolean;  // STUB: Show thumbnails
  theme?: 'light' | 'dark' | 'auto';  // STUB: UI theme
}

/**
 * Performance rendering configuration (STUB)
 */
export interface PerformanceRenderingConfig {
  lazyLoad?: boolean;  // STUB: Lazy load images
  preloadCount?: number;  // STUB: Number of images to preload
  imageQuality?: 'auto' | 'high' | 'medium' | 'low';  // STUB: Image quality
}

/**
 * New pattern-based rendering configuration
 */
export interface NewRenderingConfig {
  responsive: ResponsiveRenderingConfig;
  ui: UIRenderingConfig;
  performance?: PerformanceRenderingConfig;  // STUB
}

// ----------------------------------------------------------------------------
// New Gallery Configuration
// ----------------------------------------------------------------------------

/**
 * New pattern-based gallery configuration
 */
export interface NewGalleryConfig {
  loader: NewLoaderConfig;
  layout: NewLayoutConfig;
  animation: NewAnimationConfig;
  interaction: NewInteractionConfig;
  rendering: NewRenderingConfig;
  debug: boolean;
}

/**
 * New pattern-based options for ImageGallery initialization
 */
export interface NewImageGalleryOptions {
  container?: string;  // Container element ID (simplified from containerId)
  loader?: Partial<NewLoaderConfig>;
  layout?: Partial<NewLayoutConfig>;
  animation?: Partial<NewAnimationConfig>;
  interaction?: Partial<NewInteractionConfig>;
  rendering?: Partial<NewRenderingConfig>;
  debug?: boolean;
}
