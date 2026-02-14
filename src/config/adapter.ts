/**
 * Legacy Options Adapter
 * Converts old parameter structure to new pattern-based structure
 * Provides backward compatibility with deprecation warnings
 */

import type {
  ImageCloudOptions,
  LegacyImageGalleryOptions,
  LoaderEntry,
  LayoutConfig,
  AnimationConfig,
  InteractionConfig,
  RenderingConfig,
  ImageConfig
} from './types';

// Type aliases for clarity in the adapter
type NewOptions = Partial<ImageCloudOptions>;
type OldOptions = LegacyImageGalleryOptions;

/**
 * Tracks which deprecation warnings have been shown
 */
const shownWarnings = new Set<string>();

/**
 * Legacy Options Adapter
 * Converts old-style options to new pattern-based options
 */
export class LegacyOptionsAdapter {
  /**
   * Detect if options are in legacy format
   */
  static isLegacyFormat(options: ImageCloudOptions | OldOptions): options is OldOptions {
    const opts = options as any;

    // Check for legacy top-level properties
    return !!(
      opts.containerId ||
      opts.loaderType ||
      opts.folderUrl ||
      (opts.googleDrive && !opts.loaders) ||
      (opts.config?.layout && !opts.layout && !opts.animation && !opts.interaction)
    );
  }

  /**
   * Convert legacy options to new pattern-based options
   */
  static convert(oldOptions: OldOptions): NewOptions {
    const newOptions: NewOptions = {};

    // Convert container ID
    if (oldOptions.containerId) {
      this.warn('container', 'containerId is deprecated. Use "container" instead.');
      newOptions.container = oldOptions.containerId;
    }

    // Convert loader configuration
    newOptions.loaders = this.convertLoader(oldOptions);

    // Convert layout and image configuration
    const legacyConfig = (oldOptions as any).config;

    if (legacyConfig?.layout) {
      const { layout, image } = this.convertLayout(legacyConfig.layout);
      newOptions.layout = layout;
      newOptions.image = image;
    }

    // Convert animation configuration
    if (legacyConfig?.animation) {
      newOptions.animation = this.convertAnimation(legacyConfig.animation);
    }

    // Convert zoom to interaction.focus
    if (legacyConfig?.zoom) {
      newOptions.interaction = this.convertZoomToInteraction(legacyConfig.zoom);
    }

    // Convert rendering configuration
    newOptions.rendering = this.convertRendering(oldOptions);

    // Convert debug flag to new config.debug namespace
    if (legacyConfig?.debugLogging !== undefined) {
      if (!newOptions.config) newOptions.config = {};
      if (!newOptions.config.debug) newOptions.config.debug = {};
      newOptions.config.debug.enabled = legacyConfig.debugLogging;
      newOptions.config.debug.loaders = legacyConfig.debugLogging;
    }

    return newOptions;
  }

  /**
   * Convert loader configuration to new LoaderEntry[] format
   */
  private static convertLoader(oldOptions: OldOptions): LoaderEntry[] {
    const opts = oldOptions as any;
    const legacyConfig = opts.config;

    // Determine loader type
    const loaderType = oldOptions.loaderType || legacyConfig?.loader?.type || 'googleDrive';

    if (loaderType === 'googleDrive') {
      this.warn('loader', 'Top-level loaderType, folderUrl, and googleDrive are deprecated. Use "loaders" array instead.');

      const apiKey = oldOptions.googleDrive?.apiKey || legacyConfig?.googleDrive?.apiKey || '';

      const sources: any[] = [];
      if (oldOptions.folderUrl) {
        sources.push({
          folders: [oldOptions.folderUrl],
          recursive: true
        });
      }

      return [{
        googleDrive: {
          apiKey,
          sources,
          apiEndpoint: legacyConfig?.googleDrive?.apiEndpoint,
          allowedExtensions: legacyConfig?.googleDrive?.imageExtensions
        }
      }];
    } else if (loaderType === 'static') {
      this.warn('loader', 'Top-level staticLoader is deprecated. Use "loaders" array instead.');

      const staticConfig = opts.staticLoader || legacyConfig?.loader?.static;

      if (staticConfig) {
        const config = staticConfig as any;
        return [{
          static: {
            sources: config.sources || [],
            validateUrls: config.validateUrls,
            validationTimeout: config.validationTimeout,
            validationMethod: config.validationMethod,
            allowedExtensions: config.imageExtensions || config.allowedExtensions
          }
        }];
      }
    }

    return [];
  }

  /**
   * Convert layout configuration to new pattern-based structure
   * Returns both layout and image configs since legacy format combined them
   */
  private static convertLayout(oldLayout: any): { layout: Partial<LayoutConfig>; image: Partial<ImageConfig> } {
    this.warn('layout', 'Flat layout configuration is deprecated. Use the pattern-based structure with sizing in "image" config and spacing in "layout" config.');

    const newLayout: Partial<LayoutConfig> = {
      algorithm: oldLayout.type || 'radial'
    };

    // Convert spacing configuration
    newLayout.spacing = {
      padding: oldLayout.padding ?? 50,
      minGap: oldLayout.minSpacing ?? 20
    };

    // Convert image configuration (sizing, variance and rotation now in image config)
    const newImage: Partial<ImageConfig> = {};

    // If baseImageSize is provided, use fixed mode with that height
    const baseHeight = oldLayout.baseImageSize;
    if (baseHeight) {
      newImage.sizing = {
        mode: 'fixed',
        height: baseHeight,
        variance: {
          min: oldLayout.sizeVarianceMin ?? 1.0,
          max: oldLayout.sizeVarianceMax ?? 1.0
        }
      };
    } else {
      // Default to adaptive mode
      newImage.sizing = {
        mode: 'adaptive',
        variance: {
          min: oldLayout.sizeVarianceMin ?? 1.0,
          max: oldLayout.sizeVarianceMax ?? 1.0
        }
      };
    }

    // Convert rotation configuration
    const rotationEnabled = oldLayout.rotationRange !== undefined && oldLayout.rotationRange > 0;
    newImage.rotation = {
      mode: rotationEnabled ? 'random' : 'none',
      range: {
        min: oldLayout.minRotation ?? -15,
        max: oldLayout.maxRotation ?? 15
      }
    };

    return { layout: newLayout, image: newImage };
  }

  /**
   * Convert animation configuration to new pattern-based structure
   */
  private static convertAnimation(oldAnimation: any): Partial<AnimationConfig> {
    this.warn('animation', 'Flat animation configuration is deprecated. Use the pattern-based structure with easing, queue, and performance groups.');

    const newAnimation: Partial<AnimationConfig> = {
      duration: oldAnimation.duration || 600
    };

    // Convert easing configuration
    newAnimation.easing = {
      default: oldAnimation.easing || 'cubic-bezier(0.4, 0.0, 0.2, 1)',
      bounce: oldAnimation.bounceEasing || 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      focus: oldAnimation.easing || 'cubic-bezier(0.4, 0.0, 0.2, 1)'
    };

    // Convert queue configuration
    newAnimation.queue = {
      enabled: true,
      interval: oldAnimation.queueInterval ?? 150
    };

    return newAnimation;
  }

  /**
   * Convert zoom configuration to interaction.focus
   * Note: Old focusScale/mobileScale multipliers don't directly translate to scalePercent.
   * Using default scalePercent of 0.8 for compatibility.
   */
  private static convertZoomToInteraction(oldZoom: any): Partial<InteractionConfig> {
    this.warn('interaction', 'Zoom configuration is deprecated. Use "interaction.focus" with scalePercent instead. Old focusScale/mobileScale values are not directly convertible.');

    return {
      focus: {
        scalePercent: 0.8,  // Default - old scale values don't translate directly
        zIndex: oldZoom.focusZIndex ?? 1000
      }
    };
  }

  /**
   * Convert rendering configuration (breakpoints + ui)
   */
  private static convertRendering(oldOptions: OldOptions): Partial<RenderingConfig> {
    const rendering: Partial<RenderingConfig> = {};
    const legacyConfig = (oldOptions as any).config;

    // Convert responsive configuration
    if (legacyConfig?.breakpoints || legacyConfig?.isMobile) {
      this.warn('rendering', 'Top-level breakpoints and isMobile are deprecated. Use "rendering.responsive" instead.');

      rendering.responsive = {
        breakpoints: {
          mobile: legacyConfig?.breakpoints?.mobile ?? 768
        },
        mobileDetection: legacyConfig?.isMobile || (() => {
          if (typeof window === 'undefined') return false;
          return window.innerWidth <= 768;
        })
      };
    }

    // Convert UI configuration
    if (legacyConfig?.ui) {
      this.warn('rendering', 'Top-level ui configuration is deprecated. Use "rendering.ui" instead.');

      rendering.ui = {
        showLoadingSpinner: legacyConfig.ui.showLoadingSpinner ?? false
      };
    }

    return rendering;
  }

  /**
   * Show a deprecation warning (once per category)
   */
  private static warn(category: string, message: string): void {
    if (shownWarnings.has(category)) {
      return;  // Already warned about this category
    }

    shownWarnings.add(category);

    if (typeof console !== 'undefined') {
      console.warn(
        `[ImageCloud Deprecation Warning] ${message}\n` +
        `See migration guide: https://github.com/frybynite/image-cloud#migration-guide`
      );
    }
  }

  /**
   * Clear shown warnings (useful for testing)
   */
  static clearWarnings(): void {
    shownWarnings.clear();
  }
}
