/**
 * AnimationEngine.ts
 * Handles smooth animations with easing for the image cloud
 *
 * Public API:
 * - animateTransform(element, properties, duration, easing)
 * - animateTransformCancellable(element, from, to, duration, easing) - Web Animations API
 * - cancelAnimation(handle, commitStyle) - Cancel and optionally keep current position
 * - getCurrentTransform(element) - Get current transform state mid-animation
 * - hasActiveAnimation(element) - Check if element has active animation
 * - resetTransform(element, originalState)
 * - clearTransition(element)
 * - wait(ms)
 */

import type { AnimationConfig, TransformParams, ImageLayout, AnimationHandle, AnimationSnapshot } from '../config/types';

export class AnimationEngine {
  private config: AnimationConfig;
  private activeAnimations: Map<HTMLElement, AnimationHandle> = new Map();
  private animationIdCounter = 0;

  constructor(config: AnimationConfig) {
    this.config = config;
  }

  /**
   * Build transform string from transform params
   * Always starts with centering transform to match image positioning system
   */
  private buildTransformString(params: TransformParams): string {
    const transforms: string[] = ['translate(-50%, -50%)'];

    if (params.x !== undefined || params.y !== undefined) {
      const x = params.x ?? 0;
      const y = params.y ?? 0;
      transforms.push(`translate(${x}px, ${y}px)`);
    }

    if (params.rotation !== undefined) {
      transforms.push(`rotate(${params.rotation}deg)`);
    }

    if (params.scale !== undefined) {
      transforms.push(`scale(${params.scale})`);
    }

    return transforms.join(' ');
  }

  /**
   * Start a cancellable transform animation using Web Animations API
   * @param element - The element to animate
   * @param from - Starting transform state
   * @param to - Ending transform state
   * @param duration - Animation duration in ms (optional)
   * @param easing - CSS easing function (optional)
   * @returns AnimationHandle that can be used to cancel or query the animation
   */
  animateTransformCancellable(
    element: HTMLElement,
    from: TransformParams,
    to: TransformParams,
    duration: number | null = null,
    easing: string | null = null
  ): AnimationHandle {
    // Cancel any existing animation on this element
    this.cancelAllAnimations(element);

    const animDuration = duration ?? this.config.duration;
    const animEasing = easing ?? this.config.easing.default;

    const fromTransform = this.buildTransformString(from);
    const toTransform = this.buildTransformString(to);

    // Clear any CSS transitions to avoid conflicts
    element.style.transition = 'none';

    // Create Web Animation
    const animation = element.animate(
      [
        { transform: fromTransform },
        { transform: toTransform }
      ],
      {
        duration: animDuration,
        easing: animEasing,
        fill: 'forwards'  // Keep final state after animation
      }
    );

    const handle: AnimationHandle = {
      id: `anim-${++this.animationIdCounter}`,
      element,
      animation,
      fromState: from,
      toState: to,
      startTime: performance.now(),
      duration: animDuration
    };

    this.activeAnimations.set(element, handle);

    // Clean up when animation finishes (normally or cancelled)
    animation.finished
      .then(() => {
        // Apply final transform as inline style for consistency
        element.style.transform = toTransform;
        this.activeAnimations.delete(element);
      })
      .catch(() => {
        // Animation was cancelled - cleanup handled by cancelAnimation
        this.activeAnimations.delete(element);
      });

    return handle;
  }

  /**
   * Cancel an active animation
   * @param handle - The animation handle to cancel
   * @param commitStyle - If true, keeps current position; if false, no style change
   * @returns Snapshot of where the animation was when cancelled
   */
  cancelAnimation(handle: AnimationHandle, commitStyle: boolean = true): AnimationSnapshot {
    const snapshot = this.getCurrentTransform(handle.element);

    // Cancel the Web Animation
    handle.animation.cancel();

    if (commitStyle) {
      // Apply current position as inline style
      const currentTransform = this.buildTransformString({
        x: snapshot.x,
        y: snapshot.y,
        rotation: snapshot.rotation,
        scale: snapshot.scale
      });
      handle.element.style.transform = currentTransform;
    }

    this.activeAnimations.delete(handle.element);

    return snapshot;
  }

  /**
   * Cancel all animations on an element
   * Uses Web Animations API to find and cancel ALL animations, not just tracked ones
   * @param element - The element to cancel animations for
   */
  cancelAllAnimations(element: HTMLElement): void {
    // Cancel tracked animation
    const handle = this.activeAnimations.get(element);
    if (handle) {
      this.cancelAnimation(handle, false);
    }

    // Also cancel any other animations on the element (e.g., completed animations with fill: 'forwards')
    const allAnimations = element.getAnimations();
    for (const anim of allAnimations) {
      anim.cancel();
    }
  }

  /**
   * Get current transform state of an element (works mid-animation)
   * Uses DOMMatrix to parse the computed transform
   * @param element - The element to query
   * @returns Current transform snapshot
   */
  getCurrentTransform(element: HTMLElement): AnimationSnapshot {
    const computed = getComputedStyle(element);
    const transformStr = computed.transform;

    if (transformStr === 'none' || !transformStr) {
      return { x: 0, y: 0, rotation: 0, scale: 1 };
    }

    const matrix = new DOMMatrix(transformStr);

    // Extract scale from matrix (for uniform scale)
    const scale = Math.sqrt(matrix.a * matrix.a + matrix.b * matrix.b);

    // Extract rotation from matrix (in degrees)
    const rotation = Math.atan2(matrix.b, matrix.a) * (180 / Math.PI);

    // Extract translation
    // Note: matrix.e and matrix.f include ALL translations including the centering offset
    // The centering is translate(-50%, -50%) which depends on element dimensions
    // Since our transform chain is: translate(-50%, -50%) translate(x, y) rotate scale
    // The additional x,y offset we applied is already baked into e,f along with centering
    // For cross-animation, we need the relative offset, not absolute position
    // We'll return e,f directly and let ZoomEngine handle the interpretation
    const x = matrix.e;
    const y = matrix.f;

    return { x, y, rotation, scale };
  }

  /**
   * Check if an element has an active animation
   * @param element - The element to check
   * @returns True if animation is in progress
   */
  hasActiveAnimation(element: HTMLElement): boolean {
    return this.activeAnimations.has(element);
  }

  /**
   * Get animation handle for an element if it exists
   * @param element - The element to query
   * @returns AnimationHandle or undefined
   */
  getAnimationHandle(element: HTMLElement): AnimationHandle | undefined {
    return this.activeAnimations.get(element);
  }

  /**
   * Animate element transform with smooth easing (CSS transitions - legacy method)
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

      // Apply transition
      element.style.transition = `transform ${animDuration}ms ${animEasing}, box-shadow ${animDuration}ms ${animEasing}`;

      // Apply transform using shared helper
      element.style.transform = this.buildTransformString(properties);

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