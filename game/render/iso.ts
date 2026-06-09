// Isometric projection helpers. World "iso" space is the diamond-projected
// plane before the camera (pan + zoom) is applied.

export const TILE_W = 64;
export const TILE_H = 32;

/** grid cell -> iso world coordinates (center of the tile's top diamond) */
export function gridToIso(gx: number, gy: number): { x: number; y: number } {
  return {
    x: (gx - gy) * (TILE_W / 2),
    y: (gx + gy) * (TILE_H / 2),
  };
}

/** iso world coordinates -> fractional grid cell */
export function isoToGrid(ix: number, iy: number): { gx: number; gy: number } {
  const a = ix / (TILE_W / 2);
  const b = iy / (TILE_H / 2);
  return {
    gx: (a + b) / 2,
    gy: (b - a) / 2,
  };
}
