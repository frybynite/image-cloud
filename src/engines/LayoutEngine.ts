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

import type { LayoutConfig, ImageLayout, ContainerBounds, PlacementGenerator } from '../config/types';
import { RandomPlacementGenerator } from '../generators/RandomPlacementGenerator';
import { RadialPlacementGenerator } from '../generators/RadialPlacementGenerator';

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
}