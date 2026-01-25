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

import type { FocusInteractionConfig, ContainerBounds, ImageLayout, TransformParams, ImageStylingConfig } from '../config/types';
import { AnimationEngine } from './AnimationEngine';
import { buildStyleProperties, applyStylesToElement, applyClassNameToElement, removeClassNameFromElement, StyleProperties } from '../utils/styleUtils';

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

  // Styling
  private defaultStyles: StyleProperties;
  private focusedStyles: StyleProperties;
  private defaultClassName: string | string[] | undefined;
  private focusedClassName: string | string[] | undefined;

  constructor(config: FocusInteractionConfig, animationEngine: AnimationEngine, styling?: ImageStylingConfig) {
    this.config = config;

    this.animationEngine = animationEngine;
    this.currentFocus = null;  // Currently focused image element
    this.focusData = null;  // Data about focused image

    // Precompute styling properties
    this.defaultStyles = buildStyleProperties(styling?.default);
    this.focusedStyles = buildStyleProperties(styling?.focused);
    this.defaultClassName = styling?.default?.className;
    this.focusedClassName = styling?.focused?.className;
  }

  /**
   * Normalize scalePercent value
   * Values > 1 are treated as percentages (1-100) and divided by 100
   * Values <= 1 are treated as fractions and used as-is
   */
  private normalizeScalePercent(value: number): number {
    return value > 1 ? value / 100 : value;
  }

  /**
   * Calculate scale factor for focused image based on container-relative sizing
   * @param imageWidth - Original image width
   * @param imageHeight - Original image height
   * @param containerBounds - Container dimensions
   * @returns Calculated scale factor
   */
  private calculateFocusScale(imageWidth: number, imageHeight: number, containerBounds: ContainerBounds): number {
    // Normalize the scale percent
    const normalizedPercent = this.normalizeScalePercent(this.config.scalePercent);

    // Calculate target height
    const targetHeight = containerBounds.height * normalizedPercent;

    // Calculate scale factor based on height
    let scale = targetHeight / imageHeight;

    // Clamp if scaled width would exceed container bounds
    const scaledWidth = imageWidth * scale;
    const maxWidth = containerBounds.width * normalizedPercent;
    if (scaledWidth > maxWidth) {
      // Use width-constrained scale instead
      scale = maxWidth / imageWidth;
    }

    return scale;
  }

  /**
   * Focus (zoom) an image to center of container
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

    // Calculate center position of container
    const centerX = containerBounds.width / 2;
    const centerY = containerBounds.height / 2;

    // Get un-transformed dimensions
    const imageWidth = imageElement.offsetWidth;
    const imageHeight = imageElement.offsetHeight;

    // Layout coordinates (originalState.x, originalState.y) are CENTER positions.
    // The AnimationEngine prepends translate(-50%, -50%) to all transforms,
    // so the visual center of the image is at (originalState.x, originalState.y).
    // To move the visual center to (centerX, centerY), we need:
    const currentCenterX = originalState.x;
    const currentCenterY = originalState.y;

    const targetX = centerX - currentCenterX;
    const targetY = centerY - currentCenterY;

    // Calculate scale based on container-relative sizing
    const focusScale = this.calculateFocusScale(imageWidth, imageHeight, containerBounds);

    // Store focus data
    this.focusData = {
      element: imageElement,
      originalState: originalState,
      focusTransform: {
        x: targetX,
        y: targetY,
        rotation: 0,  // Reset rotation when focused
        scale: focusScale
      }
    };

    // Update z-index
    imageElement.style.zIndex = String(this.config.zIndex);
    imageElement.classList.add('fbn-ic-focused');

    // Apply focused styling state
    applyStylesToElement(imageElement, this.focusedStyles);
    applyClassNameToElement(imageElement, this.focusedClassName);

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
    element.classList.remove('fbn-ic-focused');

    // Revert to default styling state
    removeClassNameFromElement(element, this.focusedClassName);
    applyStylesToElement(element, this.defaultStyles);
    applyClassNameToElement(element, this.defaultClassName);

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
