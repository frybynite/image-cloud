/**
 * RandomPlacementGenerator.ts
 * Generates random overlapping layouts for image cloud
 */

import type { PlacementGenerator, ImageLayout, ContainerBounds, LayoutConfig, ImageConfig } from '../config/types';

interface RandomLayoutOptions extends Partial<LayoutConfig> {
  fixedHeight?: number;
}

export class RandomPlacementGenerator implements PlacementGenerator {
  private config: LayoutConfig;
  private imageConfig: ImageConfig;

  constructor(config: LayoutConfig, imageConfig: ImageConfig = {}) {
    this.config = config;
    this.imageConfig = imageConfig;
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

    // Get rotation config from image config
    const rotationMode = this.imageConfig.rotation?.mode ?? 'none';
    const minRotation = this.imageConfig.rotation?.range?.min ?? -15;
    const maxRotation = this.imageConfig.rotation?.range?.max ?? 15;

    // Get variance config from image config
    const varianceMin = this.imageConfig.sizing?.variance?.min ?? 1.0;
    const varianceMax = this.imageConfig.sizing?.variance?.max ?? 1.0;
    const hasVariance = varianceMin !== 1.0 || varianceMax !== 1.0;

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

      // Random rotation within range (only when mode is random)
      const rotation = rotationMode === 'random' ? this.random(minRotation, maxRotation) : 0;

      // Random size variance
      const scale = hasVariance ? this.random(varianceMin, varianceMax) : 1.0;
      const scaledImageSize = baseImageSize * scale;

      const layout: ImageLayout = {
        id: i,
        x,
        y,
        rotation,
        scale,
        baseSize: scaledImageSize
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
