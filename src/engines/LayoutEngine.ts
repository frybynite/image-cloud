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

import type { LayoutConfig, ImageLayout, ContainerBounds, PlacementGenerator, AdaptiveSizingResult, LayoutSizingConfig } from '../config/types';
import { RandomPlacementGenerator } from '../generators/RandomPlacementGenerator';
import { RadialPlacementGenerator } from '../generators/RadialPlacementGenerator';
import { GridPlacementGenerator } from '../generators/GridPlacementGenerator';
import { SpiralPlacementGenerator } from '../generators/SpiralPlacementGenerator';
import { ClusterPlacementGenerator } from '../generators/ClusterPlacementGenerator';

export class LayoutEngine {
  private config: LayoutConfig;
  private layouts: Map<number, ImageLayout>;
  private generator: PlacementGenerator;

  constructor(config: LayoutConfig) {
    this.config = config;

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
        return new RadialPlacementGenerator(this.config);
      case 'grid':
        return new GridPlacementGenerator(this.config);
      case 'spiral':
        return new SpiralPlacementGenerator(this.config);
      case 'cluster':
        return new ClusterPlacementGenerator(this.config);
      case 'random':
      default:
        return new RandomPlacementGenerator(this.config);
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
  updateConfig(newConfig: Partial<LayoutConfig>): void {
    // Deep merge not implemented here, assuming simplified updates for now
    // or that newConfig is structurally compatible with specific overrides
    Object.assign(this.config, newConfig);

    // Reinitialize generator if algorithm changed
    if (newConfig.algorithm && newConfig.algorithm !== this.config.algorithm) {
      this.generator = this.initGenerator();
    }
  }

  /**
   * Calculate adaptive image size based on container dimensions and image count
   * @param containerBounds - Container dimensions {width, height}
   * @param imageCount - Number of images to display
   * @param sizingConfig - Sizing configuration including responsive and adaptive settings
   * @param responsiveHeight - Current responsive breakpoint height (upper bound)
   * @returns Calculated sizing result with height and optional truncate count
   */
  calculateAdaptiveSize(
    containerBounds: ContainerBounds,
    imageCount: number,
    sizingConfig: LayoutSizingConfig,
    responsiveHeight: number
  ): AdaptiveSizingResult {
    const adaptive = sizingConfig.adaptive;

    // If adaptive sizing is disabled, return responsive height
    if (!adaptive || !adaptive.enabled) {
      return { height: responsiveHeight };
    }

    const { width, height } = containerBounds;
    const { minSize, maxSize, targetCoverage, densityFactor, overflowBehavior } = adaptive;

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

    // Handle overflow behavior
    if (finalHeight === minSize && calculatedHeight < minSize) {
      // Images still wouldn't fit at minimum size
      if (overflowBehavior === 'truncate') {
        // Calculate how many images can fit at minSize
        const minImageArea = minSize * (minSize * aspectRatio);
        const maxImages = Math.floor(targetArea / minImageArea);
        return {
          height: minSize,
          truncateCount: Math.max(1, maxImages)
        };
      }
      // 'minimize' behavior: force fit below minimum
      // Recalculate without minimum constraint
      finalHeight = Math.max(20, calculatedHeight); // Hard floor at 20px
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