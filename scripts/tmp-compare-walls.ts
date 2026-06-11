// TEMP: verify the wall2 port matches the DS SVG exports exactly.
import { readFileSync } from "node:fs";
import {
  makeWall2, makeWall2Corner, WallSide, WallMatKind, WallVariant,
} from "../game/render/sprites";

type Pixel = { c: string; a?: number };
type Grid = { w: number; h: number; d: (Pixel | null)[] };

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
function svg(rects: ReturnType<typeof gridRects>, w: number, h: number) {
  return '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h +
    '" viewBox="0 0 ' + w + ' ' + h + '" shape-rendering="crispEdges">' +
    rects.map(r => '<rect x="' + r.x + '" y="' + r.y + '" width="' + r.w + '" height="1" fill="' + r.c + '"' +
      (r.a != null ? ' fill-opacity="' + r.a + '"' : '') + '></rect>').join('') + '</svg>';
}
const ref = (name: string) =>
  readFileSync(`public/assets/design-system.nosync/assets/walls/${name}.svg`, "utf8").trim();

let fail = 0;
function diff(name: string, g: Grid) {
  const mine = svg(gridRects(g), g.w, g.h);
  if (mine === ref(name)) console.log(`OK   ${name}`);
  else { fail++; console.error(`DIFF ${name}: mine ${mine.length}b vs ref ${ref(name).length}b`); }
}

const WALLS2: [string, WallSide, WallMatKind, WallVariant][] = [
  ["wall2_timber_nw", "nw", "timber", "plain"], ["wall2_timber_ne", "ne", "timber", "plain"],
  ["wall2_timber_nw_window", "nw", "timber", "window"], ["wall2_timber_ne_banner", "ne", "timber", "banner"],
  ["wall2_block_nw", "nw", "block", "plain"], ["wall2_block_ne", "ne", "block", "plain"],
  ["wall2_block_nw_window", "nw", "block", "window"], ["wall2_block_ne_banner", "ne", "block", "banner"],
  ["wall2_cave_nw", "nw", "cave", "plain"], ["wall2_cave_ne", "ne", "cave", "plain"],
  ["wall2_cave_nw_seam", "nw", "cave", "seam"], ["wall2_cave_ne_lantern", "ne", "cave", "lantern"],
];
for (const [name, side, mat, variant] of WALLS2) {
  diff(name, makeWall2(side, mat, variant) as unknown as Grid);
}
for (const mat of ["timber", "block", "cave"] as WallMatKind[]) {
  diff(`wall2_${mat}_corner`, makeWall2Corner(mat) as unknown as Grid);
}
process.exit(fail ? 1 : 0);
