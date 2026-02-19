/**
 * Image Cloud Library - Main Entry Point
 *
 * Programmatic API for TypeScript/JavaScript applications
 */

// Import CSS for bundlers that support it
import './styles/image-cloud.css';

// Main class export
export { ImageCloud } from './ImageCloud';

// Backwards compatibility alias
export { ImageCloud as ImageGallery } from './ImageCloud';

// Type exports
export type {
  ImageCloudOptions,
  ImageGalleryOptions, // Backwards compatibility alias
  ImageCloudConfig,
  GalleryConfig,
  AnimationConfig,
  LayoutConfig,
  LayoutAlgorithm,
  GridAlgorithmConfig,
  SpiralAlgorithmConfig,
  ClusterAlgorithmConfig,
  // Loader types (new)
  LoaderEntry,
  StaticLoaderEntry,
  GoogleDriveLoaderEntry,
  StaticLoaderInnerConfig,
  GoogleDriveLoaderInnerConfig,
  SharedLoaderConfig,
  ConfigSection,
  DebugConfig,
  StaticUrlsSource,
  StaticPathSource,
  StaticJsonSource,
  GoogleDriveFolderSource,
  GoogleDriveFilesSource,
  UIRenderingConfig,
  ResponsiveRenderingConfig,
  ImageLayout,
  ContainerBounds,
  ResponsiveHeight,
  StaticSource,
  GoogleDriveSource,
  PlacementLayout,
  ImageLoader,
  IImageFilter,
  TransformParams,
  // Entry path animation types
  EntryPathType,
  EntryPathConfig,
  BouncePathConfig,
  ElasticPathConfig,
  WavePathConfig,
  BouncePreset,
  ElasticPreset,
  WavePathPreset,
  // Styling types
  BorderStyle,
  ImageStylingConfig
} from './config/types';

// Default config export
export {
  DEFAULT_CONFIG,
  DEFAULT_SHARED_LOADER_CONFIG,
  BOUNCE_PRESETS,
  ELASTIC_PRESETS,
  WAVE_PATH_PRESETS
} from './config/defaults';

// Export engines for advanced usage
export { AnimationEngine } from './engines/AnimationEngine';
export { LayoutEngine } from './engines/LayoutEngine';
export { ZoomEngine } from './engines/ZoomEngine';
export { EntryAnimationEngine } from './engines/EntryAnimationEngine';
export { animatePath, requiresJSAnimation } from './engines/PathAnimator';

// Export layouts for custom implementations
export { RandomPlacementLayout } from './layouts/RandomPlacementLayout';
export { RadialPlacementLayout } from './layouts/RadialPlacementLayout';
export { GridPlacementLayout } from './layouts/GridPlacementLayout';
export { SpiralPlacementLayout } from './layouts/SpiralPlacementLayout';
export { ClusterPlacementLayout } from './layouts/ClusterPlacementLayout';
export { WavePlacementLayout } from './layouts/WavePlacementLayout';

// Export loaders for custom implementations
export { GoogleDriveLoader } from './loaders/GoogleDriveLoader';
export { StaticImageLoader } from './loaders/StaticImageLoader';
export { CompositeLoader } from './loaders/CompositeLoader';
export type { CompositeLoaderConfig } from './loaders/CompositeLoader';
export { ImageFilter } from './loaders/ImageFilter';

// Export functional styles for manual injection if needed
export { injectFunctionalStyles, FUNCTIONAL_CSS } from './styles/functionalStyles';