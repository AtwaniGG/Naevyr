// Renders a sprites.ts Grid as crisp SVG rects — the trailer draws the REAL
// game art straight from the procedural generators, no screenshots.
import React, { useMemo } from "react";

export type Pixel = { c: string; a?: number };
export type Grid = { w: number; h: number; d: (Pixel | null)[] };

/** run-length encode rows into rects (same scheme as the DS exports) */
function gridRects(g: Grid) {
  const out: { x: number; y: number; w: number; c: string; a?: number }[] = [];
  for (let y = 0; y < g.h; y++) {
    let x = 0;
    while (x < g.w) {
      const v = g.d[y * g.w + x];
      if (!v) { x++; continue; }
      let x2 = x + 1;
      while (x2 < g.w) {
        const v2 = g.d[y * g.w + x2];
        if (!v2 || v2.c !== v.c || (v2.a ?? 1) !== (v.a ?? 1)) break;
        x2++;
      }
      out.push({ x, y, w: x2 - x, c: v.c, a: v.a });
      x = x2;
    }
  }
  return out;
}

export const PixelSprite: React.FC<{
  grid: Grid;
  scale: number;
  style?: React.CSSProperties;
}> = ({ grid, scale, style }) => {
  const rects = useMemo(() => gridRects(grid), [grid]);
  return (
    <svg
      width={grid.w * scale}
      height={grid.h * scale}
      viewBox={`0 0 ${grid.w} ${grid.h}`}
      shapeRendering="crispEdges"
      style={style}
    >
      {rects.map((r, i) => (
        <rect
          key={i}
          x={r.x}
          y={r.y}
          width={r.w}
          height={1}
          fill={r.c}
          fillOpacity={r.a}
        />
      ))}
    </svg>
  );
};
