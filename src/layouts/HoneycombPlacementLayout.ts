/**
 * HoneycombPlacementLayout.ts
 * Places images in hexagonal rings, filling outward clockwise from center-top.
 * Default/hover clip paths are forced to hexagon height-relative by mergeConfig().
 */

import type { PlacementLayout, ImageLayout, ContainerBounds, LayoutConfig, ImageConfig } from '../config/types';
import { DEFAULT_HONEYCOMB_CONFIG } from '../config/defaults';
import { getHexRingCells, hexCubeToPixel } from '../utils/hexagonGeometry';

export class HoneycombPlacementLayout implements PlacementLayout {
  private config: LayoutConfig;

  // imageConfig intentionally not stored — honeycomb forces uniform sizing (rotation/variance
  // would break hex tiling). Kept as parameter for interface compatibility.
  constructor(config: LayoutConfig, _imageConfig: ImageConfig = {}) {
    this.config = config;
  }

  generate(
    imageCount: number,
    containerBounds: ContainerBounds,
    options: Partial<LayoutConfig> & { fixedHeight?: number } = {}
  ): ImageLayout[] {
    const layouts: ImageLayout[] = [];
    const { width, height } = containerBounds;
    const containerCX = width / 2;
    const containerCY = height / 2;

    const baseImageSize = options.fixedHeight ?? 200;

    // Merge honeycomb config with defaults
    const honeycombConfig = {
      ...DEFAULT_HONEYCOMB_CONFIG,
      ...this.config.honeycomb
    };

    const spacing = honeycombConfig.spacing ?? 0;

    // hexH is the pitch (hex height + gap). Since the clip path is height-relative,
    // the hex's visual height equals baseImageSize. We add spacing on top.
    // Note: baseImageSize is already capped to fit the container by LayoutEngine.calculateAdaptiveSize().
    const hexH = baseImageSize + spacing;

    let placed = 0;
    let ring = 0;

    while (placed < imageCount) {
      const cells = getHexRingCells(ring);

      for (const [cx, cy, cz] of cells) {
        if (placed >= imageCount) break;

        const { px, py } = hexCubeToPixel(cx, cy, cz, containerCX, containerCY, hexH);

        layouts.push({
          id: placed,
          x: px,
          y: py,
          rotation: 0,
          scale: 1.0,
          baseSize: baseImageSize,
          // Inner rings render above outer rings
          zIndex: Math.max(1, 100 - ring)
        });

        placed++;
      }

      ring++;
    }

    return layouts;
  }
}
