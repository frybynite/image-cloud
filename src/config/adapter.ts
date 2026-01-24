/**
 * Legacy Options Adapter
 * Converts old parameter structure to new pattern-based structure
 * Provides backward compatibility with deprecation warnings
 */

import type {
  ImageCloudOptions,
  LegacyImageGalleryOptions,
  GoogleDriveSource,
  LoaderConfig,
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
      (opts.googleDrive && !opts.loader) ||
      (opts.staticLoader && !opts.loader) ||
      (opts.config && !opts.layout && !opts.animation && !opts.interaction)
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
    newOptions.loader = this.convertLoader(oldOptions);

    // Convert layout and image configuration
    if (oldOptions.config?.layout) {
      const { layout, image } = this.convertLayout(oldOptions.config.layout);
      newOptions.layout = layout;
      newOptions.image = image;
    }

    // Convert animation configuration
    if (oldOptions.config?.animation) {
      newOptions.animation = this.convertAnimation(oldOptions.config.animation);
    }

    // Convert zoom to interaction.focus
    if (oldOptions.config?.zoom) {
      newOptions.interaction = this.convertZoomToInteraction(oldOptions.config.zoom);
    }

    // Convert rendering configuration
    newOptions.rendering = this.convertRendering(oldOptions);

    // Convert debug flag
    if (oldOptions.config?.debugLogging !== undefined) {
      newOptions.debug = oldOptions.config.debugLogging;
    }

    return newOptions;
  }

  /**
   * Convert loader configuration
   */
  private static convertLoader(oldOptions: OldOptions): Partial<LoaderConfig> {
    const loader: Partial<LoaderConfig> = {};

    // Determine loader type
    const loaderType = oldOptions.loaderType || oldOptions.config?.loader?.type || 'googleDrive';
    loader.type = loaderType;

    if (loaderType === 'googleDrive') {
      this.warn('loader', 'Top-level loaderType, folderUrl, and googleDrive are deprecated. Use the unified "loader" configuration instead.');

      // Convert Google Drive configuration
      const apiKey = oldOptions.googleDrive?.apiKey || oldOptions.config?.googleDrive?.apiKey || '';

      // Convert folderUrl to sources array
      const sources: GoogleDriveSource[] = [];

      if (oldOptions.folderUrl) {
        sources.push({
          type: 'folder',
          folders: [oldOptions.folderUrl],
          recursive: true  // Default to recursive for backward compatibility
        });
      }

      loader.googleDrive = {
        apiKey,
        sources,
        apiEndpoint: oldOptions.config?.googleDrive?.apiEndpoint,
        allowedExtensions: oldOptions.config?.googleDrive?.imageExtensions,
        debugLogging: oldOptions.config?.debugLogging
      };
    } else if (loaderType === 'static') {
      this.warn('loader', 'Top-level staticLoader is deprecated. Use the unified "loader" configuration instead.');

      // Convert static loader configuration
      const staticConfig = oldOptions.staticLoader || oldOptions.config?.loader?.static;

      if (staticConfig) {
        const config = staticConfig as any;
        loader.static = {
          sources: config.sources || [],
          validateUrls: config.validateUrls,
          validationTimeout: config.validationTimeout,
          validationMethod: config.validationMethod,
          failOnAllMissing: config.failOnAllMissing,
          allowedExtensions: config.imageExtensions || config.allowedExtensions,
          debugLogging: oldOptions.config?.debugLogging
        };
      }
    }

    return loader;
  }

  /**
   * Convert layout configuration to new pattern-based structure
   * Returns both layout and image configs since legacy format combined them
   */
  private static convertLayout(oldLayout: any): { layout: Partial<LayoutConfig>; image: Partial<ImageConfig> } {
    this.warn('layout', 'Flat layout configuration is deprecated. Use the pattern-based structure with sizing in "image" config and spacing in "layout" config.');

    const newLayout: Partial<LayoutConfig> = {
      algorithm: oldLayout.type || 'radial',
      debugRadials: oldLayout.debugRadials
    };

    // Convert layout sizing configuration (base and responsive only)
    newLayout.sizing = {
      base: oldLayout.baseImageSize || 200,
      responsive: oldLayout.responsiveHeights || []
    };

    // Convert spacing configuration
    newLayout.spacing = {
      padding: oldLayout.padding ?? 50,
      minGap: oldLayout.minSpacing ?? 20
    };

    // Convert image configuration (variance and rotation now in image config)
    const newImage: Partial<ImageConfig> = {};

    // Convert sizing with variance
    newImage.sizing = {
      variance: {
        min: oldLayout.sizeVarianceMin ?? 1.0,
        max: oldLayout.sizeVarianceMax ?? 1.0
      }
    };

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
   */
  private static convertZoomToInteraction(oldZoom: any): Partial<InteractionConfig> {
    this.warn('interaction', 'Zoom configuration is deprecated. Use "interaction.focus" instead.');

    return {
      focus: {
        scale: oldZoom.focusScale ?? 2.5,
        mobileScale: oldZoom.mobileScale ?? 2.0,
        unfocusedOpacity: oldZoom.unfocusedOpacity,
        zIndex: oldZoom.focusZIndex ?? 1000
      }
    };
  }

  /**
   * Convert rendering configuration (breakpoints + ui)
   */
  private static convertRendering(oldOptions: OldOptions): Partial<RenderingConfig> {
    const rendering: Partial<RenderingConfig> = {};

    // Convert responsive configuration
    if (oldOptions.config?.breakpoints || oldOptions.config?.isMobile) {
      this.warn('rendering', 'Top-level breakpoints and isMobile are deprecated. Use "rendering.responsive" instead.');

      rendering.responsive = {
        breakpoints: {
          mobile: oldOptions.config?.breakpoints?.mobile ?? 768
        },
        mobileDetection: oldOptions.config?.isMobile || (() => {
          if (typeof window === 'undefined') return false;
          return window.innerWidth <= 768;
        })
      };
    }

    // Convert UI configuration
    if (oldOptions.config?.ui) {
      this.warn('rendering', 'Top-level ui configuration is deprecated. Use "rendering.ui" instead.');

      rendering.ui = {
        showLoadingSpinner: oldOptions.config.ui.showLoadingSpinner ?? false
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
