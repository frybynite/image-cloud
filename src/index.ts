/**
 * Image Gallery Library - Main Entry Point
 *
 * Programmatic API for TypeScript/JavaScript applications
 */

// Import CSS for bundlers that support it
import './styles/gallery.css';

// Main class export
export { ImageGallery } from './ImageGallery';

// Type exports
export type {
  ImageGalleryOptions,
  GalleryConfig,
  AnimationConfig,
  LayoutConfig,
  GoogleDriveLoaderConfig,
  StaticLoaderConfig,
  LoaderConfig,
  UIRenderingConfig,
  ResponsiveRenderingConfig,
  ImageLayout,
  ContainerBounds,
  ResponsiveHeight,
  StaticSource,
  PlacementGenerator,
  ImageLoader,
  IImageFilter,
  TransformParams
} from './config/types';

// Default config export
export { DEFAULT_CONFIG } from './config/defaults';

// Export engines for advanced usage
export { AnimationEngine } from './engines/AnimationEngine';
export { LayoutEngine } from './engines/LayoutEngine';
export { ZoomEngine } from './engines/ZoomEngine';

// Export generators for custom implementations
export { RandomPlacementGenerator } from './generators/RandomPlacementGenerator';
export { RadialPlacementGenerator } from './generators/RadialPlacementGenerator';

// Export loaders for custom implementations
export { GoogleDriveLoader } from './loaders/GoogleDriveLoader';
export { StaticImageLoader } from './loaders/StaticImageLoader';
export { ImageFilter } from './loaders/ImageFilter';