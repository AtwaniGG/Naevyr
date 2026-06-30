// TEMP: verify the Echo FX port matches the DS SVG exports exactly.
import { readFileSync } from "node:fs";
import { drawEchoVeil, drawEchoFade } from "../game/render/sprites";

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
  readFileSync(`public/assets/design-system.nosync/assets/echofx/${name}.svg`, "utf8").trim();

let fail = 0;
const G = (x: unknown) => x as unknown as Grid;
/** exports emit rects cell by cell (per-frame x offset), not row-major */
function diff(name: string, cells: { g: Grid; cx: number; cy: number }[], W: number, H: number) {
  const rects = cells.flatMap(({ g, cx, cy }) =>
    gridRects(g).map((r) => ({ ...r, x: r.x + cx, y: r.y + cy })));
  const mine = svg(rects, W, H);
  if (mine === ref(name)) console.log(`OK   ${name}`);
  else { fail++; console.error(`DIFF ${name}: mine ${mine.length}b vs ref ${ref(name).length}b`); }
}

diff("echo_veil", [0, 1, 2].map((f) => ({ g: G(drawEchoVeil(f)), cx: f * 32, cy: 0 })), 96, 40);
diff("echo_fade", [0, 1, 2, 3].map((f) => ({ g: G(drawEchoFade(f)), cx: f * 32, cy: 0 })), 128, 40);

console.log(fail === 0 ? "echofx port: all byte-exact" : `${fail} DIFFS`);
process.exit(fail === 0 ? 0 : 1);
