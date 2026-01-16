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
