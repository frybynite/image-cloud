/**
 * RandomPlacementGenerator.ts
 * Generates random overlapping layouts for image cloud
 */

import type { PlacementGenerator, ImageLayout, ContainerBounds, LayoutConfig } from '../config/types';

interface RandomLayoutOptions extends Partial<LayoutConfig> {
  fixedHeight?: number;
}

export class RandomPlacementGenerator implements PlacementGenerator {
  private config: LayoutConfig;

  constructor(config: LayoutConfig) {
    this.config = config;
  }

  /**
   * Generate random layout positions for images
   * @param imageCount - Number of images to layout
   * @param containerBounds - Container dimensions {width, height}
   * @param options - Optional overrides (includes fixedHeight)
   * @returns Array of layout objects with position, rotation, scale
   */
  generate(imageCount: number, containerBounds: ContainerBounds, options: RandomLayoutOptions = {}): ImageLayout[] {
    const layouts: ImageLayout[] = [];
    const { width, height } = containerBounds;

    const padding = this.config.spacing.padding;
    // Use fixedHeight if provided, otherwise use base size from config
    const baseImageSize = options.fixedHeight ?? this.config.sizing.base;
    const rotationRange = this.config.rotation.range.max;
    const sizeVarianceMin = this.config.sizing.variance.min;
    const sizeVarianceMax = this.config.sizing.variance.max;

    // Calculate safe bounds for center positions (accounting for half image size and padding)
    // Use 16:9 aspect ratio (1.78) as maximum to handle most landscape images
    const estAspectRatio = 1.5; // 3:2 - balanced for mixed portrait/landscape
    const halfWidth = (baseImageSize * estAspectRatio) / 2;
    const halfHeight = baseImageSize / 2;

    const maxX = width - padding - halfWidth;
    const maxY = height - padding - halfHeight;
    const minX = padding + halfWidth;
    const minY = padding + halfHeight;

    for (let i = 0; i < imageCount; i++) {
      // Random center position within safe bounds
      const x = this.random(minX, maxX);
      const y = this.random(minY, maxY);

      // Random rotation within range
      const rotation = this.random(-rotationRange, rotationRange);

      // Random size variance
      const scale = this.random(sizeVarianceMin, sizeVarianceMax);

      const layout: ImageLayout = {
        id: i,
        x,
        y,
        rotation,
        scale,
        baseSize: baseImageSize
      };

      layouts.push(layout);
    }

    return layouts;
  }

  /**
   * Utility: Generate random number between min and max
   * @param min - Minimum value
   * @param max - Maximum value
   * @returns Random number in range
   */
  private random(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }
}