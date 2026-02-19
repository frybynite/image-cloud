/**
 * ZoomEngine.ts
 * Manages zoom/focus behavior for image cloud with cross-animation support
 *
 * Public API:
 * - focusImage(imageElement, containerBounds, originalState)
 * - unfocusImage()
 * - getCurrentFocus()
 * - swapFocus(newImageElement, containerBounds, originalState)
 * - isFocused(imageElement)
 * - isAnimating()
 * - getState()
 * - reset()
 */

import type {
  FocusInteractionConfig,
  ContainerBounds,
  ImageLayout,
  TransformParams,
  ImageStylingConfig,
  AnimationHandle,
  AnimatingImage
} from '../config/types';
import { ZoomState } from '../config/types';
import { AnimationEngine } from './AnimationEngine';
import { buildStyleProperties, applyStylesToElement, applyClassNameToElement, removeClassNameFromElement, StyleProperties } from '../utils/styleUtils';

interface FocusData {
  element: HTMLElement;
  originalState: ImageLayout;
  focusTransform: TransformParams;
  originalZIndex: string;
  originalWidth: number;
  originalHeight: number;
  focusWidth: number;
  focusHeight: number;
}

// Z-index constants for layering during animations
const Z_INDEX = {
  DEFAULT: '',
  UNFOCUSING: 999,
  FOCUSING: 1000,
  FOCUSED: 1000
};

export class ZoomEngine {
  private config: FocusInteractionConfig;
  private animationEngine: AnimationEngine;

  // State machine
  private state: ZoomState = ZoomState.IDLE;
  private currentFocus: HTMLElement | null = null;
  private focusData: FocusData | null = null;

  // Animation tracking for cross-animation
  private outgoing: AnimatingImage | null = null;
  private incoming: AnimatingImage | null = null;

  // Generation counter to handle concurrent calls
  private focusGeneration: number = 0;

  // Styling
  private defaultStyles: StyleProperties;
  private focusedStyles: StyleProperties;
  private defaultClassName: string | string[] | undefined;
  private focusedClassName: string | string[] | undefined;

  constructor(config: FocusInteractionConfig, animationEngine: AnimationEngine, styling?: ImageStylingConfig) {
    this.config = config;
    this.animationEngine = animationEngine;

    // Precompute styling properties
    this.defaultStyles = buildStyleProperties(styling?.default);
    this.focusedStyles = buildStyleProperties(styling?.focused);
    this.defaultClassName = styling?.default?.className;
    this.focusedClassName = styling?.focused?.className;
  }

  /**
   * Get current state machine state
   */
  getState(): ZoomState {
    return this.state;
  }

  /**
   * Check if any animation is in progress
   */
  isAnimating(): boolean {
    return this.state !== ZoomState.IDLE && this.state !== ZoomState.FOCUSED;
  }

  /**
   * Normalize scalePercent value
   */
  private normalizeScalePercent(value: number): number {
    return value > 1 ? value / 100 : value;
  }

  /**
   * Calculate target dimensions for focused image
   * Returns actual pixel dimensions instead of scale factor for sharper rendering
   */
  private calculateFocusDimensions(imageWidth: number, imageHeight: number, containerBounds: ContainerBounds): { width: number; height: number } {
    const normalizedPercent = this.normalizeScalePercent(this.config.scalePercent);
    const targetHeight = containerBounds.height * normalizedPercent;
    const aspectRatio = imageWidth / imageHeight;

    let focusHeight = targetHeight;
    let focusWidth = focusHeight * aspectRatio;

    const maxWidth = containerBounds.width * normalizedPercent;
    if (focusWidth > maxWidth) {
      focusWidth = maxWidth;
      focusHeight = focusWidth / aspectRatio;
    }

    return { width: focusWidth, height: focusHeight };
  }

  /**
   * Calculate the transform needed to center an image (position only, no scale)
   * Scale is handled by animating actual dimensions for sharper rendering
   */
  private calculateFocusTransform(
    containerBounds: ContainerBounds,
    originalState: ImageLayout
  ): TransformParams {
    const centerX = containerBounds.width / 2;
    const centerY = containerBounds.height / 2;

    const targetX = centerX - originalState.x;
    const targetY = centerY - originalState.y;

    return {
      x: targetX,
      y: targetY,
      rotation: 0,
      scale: 1  // No scale transform - dimensions are animated instead
    };
  }

  /**
   * Build transform string for dimension-based zoom (no scale in transform)
   */
  private buildDimensionZoomTransform(params: TransformParams): string {
    const transforms: string[] = ['translate(-50%, -50%)'];

    if (params.x !== undefined || params.y !== undefined) {
      const x = params.x ?? 0;
      const y = params.y ?? 0;
      transforms.push(`translate(${x}px, ${y}px)`);
    }

    if (params.rotation !== undefined) {
      transforms.push(`rotate(${params.rotation}deg)`);
    }

    // Note: scale is intentionally omitted - we animate width/height instead

    return transforms.join(' ');
  }

  /**
   * Create a Web Animation that animates both transform (position) and dimensions
   * This provides sharper zoom by re-rendering at target size instead of scaling pixels
   */
  private animateWithDimensions(
    element: HTMLElement,
    fromTransform: TransformParams,
    toTransform: TransformParams,
    fromWidth: number,
    fromHeight: number,
    toWidth: number,
    toHeight: number,
    duration: number
  ): Animation {
    const fromTransformStr = this.buildDimensionZoomTransform(fromTransform);
    const toTransformStr = this.buildDimensionZoomTransform(toTransform);

    // Clear any CSS transitions to avoid conflicts
    element.style.transition = 'none';

    // Create Web Animation with both transform and dimensions
    const animation = element.animate(
      [
        {
          transform: fromTransformStr,
          width: `${fromWidth}px`,
          height: `${fromHeight}px`
        },
        {
          transform: toTransformStr,
          width: `${toWidth}px`,
          height: `${toHeight}px`
        }
      ],
      {
        duration: duration,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        fill: 'forwards'
      }
    );

    return animation;
  }

  /**
   * Apply focused styling to an element
   */
  private applyFocusedStyling(element: HTMLElement, zIndex: number): void {
    element.style.zIndex = String(zIndex);
    element.classList.add('fbn-ic-focused');
    applyStylesToElement(element, this.focusedStyles);
    applyClassNameToElement(element, this.focusedClassName);
  }

  /**
   * Remove focused styling from an element
   */
  private removeFocusedStyling(element: HTMLElement, originalZIndex: string): void {
    element.style.zIndex = originalZIndex;
    element.classList.remove('fbn-ic-focused');
    removeClassNameFromElement(element, this.focusedClassName);
    applyStylesToElement(element, this.defaultStyles);
    applyClassNameToElement(element, this.defaultClassName);
  }

  /**
   * Start focus animation for an image using dimension-based zoom
   * Animates actual width/height for sharper rendering instead of transform scale
   * @param fromTransform - Optional starting transform (for mid-animation reversals)
   * @param fromDimensions - Optional starting dimensions (for mid-animation reversals)
   */
  private startFocusAnimation(
    element: HTMLElement,
    containerBounds: ContainerBounds,
    originalState: ImageLayout,
    fromTransform?: TransformParams,
    fromDimensions?: { width: number; height: number }
  ): AnimatingImage {
    const originalZIndex = element.style.zIndex || '';
    const originalWidth = element.offsetWidth;
    const originalHeight = element.offsetHeight;

    // Calculate target dimensions and position
    const focusDimensions = this.calculateFocusDimensions(originalWidth, originalHeight, containerBounds);
    const focusTransform = this.calculateFocusTransform(containerBounds, originalState);

    // Apply focused styling immediately
    this.applyFocusedStyling(element, Z_INDEX.FOCUSING);

    // Cancel any existing animation
    this.animationEngine.cancelAllAnimations(element);

    // Start animation from provided state or original position
    const startTransform: TransformParams = fromTransform ?? {
      x: 0,
      y: 0,
      rotation: originalState.rotation,
      scale: 1  // No scale - using dimensions
    };

    const startWidth = fromDimensions?.width ?? originalWidth;
    const startHeight = fromDimensions?.height ?? originalHeight;

    const duration = this.config.animationDuration ?? 600;

    // Create dimension-based animation
    const animation = this.animateWithDimensions(
      element,
      startTransform,
      focusTransform,
      startWidth,
      startHeight,
      focusDimensions.width,
      focusDimensions.height,
      duration
    );

    // Create animation handle
    const handle: AnimationHandle = {
      id: `focus-${Date.now()}`,
      element,
      animation,
      fromState: startTransform,
      toState: focusTransform,
      startTime: performance.now(),
      duration
    };

    // Store focus data for later (including dimensions for unfocus)
    this.focusData = {
      element,
      originalState,
      focusTransform,
      originalZIndex,
      originalWidth,
      originalHeight,
      focusWidth: focusDimensions.width,
      focusHeight: focusDimensions.height
    };

    return {
      element,
      originalState,
      animationHandle: handle,
      direction: 'in' as const,
      originalWidth,
      originalHeight
    };
  }

  /**
   * Start unfocus animation for an image using dimension-based zoom
   * Animates back to original dimensions for consistent behavior
   * @param fromDimensions - Optional starting dimensions (for mid-animation reversals)
   */
  private startUnfocusAnimation(
    element: HTMLElement,
    originalState: ImageLayout,
    fromTransform?: TransformParams,
    fromDimensions?: { width: number; height: number }
  ): AnimatingImage {
    // Set z-index for unfocusing (below incoming)
    element.style.zIndex = String(Z_INDEX.UNFOCUSING);

    // Cancel any existing animation
    this.animationEngine.cancelAllAnimations(element);

    // Start from current focused state (or provided state for interrupted animations)
    const startTransform = fromTransform ?? this.focusData?.focusTransform ?? { x: 0, y: 0, rotation: 0, scale: 1 };
    const startWidth = fromDimensions?.width ?? this.focusData?.focusWidth ?? element.offsetWidth;
    const startHeight = fromDimensions?.height ?? this.focusData?.focusHeight ?? element.offsetHeight;

    // Target is original position and dimensions
    const toState: TransformParams = {
      x: 0,
      y: 0,
      rotation: originalState.rotation,
      scale: 1  // No scale - using dimensions
    };

    const targetWidth = this.focusData?.originalWidth ?? element.offsetWidth;
    const targetHeight = this.focusData?.originalHeight ?? element.offsetHeight;
    const duration = this.config.animationDuration ?? 600;

    // Create dimension-based animation
    const animation = this.animateWithDimensions(
      element,
      startTransform,
      toState,
      startWidth,
      startHeight,
      targetWidth,
      targetHeight,
      duration
    );

    // Create animation handle
    const handle: AnimationHandle = {
      id: `unfocus-${Date.now()}`,
      element,
      animation,
      fromState: startTransform,
      toState: toState,
      startTime: performance.now(),
      duration
    };

    return {
      element,
      originalState,
      animationHandle: handle,
      direction: 'out' as const,
      originalWidth: targetWidth,
      originalHeight: targetHeight
    };
  }

  /**
   * Capture the current visual state of an element mid-animation, BEFORE cancelling.
   *
   * The computed matrix.e/f include the -50%/-50% centering offset resolved to pixels.
   * buildDimensionZoomTransform prepends its own translate(-50%,-50%), so passing raw
   * matrix.e/f doubles the centering and produces the wrong starting position.
   *
   * This method extracts the PURE positional offset (pureX = matrix.e + 0.5*midWidth)
   * and commits width/height/transform to inline styles before the animation is cancelled,
   * preventing any visual snap.
   *
   * Must be called while the animation is still running (offsetWidth reflects animated size).
   * Caller is responsible for calling animationEngine.cancelAllAnimations() afterwards.
   */
  private captureMidAnimationState(element: HTMLElement): {
    transform: TransformParams;
    dimensions: { width: number; height: number };
  } {
    const computed = getComputedStyle(element);
    const matrix = new DOMMatrix(computed.transform);
    const midWidth = element.offsetWidth;
    const midHeight = element.offsetHeight;

    // Remove the -50%/-50% centering that is baked into matrix.e/f
    const pureX = matrix.e + midWidth * 0.5;
    const pureY = matrix.f + midHeight * 0.5;
    const rotation = Math.atan2(matrix.b, matrix.a) * (180 / Math.PI);

    // Commit current visual state to inline styles so cancelling the animation
    // does not cause the element to snap to a different size/position
    element.style.width = `${midWidth}px`;
    element.style.height = `${midHeight}px`;
    element.style.transform = `translate(-50%, -50%) translate(${pureX}px, ${pureY}px) rotate(${rotation}deg)`;
    element.style.transition = 'none';

    return {
      transform: { x: pureX, y: pureY, rotation, scale: 1 },
      dimensions: { width: midWidth, height: midHeight }
    };
  }

  /**
   * Handle animation completion
   */
  private async waitForAnimation(handle: AnimationHandle): Promise<void> {
    try {
      await handle.animation.finished;
    } catch {
      // Animation was cancelled - this is expected during interruption
    }
  }

  /**
   * Reset an element instantly to its original position and dimensions (no animation)
   */
  private resetElementInstantly(
    element: HTMLElement,
    originalState: ImageLayout,
    originalZIndex: string,
    originalWidth?: number,
    originalHeight?: number
  ): void {
    // Cancel any active animation (including completed animations with fill: 'forwards')
    this.animationEngine.cancelAllAnimations(element);

    // Build transform string for original position (no scale - using dimensions)
    const transforms = ['translate(-50%, -50%)'];
    transforms.push('translate(0px, 0px)');
    transforms.push(`rotate(${originalState.rotation}deg)`);
    // No scale in transform - dimensions handle sizing

    element.style.transition = 'none';
    element.style.transform = transforms.join(' ');

    // Restore original dimensions if provided
    if (originalWidth !== undefined && originalHeight !== undefined) {
      element.style.width = `${originalWidth}px`;
      element.style.height = `${originalHeight}px`;
    }

    // Remove focused styling
    this.removeFocusedStyling(element, originalZIndex);
  }

  /**
   * Focus (zoom) an image to center of container
   * Implements cross-animation when swapping focus
   */
  async focusImage(
    imageElement: HTMLElement,
    containerBounds: ContainerBounds,
    originalState: ImageLayout
  ): Promise<void> {
    // Same image clicked while already focused - unfocus it
    if (this.currentFocus === imageElement && this.state === ZoomState.FOCUSED) {
      return this.unfocusImage();
    }

    // Same image clicked while it's animating in - reverse to unfocus
    if (this.incoming?.element === imageElement && this.state === ZoomState.FOCUSING) {
      // Capture mid-animation state BEFORE cancelling (offsetWidth reflects animated size;
      // pure positional offset strips the -50% centering already baked into matrix.e/f)
      const { transform: fromTransform, dimensions: fromDimensions } =
        this.captureMidAnimationState(imageElement);
      this.animationEngine.cancelAllAnimations(imageElement);

      this.outgoing = this.startUnfocusAnimation(
        imageElement,
        this.incoming.originalState,
        fromTransform,
        fromDimensions
      );
      this.incoming = null;
      this.state = ZoomState.UNFOCUSING;

      await this.waitForAnimation(this.outgoing.animationHandle);
      this.removeFocusedStyling(this.outgoing.element, this.focusData?.originalZIndex || '');
      this.outgoing = null;
      this.currentFocus = null;
      this.focusData = null;
      this.state = ZoomState.IDLE;
      return;
    }

    // Increment generation to invalidate any previous in-flight calls
    const myGeneration = ++this.focusGeneration;

    switch (this.state) {
      case ZoomState.IDLE:
        // Simple focus - no current focus
        this.state = ZoomState.FOCUSING;
        this.incoming = this.startFocusAnimation(imageElement, containerBounds, originalState);

        await this.waitForAnimation(this.incoming.animationHandle);

        // Check if we're still the active generation
        if (this.focusGeneration !== myGeneration) return;

        this.currentFocus = imageElement;
        this.incoming = null;
        this.state = ZoomState.FOCUSED;
        break;

      case ZoomState.FOCUSED:
        // Cross-animation: unfocus current while focusing new
        this.state = ZoomState.CROSS_ANIMATING;

        // Start outgoing animation for currently focused image
        if (this.currentFocus && this.focusData) {
          this.outgoing = this.startUnfocusAnimation(
            this.currentFocus,
            this.focusData.originalState
          );
        }

        // Start incoming animation for new image
        this.incoming = this.startFocusAnimation(imageElement, containerBounds, originalState);

        // Wait for both animations
        await Promise.all([
          this.outgoing ? this.waitForAnimation(this.outgoing.animationHandle) : Promise.resolve(),
          this.waitForAnimation(this.incoming.animationHandle)
        ]);

        // Check if we're still the active generation
        if (this.focusGeneration !== myGeneration) {
          return;
        }

        // Cleanup outgoing
        if (this.outgoing) {
          this.removeFocusedStyling(this.outgoing.element, this.outgoing.originalState.zIndex?.toString() || '');
          this.outgoing = null;
        }

        this.currentFocus = imageElement;
        this.incoming = null;
        this.state = ZoomState.FOCUSED;
        break;

      case ZoomState.FOCUSING:
        // New image clicked while another is focusing
        // Cancel the incoming and start new focus
        if (this.incoming) {
          this.animationEngine.cancelAnimation(this.incoming.animationHandle, false);
          this.resetElementInstantly(
            this.incoming.element,
            this.incoming.originalState,
            this.focusData?.originalZIndex || '',
            this.focusData?.originalWidth,
            this.focusData?.originalHeight
          );
          this.incoming = null;
        }

        // Start focusing the new image
        this.incoming = this.startFocusAnimation(imageElement, containerBounds, originalState);

        await this.waitForAnimation(this.incoming.animationHandle);

        // Check if we're still the active generation
        if (this.focusGeneration !== myGeneration) return;

        this.currentFocus = imageElement;
        this.incoming = null;
        this.state = ZoomState.FOCUSED;
        break;

      case ZoomState.UNFOCUSING:
        // New image clicked while current is unfocusing
        // Let outgoing continue, start cross-animation
        this.state = ZoomState.CROSS_ANIMATING;
        this.incoming = this.startFocusAnimation(imageElement, containerBounds, originalState);

        await Promise.all([
          this.outgoing ? this.waitForAnimation(this.outgoing.animationHandle) : Promise.resolve(),
          this.waitForAnimation(this.incoming.animationHandle)
        ]);

        // Check if we're still the active generation
        if (this.focusGeneration !== myGeneration) return;

        if (this.outgoing) {
          this.removeFocusedStyling(this.outgoing.element, this.outgoing.originalState.zIndex?.toString() || '');
          this.outgoing = null;
        }

        this.currentFocus = imageElement;
        this.incoming = null;
        this.state = ZoomState.FOCUSED;
        break;

      case ZoomState.CROSS_ANIMATING:
        // Handle click during cross-animation

        // If clicking the same image that's animating in, ignore (it's already targeting focus)
        if (this.incoming?.element === imageElement) {
          return;
        }

        // If clicking the same image that's animating out, let it become the new focus target
        // (reverse direction - it should animate back to focused)
        if (this.outgoing?.element === imageElement) {
          // Capture mid-animation state for outgoing before cancelling
          const { transform: fromTransform, dimensions: fromDimensions } =
            this.captureMidAnimationState(imageElement);
          this.animationEngine.cancelAllAnimations(imageElement);

          // Redirect current incoming to become outgoing
          if (this.incoming) {
            const { transform: incomingFrom, dimensions: incomingFromDimensions } =
              this.captureMidAnimationState(this.incoming.element);
            this.animationEngine.cancelAllAnimations(this.incoming.element);
            this.outgoing = this.startUnfocusAnimation(
              this.incoming.element,
              this.incoming.originalState,
              incomingFrom,
              incomingFromDimensions
            );
          } else {
            this.outgoing = null;
          }

          // Start new incoming for the clicked (formerly outgoing) image
          // Use fromTransform and fromDimensions to continue from current state
          this.incoming = this.startFocusAnimation(imageElement, containerBounds, originalState, fromTransform, fromDimensions);

          await Promise.all([
            this.outgoing ? this.waitForAnimation(this.outgoing.animationHandle) : Promise.resolve(),
            this.waitForAnimation(this.incoming.animationHandle)
          ]);

          if (this.focusGeneration !== myGeneration) return;

          if (this.outgoing) {
            this.removeFocusedStyling(this.outgoing.element, this.outgoing.originalState.zIndex?.toString() || '');
            this.outgoing = null;
          }

          this.currentFocus = imageElement;
          this.incoming = null;
          this.state = ZoomState.FOCUSED;
          return;
        }

        // Third different image clicked during cross-animation
        // 1. Reset outgoing instantly
        // 2. Redirect incoming to become outgoing
        // 3. Start new incoming

        // Reset outgoing instantly
        if (this.outgoing) {
          this.animationEngine.cancelAnimation(this.outgoing.animationHandle, false);
          this.resetElementInstantly(
            this.outgoing.element,
            this.outgoing.originalState,
            this.outgoing.originalState.zIndex?.toString() || '',
            this.outgoing.originalWidth,
            this.outgoing.originalHeight
          );
          this.outgoing = null;
        }

        // Redirect incoming to outgoing (animate from current position back to original)
        if (this.incoming) {
          const { transform: fromTransform, dimensions: fromDimensions } =
            this.captureMidAnimationState(this.incoming.element);
          this.animationEngine.cancelAllAnimations(this.incoming.element);

          this.outgoing = this.startUnfocusAnimation(
            this.incoming.element,
            this.incoming.originalState,
            fromTransform,
            fromDimensions
          );
        }

        // Start new incoming
        this.incoming = this.startFocusAnimation(imageElement, containerBounds, originalState);

        // Wait for both
        await Promise.all([
          this.outgoing ? this.waitForAnimation(this.outgoing.animationHandle) : Promise.resolve(),
          this.waitForAnimation(this.incoming.animationHandle)
        ]);

        // Check if we're still the active generation
        if (this.focusGeneration !== myGeneration) return;

        if (this.outgoing) {
          this.removeFocusedStyling(this.outgoing.element, this.outgoing.originalState.zIndex?.toString() || '');
          this.outgoing = null;
        }

        this.currentFocus = imageElement;
        this.incoming = null;
        this.state = ZoomState.FOCUSED;
        break;
    }
  }

  /**
   * Unfocus current image, returning it to original position
   */
  async unfocusImage(): Promise<void> {
    // Already animating out - ignore duplicate requests (e.g. ESC pressed twice)
    if (this.state === ZoomState.UNFOCUSING) {
      return;
    }

    // Increment generation to invalidate any previous in-flight calls
    const myGeneration = ++this.focusGeneration;

    if (!this.currentFocus || !this.focusData) {
      // Handle case where we're in FOCUSING state
      if (this.incoming && this.state === ZoomState.FOCUSING) {
        const { transform: fromTransform, dimensions: fromDimensions } =
          this.captureMidAnimationState(this.incoming.element);
        this.animationEngine.cancelAllAnimations(this.incoming.element);

        this.outgoing = this.startUnfocusAnimation(
          this.incoming.element,
          this.incoming.originalState,
          fromTransform,
          fromDimensions
        );
        this.incoming = null;
        this.state = ZoomState.UNFOCUSING;

        await this.waitForAnimation(this.outgoing.animationHandle);

        if (this.focusGeneration !== myGeneration) return;

        this.removeFocusedStyling(this.outgoing.element, this.focusData?.originalZIndex || '');
        this.outgoing = null;
        this.focusData = null;
        this.state = ZoomState.IDLE;
      }
      return;
    }

    // Handle cross-animation cancellation (ESC during cross-animation)
    if (this.state === ZoomState.CROSS_ANIMATING) {
      // Cancel incoming and animate it back
      if (this.incoming) {
        const { transform: fromTransform, dimensions: fromDimensions } =
          this.captureMidAnimationState(this.incoming.element);
        this.animationEngine.cancelAllAnimations(this.incoming.element);

        // Start unfocus for incoming from its current position
        const incomingUnfocus = this.startUnfocusAnimation(
          this.incoming.element,
          this.incoming.originalState,
          fromTransform,
          fromDimensions
        );

        // Wait for both outgoing and the redirected incoming
        await Promise.all([
          this.outgoing ? this.waitForAnimation(this.outgoing.animationHandle) : Promise.resolve(),
          this.waitForAnimation(incomingUnfocus.animationHandle)
        ]);

        if (this.focusGeneration !== myGeneration) return;

        // Cleanup
        if (this.outgoing) {
          this.removeFocusedStyling(this.outgoing.element, this.outgoing.originalState.zIndex?.toString() || '');
        }
        this.removeFocusedStyling(incomingUnfocus.element, this.incoming.originalState.zIndex?.toString() || '');

        this.outgoing = null;
        this.incoming = null;
        this.currentFocus = null;
        this.focusData = null;
        this.state = ZoomState.IDLE;
        return;
      }
    }

    // Normal unfocus from FOCUSED state
    this.state = ZoomState.UNFOCUSING;
    const element = this.currentFocus;
    const originalState = this.focusData.originalState;
    const originalZIndex = this.focusData.originalZIndex;

    this.outgoing = this.startUnfocusAnimation(element, originalState);

    await this.waitForAnimation(this.outgoing.animationHandle);

    if (this.focusGeneration !== myGeneration) return;

    this.removeFocusedStyling(element, originalZIndex);
    this.outgoing = null;
    this.currentFocus = null;
    this.focusData = null;
    this.state = ZoomState.IDLE;
  }

  /**
   * Swap focus from current image to a new one (alias for focusImage with cross-animation)
   */
  async swapFocus(
    newImageElement: HTMLElement,
    containerBounds: ContainerBounds,
    originalState: ImageLayout
  ): Promise<void> {
    return this.focusImage(newImageElement, containerBounds, originalState);
  }

  /**
   * Get currently focused image element
   */
  getCurrentFocus(): HTMLElement | null {
    return this.currentFocus;
  }

  /**
   * Check if an image is currently focused (stable state)
   */
  isFocused(imageElement: HTMLElement): boolean {
    return this.currentFocus === imageElement && this.state === ZoomState.FOCUSED;
  }

  /**
   * Check if an image is the target of current focus animation
   */
  isTargetingFocus(imageElement: HTMLElement): boolean {
    return this.incoming?.element === imageElement;
  }

  /**
   * Check if an image is involved in any focus/animation state
   * Returns true if the image is focused, animating in, or animating out
   * Useful for hover state management - don't apply hover to animating images
   */
  isInvolved(imageElement: HTMLElement): boolean {
    return (
      this.currentFocus === imageElement ||
      this.incoming?.element === imageElement ||
      this.outgoing?.element === imageElement
    );
  }

  /**
   * Apply a temporary horizontal drag offset to the focused image
   * Used during swipe gestures for visual feedback
   */
  setDragOffset(offset: number): void {
    if (!this.currentFocus || !this.focusData || this.state !== ZoomState.FOCUSED) return;

    const element = this.currentFocus;
    const focusTransform = this.focusData.focusTransform;

    // Build transform with additional horizontal offset
    const transforms: string[] = ['translate(-50%, -50%)'];
    const x = (focusTransform.x ?? 0) + offset;
    const y = focusTransform.y ?? 0;
    transforms.push(`translate(${x}px, ${y}px)`);
    if (focusTransform.rotation !== undefined) {
      transforms.push(`rotate(${focusTransform.rotation}deg)`);
    }

    element.style.transition = 'none';
    element.style.transform = transforms.join(' ');
  }

  /**
   * Clear the drag offset, optionally animating back to center
   * @param animate - If true, animate back to center; if false, snap instantly
   * @param duration - Animation duration in ms (default 150)
   */
  clearDragOffset(animate: boolean, duration: number = 150): void {
    if (!this.currentFocus || !this.focusData || this.state !== ZoomState.FOCUSED) return;

    const element = this.currentFocus;
    const focusTransform = this.focusData.focusTransform;

    // Build the centered transform (no offset)
    const transforms: string[] = ['translate(-50%, -50%)'];
    const x = focusTransform.x ?? 0;
    const y = focusTransform.y ?? 0;
    transforms.push(`translate(${x}px, ${y}px)`);
    if (focusTransform.rotation !== undefined) {
      transforms.push(`rotate(${focusTransform.rotation}deg)`);
    }
    const centeredTransform = transforms.join(' ');

    if (animate) {
      element.style.transition = `transform ${duration}ms ease-out`;
      element.style.transform = centeredTransform;
      // Clear transition after animation completes
      setTimeout(() => {
        if (this.currentFocus === element) {
          element.style.transition = 'none';
        }
      }, duration);
    } else {
      element.style.transition = 'none';
      element.style.transform = centeredTransform;
    }
  }

  /**
   * Reset zoom state (cancels all animations)
   */
  reset(): void {
    // Cancel any active animations
    if (this.outgoing) {
      this.animationEngine.cancelAnimation(this.outgoing.animationHandle, false);
      this.resetElementInstantly(
        this.outgoing.element,
        this.outgoing.originalState,
        this.outgoing.originalState.zIndex?.toString() || '',
        this.outgoing.originalWidth,
        this.outgoing.originalHeight
      );
    }

    if (this.incoming) {
      this.animationEngine.cancelAnimation(this.incoming.animationHandle, false);
      this.resetElementInstantly(
        this.incoming.element,
        this.incoming.originalState,
        this.focusData?.originalZIndex || '',
        this.focusData?.originalWidth,
        this.focusData?.originalHeight
      );
    }

    if (this.currentFocus && this.focusData) {
      this.resetElementInstantly(
        this.currentFocus,
        this.focusData.originalState,
        this.focusData.originalZIndex,
        this.focusData.originalWidth,
        this.focusData.originalHeight
      );
    }

    this.state = ZoomState.IDLE;
    this.currentFocus = null;
    this.focusData = null;
    this.outgoing = null;
    this.incoming = null;
  }
}
