/**
 * Default configuration for Image Gallery
 * Centralized settings for animation, layout, and API configuration
 */

import type { ImageCloudConfig, DeepPartial, ResponsiveHeight, AdaptiveSizingConfig, ImageStylingConfig, ImageStyleState, ShadowPreset, WaveAlgorithmConfig, BouncePathConfig, ElasticPathConfig, WavePathConfig, BouncePreset, ElasticPreset, WavePathPreset, EntryPathConfig, ImageConfig, ImageSizingConfig, ImageRotationConfig, ImageVarianceConfig } from './types';

/**
 * Shadow presets for image styling
 */
export const SHADOW_PRESETS: Record<ShadowPreset, string> = Object.freeze({
  'none': 'none',
  'sm': '0 2px 4px rgba(0,0,0,0.1)',
  'md': '0 4px 16px rgba(0,0,0,0.4)',
  'lg': '0 8px 32px rgba(0,0,0,0.5)',
  'glow': '0 0 30px rgba(255,255,255,0.6)'
});

/**
 * Bounce path presets - overshoot and settle animations
 */
export const BOUNCE_PRESETS: Record<BouncePreset, BouncePathConfig> = Object.freeze({
  energetic: Object.freeze({ overshoot: 0.25, bounces: 2, decayRatio: 0.5 }),
  playful: Object.freeze({ overshoot: 0.15, bounces: 1, decayRatio: 0.5 }),
  subtle: Object.freeze({ overshoot: 0.08, bounces: 1, decayRatio: 0.5 })
});

/**
 * Elastic path presets - spring-like oscillation animations
 */
export const ELASTIC_PRESETS: Record<ElasticPreset, ElasticPathConfig> = Object.freeze({
  gentle: Object.freeze({ stiffness: 150, damping: 30, mass: 1, oscillations: 2 }),
  bouncy: Object.freeze({ stiffness: 300, damping: 15, mass: 1, oscillations: 4 }),
  wobbly: Object.freeze({ stiffness: 180, damping: 12, mass: 1.5, oscillations: 5 }),
  snappy: Object.freeze({ stiffness: 400, damping: 25, mass: 0.8, oscillations: 2 })
});

/**
 * Wave path presets - sinusoidal path animations
 */
export const WAVE_PATH_PRESETS: Record<WavePathPreset, WavePathConfig> = Object.freeze({
  gentle: Object.freeze({ amplitude: 30, frequency: 1.5, decay: true, decayRate: 0.9, phase: 0 }),
  playful: Object.freeze({ amplitude: 50, frequency: 2.5, decay: true, decayRate: 0.7, phase: 0 }),
  serpentine: Object.freeze({ amplitude: 60, frequency: 3, decay: false, decayRate: 1, phase: 0 }),
  flutter: Object.freeze({ amplitude: 20, frequency: 4, decay: true, decayRate: 0.5, phase: 0 })
});

/**
 * Default path configuration (linear - no special path effects)
 */
export const DEFAULT_PATH_CONFIG: EntryPathConfig = Object.freeze({
  type: 'linear' as const
});

/**
 * Default image styling configuration
 */
export const DEFAULT_STYLING: ImageStylingConfig = Object.freeze({
  default: Object.freeze({
    border: Object.freeze({
      width: 0,
      color: '#000000',
      radius: 8,
      style: 'solid' as const
    }),
    shadow: 'md' as ShadowPreset,
    filter: Object.freeze({}),
    opacity: 1,
    cursor: 'pointer',
    outline: Object.freeze({
      width: 0,
      color: '#000000',
      style: 'solid' as const,
      offset: 0
    })
  }),
  hover: Object.freeze({
    shadow: 'lg' as ShadowPreset
  }),
  focused: Object.freeze({
    shadow: 'glow' as ShadowPreset
  })
});

/**
 * Default wave layout configuration
 */
export const DEFAULT_WAVE_CONFIG: WaveAlgorithmConfig = Object.freeze({
  rows: 1,
  amplitude: 100,
  frequency: 2,
  phaseShift: 0,
  synchronization: 'offset' as const
  // Note: Image rotation along wave is now controlled via image.rotation.mode = 'tangent'
});

/**
 * Default image sizing configuration
 */
export const DEFAULT_IMAGE_SIZING: ImageSizingConfig = Object.freeze({
  // baseHeight not set - layouts will auto-calculate based on targetCoverage
  variance: Object.freeze({
    min: 1.0,  // No variance by default
    max: 1.0
  }),
  scaleDecay: 0  // No decay by default
});

/**
 * Default image rotation configuration
 */
export const DEFAULT_IMAGE_ROTATION: ImageRotationConfig = Object.freeze({
  mode: 'none' as const,
  range: Object.freeze({
    min: -15,
    max: 15
  })
});

/**
 * Default image configuration
 */
export const DEFAULT_IMAGE_CONFIG: ImageConfig = Object.freeze({
  sizing: DEFAULT_IMAGE_SIZING,
  rotation: DEFAULT_IMAGE_ROTATION
});

/**
 * Default configuration object
 * Frozen to prevent accidental modifications
 */
export const DEFAULT_CONFIG: ImageCloudConfig = Object.freeze({
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

  // Image sizing and rotation configuration
  image: DEFAULT_IMAGE_CONFIG,

  // Pattern-based layout configuration
  layout: Object.freeze({
    algorithm: 'radial' as const,
    sizing: Object.freeze({
      base: 200,  // pixels - fallback when image.sizing.baseHeight not set
      responsive: [
        { minWidth: 1200, height: 225 },  // Large screens
        { minWidth: 768, height: 180 },   // Tablet / Small desktop
        { minWidth: 0, height: 100 }      // Mobile / Default
      ],
      adaptive: Object.freeze({
        enabled: true,             // Enable adaptive sizing by default
        minSize: 50,               // Minimum 50px image height
        maxSize: 400               // Maximum 400px image height
      })
    }),
    targetCoverage: 0.6,           // Target 60% of container area
    densityFactor: 1.0,            // Default density
    spacing: Object.freeze({
      padding: 50,   // padding from viewport edges
      minGap: 20     // minimum spacing between images
    }),
    debugRadials: false,
    debugCenters: false
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
      enabled: true,  // When false, all images display simultaneously
      interval: 150,  // ms between processing queue items (when enabled)
      maxConcurrent: undefined  // STUB: Not implemented yet
    }),
    performance: Object.freeze({
      useGPU: undefined,  // STUB: Not implemented yet
      reduceMotion: undefined  // STUB: Not implemented yet
    }),
    entry: Object.freeze({
      start: Object.freeze({
        position: 'nearest-edge' as const,  // Default to nearest edge (current behavior)
        offset: 100,  // pixels beyond edge
        circular: Object.freeze({
          radius: '120%',  // 120% of container diagonal
          distribution: 'even' as const
        })
      }),
      timing: Object.freeze({
        duration: 600,  // ms
        stagger: 150  // ms between images
      }),
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)',  // smooth deceleration
      path: DEFAULT_PATH_CONFIG
    })
  }),

  // Pattern-based interaction configuration
  interaction: Object.freeze({
    focus: Object.freeze({
      scalePercent: 0.8,  // 80% of container height
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

  // Image styling
  styling: DEFAULT_STYLING,

  // Debug mode
  debug: false
});

/**
 * Deep merge a single style state (border, filter, outline, etc.)
 */
function deepMergeStyleState(
  base: ImageStyleState | undefined,
  override: Partial<ImageStyleState> | undefined
): ImageStyleState {
  if (!base) return override as ImageStyleState || {};
  if (!override) return { ...base };

  const merged: ImageStyleState = { ...base };

  // Merge border
  if (override.border !== undefined) {
    merged.border = { ...base.border, ...override.border };
  }

  // Merge per-side borders
  if (override.borderTop !== undefined) {
    merged.borderTop = { ...base.borderTop, ...override.borderTop };
  }
  if (override.borderRight !== undefined) {
    merged.borderRight = { ...base.borderRight, ...override.borderRight };
  }
  if (override.borderBottom !== undefined) {
    merged.borderBottom = { ...base.borderBottom, ...override.borderBottom };
  }
  if (override.borderLeft !== undefined) {
    merged.borderLeft = { ...base.borderLeft, ...override.borderLeft };
  }

  // Merge filter
  if (override.filter !== undefined) {
    merged.filter = { ...base.filter, ...override.filter };
  }

  // Merge outline
  if (override.outline !== undefined) {
    merged.outline = { ...base.outline, ...override.outline };
  }

  // Override simple properties
  if (override.shadow !== undefined) merged.shadow = override.shadow;
  if (override.opacity !== undefined) merged.opacity = override.opacity;
  if (override.cursor !== undefined) merged.cursor = override.cursor;
  if (override.className !== undefined) merged.className = override.className;
  if (override.objectFit !== undefined) merged.objectFit = override.objectFit;
  if (override.aspectRatio !== undefined) merged.aspectRatio = override.aspectRatio;

  return merged;
}

/**
 * Deep merge styling config with proper state inheritance
 * - hover inherits from default, then applies overrides
 * - focused inherits from default, then applies overrides
 */
function deepMergeStyling(
  defaults: ImageStylingConfig,
  userStyling: Partial<ImageStylingConfig> | undefined
): ImageStylingConfig {
  if (!userStyling) return { ...defaults };

  // First, merge the default state
  const mergedDefault = deepMergeStyleState(defaults.default, userStyling.default);

  // Hover inherits from merged default, then user hover overrides
  const mergedHover = deepMergeStyleState(
    deepMergeStyleState(mergedDefault, defaults.hover),
    userStyling.hover
  );

  // Focused inherits from merged default, then user focused overrides
  const mergedFocused = deepMergeStyleState(
    deepMergeStyleState(mergedDefault, defaults.focused),
    userStyling.focused
  );

  return {
    default: mergedDefault,
    hover: mergedHover,
    focused: mergedFocused
  };
}

/**
 * Deep merge utility for config objects
 * Merges user config with default config
 */
/**
 * Deep merge image config with validation
 */
function deepMergeImageConfig(
  defaults: ImageConfig,
  userImage: Partial<ImageConfig> | undefined
): ImageConfig {
  if (!userImage) return { ...defaults };

  const merged: ImageConfig = { ...defaults };

  // Deep merge sizing config
  if (userImage.sizing !== undefined) {
    merged.sizing = {
      ...defaults.sizing,
      ...userImage.sizing
    };

    // Deep merge variance with validation
    if (userImage.sizing.variance) {
      const userVariance = userImage.sizing.variance as ImageVarianceConfig;
      const validMin = userVariance.min !== undefined && userVariance.min > 0.1 && userVariance.min < 1
        ? userVariance.min
        : defaults.sizing?.variance?.min ?? 1.0;
      const validMax = userVariance.max !== undefined && userVariance.max > 1 && userVariance.max < 2
        ? userVariance.max
        : defaults.sizing?.variance?.max ?? 1.0;
      merged.sizing!.variance = { min: validMin, max: validMax };
    }
  }

  // Deep merge rotation config
  if (userImage.rotation !== undefined) {
    merged.rotation = {
      ...defaults.rotation,
      ...userImage.rotation
    };

    // Deep merge rotation range with validation
    if (userImage.rotation.range) {
      const userRange = userImage.rotation.range;
      const validMin = userRange.min !== undefined && userRange.min >= -180 && userRange.min <= 0
        ? userRange.min
        : defaults.rotation?.range?.min ?? -15;
      const validMax = userRange.max !== undefined && userRange.max >= 0 && userRange.max <= 180
        ? userRange.max
        : defaults.rotation?.range?.max ?? 15;
      merged.rotation!.range = { min: validMin, max: validMax };
    }
  }

  return merged;
}

/**
 * Convert legacy layout.rotation config to new image.rotation format
 * This provides backward compatibility with the old API
 */
function convertLegacyRotationConfig(userConfig: DeepPartial<ImageCloudConfig>): Partial<ImageConfig> | undefined {
  const legacyRotation = (userConfig.layout as any)?.rotation;
  if (!legacyRotation) return undefined;

  // Legacy format: { enabled: boolean, range: { min, max } }
  if ('enabled' in legacyRotation) {
    return {
      rotation: {
        mode: legacyRotation.enabled ? 'random' : 'none',
        range: legacyRotation.range
      }
    };
  }

  return undefined;
}

/**
 * Convert legacy layout.sizing.variance config to new image.sizing.variance format
 */
function convertLegacyVarianceConfig(userConfig: DeepPartial<ImageCloudConfig>): Partial<ImageConfig> | undefined {
  const legacyVariance = (userConfig.layout as any)?.sizing?.variance;
  if (!legacyVariance) return undefined;

  return {
    sizing: {
      variance: legacyVariance
    }
  };
}

export function mergeConfig(
  userConfig: DeepPartial<ImageCloudConfig> = {}
): ImageCloudConfig {
  // Convert legacy configs to new format
  const legacyRotation = convertLegacyRotationConfig(userConfig);
  const legacyVariance = convertLegacyVarianceConfig(userConfig);

  // Combine user image config with converted legacy configs
  // User's explicit image config takes precedence over legacy conversions
  let combinedImageConfig: Partial<ImageConfig> | undefined = userConfig.image as Partial<ImageConfig> | undefined;
  if (legacyRotation || legacyVariance) {
    combinedImageConfig = {
      ...(legacyVariance || {}),
      ...(legacyRotation || {}),
      ...combinedImageConfig
    };
    // Deep merge the rotation config if both exist
    if (combinedImageConfig.rotation && legacyRotation?.rotation && userConfig.image?.rotation) {
      combinedImageConfig.rotation = {
        ...legacyRotation.rotation,
        ...(userConfig.image as any).rotation
      };
    }
  }

  const merged: ImageCloudConfig = {
    loader: { ...DEFAULT_CONFIG.loader },
    image: deepMergeImageConfig(DEFAULT_IMAGE_CONFIG, combinedImageConfig),
    layout: { ...DEFAULT_CONFIG.layout },
    animation: { ...DEFAULT_CONFIG.animation },
    interaction: { ...DEFAULT_CONFIG.interaction },
    rendering: { ...DEFAULT_CONFIG.rendering },
    styling: deepMergeStyling(DEFAULT_STYLING, userConfig.styling as Partial<ImageStylingConfig> | undefined),
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
        responsive: (userConfig.layout.sizing.responsive as ResponsiveHeight[]) || DEFAULT_CONFIG.layout.sizing.responsive,
        adaptive: userConfig.layout.sizing.adaptive
          ? { ...DEFAULT_CONFIG.layout.sizing.adaptive!, ...(userConfig.layout.sizing.adaptive as AdaptiveSizingConfig) }
          : DEFAULT_CONFIG.layout.sizing.adaptive
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

    // Deep merge entry animation config
    if (userConfig.animation.entry) {
      merged.animation.entry = {
        ...DEFAULT_CONFIG.animation.entry!,
        ...userConfig.animation.entry,
        start: userConfig.animation.entry.start
          ? {
              ...DEFAULT_CONFIG.animation.entry!.start,
              ...userConfig.animation.entry.start,
              circular: userConfig.animation.entry.start.circular
                ? { ...DEFAULT_CONFIG.animation.entry!.start.circular, ...userConfig.animation.entry.start.circular }
                : DEFAULT_CONFIG.animation.entry!.start.circular
            }
          : DEFAULT_CONFIG.animation.entry!.start,
        timing: userConfig.animation.entry.timing
          ? { ...DEFAULT_CONFIG.animation.entry!.timing, ...userConfig.animation.entry.timing }
          : DEFAULT_CONFIG.animation.entry!.timing,
        path: userConfig.animation.entry.path
          ? { ...DEFAULT_PATH_CONFIG, ...userConfig.animation.entry.path }
          : DEFAULT_CONFIG.animation.entry!.path
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
 * Resolve bounce path config from preset and overrides
 */
export function resolveBounceConfig(
  preset?: BouncePreset,
  overrides?: Partial<BouncePathConfig>
): BouncePathConfig {
  const base = preset ? BOUNCE_PRESETS[preset] : BOUNCE_PRESETS.playful;
  return { ...base, ...overrides };
}

/**
 * Resolve elastic path config from preset and overrides
 */
export function resolveElasticConfig(
  preset?: ElasticPreset,
  overrides?: Partial<ElasticPathConfig>
): ElasticPathConfig {
  const base = preset ? ELASTIC_PRESETS[preset] : ELASTIC_PRESETS.gentle;
  return { ...base, ...overrides };
}

/**
 * Resolve wave path config from preset and overrides
 */
export function resolveWavePathConfig(
  preset?: WavePathPreset,
  overrides?: Partial<WavePathConfig>
): WavePathConfig {
  const base = preset ? WAVE_PATH_PRESETS[preset] : WAVE_PATH_PRESETS.gentle;
  return { ...base, ...overrides };
}

/**
 * Debug logger
 */
export function debugLog(config: ImageCloudConfig, ...args: unknown[]): void {
  if (config.debug && typeof console !== 'undefined') {
    console.log(...args);
  }
}