/**
 * Default configuration for Image Gallery
 * Centralized settings for animation, layout, and API configuration
 */

import type { GalleryConfig } from './types';

/**
 * Default configuration object
 * Frozen to prevent accidental modifications
 */
export const DEFAULT_CONFIG: GalleryConfig = Object.freeze({
  // Animation settings
  animation: Object.freeze({
    duration: 600,  // milliseconds
    easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)',  // smooth easing
    bounceEasing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',  // bounce effect
    queueInterval: 150 // ms between processing queue items
  }),

  // UI settings
  ui: Object.freeze({
    showLoadingSpinner: false
  }),

  // Layout settings
  layout: Object.freeze({
    type: 'radial' as const, // 'random' or 'radial'
    debugRadials: false,
    rotationRange: 15,  // degrees (+/-)
    minRotation: -15,
    maxRotation: 15,
    sizeVarianceMin: 1.0,  // No variance for consistent height
    sizeVarianceMax: 1.0,  // No variance for consistent height
    baseImageSize: 200,  // pixels
    // responsive heights based on window width
    responsiveHeights: [
      { minWidth: 1200, height: 225 }, // Large screens
      { minWidth: 768, height: 180 },  // Tablet / Small desktop
      { minWidth: 0, height: 100 }     // Mobile / Default
    ],
    padding: 50,  // padding from viewport edges
    minSpacing: 20  // minimum spacing between images to encourage overlap
  }),

  // Zoom settings
  zoom: Object.freeze({
    focusScale: 2.5,  // how much to scale focused image
    mobileScale: 2.0,  // slightly smaller scale for mobile
    unfocusedOpacity: 0.3,  // opacity of other images when one is focused (optional)
    focusZIndex: 1000
  }),

  // Google Drive API settings
  googleDrive: Object.freeze({
    apiKey: '',  // Value provided by ImageGallery initialization
    apiEndpoint: 'https://www.googleapis.com/drive/v3/files',
    imageExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp']
  }),

  // Responsive breakpoints
  breakpoints: Object.freeze({
    mobile: 768
  }),

  // Debugging
  debugLogging: false,

  // Image loader settings
  loader: Object.freeze({
    type: 'googleDrive' as const,  // 'googleDrive' or 'static'
    static: Object.freeze({
      validateUrls: true,
      validationTimeout: 5000,
      validationMethod: 'head' as const,  // 'head', 'simple', or 'none'
      failOnAllMissing: true,
      imageExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp']
    })
  }),

  // Helper function to check if device is mobile
  isMobile: () => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= DEFAULT_CONFIG.breakpoints.mobile;
  }
});

/**
 * Deep merge utility for config objects
 * Merges user config with default config
 */
export function mergeConfig(
  defaultConfig: GalleryConfig,
  userConfig: Partial<GalleryConfig>
): GalleryConfig {
  const merged = { ...defaultConfig };

  // Deep merge animation config
  if (userConfig.animation) {
    merged.animation = { ...defaultConfig.animation, ...userConfig.animation };
  }

  // Deep merge ui config
  if (userConfig.ui) {
    merged.ui = { ...defaultConfig.ui, ...userConfig.ui };
  }

  // Deep merge layout config
  if (userConfig.layout) {
    merged.layout = {
      ...defaultConfig.layout,
      ...userConfig.layout,
      // Special handling for responsiveHeights array
      responsiveHeights: userConfig.layout.responsiveHeights || defaultConfig.layout.responsiveHeights
    };
  }

  // Deep merge zoom config
  if (userConfig.zoom) {
    merged.zoom = { ...defaultConfig.zoom, ...userConfig.zoom };
  }

  // Deep merge googleDrive config
  if (userConfig.googleDrive) {
    merged.googleDrive = {
      ...defaultConfig.googleDrive,
      ...userConfig.googleDrive,
      imageExtensions: userConfig.googleDrive.imageExtensions || defaultConfig.googleDrive.imageExtensions
    };
  }

  // Deep merge breakpoints config
  if (userConfig.breakpoints) {
    merged.breakpoints = { ...defaultConfig.breakpoints, ...userConfig.breakpoints };
  }

  // Deep merge loader config
  if (userConfig.loader) {
    merged.loader = {
      ...defaultConfig.loader,
      ...userConfig.loader,
      static: userConfig.loader.static
        ? { ...defaultConfig.loader.static, ...userConfig.loader.static }
        : defaultConfig.loader.static
    };
  }

  // Merge top-level properties
  if (userConfig.debugLogging !== undefined) {
    merged.debugLogging = userConfig.debugLogging;
  }

  return merged;
}

/**
 * Centralized debug logger
 * Safe wrapper for console.log
 */
export function debugLog(config: GalleryConfig, ...args: unknown[]): void {
  if (config.debugLogging && typeof console !== 'undefined') {
    console.log(...args);
  }
}
