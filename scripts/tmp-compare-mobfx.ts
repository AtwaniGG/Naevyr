// TEMP: verify the mob projectile / ability FX ports match the expansion exports.
import { readFileSync } from "node:fs";
import { drawBogSpit, drawDriftBolt, drawAshShockwave } from "../game/render/sprites";

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
      while (x2 < g.w) { const v2 = g.d[y * g.w + x2]; if (!v2 || v2.c !== v.c || (v2.a ?? 1) !== (v.a ?? 1)) break; x2++; }
      out.push({ x, y, w: x2 - x, c: v.c, a: v.a }); x = x2;
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
  readFileSync(`public/assets/expansion.nosync/_naevyr_expansion_pkg/mobs/${name}.svg`, "utf8").trim();
const G = (x: unknown) => x as unknown as Grid;
let fail = 0;
function diff(name: string, frames: Grid[]) {
  const fw = frames[0].w, fh = frames[0].h;
  const rects = frames.flatMap((f, i) => gridRects(f).map((r) => ({ ...r, x: r.x + i * fw })));
  const mine = svg(rects, fw * frames.length, fh);
  if (mine === ref(name)) console.log(`OK   ${name}`);
  else { fail++; console.error(`DIFF ${name}: mine ${mine.length}b vs ref ${ref(name).length}b`); }
}

// bog_spit: travel 0..2 (splat=0) then splat seeds 1,2
diff("bog_spit", [
  G(drawBogSpit(0, 0)), G(drawBogSpit(1, 0)), G(drawBogSpit(2, 0)),
  G(drawBogSpit(0, 1)), G(drawBogSpit(0, 2)),
]);
diff("drift_bolt",    [0, 1, 2].map((f) => G(drawDriftBolt(f))));
diff("ash_shockwave", [0, 1, 2, 3].map((f) => G(drawAshShockwave(f))));

if (fail) { console.error(`${fail} mobfx sprite(s) differ`); process.exit(1); }
console.log("mob projectiles + ability FX: all byte-exact");
