// TEMP: verify the world-event FX ports match the expansion exports exactly.
import { readFileSync } from "node:fs";
import {
  drawDriftRift, drawRiftMote, drawBloodMoon, drawBloodAura, drawBloodSkySwatch,
  type RiftState,
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
  readFileSync(`public/assets/expansion.nosync/_naevyr_expansion_pkg/events/${name}.svg`, "utf8").trim();
const G = (x: unknown) => x as unknown as Grid;
let fail = 0;
function diff(name: string, frames: Grid[]) {
  const fw = frames[0].w, fh = frames[0].h;
  const rects = frames.flatMap((f, i) => gridRects(f).map((r) => ({ ...r, x: r.x + i * fw })));
  const mine = svg(rects, fw * frames.length, fh);
  if (mine === ref(name)) console.log(`OK   ${name}`);
  else { fail++; console.error(`DIFF ${name}: mine ${mine.length}b vs ref ${ref(name).length}b`); }
}

// drift_rift: states laid out in order sealed(2) opening(4) active(4) closing(4)
const riftFrames: Grid[] = [];
([["sealed", 2], ["opening", 4], ["active", 4], ["closing", 4]] as [RiftState, number][])
  .forEach(([state, n]) => { for (let f = 0; f < n; f++) riftFrames.push(G(drawDriftRift(state, f))); });
diff("drift_rift", riftFrames);

diff("rift_mote",  [0, 1].map((f) => G(drawRiftMote(f))));
diff("blood_moon", [0, 1].map((f) => G(drawBloodMoon(f))));
diff("blood_aura", [0, 1, 2].map((f) => G(drawBloodAura(f))));
diff("blood_sky",  [G(drawBloodSkySwatch())]);

if (fail) { console.error(`${fail} event sprite(s) differ`); process.exit(1); }
console.log("frontier event FX: all byte-exact");
