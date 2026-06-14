// TEMP: verify the frontier ground/doodad + crypt floor/fixture ports match the
// expansion-pack SVG exports exactly.
import { readFileSync } from "node:fs";
import {
  drawAshGround, drawDriftCrystal, drawAshDune, drawScorchedStump,
  makeCryptFloor, fxSarcophagus, fxRubblePile, fxStandingBrazier, fxBrokenPillar, fxBonePile,
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
const ref = (dir: string, name: string) =>
  readFileSync(`public/assets/expansion.nosync/_naevyr_expansion_pkg/${dir}/${name}.svg`, "utf8").trim();
const G = (x: unknown) => x as unknown as Grid;
let fail = 0;
/** frames laid out left-to-right at i*cellWidth (variants or anim frames) */
function diff(dir: string, name: string, frames: Grid[]) {
  const fw = frames[0].w, fh = frames[0].h;
  const rects = frames.flatMap((f, i) => gridRects(f).map((r) => ({ ...r, x: r.x + i * fw })));
  const mine = svg(rects, fw * frames.length, fh);
  if (mine === ref(dir, name)) console.log(`OK   ${name}`);
  else { fail++; console.error(`DIFF ${name}: mine ${mine.length}b vs ref ${ref(dir, name).length}b`); }
}

// frontier ground accents + standing doodads (2 variants each)
diff("frontier", "ash_ground",     [G(drawAshGround(0)), G(drawAshGround(1))]);
diff("frontier", "drift_crystal",  [G(drawDriftCrystal(0)), G(drawDriftCrystal(1))]);
diff("frontier", "ash_dune",       [G(drawAshDune(0)), G(drawAshDune(1))]);
diff("frontier", "scorched_stump", [G(drawScorchedStump(0)), G(drawScorchedStump(1))]);

// crypt floor (3 seed variants) + dungeon fixtures
diff("crypt", "floor_crypt",      [G(makeCryptFloor(0)), G(makeCryptFloor(1)), G(makeCryptFloor(2))]);
diff("crypt", "sarcophagus",      [G(fxSarcophagus())]);
diff("crypt", "rubble_pile",      [G(fxRubblePile())]);
diff("crypt", "standing_brazier", [G(fxStandingBrazier(0)), G(fxStandingBrazier(1))]);
diff("crypt", "broken_pillar",    [G(fxBrokenPillar())]);
diff("crypt", "bone_pile",        [G(fxBonePile())]);

if (fail) { console.error(`${fail} frontier/crypt sprite(s) differ`); process.exit(1); }
console.log("frontier + crypt port: all byte-exact");
