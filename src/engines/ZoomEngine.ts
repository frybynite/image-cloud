/**
 * ZoomEngine.ts
 * Manages zoom/focus behavior for image cloud
 *
 * Public API:
 * - focusImage(imageElement, containerBounds, originalState)
 * - unfocusImage()
 * - getCurrentFocus()
 * - swapFocus(newImageElement, containerBounds, originalState)
 * - isFocused(imageElement)
 * - reset()
 */

import type { FocusInteractionConfig, ContainerBounds, ImageLayout, TransformParams } from '../config/types';
import { AnimationEngine } from './AnimationEngine';

interface FocusData {
  element: HTMLElement;
  originalState: ImageLayout;
  focusTransform: TransformParams;
}

export class ZoomEngine {
  private config: FocusInteractionConfig;
  private animationEngine: AnimationEngine;
  private currentFocus: HTMLElement | null;
  private focusData: FocusData | null;

  constructor(config: FocusInteractionConfig, animationEngine: AnimationEngine) {
    this.config = config;

    this.animationEngine = animationEngine;
    this.currentFocus = null;  // Currently focused image element
    this.focusData = null;  // Data about focused image
  }

  /**
   * Focus (zoom) an image to center
   * @param imageElement - The image to focus
   * @param containerBounds - Container dimensions {width, height}
   * @param originalState - Original position/rotation from layout
   * @returns Promise that resolves when zoom completes
   */
  async focusImage(imageElement: HTMLElement, containerBounds: ContainerBounds, originalState: ImageLayout): Promise<void> {
    // If there's already a focused image, unfocus it first
    if (this.currentFocus && this.currentFocus !== imageElement) {
      await this.unfocusImage();
    }

    // Calculate center position
    const centerX = containerBounds.width / 2;
    const centerY = containerBounds.height / 2;

    // Get un-transformed dimensions
    const imageWidth = imageElement.offsetWidth;
    const imageHeight = imageElement.offsetHeight;

    // Calculate position to center the image
    // Target is simply center minus half size (to place top-left) minus current position
    const currentX = originalState.x;
    const currentY = originalState.y;

    const targetX = centerX - (imageWidth / 2) - currentX;
    const targetY = centerY - (imageHeight / 2) - currentY;

    // Store focus data
    this.focusData = {
      element: imageElement,
      originalState: originalState,
      focusTransform: {
        x: targetX,
        y: targetY,
        rotation: 0,  // Reset rotation when focused
        scale: this.config.scale
      }
    };

    // Update z-index
    imageElement.style.zIndex = String(this.config.zIndex);
    imageElement.classList.add('focused');

    // Animate to focused state
    this.currentFocus = imageElement;

    return this.animationEngine.animateTransform(
      imageElement,
      this.focusData.focusTransform,
      this.config.animationDuration
    );
  }

  /**
   * Unfocus current image, returning it to original position
   * @returns Promise that resolves when animation completes
   */
  async unfocusImage(): Promise<void> {
    if (!this.currentFocus || !this.focusData) {
      return;
    }

    const element = this.currentFocus;
    const originalState = this.focusData.originalState;

    // Animate back to original state
    await this.animationEngine.animateTransform(element, {
      x: 0,
      y: 0,
      rotation: originalState.rotation,
      scale: originalState.scale
    });

    // Reset z-index after animation completes
    element.style.zIndex = '';
    element.classList.remove('focused');

    // Clear focus state
    this.currentFocus = null;
    this.focusData = null;
  }

  /**
   * Swap focus from current image to a new one
   * @param newImageElement - The new image to focus
   * @param containerBounds - Container dimensions
   * @param originalState - Original state of new image
   * @returns Promise that resolves when swap completes
   */
  async swapFocus(newImageElement: HTMLElement, containerBounds: ContainerBounds, originalState: ImageLayout): Promise<void> {
    // Simply focus the new image (focusImage handles unfocusing the old one)
    return this.focusImage(newImageElement, containerBounds, originalState);
  }

  /**
   * Get currently focused image element
   * @returns Currently focused element or null
   */
  getCurrentFocus(): HTMLElement | null {
    return this.currentFocus;
  }

  /**
   * Check if an image is currently focused
   * @param imageElement - Element to check
   * @returns True if element is focused
   */
  isFocused(imageElement: HTMLElement): boolean {
    return this.currentFocus === imageElement;
  }

  /**
   * Reset zoom state
   */
  reset(): void {
    this.currentFocus = null;
    this.focusData = null;
  }
}