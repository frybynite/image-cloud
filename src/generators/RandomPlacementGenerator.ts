/**
 * RandomPlacementGenerator.ts
 * Generates random overlapping layouts for image cloud
 */

import type { PlacementGenerator, ImageLayout, ContainerBounds, LayoutConfig } from '../config/types';

export class RandomPlacementGenerator implements PlacementGenerator {
  private config: LayoutConfig;

  constructor(config: LayoutConfig) {
    this.config = config;
  }

  /**
   * Generate random layout positions for images
   * @param imageCount - Number of images to layout
   * @param containerBounds - Container dimensions {width, height}
   * @param options - Optional overrides
   * @returns Array of layout objects with position, rotation, scale
   */
  generate(imageCount: number, containerBounds: ContainerBounds, _options: Partial<LayoutConfig> = {}): ImageLayout[] {
    const layouts: ImageLayout[] = [];
    const { width, height } = containerBounds;
    const { padding, baseImageSize, rotationRange, sizeVarianceMin, sizeVarianceMax } = this.config;

    // Calculate safe bounds (accounting for image size and padding)
    const maxX = width - baseImageSize - padding;
    const maxY = height - baseImageSize - padding;
    const minX = padding;
    const minY = padding;

    for (let i = 0; i < imageCount; i++) {
      // Random position within safe bounds
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
