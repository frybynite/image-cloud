/**
 * LayoutEngine.ts
 * Generates layouts for image cloud using placement strategies
 *
 * Public API:
 * - generateLayout(imageCount, containerBounds, options)
 * - getOriginalState(imageId)
 * - reset()
 * - updateConfig(newConfig)
 */

import type { LayoutConfig, ImageLayout, ContainerBounds, PlacementGenerator, AdaptiveSizingResult, ImageConfig, ResponsiveBaseHeight } from '../config/types';
import { RandomPlacementGenerator } from '../generators/RandomPlacementGenerator';
import { RadialPlacementGenerator } from '../generators/RadialPlacementGenerator';
import { GridPlacementGenerator } from '../generators/GridPlacementGenerator';
import { SpiralPlacementGenerator } from '../generators/SpiralPlacementGenerator';
import { ClusterPlacementGenerator } from '../generators/ClusterPlacementGenerator';
import { WavePlacementGenerator } from '../generators/WavePlacementGenerator';

export interface LayoutEngineConfig {
  layout: LayoutConfig;
  image: ImageConfig;
  breakpoints?: {
    mobile: number;
    tablet?: number;
  };
}

export class LayoutEngine {
  private config: LayoutConfig;
  private imageConfig: ImageConfig;
  private breakpoints: { mobile: number; tablet?: number };
  private layouts: Map<number, ImageLayout>;
  private generator: PlacementGenerator;

  constructor(config: LayoutEngineConfig) {
    this.config = config.layout;
    this.imageConfig = config.image;
    this.breakpoints = config.breakpoints ?? { mobile: 768 };

    this.layouts = new Map();  // Store original states by image ID

    // Initialize generator strategy
    this.generator = this.initGenerator();
  }

  /**
   * Initialize the appropriate generator based on config type
   * @returns Initialized placement generator
   */
  private initGenerator(): PlacementGenerator {
    switch (this.config.algorithm) {
      case 'radial':
        return new RadialPlacementGenerator(this.config, this.imageConfig);
      case 'grid':
        return new GridPlacementGenerator(this.config, this.imageConfig);
      case 'spiral':
        return new SpiralPlacementGenerator(this.config, this.imageConfig);
      case 'cluster':
        return new ClusterPlacementGenerator(this.config, this.imageConfig);
      case 'wave':
        return new WavePlacementGenerator(this.config, this.imageConfig);
      case 'random':
      default:
        return new RandomPlacementGenerator(this.config, this.imageConfig);
    }
  }

  /**
   * Generate layout positions for images
   * @param imageCount - Number of images to layout
   * @param containerBounds - Container dimensions {width, height}
   * @param options - Optional overrides for configuration (e.g. fixedHeight)
   * @returns Array of layout objects with position, rotation, scale
   */
  generateLayout(imageCount: number, containerBounds: ContainerBounds, options: Partial<LayoutConfig> = {}): ImageLayout[] {
    const layouts = this.generator.generate(imageCount, containerBounds, options);

    // Store layouts for state retrieval
    layouts.forEach(layout => {
      this.layouts.set(layout.id, layout);
    });

    return layouts;
  }

  /**
   * Get the original layout state for an image
   * @param imageId - The image ID (number or string)
   * @returns Original layout state or undefined if not found
   */
  getOriginalState(imageId: number | string): ImageLayout | undefined {
    return this.layouts.get(Number(imageId));
  }

  /**
   * Reset all stored layouts
   */
  reset(): void {
    this.layouts.clear();
  }

  /**
   * Update config dynamically (useful for responsive changes)
   * @param newConfig - Updated configuration
   */
  updateConfig(newConfig: Partial<LayoutEngineConfig>): void {
    // Update layout config
    if (newConfig.layout) {
      Object.assign(this.config, newConfig.layout);

      // Reinitialize generator if algorithm changed
      if (newConfig.layout.algorithm && newConfig.layout.algorithm !== this.config.algorithm) {
        this.generator = this.initGenerator();
      }
    }

    // Update image config
    if (newConfig.image) {
      Object.assign(this.imageConfig, newConfig.image);
    }

    // Update breakpoints
    if (newConfig.breakpoints) {
      this.breakpoints = newConfig.breakpoints;
    }
  }

  /**
   * Resolve the effective base height based on image config and current viewport
   * @param viewportWidth - Current viewport width
   * @returns Resolved base height or undefined if should auto-calculate
   */
  resolveBaseHeight(viewportWidth: number): number | undefined {
    const baseHeight = this.imageConfig.sizing?.baseHeight;

    if (baseHeight === undefined) {
      return undefined; // Signal to auto-calculate
    }

    if (typeof baseHeight === 'number') {
      return baseHeight;
    }

    // Responsive base height
    const responsive = baseHeight as ResponsiveBaseHeight;

    if (viewportWidth <= this.breakpoints.mobile) {
      return responsive.mobile ?? responsive.tablet ?? responsive.default;
    }

    if (this.breakpoints.tablet && viewportWidth <= this.breakpoints.tablet) {
      return responsive.tablet ?? responsive.default;
    }

    return responsive.default;
  }

  /**
   * Calculate adaptive image size based on container dimensions and image count
   * @param containerBounds - Container dimensions {width, height}
   * @param imageCount - Number of images to display
   * @param responsiveHeight - Current responsive breakpoint height (upper bound)
   * @param viewportWidth - Current viewport width for baseHeight resolution
   * @returns Calculated sizing result with height
   */
  calculateAdaptiveSize(
    containerBounds: ContainerBounds,
    imageCount: number,
    responsiveHeight: number,
    viewportWidth: number
  ): AdaptiveSizingResult {
    const adaptive = this.config.sizing.adaptive;

    // Check if user specified a baseHeight in image config
    const userBaseHeight = this.resolveBaseHeight(viewportWidth);

    // If user specified baseHeight, use it (clamped to responsive max and adaptive bounds)
    if (userBaseHeight !== undefined) {
      let height = Math.min(userBaseHeight, responsiveHeight);
      if (adaptive) {
        height = this.clamp(height, adaptive.minSize, adaptive.maxSize);
      }
      return { height };
    }

    // If adaptive sizing is disabled, return responsive height
    if (!adaptive || !adaptive.enabled) {
      return { height: responsiveHeight };
    }

    const { width, height } = containerBounds;
    const { minSize, maxSize } = adaptive;
    const targetCoverage = this.config.targetCoverage ?? 0.6;
    const densityFactor = this.config.densityFactor ?? 1.0;

    // Calculate area-based optimal size
    const containerArea = width * height;
    const targetArea = containerArea * targetCoverage;
    const areaPerImage = targetArea / imageCount;

    // Calculate height from area assuming 1.4 aspect ratio (landscape images)
    const aspectRatio = 1.4;
    let calculatedHeight = Math.sqrt(areaPerImage / aspectRatio);

    // Apply density factor
    calculatedHeight *= densityFactor;

    // Clamp to responsive maximum (responsive height is the ceiling)
    calculatedHeight = Math.min(calculatedHeight, responsiveHeight);

    // Apply min/max constraints
    let finalHeight = this.clamp(calculatedHeight, minSize, maxSize);

    // 'minimize' behavior: force fit below minimum if needed (0.05 floor)
    if (finalHeight === minSize && calculatedHeight < minSize) {
      // Minimum floor is 5% of calculated size
      const floor = Math.max(minSize * 0.05, 20);
      finalHeight = Math.max(floor, calculatedHeight);
    }

    return { height: finalHeight };
  }

  /**
   * Utility: Clamp a value between min and max
   */
  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }
}