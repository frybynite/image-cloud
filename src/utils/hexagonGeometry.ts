/**
 * hexagonGeometry.ts
 * Single source of truth for hexagonal grid math.
 * Used by clipPathGenerator.ts and HoneycombPlacementLayout.ts.
 */

/** Reference height for the canonical hexagon definition (100px) */
export const HEXAGON_REF_HEIGHT = 100;

/**
 * Regular flat-top hexagon reference points (refHeight = 100).
 * Circumradius r = 100/√3 so that height = r√3 = 100 exactly.
 * Width = 2r = 200/√3 ≈ 115.47.  All 6 vertices are equidistant from center.
 *
 *   x = r/2  = 50/√3 ≈ 28.87    (upper/lower inner)
 *   x = 3r/2 = 150/√3 ≈ 86.60   (upper/lower outer)
 *   x = 2r   = 200/√3 ≈ 115.47  (mid right vertex)
 */
const _R = 100 / Math.sqrt(3);
export const HEXAGON_REF_POINTS: Array<[number, number]> = [
  [_R / 2,     0  ],   // upper-left
  [3 * _R / 2, 0  ],   // upper-right
  [2 * _R,     50 ],   // right  ← tiling key vertex
  [3 * _R / 2, 100],   // lower-right
  [_R / 2,     100],   // lower-left
  [0,          50 ],   // left
];

/**
 * Col-step ratio = x of upper-right vertex / refHeight = (3r/2) / 100 = √3/2 ≈ 0.866.
 * (Previously 0.75 with the non-regular hexagon.)
 */
export const HEXAGON_COL_STEP_RATIO = HEXAGON_REF_POINTS[1][0] / HEXAGON_REF_HEIGHT; // √3/2 ≈ 0.866

/** Row-offset ratio = y of right vertex / refHeight = 50/100 = 0.50 (unchanged) */
export const HEXAGON_ROW_OFFSET_RATIO = HEXAGON_REF_POINTS[2][1] / HEXAGON_REF_HEIGHT; // 0.50

/**
 * Returns tiling parameters for a hexagon of the given height.
 * Derived from the canonical reference points, not hardcoded constants.
 */
export function getHexTilingParams(hexH: number): { colStep: number; rowOffset: number } {
  return {
    colStep: HEXAGON_COL_STEP_RATIO * hexH,
    rowOffset: HEXAGON_ROW_OFFSET_RATIO * hexH,
  };
}

/**
 * Converts cube coordinates (cx, cy, cz) to pixel center position.
 * @param cx - Cube coord x (cx + cy + cz = 0)
 * @param cy - Cube coord y
 * @param cz - Cube coord z
 * @param originX - Pixel origin X (container center)
 * @param originY - Pixel origin Y (container center)
 * @param hexH - Visual hex height (= imageHeight for height-relative clip path)
 */
export function hexCubeToPixel(
  cx: number, cy: number, _cz: number,
  originX: number, originY: number,
  hexH: number
): { px: number; py: number } {
  const { colStep } = getHexTilingParams(hexH);
  return {
    px: originX + colStep * cx,
    py: originY + hexH * (cy + cx / 2),
  };
}

/** 6 cube direction vectors for clockwise ring traversal starting from top */
export const HEX_RING_DIRECTIONS: Array<[number, number, number]> = [
  [+1,  0, -1],
  [ 0, +1, -1],
  [-1, +1,  0],
  [-1,  0, +1],
  [ 0, -1, +1],
  [+1, -1,  0],
];

/**
 * Returns ordered cube coordinates for all cells in ring k, clockwise from the top.
 * Ring 0: [(0,0,0)]. Ring k: 6k cells.
 */
export function getHexRingCells(ring: number): Array<[number, number, number]> {
  if (ring === 0) return [[0, 0, 0]];
  const cells: Array<[number, number, number]> = [];
  let [cx, cy, cz] = [0, -ring, ring]; // start at top
  for (const [dx, dy, dz] of HEX_RING_DIRECTIONS) {
    for (let step = 0; step < ring; step++) {
      cells.push([cx, cy, cz]);
      cx += dx; cy += dy; cz += dz;
    }
  }
  return cells;
}
