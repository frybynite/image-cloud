/**
 * RadialPlacementLayout.ts
 * Generates concentric radial layouts for image cloud
 */

import type { PlacementLayout, ImageLayout, ContainerBounds, LayoutConfig, RadialAlgorithmConfig, ImageConfig } from '../config/types';
import { DEFAULT_RADIAL_CONFIG } from '../config/defaults';

interface RadialLayoutOptions extends Partial<LayoutConfig> {
  fixedHeight?: number;
}

export class RadialPlacementLayout implements PlacementLayout {
  private config: LayoutConfig;
  private imageConfig: ImageConfig;

  constructor(config: LayoutConfig, imageConfig: ImageConfig = {}) {
    this.config = config;
    this.imageConfig = imageConfig;
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
    // Use fixedHeight if provided, otherwise use default 200
    const baseImageSize = options.fixedHeight ?? 200;

    // Get rotation config from image config
    const rotationMode = this.imageConfig.rotation?.mode ?? 'none';
    const minRotation = this.imageConfig.rotation?.range?.min ?? -15;
    const maxRotation = this.imageConfig.rotation?.range?.max ?? 15;

    // Get variance config from image config
    const varianceMin = this.imageConfig.sizing?.variance?.min ?? 1.0;
    const varianceMax = this.imageConfig.sizing?.variance?.max ?? 1.0;
    const hasVariance = varianceMin !== 1.0 || varianceMax !== 1.0;

    // Get scale decay from layout config
    const scaleDecay = this.config.scaleDecay ?? 0;

    const radialConfig: RadialAlgorithmConfig = {
      ...DEFAULT_RADIAL_CONFIG,
      ...this.config.radial,
    };

    // Use override fixedHeight if provided, else baseImageSize
    const imageSize = options.fixedHeight ?? baseImageSize;
    const cx = width / 2;
    const cy = height / 2;

    // Calculate max rings for scale decay calculation
    const estimatedMaxRings = Math.ceil(Math.sqrt(imageCount));

    const padding = this.config.spacing.padding ?? 50;
    const maxRadius = Math.max(1, Math.min(
      cx - padding - imageSize / 2,
      cy - padding - imageSize / 2
    ));

    // Add center image (using center position)
    if (imageCount > 0) {
      // Apply variance to center image
      const varianceScale = hasVariance ? this.random(varianceMin, varianceMax) : 1.0;
      const centerSize = imageSize * varianceScale;

      layouts.push({
        id: 0,
        x: cx,
        y: cy,
        rotation: rotationMode === 'random' ? this.random(minRotation * 0.33, maxRotation * 0.33) : 0, // Less rotation for center
        scale: varianceScale,
        baseSize: centerSize,
        zIndex: 100 // Center image is highest
      });
    }

    let processedCount = 1;
    let currentRing = 1;

    while (processedCount < imageCount) {
      // Calculate scale decay for this ring (center is largest, outer rings smaller)
      const normalizedRing = currentRing / estimatedMaxRings;
      const ringScale = scaleDecay > 0
        ? 1 - (normalizedRing * scaleDecay * 0.5) // Max 50% size reduction
        : 1.0;

      // Ring settings
      // Scale X more than Y to create horizontal oval shape
      const ringStep = (maxRadius / estimatedMaxRings) * radialConfig.tightness;
      const radiusY = currentRing * ringStep;
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

        // Apply variance and scale decay
        const varianceScale = hasVariance ? this.random(varianceMin, varianceMax) : 1.0;
        const combinedScale = ringScale * varianceScale;
        const scaledImageSize = imageSize * combinedScale;

        // Calculate center position of image using elliptical formula (store center, not top-left)
        let x = cx + Math.cos(angle) * radiusX;
        let y = cy + Math.sin(angle) * radiusY;

        // Boundary Clamping - clamp center position with conservative estimate
        // Use 16:9 aspect ratio (1.78) as maximum to handle most landscape images
        const estAspectRatio = 1.5; // 3:2 - balanced for mixed portrait/landscape
        const halfWidth = (scaledImageSize * estAspectRatio) / 2;
        const halfHeight = scaledImageSize / 2;

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

        const rotation = rotationMode === 'random' ? this.random(minRotation, maxRotation) : 0;

        layouts.push({
          id: processedCount,
          x,
          y,
          rotation,
          scale: combinedScale,
          baseSize: scaledImageSize,
          zIndex: Math.max(1, 100 - currentRing) // Outer rings have lower z-index
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