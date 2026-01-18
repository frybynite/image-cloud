/**
 * SpiralPlacementGenerator.ts
 * Generates spiral layouts (golden, archimedean, logarithmic)
 */

import type { PlacementGenerator, ImageLayout, ContainerBounds, LayoutConfig, SpiralAlgorithmConfig } from '../config/types';

interface SpiralLayoutOptions extends Partial<LayoutConfig> {
  fixedHeight?: number;
}

// Golden angle in radians (~137.5 degrees)
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

const DEFAULT_SPIRAL_CONFIG: SpiralAlgorithmConfig = {
  spiralType: 'golden',
  direction: 'counterclockwise',
  tightness: 1.0,
  scaleDecay: 0,
  startAngle: 0
};

export class SpiralPlacementGenerator implements PlacementGenerator {
  private config: LayoutConfig;

  constructor(config: LayoutConfig) {
    this.config = config;
  }

  /**
   * Generate spiral layout positions for images
   * @param imageCount - Number of images to layout
   * @param containerBounds - Container dimensions {width, height}
   * @param options - Optional overrides (includes fixedHeight)
   * @returns Array of layout objects with position, rotation, scale
   */
  generate(
    imageCount: number,
    containerBounds: ContainerBounds,
    options: SpiralLayoutOptions = {}
  ): ImageLayout[] {
    const layouts: ImageLayout[] = [];
    const { width, height } = containerBounds;

    const spiralConfig = { ...DEFAULT_SPIRAL_CONFIG, ...this.config.spiral };
    const padding = this.config.spacing.padding;
    // Use fixedHeight if provided, otherwise use base size from config
    const baseImageSize = options.fixedHeight ?? this.config.sizing.base;
    const rotationRange = this.config.rotation.range.max;

    // Center of the spiral
    const cx = width / 2;
    const cy = height / 2;

    // Calculate available radius (distance from center to edge)
    const maxRadius = Math.min(
      cx - padding - baseImageSize / 2,
      cy - padding - baseImageSize / 2
    );

    // Estimated image width for landscape images
    const estimatedImageWidth = baseImageSize * 1.4;

    // Direction multiplier (1 for counterclockwise, -1 for clockwise)
    const directionMultiplier = spiralConfig.direction === 'clockwise' ? -1 : 1;

    for (let i = 0; i < imageCount; i++) {
      // Calculate angle based on spiral type
      let angle: number;
      let radius: number;

      if (spiralConfig.spiralType === 'golden') {
        // Golden spiral: each point separated by golden angle
        // Creates optimal distribution like sunflower seeds
        angle = i * GOLDEN_ANGLE * directionMultiplier + spiralConfig.startAngle;
        // Radius grows with square root of index for even distribution
        radius = this.calculateGoldenRadius(i, imageCount, maxRadius, spiralConfig.tightness);
      } else if (spiralConfig.spiralType === 'archimedean') {
        // Archimedean spiral: r = a + b*θ (constant spacing between arms)
        const theta = i * 0.5 * spiralConfig.tightness;
        angle = theta * directionMultiplier + spiralConfig.startAngle;
        radius = this.calculateArchimedeanRadius(theta, imageCount, maxRadius, spiralConfig.tightness);
      } else {
        // Logarithmic spiral: r = a * e^(b*θ) (self-similar, appears in nature)
        const theta = i * 0.3 * spiralConfig.tightness;
        angle = theta * directionMultiplier + spiralConfig.startAngle;
        radius = this.calculateLogarithmicRadius(theta, imageCount, maxRadius, spiralConfig.tightness);
      }

      // Convert polar to cartesian coordinates
      const centerX = cx + Math.cos(angle) * radius;
      const centerY = cy + Math.sin(angle) * radius;

      // Top-left position
      let x = centerX - estimatedImageWidth / 2;
      let y = centerY - baseImageSize / 2;

      // Calculate scale based on decay (center images larger)
      const normalizedRadius = radius / maxRadius;
      const scale = spiralConfig.scaleDecay > 0
        ? 1 - (normalizedRadius * spiralConfig.scaleDecay * 0.5) // Max 50% size reduction
        : 1.0;

      // Apply scaled image size
      const scaledImageSize = baseImageSize * scale;
      const scaledImageWidth = estimatedImageWidth * scale;

      // Recalculate position with scaled size
      x = centerX - scaledImageWidth / 2;
      y = centerY - scaledImageSize / 2;

      // Note: No boundary clamping - maxRadius calculation already ensures images stay within bounds
      // Clamping would cause asymmetric shifts making the spiral appear off-center

      // Rotation - slight variance that follows spiral direction
      const baseRotation = (angle * 180 / Math.PI) % 360;
      const rotationVariance = this.random(-rotationRange, rotationRange);
      const rotation = spiralConfig.spiralType === 'golden'
        ? rotationVariance // Pure random for golden (more organic)
        : (baseRotation * 0.1 + rotationVariance * 0.9); // Slight directional bias for others

      // Z-index: center images on top
      const zIndex = imageCount - i;

      layouts.push({
        id: i,
        x,
        y,
        rotation,
        scale,
        baseSize: scaledImageSize,
        zIndex
      });
    }

    return layouts;
  }

  /**
   * Calculate radius for golden spiral (Vogel's model)
   * Creates even distribution like sunflower seeds
   */
  private calculateGoldenRadius(
    index: number,
    totalImages: number,
    maxRadius: number,
    tightness: number
  ): number {
    // Vogel's model: r = c * sqrt(n)
    // Scaling factor to fit within maxRadius
    const scalingFactor = maxRadius / Math.sqrt(totalImages);
    const radius = scalingFactor * Math.sqrt(index) / tightness;
    return Math.min(radius, maxRadius);
  }

  /**
   * Calculate radius for Archimedean spiral
   * r = a + b*θ (constant spacing between arms)
   */
  private calculateArchimedeanRadius(
    theta: number,
    totalImages: number,
    maxRadius: number,
    tightness: number
  ): number {
    // Scale so that the last point is at maxRadius
    const maxTheta = totalImages * 0.5 * tightness;
    const normalizedTheta = theta / maxTheta;
    return normalizedTheta * maxRadius;
  }

  /**
   * Calculate radius for logarithmic (equiangular) spiral
   * r = a * e^(b*θ)
   */
  private calculateLogarithmicRadius(
    theta: number,
    totalImages: number,
    maxRadius: number,
    tightness: number
  ): number {
    // Parameters for logarithmic spiral
    const a = maxRadius * 0.05; // Starting radius
    const b = 0.15 / tightness; // Growth rate

    const radius = a * Math.exp(b * theta);

    // Normalize to fit within maxRadius
    const maxTheta = totalImages * 0.3 * tightness;
    const maxComputedRadius = a * Math.exp(b * maxTheta);

    return (radius / maxComputedRadius) * maxRadius;
  }

  /**
   * Utility: Generate random number between min and max
   */
  private random(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }
}
