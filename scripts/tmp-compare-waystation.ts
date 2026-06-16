// TEMP: verify the Waystation port matches the expansion-pack SVG export exactly.
import { readFileSync } from "node:fs";
import { makeWaystation } from "../game/render/sprites";

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
const ref = readFileSync(
  "public/assets/expansion.nosync/_naevyr_expansion_pkg/waystation/waystation.svg", "utf8").trim();

const G = (x: unknown) => x as unknown as Grid;
const frames = [0, 1, 2, 3].map((f) => G(makeWaystation(f)));
const fw = frames[0].w, fh = frames[0].h;
const rects = frames.flatMap((f, i) => gridRects(f).map((r) => ({ ...r, x: r.x + i * fw })));
const mine = svg(rects, fw * frames.length, fh);
if (mine === ref) { console.log("OK   waystation (4 frames byte-exact)"); process.exit(0); }
console.error(`DIFF waystation: mine ${mine.length}b vs ref ${ref.length}b`);
// show the first divergence for diagnosis
for (let i = 0; i < Math.min(mine.length, ref.length); i++) {
  if (mine[i] !== ref[i]) {
    console.error(`first diff at char ${i}:\n mine …${mine.slice(Math.max(0, i - 40), i + 40)}…\n ref  …${ref.slice(Math.max(0, i - 40), i + 40)}…`);
    break;
  }
}
process.exit(1);
