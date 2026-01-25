/**
 * GridPlacementGenerator.ts
 * Generates grid-based layouts with optional stagger and jitter
 */

import type { PlacementGenerator, ImageLayout, ContainerBounds, LayoutConfig, GridAlgorithmConfig, ImageConfig } from '../config/types';

interface GridLayoutOptions extends Partial<LayoutConfig> {
  fixedHeight?: number;
}

const DEFAULT_GRID_CONFIG: GridAlgorithmConfig = {
  columns: 'auto',
  rows: 'auto',
  stagger: 'none',
  jitter: 0,
  overlap: 0,
  fillDirection: 'row',
  alignment: 'center',
  gap: 10
};

export class GridPlacementGenerator implements PlacementGenerator {
  private config: LayoutConfig;
  private imageConfig: ImageConfig;

  constructor(config: LayoutConfig, imageConfig: ImageConfig = {}) {
    this.config = config;
    this.imageConfig = imageConfig;
  }

  /**
   * Generate grid layout positions for images
   * @param imageCount - Number of images to layout
   * @param containerBounds - Container dimensions {width, height}
   * @param options - Optional overrides (includes fixedHeight)
   * @returns Array of layout objects with position, rotation, scale
   */
  generate(
    imageCount: number,
    containerBounds: ContainerBounds,
    options: GridLayoutOptions = {}
  ): ImageLayout[] {
    const layouts: ImageLayout[] = [];
    const { width, height } = containerBounds;

    const gridConfig = { ...DEFAULT_GRID_CONFIG, ...this.config.grid };
    const padding = this.config.spacing.padding;
    // Use fixedHeight if provided, otherwise use base size from config
    const baseImageSize = options.fixedHeight ?? this.config.sizing.base;

    // Get rotation config from image config
    const rotationMode = this.imageConfig.rotation?.mode ?? 'none';

    // Get variance config from image config
    const varianceMin = this.imageConfig.sizing?.variance?.min ?? 1.0;
    const varianceMax = this.imageConfig.sizing?.variance?.max ?? 1.0;
    const hasVariance = varianceMin !== 1.0 || varianceMax !== 1.0;

    // Calculate available space
    const availableWidth = width - (2 * padding);
    const availableHeight = height - (2 * padding);

    // Calculate grid dimensions
    const { columns, rows } = this.calculateGridDimensions(
      imageCount,
      availableWidth,
      availableHeight,
      baseImageSize,
      gridConfig
    );

    // For stagger layouts, we need n+0.5 cells to fit in available space
    // Calculate cell size accounting for this extra half-cell
    const hasRowStagger = gridConfig.stagger === 'row';
    const hasColumnStagger = gridConfig.stagger === 'column';

    // Effective columns/rows for sizing: add 0.5 for stagger
    const effectiveColumns = hasRowStagger ? columns + 0.5 : columns;
    const effectiveRows = hasColumnStagger ? rows + 0.5 : rows;

    // Calculate cell size to fit effective count in available space
    const cellWidth = (availableWidth - (gridConfig.gap * (columns - 1))) / effectiveColumns;
    const cellHeight = (availableHeight - (gridConfig.gap * (rows - 1))) / effectiveRows;

    // Stagger offset is half a cell
    const staggerOffsetX = hasRowStagger ? cellWidth / 2 : 0;
    const staggerOffsetY = hasColumnStagger ? cellHeight / 2 : 0;

    // Calculate image size with overlap factor
    // overlap: 0 = fit in cell, 0.5 = 50% larger, 1.0 = 2x cell size
    const overlapMultiplier = 1 + gridConfig.overlap;
    const cellBasedSize = Math.min(cellWidth, cellHeight) * overlapMultiplier;

    // Use fixedHeight if provided, otherwise use cell-based calculation
    // For grid layouts, we respect fixedHeight but cap at cell-based size to avoid overflow
    const imageSize = options.fixedHeight
      ? Math.min(options.fixedHeight, cellBasedSize)
      : cellBasedSize;

    // Calculate total grid dimensions for alignment (include stagger offset)
    const totalGridWidth = columns * cellWidth + (columns - 1) * gridConfig.gap + staggerOffsetX;
    const totalGridHeight = rows * cellHeight + (rows - 1) * gridConfig.gap + staggerOffsetY;

    // Center the grid in the container
    const gridOffsetX = padding + (availableWidth - totalGridWidth) / 2;
    const gridOffsetY = padding + (availableHeight - totalGridHeight) / 2;

    for (let i = 0; i < imageCount; i++) {
      let col: number;
      let row: number;

      if (gridConfig.fillDirection === 'row') {
        col = i % columns;
        row = Math.floor(i / columns);
      } else {
        row = i % rows;
        col = Math.floor(i / rows);
      }

      // Base cell position (center of cell)
      let cellCenterX = gridOffsetX + col * (cellWidth + gridConfig.gap) + cellWidth / 2;
      let cellCenterY = gridOffsetY + row * (cellHeight + gridConfig.gap) + cellHeight / 2;

      // Apply stagger offset
      if (gridConfig.stagger === 'row' && row % 2 === 1) {
        cellCenterX += cellWidth / 2;
      } else if (gridConfig.stagger === 'column' && col % 2 === 1) {
        cellCenterY += cellHeight / 2;
      }

      // Apply jitter (random offset within cell bounds)
      if (gridConfig.jitter > 0) {
        const maxJitterX = (cellWidth / 2) * gridConfig.jitter;
        const maxJitterY = (cellHeight / 2) * gridConfig.jitter;
        cellCenterX += this.random(-maxJitterX, maxJitterX);
        cellCenterY += this.random(-maxJitterY, maxJitterY);
      }

      // Store center position directly (not top-left)
      let x = cellCenterX;
      let y = cellCenterY;

      // Handle incomplete row alignment
      if (gridConfig.fillDirection === 'row') {
        const itemsInLastRow = imageCount % columns || columns;
        const isLastRow = row === Math.floor((imageCount - 1) / columns);

        if (isLastRow && itemsInLastRow < columns) {
          const lastRowWidth = itemsInLastRow * cellWidth + (itemsInLastRow - 1) * gridConfig.gap;
          let alignmentOffset = 0;

          if (gridConfig.alignment === 'center') {
            alignmentOffset = (totalGridWidth - lastRowWidth) / 2;
          } else if (gridConfig.alignment === 'end') {
            alignmentOffset = totalGridWidth - lastRowWidth;
          }

          x += alignmentOffset;
        }
      }

      // Apply variance to create non-uniform look
      const varianceScale = hasVariance ? this.random(varianceMin, varianceMax) : 1.0;
      const scaledImageSize = imageSize * varianceScale;

      // Boundary clamping for center-based positioning
      // Use 1.5 multiplier (3:2 aspect) as reasonable middle ground for mixed portrait/landscape
      const estAspectRatio = 1.5;
      const halfWidth = (scaledImageSize * estAspectRatio) / 2;
      const halfHeight = scaledImageSize / 2;
      const minX = padding + halfWidth;
      const maxX = width - padding - halfWidth;
      const minY = padding + halfHeight;
      const maxY = height - padding - halfHeight;

      x = Math.max(minX, Math.min(x, maxX));
      y = Math.max(minY, Math.min(y, maxY));

      // Apply rotation when mode is random
      // If jitter > 0, scale rotation by jitter factor; otherwise use full rotation range
      let rotation = 0;
      if (rotationMode === 'random') {
        const minRotation = this.imageConfig.rotation?.range?.min ?? -15;
        const maxRotation = this.imageConfig.rotation?.range?.max ?? 15;
        if (gridConfig.jitter > 0) {
          // Scale rotation by jitter factor for more subtle effect
          rotation = this.random(minRotation * gridConfig.jitter, maxRotation * gridConfig.jitter);
        } else {
          // Full rotation range even without jitter
          rotation = this.random(minRotation, maxRotation);
        }
      }

      layouts.push({
        id: i,
        x,
        y,
        rotation,
        scale: varianceScale,
        baseSize: scaledImageSize,
        zIndex: i + 1
      });
    }

    return layouts;
  }

  /**
   * Calculate optimal grid dimensions based on image count and container
   */
  private calculateGridDimensions(
    imageCount: number,
    availableWidth: number,
    availableHeight: number,
    _baseImageSize: number,
    config: GridAlgorithmConfig
  ): { columns: number; rows: number } {
    let columns: number;
    let rows: number;

    if (config.columns !== 'auto' && config.rows !== 'auto') {
      columns = config.columns;
      rows = config.rows;
    } else if (config.columns !== 'auto') {
      columns = config.columns;
      rows = Math.ceil(imageCount / columns);
    } else if (config.rows !== 'auto') {
      rows = config.rows;
      columns = Math.ceil(imageCount / rows);
    } else {
      // Auto-calculate: try to fill the space while maintaining reasonable aspect ratio
      const aspectRatio = availableWidth / availableHeight;
      const imageAspectRatio = 1.4; // Assumed landscape

      // Calculate ideal columns based on aspect ratio
      columns = Math.max(1, Math.round(Math.sqrt(imageCount * aspectRatio / imageAspectRatio)));
      rows = Math.ceil(imageCount / columns);

      // Ensure we don't have too many empty cells
      while (columns > 1 && (columns - 1) * rows >= imageCount) {
        columns--;
      }
    }

    return { columns: Math.max(1, columns), rows: Math.max(1, rows) };
  }

  /**
   * Utility: Generate random number between min and max
   */
  private random(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }
}
