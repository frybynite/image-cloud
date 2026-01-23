/**
 * AnimationEngine.ts
 * Handles smooth animations with easing for the image cloud
 *
 * Public API:
 * - animateTransform(element, properties, duration, easing)
 * - resetTransform(element, originalState)
 * - clearTransition(element)
 * - wait(ms)
 */

import type { AnimationConfig, TransformParams, ImageLayout } from '../config/types';

export class AnimationEngine {
  private config: AnimationConfig;

  constructor(config: AnimationConfig) {
    this.config = config;
  }

  /**
   * Animate element transform with smooth easing
   * @param element - The element to animate
   * @param properties - Transform properties {x, y, rotation, scale}
   * @param duration - Animation duration in ms (optional)
   * @param easing - CSS easing function (optional)
   * @returns Promise that resolves when animation completes
   */
  animateTransform(
    element: HTMLElement,
    properties: TransformParams,
    duration: number | null = null,
    easing: string | null = null
  ): Promise<void> {
    return new Promise((resolve) => {
      const animDuration = duration ?? this.config.duration;
      const animEasing = easing ?? this.config.easing.default;

      // Build transform string
      // Always start with centering transform to match image positioning system
      const transforms: string[] = ['translate(-50%, -50%)'];

      if (properties.x !== undefined || properties.y !== undefined) {
        const x = properties.x ?? 0;
        const y = properties.y ?? 0;
        transforms.push(`translate(${x}px, ${y}px)`);
      }

      if (properties.rotation !== undefined) {
        transforms.push(`rotate(${properties.rotation}deg)`);
      }

      if (properties.scale !== undefined) {
        transforms.push(`scale(${properties.scale})`);
      }

      // Apply transition
      element.style.transition = `transform ${animDuration}ms ${animEasing}, box-shadow ${animDuration}ms ${animEasing}`;

      // Apply transform
      element.style.transform = transforms.join(' ');

      // Resolve promise when animation completes
      setTimeout(() => {
        resolve();
      }, animDuration);
    });
  }

  /**
   * Reset element to its original transform
   * @param element - The element to reset
   * @param originalState - Original transform state {x, y, rotation, scale}
   * @returns Promise that resolves when animation completes
   */
  resetTransform(element: HTMLElement, originalState: TransformParams | ImageLayout): Promise<void> {
    return this.animateTransform(element, originalState);
  }

  /**
   * Remove transition styles from element
   * @param element - The element to clear
   */
  clearTransition(element: HTMLElement): void {
    element.style.transition = '';
  }

  /**
   * Utility: Wait for a specified duration
   * @param ms - Milliseconds to wait
   * @returns Promise that resolves after the specified duration
   */
  wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}