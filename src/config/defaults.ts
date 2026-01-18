/**
 * Default configuration for Image Gallery
 * Centralized settings for animation, layout, and API configuration
 */

import type { GalleryConfig, DeepPartial, ResponsiveHeight, AdaptiveSizingConfig } from './types';

/**
 * Default configuration object
 * Frozen to prevent accidental modifications
 */
export const DEFAULT_CONFIG: GalleryConfig = Object.freeze({
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
      ],
      adaptive: Object.freeze({
        enabled: true,             // Enable adaptive sizing by default
        minSize: 50,               // Minimum 50px image height
        maxSize: 400,              // Maximum 400px image height
        targetCoverage: 0.6,       // Target 60% of container area
        densityFactor: 1.0,        // Default density
        overflowBehavior: 'minimize' as const  // Reduce size to fit, never truncate by default
      })
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
 * Deep merge utility for config objects
 * Merges user config with default config
 */
export function mergeConfig(
  userConfig: DeepPartial<GalleryConfig> = {}
): GalleryConfig {
  const merged: GalleryConfig = {
    loader: { ...DEFAULT_CONFIG.loader },
    layout: { ...DEFAULT_CONFIG.layout },
    animation: { ...DEFAULT_CONFIG.animation },
    interaction: { ...DEFAULT_CONFIG.interaction },
    rendering: { ...DEFAULT_CONFIG.rendering },
    debug: DEFAULT_CONFIG.debug
  };

  // Deep merge loader config
  if (userConfig.loader) {
    merged.loader = {
      ...DEFAULT_CONFIG.loader,
      ...userConfig.loader
    } as any;

    // Deep merge googleDrive config
    if (userConfig.loader.googleDrive) {
      merged.loader.googleDrive = {
        ...DEFAULT_CONFIG.loader.googleDrive!,
        ...userConfig.loader.googleDrive,
        sources: userConfig.loader.googleDrive.sources || DEFAULT_CONFIG.loader.googleDrive!.sources,
        allowedExtensions: userConfig.loader.googleDrive.allowedExtensions ||
          DEFAULT_CONFIG.loader.googleDrive!.allowedExtensions
      };
    }

    // Deep merge static config
    if (userConfig.loader.static) {
      merged.loader.static = {
        ...DEFAULT_CONFIG.loader.static!,
        ...userConfig.loader.static,
        sources: userConfig.loader.static.sources || DEFAULT_CONFIG.loader.static!.sources,
        allowedExtensions: userConfig.loader.static.allowedExtensions ||
          DEFAULT_CONFIG.loader.static!.allowedExtensions
      };
    }
  }

  // Deep merge layout config
  if (userConfig.layout) {
    merged.layout = {
      ...DEFAULT_CONFIG.layout,
      ...userConfig.layout
    } as any;

    // Deep merge sizing config
    if (userConfig.layout.sizing) {
      merged.layout.sizing = {
        ...DEFAULT_CONFIG.layout.sizing,
        ...userConfig.layout.sizing,
        variance: userConfig.layout.sizing.variance
          ? { ...DEFAULT_CONFIG.layout.sizing.variance, ...userConfig.layout.sizing.variance }
          : DEFAULT_CONFIG.layout.sizing.variance,
        responsive: (userConfig.layout.sizing.responsive as ResponsiveHeight[]) || DEFAULT_CONFIG.layout.sizing.responsive,
        adaptive: userConfig.layout.sizing.adaptive
          ? { ...DEFAULT_CONFIG.layout.sizing.adaptive!, ...(userConfig.layout.sizing.adaptive as AdaptiveSizingConfig) }
          : DEFAULT_CONFIG.layout.sizing.adaptive
      };
    }

    // Deep merge rotation config
    if (userConfig.layout.rotation) {
      merged.layout.rotation = {
        ...DEFAULT_CONFIG.layout.rotation,
        ...userConfig.layout.rotation,
        range: userConfig.layout.rotation.range
          ? { ...DEFAULT_CONFIG.layout.rotation.range, ...userConfig.layout.rotation.range }
          : DEFAULT_CONFIG.layout.rotation.range
      };
    }

    // Deep merge spacing config
    if (userConfig.layout.spacing) {
      merged.layout.spacing = {
        ...DEFAULT_CONFIG.layout.spacing,
        ...userConfig.layout.spacing
      };
    }
  }

  // Deep merge animation config
  if (userConfig.animation) {
    merged.animation = {
      ...DEFAULT_CONFIG.animation,
      ...userConfig.animation
    } as any;

    // Deep merge easing config
    if (userConfig.animation.easing) {
      merged.animation.easing = {
        ...DEFAULT_CONFIG.animation.easing,
        ...userConfig.animation.easing
      };
    }

    // Deep merge queue config
    if (userConfig.animation.queue) {
      merged.animation.queue = {
        ...DEFAULT_CONFIG.animation.queue,
        ...userConfig.animation.queue
      };
    }

    // Deep merge performance config
    if (userConfig.animation.performance) {
      merged.animation.performance = {
        ...DEFAULT_CONFIG.animation.performance,
        ...userConfig.animation.performance
      };
    }
  }

  // Deep merge interaction config
  if (userConfig.interaction) {
    merged.interaction = {
      ...DEFAULT_CONFIG.interaction,
      ...userConfig.interaction
    } as any;

    // Deep merge focus config
    if (userConfig.interaction.focus) {
      merged.interaction.focus = {
        ...DEFAULT_CONFIG.interaction.focus,
        ...userConfig.interaction.focus
      };
    }

    // Deep merge navigation config
    if (userConfig.interaction.navigation) {
      merged.interaction.navigation = {
        ...DEFAULT_CONFIG.interaction.navigation,
        ...userConfig.interaction.navigation
      };
    }

    // Deep merge gestures config
    if (userConfig.interaction.gestures) {
      merged.interaction.gestures = {
        ...DEFAULT_CONFIG.interaction.gestures,
        ...userConfig.interaction.gestures
      };
    }
  }

  // Deep merge rendering config
  if (userConfig.rendering) {
    merged.rendering = {
      ...DEFAULT_CONFIG.rendering,
      ...userConfig.rendering
    } as any;

    // Deep merge responsive config
    if (userConfig.rendering.responsive) {
      merged.rendering.responsive = {
        ...DEFAULT_CONFIG.rendering.responsive,
        ...userConfig.rendering.responsive,
        breakpoints: userConfig.rendering.responsive.breakpoints
          ? { ...DEFAULT_CONFIG.rendering.responsive.breakpoints, ...userConfig.rendering.responsive.breakpoints }
          : DEFAULT_CONFIG.rendering.responsive.breakpoints,
        mobileDetection: userConfig.rendering.responsive.mobileDetection
          ? (userConfig.rendering.responsive.mobileDetection as () => boolean)
          : DEFAULT_CONFIG.rendering.responsive.mobileDetection
      };
    }

    // Deep merge ui config
    if (userConfig.rendering.ui) {
      merged.rendering.ui = {
        ...DEFAULT_CONFIG.rendering.ui,
        ...userConfig.rendering.ui
      };
    }

    // Deep merge performance config
    if (userConfig.rendering.performance) {
      merged.rendering.performance = {
        ...DEFAULT_CONFIG.rendering.performance,
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
 * Debug logger
 */
export function debugLog(config: GalleryConfig, ...args: unknown[]): void {
  if (config.debug && typeof console !== 'undefined') {
    console.log(...args);
  }
}