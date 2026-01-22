/**
 * WavePlacementGenerator.ts
 * Generates wave-based layouts for image cloud
 */

import type { PlacementGenerator, ImageLayout, ContainerBounds, LayoutConfig } from '../config/types';
import { DEFAULT_WAVE_CONFIG } from '../config/defaults';

interface WaveLayoutOptions extends Partial<LayoutConfig> {
  fixedHeight?: number;
}

export class WavePlacementGenerator implements PlacementGenerator {
  private config: LayoutConfig;

  constructor(config: LayoutConfig) {
    this.config = config;
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
    const baseImageSize = this.config.sizing.base;
    const rotationRange = this.config.rotation?.range?.max ?? 15;
    const padding = this.config.spacing.padding ?? 50;

    // Use override fixedHeight if provided, else baseImageSize
    const imageSize = options.fixedHeight ?? baseImageSize;
    const estimatedItemWidth = this.estimateWidth(imageSize);

    // Get wave configuration, merging user config with defaults
    const waveConfig = {
      ...DEFAULT_WAVE_CONFIG,
      ...this.config.wave
    };

    const { rows, amplitude, frequency, phaseShift, synchronization, orientation } = waveConfig;

    // Calculate images per row (distribute evenly)
    const imagesPerRow = Math.ceil(imageCount / rows);

    // Calculate horizontal spacing
    const horizontalSpacing = width / (imagesPerRow + 1);

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
        // Calculate horizontal position
        const x = horizontalSpacing * (imgInRow + 1) - (estimatedItemWidth / 2);

        // Calculate wave displacement
        const waveY = this.calculateWaveY(x, width, amplitude, frequency, phase);

        // Final Y position
        const y = baseY + waveY - (imageSize / 2);

        // Calculate rotation if orientation is 'follow'
        let rotation = 0;
        if (orientation === 'follow') {
          rotation = this.calculateRotation(x, width, amplitude, frequency, phase);
        } else {
          // Upright mode: use standard random rotation
          rotation = this.random(-rotationRange, rotationRange);
        }

        layouts.push({
          id: imageIndex,
          x: Math.max(padding, Math.min(x, width - estimatedItemWidth - padding)),
          y: Math.max(padding, Math.min(y, height - imageSize - padding)),
          rotation,
          scale: 1.0,
          baseSize: imageSize,
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
