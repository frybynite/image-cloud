/**
 * Maps predefined shape names to CSS clip-path polygon values.
 * All coordinates use percentages for scalability across different image sizes.
 */

import type { ClipPathShape } from '../config/types';

const CLIP_PATH_SHAPES: Record<ClipPathShape, string> = {
  // Geometric shapes - uses percentages for responsive sizing
  circle: 'circle(50%)',
  square: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
  triangle: 'polygon(50% 0%, 100% 100%, 0% 100%)',
  pentagon: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)',
  hexagon: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
  octagon: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
  diamond: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)'
};

/**
 * Resolves a shape name or custom clip-path string to a valid CSS clip-path value.
 * @param shape - Predefined shape name or custom clip-path string
 * @returns Valid CSS clip-path value
 */
export function getClipPath(shape: ClipPathShape | string | undefined): string | undefined {
  if (!shape) return undefined;

  // Check if it's a predefined shape
  if (shape in CLIP_PATH_SHAPES) {
    return CLIP_PATH_SHAPES[shape as ClipPathShape];
  }

  // Treat as custom clip-path string (e.g., 'polygon(...)' or 'inset(...)')
  return shape;
}

/**
 * Returns available predefined shape names for UI/documentation.
 */
export function getAvailableShapes(): ClipPathShape[] {
  return Object.keys(CLIP_PATH_SHAPES) as ClipPathShape[];
}
