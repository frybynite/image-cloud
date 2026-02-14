/**
 * WavePlacementLayout.ts
 * Generates wave-based layouts for image cloud
 */

import type { PlacementLayout, ImageLayout, ContainerBounds, LayoutConfig, ImageConfig } from '../config/types';
import { DEFAULT_WAVE_CONFIG } from '../config/defaults';

interface WaveLayoutOptions extends Partial<LayoutConfig> {
  fixedHeight?: number;
}

export class WavePlacementLayout implements PlacementLayout {
  private config: LayoutConfig;
  private imageConfig: ImageConfig;

  constructor(config: LayoutConfig, imageConfig: ImageConfig = {}) {
    this.config = config;
    this.imageConfig = imageConfig;
  }

  /**
   * Generate wave layout positions for images
   * @param imageCount - Number of images to layout
   * @param containerBounds - Container dimensions {width, height}
   * @param options - Optional overrides
   * @returns Array of layout objects with position, rotation, scale
   */
  generate(
    imageCount: number,
    containerBounds: ContainerBounds,
    options: WaveLayoutOptions = {}
  ): ImageLayout[] {
    const layouts: ImageLayout[] = [];
    const { width, height } = containerBounds;
    // Use fixedHeight if provided, otherwise use default 200
    const baseImageSize = options.fixedHeight ?? 200;
    const padding = this.config.spacing.padding ?? 50;

    // Get rotation config from image config
    const rotationMode = this.imageConfig.rotation?.mode ?? 'none';
    const minRotation = this.imageConfig.rotation?.range?.min ?? -15;
    const maxRotation = this.imageConfig.rotation?.range?.max ?? 15;

    // Get variance config from image config
    const varianceMin = this.imageConfig.sizing?.variance?.min ?? 1.0;
    const varianceMax = this.imageConfig.sizing?.variance?.max ?? 1.0;
    const hasVariance = varianceMin !== 1.0 || varianceMax !== 1.0;

    // Use override fixedHeight if provided, else baseImageSize
    const imageSize = options.fixedHeight ?? baseImageSize;

    // Get wave configuration, merging user config with defaults
    const waveConfig = {
      ...DEFAULT_WAVE_CONFIG,
      ...this.config.wave
    };

    const { rows, amplitude, frequency, phaseShift, synchronization } = waveConfig;

    // Calculate images per row (distribute evenly)
    const imagesPerRow = Math.ceil(imageCount / rows);

    // Estimate image width based on height and typical aspect ratio
    const estAspectRatio = 1.5; // 3:2 - balanced for mixed portrait/landscape
    const estImageWidth = imageSize * estAspectRatio;
    const halfImageWidth = estImageWidth / 2;

    // Calculate available horizontal space (accounting for image width at edges)
    // This ensures images don't get compressed against the edges
    const startX = padding + halfImageWidth;
    const endX = width - padding - halfImageWidth;
    const availableWidth = endX - startX;

    // Distribute images evenly between startX and endX
    const horizontalSpacing = imagesPerRow > 1 ? availableWidth / (imagesPerRow - 1) : 0;

    // Calculate vertical distribution to fill the screen
    // Row centerlines need room for amplitude swing above and below
    const minCenterY = padding + amplitude + (imageSize / 2);
    const maxCenterY = height - padding - amplitude - (imageSize / 2);
    const availableHeight = maxCenterY - minCenterY;

    // Calculate spacing between row centerlines
    const rowSpacing = rows > 1 ? availableHeight / (rows - 1) : 0;

    let imageIndex = 0;

    for (let rowIndex = 0; rowIndex < rows && imageIndex < imageCount; rowIndex++) {
      // Calculate base Y position (centerline) for this row - evenly distributed
      const baseY = rows === 1
        ? (minCenterY + maxCenterY) / 2  // Single row: center vertically
        : minCenterY + (rowIndex * rowSpacing);

      // Calculate phase offset based on synchronization mode
      let phase = 0;
      if (synchronization === 'offset') {
        phase = rowIndex * phaseShift;
      } else if (synchronization === 'alternating') {
        phase = rowIndex * Math.PI;
      }
      // If 'synchronized', phase remains 0

      // Place images along this wave row
      for (let imgInRow = 0; imgInRow < imagesPerRow && imageIndex < imageCount; imgInRow++) {
        // Calculate center position - evenly distributed within available space
        // For single image, center it; otherwise distribute from startX to endX
        const centerX = imagesPerRow === 1
          ? (startX + endX) / 2
          : startX + (imgInRow * horizontalSpacing);

        // Calculate wave displacement based on center position
        const waveY = this.calculateWaveY(centerX, width, amplitude, frequency, phase);

        // Store center position directly (CSS transform will handle centering)
        const x = centerX;
        const y = baseY + waveY;

        // Apply variance
        const varianceScale = hasVariance ? this.random(varianceMin, varianceMax) : 1.0;
        const scaledImageSize = imageSize * varianceScale;

        // Calculate rotation based on image.rotation.mode
        let rotation = 0;
        if (rotationMode === 'tangent') {
          // Follow wave tangent - images rotate to align with wave curve
          rotation = this.calculateRotation(centerX, width, amplitude, frequency, phase);
        } else if (rotationMode === 'random') {
          // Random rotation within configured range
          rotation = this.random(minRotation, maxRotation);
        }
        // If mode is 'none', rotation stays 0

        // Clamp center positions to keep images within bounds
        // Use 16:9 aspect ratio (1.78) as maximum to handle most landscape images
        const estAspectRatio = 1.5; // 3:2 - balanced for mixed portrait/landscape
        const halfWidth = (scaledImageSize * estAspectRatio) / 2;
        const halfHeight = scaledImageSize / 2;
        const minX = padding + halfWidth;
        const maxX = width - padding - halfWidth;
        const minY = padding + halfHeight;
        const maxY = height - padding - halfHeight;

        layouts.push({
          id: imageIndex,
          x: Math.max(minX, Math.min(x, maxX)),
          y: Math.max(minY, Math.min(y, maxY)),
          rotation,
          scale: varianceScale,
          baseSize: scaledImageSize,
          zIndex: imageIndex + 1
        });

        imageIndex++;
      }
    }

    return layouts;
  }

  /**
   * Calculate Y position displacement on wave curve
   * @param x - Horizontal position
   * @param containerWidth - Container width
   * @param amplitude - Wave amplitude
   * @param frequency - Wave frequency
   * @param phase - Phase offset
   * @returns Y displacement from baseline
   */
  private calculateWaveY(
    x: number,
    containerWidth: number,
    amplitude: number,
    frequency: number,
    phase: number
  ): number {
    // Normalize x to [0, 1] range
    const normalizedX = x / containerWidth;

    // Calculate wave: y = amplitude * sin(frequency * x * 2π + phase)
    return amplitude * Math.sin(frequency * normalizedX * 2 * Math.PI + phase);
  }

  /**
   * Calculate rotation based on wave tangent
   * @param x - Horizontal position
   * @param containerWidth - Container width
   * @param amplitude - Wave amplitude
   * @param frequency - Wave frequency
   * @param phase - Phase offset
   * @returns Rotation angle in degrees
   */
  private calculateRotation(
    x: number,
    containerWidth: number,
    amplitude: number,
    frequency: number,
    phase: number
  ): number {
    // Normalize x to [0, 1] range
    const normalizedX = x / containerWidth;

    // Derivative of sine wave: amplitude * frequency * cos(frequency * x * 2π + phase)
    const derivative = amplitude * frequency * 2 * Math.PI * Math.cos(frequency * normalizedX * 2 * Math.PI + phase) / containerWidth;

    // Convert derivative to rotation angle in degrees
    return Math.atan(derivative) * (180 / Math.PI);
  }

  /**
   * Estimate image width based on height
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
