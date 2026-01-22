/**
 * EntryAnimationEngine.ts
 * Calculates starting positions for entry animations based on configuration
 *
 * Public API:
 * - calculateStartPosition(finalPosition, imageSize, containerBounds, imageIndex, totalImages)
 * - getAnimationParams(imageIndex)
 */

import type {
  EntryAnimationConfig,
  EntryStartPosition,
  ContainerBounds,
  LayoutAlgorithm
} from '../config/types';

/** Layout-aware default start positions */
const LAYOUT_ENTRY_DEFAULTS: Record<LayoutAlgorithm, EntryStartPosition> = {
  radial: 'center',
  spiral: 'center',
  grid: 'top',
  cluster: 'nearest-edge',
  random: 'nearest-edge',
  wave: 'left'
};

export interface StartPosition {
  x: number;
  y: number;
  useScale?: boolean;  // For center position, start with scale 0
}

export interface AnimationParams {
  startTransform: string;
  duration: number;
  delay: number;
  easing: string;
}

export class EntryAnimationEngine {
  private config: EntryAnimationConfig;
  private layoutAlgorithm: LayoutAlgorithm;
  private resolvedStartPosition: EntryStartPosition;

  constructor(config: EntryAnimationConfig, layoutAlgorithm: LayoutAlgorithm) {
    this.config = config;
    this.layoutAlgorithm = layoutAlgorithm;

    // Resolve the start position, using layout-aware defaults if not specified
    this.resolvedStartPosition = this.resolveStartPosition();
  }

  /**
   * Get the effective start position, considering layout-aware defaults
   */
  private resolveStartPosition(): EntryStartPosition {
    // If explicitly configured, use that
    if (this.config.start.position) {
      return this.config.start.position;
    }
    // Otherwise use layout-aware default
    return LAYOUT_ENTRY_DEFAULTS[this.layoutAlgorithm] || 'nearest-edge';
  }

  /**
   * Calculate the starting position for an image's entry animation
   */
  calculateStartPosition(
    finalPosition: { x: number; y: number },
    imageSize: { width: number; height: number },
    containerBounds: ContainerBounds,
    imageIndex: number,
    totalImages: number
  ): StartPosition {
    const position = this.resolvedStartPosition;
    const offset = this.config.start.offset ?? 100;

    switch (position) {
      case 'nearest-edge':
        return this.calculateNearestEdge(finalPosition, imageSize, containerBounds, offset);

      case 'top':
        return this.calculateEdgePosition('top', finalPosition, imageSize, containerBounds, offset);

      case 'bottom':
        return this.calculateEdgePosition('bottom', finalPosition, imageSize, containerBounds, offset);

      case 'left':
        return this.calculateEdgePosition('left', finalPosition, imageSize, containerBounds, offset);

      case 'right':
        return this.calculateEdgePosition('right', finalPosition, imageSize, containerBounds, offset);

      case 'center':
        return this.calculateCenterPosition(containerBounds, finalPosition, imageSize);

      case 'random-edge':
        return this.calculateRandomEdge(finalPosition, imageSize, containerBounds, offset);

      case 'circular':
        return this.calculateCircularPosition(
          finalPosition,
          imageSize,
          containerBounds,
          imageIndex,
          totalImages
        );

      default:
        return this.calculateNearestEdge(finalPosition, imageSize, containerBounds, offset);
    }
  }

  /**
   * Calculate start position from the nearest edge (current default behavior)
   */
  private calculateNearestEdge(
    finalPosition: { x: number; y: number },
    imageSize: { width: number; height: number },
    containerBounds: ContainerBounds,
    offset: number
  ): StartPosition {
    const centerX = finalPosition.x + imageSize.width / 2;
    const centerY = finalPosition.y + imageSize.height / 2;

    const distLeft = centerX;
    const distRight = containerBounds.width - centerX;
    const distTop = centerY;
    const distBottom = containerBounds.height - centerY;

    const minDist = Math.min(distLeft, distRight, distTop, distBottom);

    let startX = finalPosition.x;
    let startY = finalPosition.y;

    if (minDist === distLeft) {
      // Start from left edge
      startX = -(imageSize.width + offset);
    } else if (minDist === distRight) {
      // Start from right edge
      startX = containerBounds.width + offset;
    } else if (minDist === distTop) {
      // Start from top edge
      startY = -(imageSize.height + offset);
    } else {
      // Start from bottom edge
      startY = containerBounds.height + offset;
    }

    return { x: startX, y: startY };
  }

  /**
   * Calculate start position from a specific edge
   */
  private calculateEdgePosition(
    edge: 'top' | 'bottom' | 'left' | 'right',
    finalPosition: { x: number; y: number },
    imageSize: { width: number; height: number },
    containerBounds: ContainerBounds,
    offset: number
  ): StartPosition {
    let startX = finalPosition.x;
    let startY = finalPosition.y;

    switch (edge) {
      case 'top':
        startY = -(imageSize.height + offset);
        break;
      case 'bottom':
        startY = containerBounds.height + offset;
        break;
      case 'left':
        startX = -(imageSize.width + offset);
        break;
      case 'right':
        startX = containerBounds.width + offset;
        break;
    }

    return { x: startX, y: startY };
  }

  /**
   * Calculate start position from center with scale animation
   */
  private calculateCenterPosition(
    containerBounds: ContainerBounds,
    _finalPosition: { x: number; y: number },
    imageSize: { width: number; height: number }
  ): StartPosition {
    // Start at center of container
    const centerX = containerBounds.width / 2 - imageSize.width / 2;
    const centerY = containerBounds.height / 2 - imageSize.height / 2;

    return {
      x: centerX,
      y: centerY,
      useScale: true  // Signal to use scale animation from 0
    };
  }

  /**
   * Calculate start position from a random edge
   */
  private calculateRandomEdge(
    finalPosition: { x: number; y: number },
    imageSize: { width: number; height: number },
    containerBounds: ContainerBounds,
    offset: number
  ): StartPosition {
    const edges: ('top' | 'bottom' | 'left' | 'right')[] = ['top', 'bottom', 'left', 'right'];
    const randomEdge = edges[Math.floor(Math.random() * edges.length)];
    return this.calculateEdgePosition(randomEdge, finalPosition, imageSize, containerBounds, offset);
  }

  /**
   * Calculate start position on a circle around the container
   */
  private calculateCircularPosition(
    _finalPosition: { x: number; y: number },
    imageSize: { width: number; height: number },
    containerBounds: ContainerBounds,
    imageIndex: number,
    totalImages: number
  ): StartPosition {
    const circularConfig = this.config.start.circular || {};
    const distribution = circularConfig.distribution || 'even';

    // Calculate radius
    let radius: number;
    const radiusConfig = circularConfig.radius || '120%';

    if (typeof radiusConfig === 'string' && radiusConfig.endsWith('%')) {
      // Percentage of container diagonal
      const percentage = parseFloat(radiusConfig) / 100;
      const diagonal = Math.sqrt(
        containerBounds.width ** 2 + containerBounds.height ** 2
      );
      radius = diagonal * percentage / 2;
    } else {
      radius = typeof radiusConfig === 'number' ? radiusConfig : 500;
    }

    // Calculate angle
    let angle: number;
    if (distribution === 'even') {
      angle = (imageIndex / totalImages) * 2 * Math.PI;
    } else {
      angle = Math.random() * 2 * Math.PI;
    }

    // Calculate position on circle, centered on container
    const centerX = containerBounds.width / 2;
    const centerY = containerBounds.height / 2;

    const startX = centerX + Math.cos(angle) * radius - imageSize.width / 2;
    const startY = centerY + Math.sin(angle) * radius - imageSize.height / 2;

    return { x: startX, y: startY };
  }

  /**
   * Get animation parameters for an image
   */
  getAnimationParams(imageIndex: number): AnimationParams {
    const duration = this.config.timing.duration;
    const stagger = this.config.timing.stagger;
    const easing = this.config.easing;

    return {
      startTransform: '',  // Will be computed by caller based on start position
      duration,
      delay: imageIndex * stagger,
      easing
    };
  }

  /**
   * Build a CSS transform string for the start position
   */
  buildStartTransform(
    startPosition: StartPosition,
    finalPosition: { x: number; y: number },
    finalRotation: number,
    finalScale: number
  ): string {
    // Calculate translation from final to start position
    const translateX = startPosition.x - finalPosition.x;
    const translateY = startPosition.y - finalPosition.y;

    if (startPosition.useScale) {
      // For center position: start at center with scale 0
      return `translate(${translateX}px, ${translateY}px) rotate(${finalRotation}deg) scale(0)`;
    }

    // Standard entry: translate from edge, maintain rotation and scale
    return `translate(${translateX}px, ${translateY}px) rotate(${finalRotation}deg) scale(${finalScale})`;
  }

  /**
   * Build the final CSS transform string
   */
  buildFinalTransform(rotation: number, scale: number): string {
    return `rotate(${rotation}deg) scale(${scale})`;
  }

  /**
   * Get the transition CSS for entry animation
   */
  getTransitionCSS(): string {
    const duration = this.config.timing.duration;
    const easing = this.config.easing;
    return `opacity ${duration}ms ease-out, transform ${duration}ms ${easing}`;
  }
}
