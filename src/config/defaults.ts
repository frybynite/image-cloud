/**
 * Default configuration for Image Gallery
 * Centralized settings for animation, layout, and API configuration
 */

import type { GalleryConfig, NewGalleryConfig } from './types';

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

// ============================================================================
// NEW PATTERN-BASED CONFIGURATION (v0.2.0+)
// ============================================================================

/**
 * New pattern-based default configuration
 * Frozen to prevent accidental modifications
 */
export const NEW_DEFAULT_CONFIG: NewGalleryConfig = Object.freeze({
  // Unified loader configuration
  loader: Object.freeze({
    type: 'googleDrive' as const,
    googleDrive: Object.freeze({
      apiKey: '',  // Must be provided by user
      sources: [],  // Must be provided by user
      apiEndpoint: 'https://www.googleapis.com/drive/v3/files',
      allowedExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'],
      debugLogging: false
    }),
    static: Object.freeze({
      sources: [],  // Must be provided by user
      validateUrls: true,
      validationTimeout: 5000,
      validationMethod: 'head' as const,
      failOnAllMissing: true,
      allowedExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'],
      debugLogging: false
    })
  }),

  // Pattern-based layout configuration
  layout: Object.freeze({
    algorithm: 'radial' as const,
    sizing: Object.freeze({
      base: 200,  // pixels
      variance: Object.freeze({
        min: 1.0,  // No variance for consistent height
        max: 1.0   // No variance for consistent height
      }),
      responsive: [
        { minWidth: 1200, height: 225 },  // Large screens
        { minWidth: 768, height: 180 },   // Tablet / Small desktop
        { minWidth: 0, height: 100 }      // Mobile / Default
      ]
    }),
    rotation: Object.freeze({
      enabled: true,
      range: Object.freeze({
        min: -15,  // degrees
        max: 15    // degrees
      })
    }),
    spacing: Object.freeze({
      padding: 50,   // padding from viewport edges
      minGap: 20     // minimum spacing between images
    }),
    debugRadials: false
  }),

  // Pattern-based animation configuration
  animation: Object.freeze({
    duration: 600,  // milliseconds
    easing: Object.freeze({
      default: 'cubic-bezier(0.4, 0.0, 0.2, 1)',  // smooth easing
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',  // bounce effect
      focus: 'cubic-bezier(0.4, 0.0, 0.2, 1)'  // focus/zoom easing
    }),
    queue: Object.freeze({
      enabled: true,
      interval: 150,  // ms between processing queue items
      maxConcurrent: undefined  // STUB: Not implemented yet
    }),
    performance: Object.freeze({
      useGPU: undefined,  // STUB: Not implemented yet
      reduceMotion: undefined  // STUB: Not implemented yet
    })
  }),

  // Pattern-based interaction configuration
  interaction: Object.freeze({
    focus: Object.freeze({
      scale: 2.5,  // how much to scale focused image
      mobileScale: 2.0,  // slightly smaller scale for mobile
      unfocusedOpacity: 0.3,  // opacity of other images when one is focused
      zIndex: 1000,
      animationDuration: undefined  // Use default animation duration
    }),
    navigation: Object.freeze({
      keyboard: undefined,  // STUB: Not implemented yet
      swipe: undefined,  // STUB: Not implemented yet
      mouseWheel: undefined  // STUB: Not implemented yet
    }),
    gestures: Object.freeze({
      pinchToZoom: undefined,  // STUB: Not implemented yet
      doubleTapToFocus: undefined  // STUB: Not implemented yet
    })
  }),

  // Pattern-based rendering configuration
  rendering: Object.freeze({
    responsive: Object.freeze({
      breakpoints: Object.freeze({
        mobile: 768,
        tablet: undefined,  // STUB: Not implemented yet
        desktop: undefined  // STUB: Not implemented yet
      }),
      mobileDetection: () => {
        if (typeof window === 'undefined') return false;
        return window.innerWidth <= 768;
      }
    }),
    ui: Object.freeze({
      showLoadingSpinner: false,
      showImageCounter: undefined,  // STUB: Not implemented yet
      showThumbnails: undefined,  // STUB: Not implemented yet
      theme: undefined  // STUB: Not implemented yet
    }),
    performance: Object.freeze({
      lazyLoad: undefined,  // STUB: Not implemented yet
      preloadCount: undefined,  // STUB: Not implemented yet
      imageQuality: undefined  // STUB: Not implemented yet
    })
  }),

  // Debug mode
  debug: false
});

/**
 * Deep merge utility for new pattern-based config objects
 * Merges user config with default config
 */
export function mergeNewConfig(
  userConfig: Partial<NewGalleryConfig> = {}
): NewGalleryConfig {
  const merged: NewGalleryConfig = {
    loader: { ...NEW_DEFAULT_CONFIG.loader },
    layout: { ...NEW_DEFAULT_CONFIG.layout },
    animation: { ...NEW_DEFAULT_CONFIG.animation },
    interaction: { ...NEW_DEFAULT_CONFIG.interaction },
    rendering: { ...NEW_DEFAULT_CONFIG.rendering },
    debug: NEW_DEFAULT_CONFIG.debug
  };

  // Deep merge loader config
  if (userConfig.loader) {
    merged.loader = {
      ...NEW_DEFAULT_CONFIG.loader,
      ...userConfig.loader
    };

    // Deep merge googleDrive config
    if (userConfig.loader.googleDrive) {
      merged.loader.googleDrive = {
        ...NEW_DEFAULT_CONFIG.loader.googleDrive!,
        ...userConfig.loader.googleDrive,
        sources: userConfig.loader.googleDrive.sources || NEW_DEFAULT_CONFIG.loader.googleDrive!.sources,
        allowedExtensions: userConfig.loader.googleDrive.allowedExtensions ||
          NEW_DEFAULT_CONFIG.loader.googleDrive!.allowedExtensions
      };
    }

    // Deep merge static config
    if (userConfig.loader.static) {
      merged.loader.static = {
        ...NEW_DEFAULT_CONFIG.loader.static!,
        ...userConfig.loader.static,
        sources: userConfig.loader.static.sources || NEW_DEFAULT_CONFIG.loader.static!.sources,
        allowedExtensions: userConfig.loader.static.allowedExtensions ||
          NEW_DEFAULT_CONFIG.loader.static!.allowedExtensions
      };
    }
  }

  // Deep merge layout config
  if (userConfig.layout) {
    merged.layout = {
      ...NEW_DEFAULT_CONFIG.layout,
      ...userConfig.layout
    };

    // Deep merge sizing config
    if (userConfig.layout.sizing) {
      merged.layout.sizing = {
        ...NEW_DEFAULT_CONFIG.layout.sizing,
        ...userConfig.layout.sizing,
        variance: userConfig.layout.sizing.variance
          ? { ...NEW_DEFAULT_CONFIG.layout.sizing.variance, ...userConfig.layout.sizing.variance }
          : NEW_DEFAULT_CONFIG.layout.sizing.variance,
        responsive: userConfig.layout.sizing.responsive || NEW_DEFAULT_CONFIG.layout.sizing.responsive
      };
    }

    // Deep merge rotation config
    if (userConfig.layout.rotation) {
      merged.layout.rotation = {
        ...NEW_DEFAULT_CONFIG.layout.rotation,
        ...userConfig.layout.rotation,
        range: userConfig.layout.rotation.range
          ? { ...NEW_DEFAULT_CONFIG.layout.rotation.range, ...userConfig.layout.rotation.range }
          : NEW_DEFAULT_CONFIG.layout.rotation.range
      };
    }

    // Deep merge spacing config
    if (userConfig.layout.spacing) {
      merged.layout.spacing = {
        ...NEW_DEFAULT_CONFIG.layout.spacing,
        ...userConfig.layout.spacing
      };
    }
  }

  // Deep merge animation config
  if (userConfig.animation) {
    merged.animation = {
      ...NEW_DEFAULT_CONFIG.animation,
      ...userConfig.animation
    };

    // Deep merge easing config
    if (userConfig.animation.easing) {
      merged.animation.easing = {
        ...NEW_DEFAULT_CONFIG.animation.easing,
        ...userConfig.animation.easing
      };
    }

    // Deep merge queue config
    if (userConfig.animation.queue) {
      merged.animation.queue = {
        ...NEW_DEFAULT_CONFIG.animation.queue,
        ...userConfig.animation.queue
      };
    }

    // Deep merge performance config
    if (userConfig.animation.performance) {
      merged.animation.performance = {
        ...NEW_DEFAULT_CONFIG.animation.performance,
        ...userConfig.animation.performance
      };
    }
  }

  // Deep merge interaction config
  if (userConfig.interaction) {
    merged.interaction = {
      ...NEW_DEFAULT_CONFIG.interaction,
      ...userConfig.interaction
    };

    // Deep merge focus config
    if (userConfig.interaction.focus) {
      merged.interaction.focus = {
        ...NEW_DEFAULT_CONFIG.interaction.focus,
        ...userConfig.interaction.focus
      };
    }

    // Deep merge navigation config
    if (userConfig.interaction.navigation) {
      merged.interaction.navigation = {
        ...NEW_DEFAULT_CONFIG.interaction.navigation,
        ...userConfig.interaction.navigation
      };
    }

    // Deep merge gestures config
    if (userConfig.interaction.gestures) {
      merged.interaction.gestures = {
        ...NEW_DEFAULT_CONFIG.interaction.gestures,
        ...userConfig.interaction.gestures
      };
    }
  }

  // Deep merge rendering config
  if (userConfig.rendering) {
    merged.rendering = {
      ...NEW_DEFAULT_CONFIG.rendering,
      ...userConfig.rendering
    };

    // Deep merge responsive config
    if (userConfig.rendering.responsive) {
      merged.rendering.responsive = {
        ...NEW_DEFAULT_CONFIG.rendering.responsive,
        ...userConfig.rendering.responsive,
        breakpoints: userConfig.rendering.responsive.breakpoints
          ? { ...NEW_DEFAULT_CONFIG.rendering.responsive.breakpoints, ...userConfig.rendering.responsive.breakpoints }
          : NEW_DEFAULT_CONFIG.rendering.responsive.breakpoints
      };
    }

    // Deep merge ui config
    if (userConfig.rendering.ui) {
      merged.rendering.ui = {
        ...NEW_DEFAULT_CONFIG.rendering.ui,
        ...userConfig.rendering.ui
      };
    }

    // Deep merge performance config
    if (userConfig.rendering.performance) {
      merged.rendering.performance = {
        ...NEW_DEFAULT_CONFIG.rendering.performance,
        ...userConfig.rendering.performance
      };
    }
  }

  // Merge debug flag
  if (userConfig.debug !== undefined) {
    merged.debug = userConfig.debug;
  }

  return merged;
}

/**
 * New debug logger for pattern-based config
 */
export function newDebugLog(config: NewGalleryConfig, ...args: unknown[]): void {
  if (config.debug && typeof console !== 'undefined') {
    console.log(...args);
  }
}
