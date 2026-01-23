/**
 * GridPlacementGenerator.ts
 * Generates grid-based layouts with optional stagger and jitter
 */

import type { PlacementGenerator, ImageLayout, ContainerBounds, LayoutConfig, GridAlgorithmConfig } from '../config/types';

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

  constructor(config: LayoutConfig) {
    this.config = config;
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
    const rotationEnabled = this.config.rotation.enabled;
    const rotationRange = rotationEnabled ? this.config.rotation.range.max : 0;

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

    // Calculate cell size
    const cellWidth = (availableWidth - (gridConfig.gap * (columns - 1))) / columns;
    const cellHeight = (availableHeight - (gridConfig.gap * (rows - 1))) / rows;

    // Calculate image size with overlap factor
    // overlap: 0 = fit in cell, 0.5 = 50% larger, 1.0 = 2x cell size
    const overlapMultiplier = 1 + gridConfig.overlap;
    const cellBasedSize = Math.min(cellWidth, cellHeight) * overlapMultiplier;

    // Use fixedHeight if provided, otherwise use cell-based calculation
    // For grid layouts, we respect fixedHeight but cap at cell-based size to avoid overflow
    const imageSize = options.fixedHeight
      ? Math.min(options.fixedHeight, cellBasedSize)
      : cellBasedSize;

    // Calculate total grid dimensions for alignment
    const totalGridWidth = columns * cellWidth + (columns - 1) * gridConfig.gap;
    const totalGridHeight = rows * cellHeight + (rows - 1) * gridConfig.gap;

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

      // Boundary clamping for center-based positioning
      // Use 1.5 multiplier (3:2 aspect) as reasonable middle ground for mixed portrait/landscape
      const estAspectRatio = 1.5;
      const halfWidth = (imageSize * estAspectRatio) / 2;
      const halfHeight = imageSize / 2;
      const minX = padding + halfWidth;
      const maxX = width - padding - halfWidth;
      const minY = padding + halfHeight;
      const maxY = height - padding - halfHeight;

      x = Math.max(minX, Math.min(x, maxX));
      y = Math.max(minY, Math.min(y, maxY));

      // Apply rotation (reduced for grid layouts to maintain structure)
      const rotation = gridConfig.jitter > 0
        ? this.random(-rotationRange * gridConfig.jitter, rotationRange * gridConfig.jitter)
        : 0;

      layouts.push({
        id: i,
        x,
        y,
        rotation,
        scale: 1.0,
        baseSize: imageSize,
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
