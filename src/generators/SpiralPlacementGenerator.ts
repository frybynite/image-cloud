/**
 * SpiralPlacementGenerator.ts
 * Generates spiral layouts (golden, archimedean, logarithmic)
 */

import type { PlacementGenerator, ImageLayout, ContainerBounds, LayoutConfig, SpiralAlgorithmConfig, ImageConfig } from '../config/types';

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
  private imageConfig: ImageConfig;

  constructor(config: LayoutConfig, imageConfig: ImageConfig = {}) {
    this.config = config;
    this.imageConfig = imageConfig;
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

    // Get rotation config from image config
    const rotationMode = this.imageConfig.rotation?.mode ?? 'none';
    const minRotation = this.imageConfig.rotation?.range?.min ?? -15;
    const maxRotation = this.imageConfig.rotation?.range?.max ?? 15;

    // Get variance config from image config
    const varianceMin = this.imageConfig.sizing?.variance?.min ?? 1.0;
    const varianceMax = this.imageConfig.sizing?.variance?.max ?? 1.0;
    const hasVariance = varianceMin !== 1.0 || varianceMax !== 1.0;

    // Get scale decay from image config (overrides spiral config)
    const scaleDecay = this.imageConfig.sizing?.scaleDecay ?? spiralConfig.scaleDecay;

    // Center of the spiral
    const cx = width / 2;
    const cy = height / 2;

    // Calculate available radius (distance from center to edge)
    const maxRadius = Math.min(
      cx - padding - baseImageSize / 2,
      cy - padding - baseImageSize / 2
    );

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

      // Convert polar to cartesian coordinates (store center position)
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;

      // Calculate scale based on decay (center images larger) - use scaleDecay from image config
      const normalizedRadius = radius / maxRadius;
      const decayScale = scaleDecay > 0
        ? 1 - (normalizedRadius * scaleDecay * 0.5) // Max 50% size reduction
        : 1.0;

      // Apply variance
      const varianceScale = hasVariance ? this.random(varianceMin, varianceMax) : 1.0;
      const combinedScale = decayScale * varianceScale;

      // Apply scaled image size
      const scaledImageSize = baseImageSize * combinedScale;

      // Clamp center positions to keep images within bounds
      // Use 16:9 aspect ratio (1.78) as maximum to handle most landscape images
      const estAspectRatio = 1.5; // 3:2 - balanced for mixed portrait/landscape
      const halfWidth = (scaledImageSize * estAspectRatio) / 2;
      const halfHeight = scaledImageSize / 2;
      const minX = padding + halfWidth;
      const maxX = width - padding - halfWidth;
      const minY = padding + halfHeight;
      const maxY = height - padding - halfHeight;

      const clampedX = Math.max(minX, Math.min(x, maxX));
      const clampedY = Math.max(minY, Math.min(y, maxY));

      // Rotation based on mode
      let rotation = 0;
      if (rotationMode === 'random') {
        const baseRotation = (angle * 180 / Math.PI) % 360;
        const rotationVariance = this.random(minRotation, maxRotation);
        rotation = spiralConfig.spiralType === 'golden'
          ? rotationVariance // Pure random for golden (more organic)
          : (baseRotation * 0.1 + rotationVariance * 0.9); // Slight directional bias for others
      } else if (rotationMode === 'tangent') {
        // Tangent rotation: align image to spiral curve
        rotation = this.calculateSpiralTangent(angle, radius, spiralConfig);
      }

      // Z-index: center images on top
      const zIndex = imageCount - i;

      layouts.push({
        id: i,
        x: clampedX,
        y: clampedY,
        rotation,
        scale: combinedScale,
        baseSize: scaledImageSize,
        zIndex
      });
    }

    return layouts;
  }

  /**
   * Calculate tangent angle for spiral curve at given position
   * This aligns the image along the spiral's direction of travel
   */
  private calculateSpiralTangent(
    angle: number,
    radius: number,
    spiralConfig: SpiralAlgorithmConfig
  ): number {
    // For different spiral types, the tangent calculation varies
    // The tangent angle is the derivative of the spiral equation

    let tangentAngle: number;

    if (spiralConfig.spiralType === 'golden') {
      // Golden spiral tangent is approximately perpendicular to radial line
      // Plus a small offset based on the golden angle
      tangentAngle = angle + Math.PI / 2;
    } else if (spiralConfig.spiralType === 'archimedean') {
      // Archimedean spiral: dr/dθ = constant = b
      // tan(ψ) = r / (dr/dθ) = r / b
      // For tightness = 1, b ≈ 1
      const b = 1 / spiralConfig.tightness;
      const psi = Math.atan(radius / b);
      tangentAngle = angle + psi;
    } else {
      // Logarithmic spiral: tangent makes constant angle with radial line
      // This angle depends on the growth rate b
      const b = 0.15 / spiralConfig.tightness;
      const psi = Math.atan(1 / b); // Constant pitch angle
      tangentAngle = angle + psi;
    }

    // Convert to degrees and normalize
    const degrees = (tangentAngle * 180 / Math.PI) % 360;

    // Adjust so 0 degrees means pointing right
    return degrees - 90;
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
