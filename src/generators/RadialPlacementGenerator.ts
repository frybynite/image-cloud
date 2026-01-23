/**
 * RadialPlacementGenerator.ts
 * Generates concentric radial layouts for image cloud
 */

import type { PlacementGenerator, ImageLayout, ContainerBounds, LayoutConfig } from '../config/types';

interface RadialLayoutOptions extends Partial<LayoutConfig> {
  fixedHeight?: number;
}

export class RadialPlacementGenerator implements PlacementGenerator {
  private config: LayoutConfig;

  constructor(config: LayoutConfig) {
    this.config = config;
  }

  /**
   * Generate radial layout positions for images
   * @param imageCount - Number of images to layout
   * @param containerBounds - Container dimensions {width, height}
   * @param options - Optional overrides
   * @returns Array of layout objects with position, rotation, scale
   */
  generate(
    imageCount: number,
    containerBounds: ContainerBounds,
    options: RadialLayoutOptions = {}
  ): ImageLayout[] {
    const layouts: ImageLayout[] = [];
    const { width, height } = containerBounds;
    const { debugRadials } = this.config;
    const baseImageSize = this.config.sizing.base;
    const rotationEnabled = this.config.rotation.enabled;
    const rotationRange = rotationEnabled ? this.config.rotation.range.max : 0;

    // Debug color palette
    const debugPalette = ['green', 'blue', 'red', 'yellow', 'orange', 'purple'];

    // Use override fixedHeight if provided, else baseImageSize
    const imageSize = options.fixedHeight ?? baseImageSize;
    const cx = width / 2;
    const cy = height / 2;

    // Add center image (using center position)
    if (imageCount > 0) {
      layouts.push({
        id: 0,
        x: cx,
        y: cy,
        rotation: this.random(-5, 5), // Less rotation for center
        scale: 1.0,
        baseSize: imageSize,
        zIndex: 100, // Center image is highest
        borderColor: debugRadials ? 'cyan' : undefined
      });
    }

    let processedCount = 1;
    let currentRing = 1;

    while (processedCount < imageCount) {
      // Ring settings
      // Scale X more than Y to create horizontal oval shape
      const radiusY = currentRing * (imageSize * 0.8); // Reduce overlap by 20% (1.0 -> 0.8)
      const radiusX = radiusY * 1.5; // Horizontal stretching factor

      const circumference = Math.PI * (3 * (radiusX + radiusY) - Math.sqrt((3 * radiusX + radiusY) * (radiusX + 3 * radiusY))); // Ramanujan's approximation

      const estimatedItemWidth = this.estimateWidth(imageSize);
      // Increase density by ~40% (1.1 -> 0.7)
      const itemsInRing = Math.floor(circumference / (estimatedItemWidth * 0.7));

      if (itemsInRing === 0) {
        currentRing++;
        continue;
      }

      const angleStep = (2 * Math.PI) / itemsInRing;

      // Add offset of 20 degrees per ring
      const ringOffset = currentRing * (20 * Math.PI / 180);

      for (let i = 0; i < itemsInRing && processedCount < imageCount; i++) {
        const angle = (i * angleStep) + ringOffset;

        // Calculate center position of image using elliptical formula (store center, not top-left)
        let x = cx + Math.cos(angle) * radiusX;
        let y = cy + Math.sin(angle) * radiusY;

        // Boundary Clamping - clamp center position with conservative estimate
        // Use 16:9 aspect ratio (1.78) as maximum to handle most landscape images
        const padding = this.config.spacing.padding ?? 50;
        const estAspectRatio = 1.5; // 3:2 - balanced for mixed portrait/landscape
        const halfWidth = (imageSize * estAspectRatio) / 2;
        const halfHeight = imageSize / 2;

        // Clamp X (center position)
        if (x - halfWidth < padding) {
          x = padding + halfWidth;
        } else if (x + halfWidth > width - padding) {
          x = width - padding - halfWidth;
        }

        // Clamp Y (center position)
        if (y - halfHeight < padding) {
          y = padding + halfHeight;
        } else if (y + halfHeight > height - padding) {
          y = height - padding - halfHeight;
        }

        const rotation = this.random(-rotationRange, rotationRange);

        layouts.push({
          id: processedCount,
          x,
          y,
          rotation,
          scale: 1.0,
          baseSize: imageSize,
          zIndex: Math.max(1, 100 - currentRing), // Outer rings have lower z-index
          borderColor: debugRadials ? debugPalette[(currentRing - 1) % debugPalette.length] : undefined
        });

        processedCount++;
      }

      currentRing++;
    }

    return layouts;
  }

  /**
   * Estimate image width based on height
   * Assumes landscape aspect ratio (approximately 1.4:1)
   * @param height - Image height
   * @returns Estimated width
   */
  private estimateWidth(height: number): number {
    // Assume landscape aspect ratio approx 4:3 or 16:9 on average
    // Using 1.4 ratio
    return height * 1.4;
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