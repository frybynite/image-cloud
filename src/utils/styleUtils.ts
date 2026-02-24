/**
 * Style utilities for image styling configuration
 */

import type { ImageStyleState, FilterConfig, BorderConfig, ShadowPreset, DropShadowConfig, ClipPathConfig, ClipPathShape } from '../config/types';
import { SHADOW_PRESETS } from '../config/defaults';
import { getClipPath, calculateHeightRelativeClipPath } from './clipPathGenerator';

/**
 * Check if a value is a known shadow preset
 */
function isShadowPreset(value: string): value is ShadowPreset {
  return value in SHADOW_PRESETS;
}

/**
 * Resolve shadow value - converts preset names to CSS values,
 * passes custom CSS strings through directly
 */
export function resolveShadow(shadow: ShadowPreset | string | undefined): string {
  if (!shadow) return SHADOW_PRESETS.md;
  if (isShadowPreset(shadow)) return SHADOW_PRESETS[shadow];
  return shadow; // Custom CSS string
}

/**
 * Build CSS filter string from FilterConfig
 */
export function buildFilterString(filter: FilterConfig | undefined): string {
  if (!filter) return '';

  const parts: string[] = [];

  if (filter.grayscale !== undefined) {
    parts.push(`grayscale(${filter.grayscale})`);
  }
  if (filter.blur !== undefined) {
    parts.push(`blur(${filter.blur}px)`);
  }
  if (filter.brightness !== undefined) {
    parts.push(`brightness(${filter.brightness})`);
  }
  if (filter.contrast !== undefined) {
    parts.push(`contrast(${filter.contrast})`);
  }
  if (filter.saturate !== undefined) {
    parts.push(`saturate(${filter.saturate})`);
  }
  if (filter.opacity !== undefined) {
    parts.push(`opacity(${filter.opacity})`);
  }
  if (filter.sepia !== undefined) {
    parts.push(`sepia(${filter.sepia})`);
  }
  if (filter.hueRotate !== undefined) {
    parts.push(`hue-rotate(${filter.hueRotate}deg)`);
  }
  if (filter.invert !== undefined) {
    parts.push(`invert(${filter.invert})`);
  }
  if (filter.dropShadow !== undefined) {
    if (typeof filter.dropShadow === 'string') {
      parts.push(`drop-shadow(${filter.dropShadow})`);
    } else {
      const ds = filter.dropShadow as DropShadowConfig;
      parts.push(`drop-shadow(${ds.x}px ${ds.y}px ${ds.blur}px ${ds.color})`);
    }
  }

  return parts.join(' ');
}

/**
 * Build border CSS for a single side
 */
function buildSingleBorder(config: BorderConfig | undefined): string {
  if (!config || config.style === 'none' || config.width === 0) {
    return 'none';
  }
  const width = config.width ?? 0;
  const style = config.style ?? 'solid';
  const color = config.color ?? '#000000';
  return `${width}px ${style} ${color}`;
}

/**
 * CSS properties object type for style application
 */
export interface StyleProperties {
  borderRadius?: string;
  borderTopLeftRadius?: string;
  borderTopRightRadius?: string;
  borderBottomRightRadius?: string;
  borderBottomLeftRadius?: string;
  border?: string;
  borderTop?: string;
  borderRight?: string;
  borderBottom?: string;
  borderLeft?: string;
  boxShadow?: string;
  filter?: string;
  opacity?: string;
  cursor?: string;
  outline?: string;
  outlineOffset?: string;
  objectFit?: string;
  aspectRatio?: string;
  clipPath?: string;
  overflow?: string;
}

/**
 * Build complete style properties object from ImageStyleState
 * @param state - Image style state configuration
 * @param imageHeight - Optional image height for height-relative clip-path calculations
 * @param imageWidth - Optional image width for centering height-relative clip-path shapes
 */
export function buildStyleProperties(state: ImageStyleState | undefined, imageHeight?: number, imageWidth?: number): StyleProperties {
  if (!state) return {};

  const styles: StyleProperties = {};

  // Border radius - check for per-corner overrides first
  const hasPerCornerRadius = state.borderRadiusTopLeft !== undefined ||
                             state.borderRadiusTopRight !== undefined ||
                             state.borderRadiusBottomRight !== undefined ||
                             state.borderRadiusBottomLeft !== undefined;

  if (hasPerCornerRadius) {
    // Use per-corner radius with fallback to base radius
    const baseRadius = state.border?.radius ?? 0;
    if (state.borderRadiusTopLeft !== undefined) {
      styles.borderTopLeftRadius = `${state.borderRadiusTopLeft}px`;
    } else if (baseRadius) {
      styles.borderTopLeftRadius = `${baseRadius}px`;
    }
    if (state.borderRadiusTopRight !== undefined) {
      styles.borderTopRightRadius = `${state.borderRadiusTopRight}px`;
    } else if (baseRadius) {
      styles.borderTopRightRadius = `${baseRadius}px`;
    }
    if (state.borderRadiusBottomRight !== undefined) {
      styles.borderBottomRightRadius = `${state.borderRadiusBottomRight}px`;
    } else if (baseRadius) {
      styles.borderBottomRightRadius = `${baseRadius}px`;
    }
    if (state.borderRadiusBottomLeft !== undefined) {
      styles.borderBottomLeftRadius = `${state.borderRadiusBottomLeft}px`;
    } else if (baseRadius) {
      styles.borderBottomLeftRadius = `${baseRadius}px`;
    }
  } else if (state.border?.radius !== undefined) {
    styles.borderRadius = `${state.border.radius}px`;
  }

  // Check if any per-side border is defined
  const hasPerSideBorder = state.borderTop || state.borderRight || state.borderBottom || state.borderLeft;

  if (hasPerSideBorder) {
    // Merge base border with per-side overrides
    const baseBorder = state.border || {};

    const topBorder = { ...baseBorder, ...state.borderTop };
    const rightBorder = { ...baseBorder, ...state.borderRight };
    const bottomBorder = { ...baseBorder, ...state.borderBottom };
    const leftBorder = { ...baseBorder, ...state.borderLeft };

    styles.borderTop = buildSingleBorder(topBorder);
    styles.borderRight = buildSingleBorder(rightBorder);
    styles.borderBottom = buildSingleBorder(bottomBorder);
    styles.borderLeft = buildSingleBorder(leftBorder);
  } else if (state.border) {
    // Apply uniform border
    styles.border = buildSingleBorder(state.border);
  }

  // Shadow
  if (state.shadow !== undefined) {
    styles.boxShadow = resolveShadow(state.shadow);
  }

  // Filter - always set to ensure hover filters are properly cleared on mouseleave
  const filterStr = buildFilterString(state.filter);
  styles.filter = filterStr || 'none';

  // Opacity
  if (state.opacity !== undefined) {
    styles.opacity = String(state.opacity);
  }

  // Cursor
  if (state.cursor !== undefined) {
    styles.cursor = state.cursor;
  }

  // Outline
  if (state.outline && state.outline.style !== 'none' && (state.outline.width ?? 0) > 0) {
    const width = state.outline.width ?? 0;
    const style = state.outline.style ?? 'solid';
    const color = state.outline.color ?? '#000000';
    styles.outline = `${width}px ${style} ${color}`;
    if (state.outline.offset !== undefined) {
      styles.outlineOffset = `${state.outline.offset}px`;
    }
  }

  // Object fit
  if (state.objectFit !== undefined) {
    styles.objectFit = state.objectFit;
  }

  // Aspect ratio
  if (state.aspectRatio !== undefined) {
    styles.aspectRatio = state.aspectRatio;
  }

  // Clip path (cropping)
  if (state.clipPath !== undefined) {
    let clipPathValue: string | undefined;

    // Check if clipPath is a config object with height-relative mode
    const isConfig = typeof state.clipPath === 'object' && state.clipPath !== null && 'shape' in state.clipPath;
    const config = isConfig ? (state.clipPath as ClipPathConfig) : undefined;

    if (config?.mode === 'height-relative' && imageHeight) {
      // Use height-relative calculation if mode is specified and imageHeight is available
      clipPathValue = calculateHeightRelativeClipPath(config.shape, imageHeight, imageWidth);
    } else {
      // Fall back to standard clip-path resolution
      const clipPathInput = isConfig && config ? config.shape : state.clipPath;
      clipPathValue = getClipPath(clipPathInput as ClipPathShape | string);
    }

    if (clipPathValue) {
      // When 'none' is specified, use 'unset' to clear any inherited clip-path
      if (clipPathValue === 'none') {
        styles.clipPath = 'unset';
      } else {
        styles.clipPath = clipPathValue;
        styles.overflow = 'hidden';  // Ensure clean boundaries
      }
    }
  }

  return styles;
}

/**
 * Apply style properties to an HTML element
 */
export function applyStylesToElement(element: HTMLElement, styles: StyleProperties): void {
  if (styles.borderRadius !== undefined) element.style.borderRadius = styles.borderRadius;
  if (styles.borderTopLeftRadius !== undefined) element.style.borderTopLeftRadius = styles.borderTopLeftRadius;
  if (styles.borderTopRightRadius !== undefined) element.style.borderTopRightRadius = styles.borderTopRightRadius;
  if (styles.borderBottomRightRadius !== undefined) element.style.borderBottomRightRadius = styles.borderBottomRightRadius;
  if (styles.borderBottomLeftRadius !== undefined) element.style.borderBottomLeftRadius = styles.borderBottomLeftRadius;
  if (styles.border !== undefined) element.style.border = styles.border;
  if (styles.borderTop !== undefined) element.style.borderTop = styles.borderTop;
  if (styles.borderRight !== undefined) element.style.borderRight = styles.borderRight;
  if (styles.borderBottom !== undefined) element.style.borderBottom = styles.borderBottom;
  if (styles.borderLeft !== undefined) element.style.borderLeft = styles.borderLeft;
  if (styles.boxShadow !== undefined) element.style.boxShadow = styles.boxShadow;
  if (styles.filter !== undefined) element.style.filter = styles.filter;
  if (styles.opacity !== undefined) element.style.opacity = styles.opacity;
  if (styles.cursor !== undefined) element.style.cursor = styles.cursor;
  if (styles.outline !== undefined) element.style.outline = styles.outline;
  if (styles.outlineOffset !== undefined) element.style.outlineOffset = styles.outlineOffset;
  if (styles.objectFit !== undefined) element.style.objectFit = styles.objectFit;
  if (styles.aspectRatio !== undefined) element.style.aspectRatio = styles.aspectRatio;
  if (styles.clipPath !== undefined) element.style.clipPath = styles.clipPath;
  if (styles.overflow !== undefined) element.style.overflow = styles.overflow;
}

/**
 * Build and apply style properties for a given state with image dimensions
 * This is useful for height-relative clip-path calculations which depend on image height and width
 * @param element - HTML element to apply styles to
 * @param state - Image style state configuration
 * @param imageHeight - Optional image height for height-relative clip-path calculations
 * @param imageWidth - Optional image width for centering height-relative clip-path shapes
 */
export function applyStylesToElementWithState(element: HTMLElement, state: ImageStyleState | undefined, imageHeight?: number, imageWidth?: number): void {
  const styles = buildStyleProperties(state, imageHeight, imageWidth);
  applyStylesToElement(element, styles);
}

/**
 * Resolve className to a space-separated string
 */
export function resolveClassName(className: string | string[] | undefined): string {
  if (!className) return '';
  if (Array.isArray(className)) return className.join(' ');
  return className;
}

/**
 * Apply className to element (additive with existing classes)
 */
export function applyClassNameToElement(element: HTMLElement, className: string | string[] | undefined): void {
  const resolved = resolveClassName(className);
  if (resolved) {
    resolved.split(' ').forEach(cls => {
      if (cls.trim()) element.classList.add(cls.trim());
    });
  }
}

/**
 * Remove className from element
 */
export function removeClassNameFromElement(element: HTMLElement, className: string | string[] | undefined): void {
  const resolved = resolveClassName(className);
  if (resolved) {
    resolved.split(' ').forEach(cls => {
      if (cls.trim()) element.classList.remove(cls.trim());
    });
  }
}
