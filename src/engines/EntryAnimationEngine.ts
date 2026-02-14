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
  LayoutAlgorithm,
  EntryPathConfig,
  EntryPathType,
  EntryRotationConfig,
  EntryRotationMode,
  EntryScaleConfig,
  EntryScaleMode
} from '../config/types';
import { DEFAULT_PATH_CONFIG, DEFAULT_ENTRY_ROTATION, DEFAULT_ENTRY_SCALE } from '../config/defaults';
import { requiresJSAnimation } from './PathAnimator';

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
  private pathConfig: EntryPathConfig;
  private rotationConfig: EntryRotationConfig;
  private scaleConfig: EntryScaleConfig;

  constructor(config: EntryAnimationConfig, layoutAlgorithm: LayoutAlgorithm) {
    this.config = config;
    this.layoutAlgorithm = layoutAlgorithm;

    // Resolve the start position, using layout-aware defaults if not specified
    this.resolvedStartPosition = this.resolveStartPosition();

    // Resolve path config
    this.pathConfig = config.path || DEFAULT_PATH_CONFIG;

    // Resolve rotation config
    this.rotationConfig = config.rotation || DEFAULT_ENTRY_ROTATION;

    // Resolve scale config
    this.scaleConfig = config.scale || DEFAULT_ENTRY_SCALE;
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
    // finalPosition now stores center position directly
    const centerX = finalPosition.x;
    const centerY = finalPosition.y;

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
    _imageSize: { width: number; height: number }
  ): StartPosition {
    // Start at center of container (using center position, not top-left)
    const centerX = containerBounds.width / 2;
    const centerY = containerBounds.height / 2;

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
    _imageSize: { width: number; height: number },
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

    // Return center position on circle (not top-left)
    const startX = centerX + Math.cos(angle) * radius;
    const startY = centerY + Math.sin(angle) * radius;

    return { x: startX, y: startY };
  }

  /**
   * Get animation parameters for an image
   */
  getAnimationParams(_imageIndex: number): AnimationParams {
    const duration = this.config.timing.duration;
    const easing = this.config.easing;

    return {
      startTransform: '',  // Will be computed by caller based on start position
      duration,
      delay: 0,
      easing
    };
  }

  /**
   * Build a CSS transform string for the start position
   * Uses pixel-based centering offset for reliable cross-browser behavior
   */
  buildStartTransform(
    startPosition: StartPosition,
    finalPosition: { x: number; y: number },
    finalRotation: number,
    finalScale: number,
    imageWidth?: number,
    imageHeight?: number,
    startRotation?: number,
    startScale?: number
  ): string {
    // Calculate translation from final to start position
    const translateX = startPosition.x - finalPosition.x;
    const translateY = startPosition.y - finalPosition.y;

    // Use start rotation if provided, otherwise use final rotation
    const rotation = startRotation !== undefined ? startRotation : finalRotation;

    // Use start scale if provided, otherwise use final scale
    const scale = startScale !== undefined ? startScale : finalScale;

    // Use pixel offset if dimensions provided
    const centerOffsetX = imageWidth !== undefined ? -imageWidth / 2 : 0;
    const centerOffsetY = imageHeight !== undefined ? -imageHeight / 2 : 0;
    const centerTranslate = imageWidth !== undefined
      ? `translate(${centerOffsetX}px, ${centerOffsetY}px)`
      : `translate(-50%, -50%)`;

    if (startPosition.useScale) {
      // For center position: start at center with scale 0
      return `${centerTranslate} translate(${translateX}px, ${translateY}px) rotate(${rotation}deg) scale(0)`;
    }

    // Standard entry: translate from edge, with configured start scale
    return `${centerTranslate} translate(${translateX}px, ${translateY}px) rotate(${rotation}deg) scale(${scale})`;
  }

  /**
   * Build the final CSS transform string
   * Uses pixel-based centering offset for reliable cross-browser behavior
   */
  buildFinalTransform(rotation: number, scale: number, imageWidth?: number, imageHeight?: number): string {
    // Use pixel offset if dimensions provided, otherwise fall back to percentage
    if (imageWidth !== undefined && imageHeight !== undefined) {
      const offsetX = -imageWidth / 2;
      const offsetY = -imageHeight / 2;
      return `translate(${offsetX}px, ${offsetY}px) rotate(${rotation}deg) scale(${scale})`;
    }
    return `translate(-50%, -50%) rotate(${rotation}deg) scale(${scale})`;
  }

  /**
   * Get the transition CSS for entry animation
   * For JS-animated paths, only animate opacity (transform handled by JS)
   */
  getTransitionCSS(): string {
    const duration = this.config.timing.duration;
    const easing = this.config.easing;

    // For paths that use JS animation, don't transition transform
    if (this.requiresJSAnimation()) {
      return `opacity ${duration}ms ease-out`;
    }

    return `opacity ${duration}ms ease-out, transform ${duration}ms ${easing}`;
  }

  /**
   * Check if the current path type requires JavaScript animation
   */
  requiresJSAnimation(): boolean {
    return requiresJSAnimation(this.pathConfig.type);
  }

  /**
   * Get the path configuration
   */
  getPathConfig(): EntryPathConfig {
    return this.pathConfig;
  }

  /**
   * Get the path type
   */
  getPathType(): EntryPathType {
    return this.pathConfig.type;
  }

  /**
   * Get animation timing configuration
   */
  getTiming(): { duration: number } {
    return {
      duration: this.config.timing.duration
    };
  }

  /**
   * Get the rotation configuration
   */
  getRotationConfig(): EntryRotationConfig {
    return this.rotationConfig;
  }

  /**
   * Get the rotation mode
   */
  getRotationMode(): EntryRotationMode {
    return this.rotationConfig.mode;
  }

  /**
   * Calculate the starting rotation for an entry animation
   * @param finalRotation - The final rotation from the layout
   * @returns The starting rotation in degrees
   */
  calculateStartRotation(finalRotation: number): number {
    const mode = this.rotationConfig.mode;

    switch (mode) {
      case 'none':
        // No rotation animation - start at final rotation
        return finalRotation;

      case 'settle': {
        // Start at a configured rotation and settle to final
        const startConfig = this.rotationConfig.startRotation;
        if (startConfig === undefined) {
          // Default: ±30° random offset from final
          return finalRotation + (Math.random() - 0.5) * 60;
        }
        if (typeof startConfig === 'number') {
          return startConfig;
        }
        // Range: random value between min and max
        const range = startConfig.max - startConfig.min;
        return startConfig.min + Math.random() * range;
      }

      case 'spin': {
        // Spin from a rotated position to final
        const spinCount = this.rotationConfig.spinCount ?? 1;
        const direction = this.resolveSpinDirection(finalRotation);
        return finalRotation + (spinCount * 360 * direction);
      }

      case 'random':
        // Random starting rotation (±30° from final)
        return finalRotation + (Math.random() - 0.5) * 60;

      case 'wobble':
        // Wobble is handled in JS animation, start at final rotation
        return finalRotation;

      default:
        return finalRotation;
    }
  }

  /**
   * Resolve spin direction based on config
   * @returns 1 for clockwise, -1 for counterclockwise
   */
  private resolveSpinDirection(finalRotation: number): number {
    const direction = this.rotationConfig.direction ?? 'auto';

    switch (direction) {
      case 'clockwise':
        return -1;  // Negative rotation = clockwise spin to final
      case 'counterclockwise':
        return 1;   // Positive rotation = counterclockwise spin to final
      case 'random':
        return Math.random() < 0.5 ? 1 : -1;
      case 'auto':
      default:
        // Auto: choose direction that reduces total rotation distance
        // If final rotation is positive, spin counterclockwise (add positive offset)
        return finalRotation >= 0 ? 1 : -1;
    }
  }

  /**
   * Check if the current rotation mode requires JavaScript animation
   * (as opposed to CSS transitions)
   */
  requiresJSRotation(): boolean {
    return this.rotationConfig.mode === 'wobble';
  }

  /**
   * Calculate wobble rotation for a given animation progress
   * @param progress - Animation progress from 0 to 1
   * @param finalRotation - The final rotation in degrees
   * @returns The current rotation in degrees
   */
  calculateWobbleRotation(progress: number, finalRotation: number): number {
    if (this.rotationConfig.mode !== 'wobble') {
      return finalRotation;
    }

    const wobbleConfig = this.rotationConfig.wobble || {
      amplitude: 15,
      frequency: 3,
      decay: true
    };

    const { amplitude, frequency, decay } = wobbleConfig;

    // Oscillation using sine wave
    const oscillation = Math.sin(progress * frequency * Math.PI * 2);

    // Apply decay if enabled (stronger decay toward end)
    const decayFactor = decay ? Math.pow(1 - progress, 2) : 1;

    // Calculate wobble offset
    const wobbleOffset = amplitude * oscillation * decayFactor;

    return finalRotation + wobbleOffset;
  }

  /**
   * Get the scale configuration
   */
  getScaleConfig(): EntryScaleConfig {
    return this.scaleConfig;
  }

  /**
   * Get the scale mode
   */
  getScaleMode(): EntryScaleMode {
    return this.scaleConfig.mode;
  }

  /**
   * Calculate the starting scale for an entry animation
   * @param finalScale - The final scale from the layout
   * @returns The starting scale
   */
  calculateStartScale(finalScale: number): number {
    const mode = this.scaleConfig.mode;

    switch (mode) {
      case 'none':
        // No scale animation - start at final scale
        return finalScale;

      case 'grow': {
        // Start smaller, grow to final
        const startScale = this.scaleConfig.startScale ?? 0.3;
        return startScale * finalScale;  // Apply relative to final scale
      }

      case 'shrink': {
        // Start larger, shrink to final
        const startScale = this.scaleConfig.startScale ?? 1.5;
        return startScale * finalScale;  // Apply relative to final scale
      }

      case 'pop':
        // Pop mode uses JS animation, start at final scale
        // (the overshoot/bounce is handled in the animation tick)
        return finalScale;

      case 'random': {
        // Random start scale in configured range
        const range = this.scaleConfig.range ?? { min: 0.5, max: 1.0 };
        const randomFactor = range.min + Math.random() * (range.max - range.min);
        return randomFactor * finalScale;
      }

      default:
        return finalScale;
    }
  }

  /**
   * Check if the current scale mode requires JavaScript animation
   * (as opposed to CSS transitions)
   */
  requiresJSScale(): boolean {
    return this.scaleConfig.mode === 'pop';
  }

  /**
   * Calculate pop scale for a given animation progress
   * @param progress - Animation progress from 0 to 1
   * @param finalScale - The final scale value
   * @returns The current scale value with bounce effect
   */
  calculatePopScale(progress: number, finalScale: number): number {
    if (this.scaleConfig.mode !== 'pop') {
      return finalScale;
    }

    const popConfig = this.scaleConfig.pop || {
      overshoot: 1.2,
      bounces: 1
    };

    const { overshoot, bounces } = popConfig;

    // Create keyframes for bounce effect
    // Similar to bounce path but for scale
    const keyframes = this.generateScaleBounceKeyframes(bounces, overshoot);

    // Find current segment
    let currentScale = finalScale;
    for (let i = 0; i < keyframes.length; i++) {
      if (progress <= keyframes[i].time) {
        const prevTime = i === 0 ? 0 : keyframes[i - 1].time;
        const prevScale = i === 0 ? finalScale : keyframes[i - 1].scale;
        const segmentProgress = (progress - prevTime) / (keyframes[i].time - prevTime);
        // Smooth easing within segment
        const easedProgress = this.easeOutQuad(segmentProgress);
        currentScale = prevScale + (keyframes[i].scale - prevScale) * easedProgress;
        break;
      }
    }

    return currentScale * finalScale;
  }

  /**
   * Generate keyframes for scale bounce animation
   */
  private generateScaleBounceKeyframes(
    bounces: number,
    overshoot: number
  ): Array<{ time: number; scale: number }> {
    const keyframes: Array<{ time: number; scale: number }> = [];

    // Reach overshoot at 50% of animation
    keyframes.push({ time: 0.5, scale: overshoot });

    // Add bounces
    let currentOvershoot = overshoot;
    const bounceDecay = 0.5;  // Each bounce is 50% of previous
    const remainingTime = 0.5;
    const bounceTime = remainingTime / (bounces * 2);

    let currentTime = 0.5;
    for (let i = 0; i < bounces; i++) {
      // Undershoot (go below 1)
      const undershoot = 1 - (currentOvershoot - 1) * bounceDecay;
      currentTime += bounceTime;
      keyframes.push({ time: currentTime, scale: undershoot });

      // Overshoot again (smaller)
      currentOvershoot = 1 + (currentOvershoot - 1) * bounceDecay * bounceDecay;
      currentTime += bounceTime;
      if (i < bounces - 1) {
        keyframes.push({ time: currentTime, scale: currentOvershoot });
      }
    }

    // Final settle
    keyframes.push({ time: 1, scale: 1 });

    return keyframes;
  }

  /**
   * Easing function for smooth transitions
   */
  private easeOutQuad(t: number): number {
    return 1 - (1 - t) * (1 - t);
  }
}
