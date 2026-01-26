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
   * Calculate scale factor for focused image
   */
  private calculateFocusScale(imageWidth: number, imageHeight: number, containerBounds: ContainerBounds): number {
    const normalizedPercent = this.normalizeScalePercent(this.config.scalePercent);
    const targetHeight = containerBounds.height * normalizedPercent;
    let scale = targetHeight / imageHeight;

    const scaledWidth = imageWidth * scale;
    const maxWidth = containerBounds.width * normalizedPercent;
    if (scaledWidth > maxWidth) {
      scale = maxWidth / imageWidth;
    }

    return scale;
  }

  /**
   * Calculate the transform needed to center an image
   */
  private calculateFocusTransform(
    imageElement: HTMLElement,
    containerBounds: ContainerBounds,
    originalState: ImageLayout
  ): TransformParams {
    const centerX = containerBounds.width / 2;
    const centerY = containerBounds.height / 2;

    const imageWidth = imageElement.offsetWidth;
    const imageHeight = imageElement.offsetHeight;

    const targetX = centerX - originalState.x;
    const targetY = centerY - originalState.y;

    const focusScale = this.calculateFocusScale(imageWidth, imageHeight, containerBounds);

    return {
      x: targetX,
      y: targetY,
      rotation: 0,
      scale: focusScale
    };
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
   * Start focus animation for an image
   * @param fromTransform - Optional starting transform (for mid-animation reversals)
   */
  private startFocusAnimation(
    element: HTMLElement,
    containerBounds: ContainerBounds,
    originalState: ImageLayout,
    fromTransform?: TransformParams
  ): AnimatingImage {
    const focusTransform = this.calculateFocusTransform(element, containerBounds, originalState);
    const originalZIndex = element.style.zIndex || '';

    // Apply focused styling immediately
    this.applyFocusedStyling(element, Z_INDEX.FOCUSING);

    // Start animation from provided position or original position
    const fromState: TransformParams = fromTransform ?? {
      x: 0,
      y: 0,
      rotation: originalState.rotation,
      scale: originalState.scale
    };

    const handle = this.animationEngine.animateTransformCancellable(
      element,
      fromState,
      focusTransform,
      this.config.animationDuration
    );

    // Store focus data for later
    this.focusData = {
      element,
      originalState,
      focusTransform,
      originalZIndex
    };

    return {
      element,
      originalState,
      animationHandle: handle,
      direction: 'in'
    };
  }

  /**
   * Start unfocus animation for an image
   */
  private startUnfocusAnimation(
    element: HTMLElement,
    originalState: ImageLayout,
    fromTransform?: TransformParams
  ): AnimatingImage {
    // Set z-index for unfocusing (below incoming)
    element.style.zIndex = String(Z_INDEX.UNFOCUSING);

    // Start from current focused position (or provided position for interrupted animations)
    const from = fromTransform ?? this.focusData?.focusTransform ?? { x: 0, y: 0, rotation: 0, scale: 1 };

    const toState: TransformParams = {
      x: 0,
      y: 0,
      rotation: originalState.rotation,
      scale: originalState.scale
    };

    const handle = this.animationEngine.animateTransformCancellable(
      element,
      from,
      toState,
      this.config.animationDuration
    );

    return {
      element,
      originalState,
      animationHandle: handle,
      direction: 'out'
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
   * Reset an element instantly to its original position (no animation)
   */
  private resetElementInstantly(element: HTMLElement, originalState: ImageLayout, originalZIndex: string): void {
    // Cancel any active animation (including completed animations with fill: 'forwards')
    this.animationEngine.cancelAllAnimations(element);

    // Build transform string for original position
    // Must include translate(0px, 0px) to match animation format
    const transforms = ['translate(-50%, -50%)'];
    transforms.push('translate(0px, 0px)');
    transforms.push(`rotate(${originalState.rotation}deg)`);
    transforms.push(`scale(${originalState.scale})`);

    element.style.transition = 'none';
    element.style.transform = transforms.join(' ');

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
      // Capture current position and reverse
      const snapshot = this.animationEngine.cancelAnimation(this.incoming.animationHandle, true);
      const fromTransform: TransformParams = {
        x: snapshot.x,
        y: snapshot.y,
        rotation: snapshot.rotation,
        scale: snapshot.scale
      };

      this.outgoing = this.startUnfocusAnimation(
        imageElement,
        this.incoming.originalState,
        fromTransform
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
            this.focusData?.originalZIndex || ''
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
          // Cancel outgoing animation and make it the incoming
          const snapshot = this.animationEngine.cancelAnimation(this.outgoing.animationHandle, true);
          const fromTransform: TransformParams = {
            x: snapshot.x,
            y: snapshot.y,
            rotation: snapshot.rotation,
            scale: snapshot.scale
          };

          // Redirect current incoming to become outgoing
          if (this.incoming) {
            const incomingSnapshot = this.animationEngine.cancelAnimation(this.incoming.animationHandle, true);
            const incomingFrom: TransformParams = {
              x: incomingSnapshot.x,
              y: incomingSnapshot.y,
              rotation: incomingSnapshot.rotation,
              scale: incomingSnapshot.scale
            };
            this.outgoing = this.startUnfocusAnimation(
              this.incoming.element,
              this.incoming.originalState,
              incomingFrom
            );
          } else {
            this.outgoing = null;
          }

          // Start new incoming for the clicked (formerly outgoing) image
          // Use fromTransform to continue from current position
          this.incoming = this.startFocusAnimation(imageElement, containerBounds, originalState, fromTransform);

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
            this.outgoing.originalState.zIndex?.toString() || ''
          );
          this.outgoing = null;
        }

        // Redirect incoming to outgoing (animate from current position back to original)
        if (this.incoming) {
          const snapshot = this.animationEngine.cancelAnimation(this.incoming.animationHandle, true);
          const fromTransform: TransformParams = {
            x: snapshot.x,
            y: snapshot.y,
            rotation: snapshot.rotation,
            scale: snapshot.scale
          };

          this.outgoing = this.startUnfocusAnimation(
            this.incoming.element,
            this.incoming.originalState,
            fromTransform
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
    // Increment generation to invalidate any previous in-flight calls
    const myGeneration = ++this.focusGeneration;

    if (!this.currentFocus || !this.focusData) {
      // Handle case where we're in FOCUSING state
      if (this.incoming && this.state === ZoomState.FOCUSING) {
        const snapshot = this.animationEngine.cancelAnimation(this.incoming.animationHandle, true);
        const fromTransform: TransformParams = {
          x: snapshot.x,
          y: snapshot.y,
          rotation: snapshot.rotation,
          scale: snapshot.scale
        };

        this.outgoing = this.startUnfocusAnimation(
          this.incoming.element,
          this.incoming.originalState,
          fromTransform
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
        const snapshot = this.animationEngine.cancelAnimation(this.incoming.animationHandle, true);
        const fromTransform: TransformParams = {
          x: snapshot.x,
          y: snapshot.y,
          rotation: snapshot.rotation,
          scale: snapshot.scale
        };

        // Start unfocus for incoming from its current position
        const incomingUnfocus = this.startUnfocusAnimation(
          this.incoming.element,
          this.incoming.originalState,
          fromTransform
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
   * Reset zoom state (cancels all animations)
   */
  reset(): void {
    // Cancel any active animations
    if (this.outgoing) {
      this.animationEngine.cancelAnimation(this.outgoing.animationHandle, false);
      this.resetElementInstantly(
        this.outgoing.element,
        this.outgoing.originalState,
        this.outgoing.originalState.zIndex?.toString() || ''
      );
    }

    if (this.incoming) {
      this.animationEngine.cancelAnimation(this.incoming.animationHandle, false);
      this.resetElementInstantly(
        this.incoming.element,
        this.incoming.originalState,
        this.focusData?.originalZIndex || ''
      );
    }

    if (this.currentFocus && this.focusData) {
      this.resetElementInstantly(
        this.currentFocus,
        this.focusData.originalState,
        this.focusData.originalZIndex
      );
    }

    this.state = ZoomState.IDLE;
    this.currentFocus = null;
    this.focusData = null;
    this.outgoing = null;
    this.incoming = null;
  }
}
