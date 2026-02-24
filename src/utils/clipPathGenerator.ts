/**
 * Maps predefined shape names to CSS clip-path values.
 * Supports both percentage-based (responsive) and height-relative (aspect-ratio aware) modes.
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
 * Height-relative shapes: normalized at a reference height of 100px
 * Points are in pixels relative to the reference height
 * When applied, coordinates scale based on actual image height
 */
interface HeightRelativeShape {
  refHeight: number;
  points: Array<[number, number]>;  // [x, y] coordinates
}

const CLIP_PATH_SHAPES_HEIGHT_RELATIVE: Record<ClipPathShape, HeightRelativeShape> = {
  // Circle - uses radius in pixels (refHeight of 100px = 50px radius)
  circle: {
    refHeight: 100,
    points: []  // Special case: handled separately
  },
  // Square - maintains perfect aspect ratio (always 1:1)
  square: {
    refHeight: 100,
    points: [[0, 0], [100, 0], [100, 100], [0, 100]]
  },
  // Triangle - isosceles triangle
  triangle: {
    refHeight: 100,
    points: [[50, 0], [100, 100], [0, 100]]
  },
  // Pentagon - regular pentagon
  pentagon: {
    refHeight: 100,
    points: [[50, 0], [100, 38], [82, 100], [18, 100], [0, 38]]
  },
  // Hexagon - regular hexagon
  hexagon: {
    refHeight: 100,
    points: [[25, 0], [75, 0], [100, 50], [75, 100], [25, 100], [0, 50]]
  },
  // Octagon - regular octagon
  octagon: {
    refHeight: 100,
    points: [[30, 0], [70, 0], [100, 30], [100, 70], [70, 100], [30, 100], [0, 70], [0, 30]]
  },
  // Diamond - 45-degree rotated square
  diamond: {
    refHeight: 100,
    points: [[50, 0], [100, 50], [50, 100], [0, 50]]
  }
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

/**
 * Calculates height-relative clip-path string for a given shape and image dimensions.
 * Scales the reference shape definition by (imageHeight / refHeight) and centers it horizontally.
 * @param shape - Predefined shape name
 * @param imageHeight - Actual image height in pixels
 * @param imageWidth - Actual image width in pixels (used to center the shape horizontally)
 * @returns CSS clip-path value (e.g., 'circle(50px)' or 'polygon(...)')
 */
export function calculateHeightRelativeClipPath(shape: ClipPathShape, imageHeight: number, imageWidth?: number): string {
  const shapeDef = CLIP_PATH_SHAPES_HEIGHT_RELATIVE[shape];
  if (!shapeDef) return '';

  const scale = imageHeight / shapeDef.refHeight;

  // Special case: circle uses circle() function with radius
  if (shape === 'circle') {
    const radius = Math.round(50 * scale * 100) / 100; // Round to 2 decimals
    return `circle(${radius}px)`;
  }

  // Calculate offsets to center the shape's bounding box within the image
  // The shape's original bounding box is 100x100, centered at (50, 50)
  // After scaling, it's scaledSize x scaledSize, centered at (scaledSize/2, scaledSize/2)
  // We want to move that center to the image's center: (imageWidth/2, imageHeight/2)
  const scaledSize = shapeDef.refHeight * scale;  // e.g., 100 * 2 = 200

  // Shape's bounding box center in scaled coordinates
  const shapeCenterX = scaledSize / 2;  // e.g., 100
  const shapeCenterY = scaledSize / 2;  // e.g., 100

  // Image's center
  const imageCenterX = (imageWidth ?? scaledSize) / 2;
  const imageCenterY = imageHeight / 2;

  // Offsets to move shape center to image center
  const horizontalOffset = imageCenterX - shapeCenterX;
  const verticalOffset = imageCenterY - shapeCenterY;

  // For polygon shapes, scale all points and format as polygon()
  const scaledPoints = shapeDef.points.map(([x, y]) => {
    const scaledX = Math.round((x * scale + horizontalOffset) * 100) / 100;
    const scaledY = Math.round((y * scale + verticalOffset) * 100) / 100;
    return `${scaledX}px ${scaledY}px`;
  });

  return `polygon(${scaledPoints.join(', ')})`;
}
