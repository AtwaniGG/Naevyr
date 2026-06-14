// TEMP: verify the battle-pass art ports match the DS SVG exports exactly.
// tarnished_chalice aura (3 frames, 64×64, frame-by-frame x offset) +
// pass_emblem / pass_emblem-mono (32×32 static).
import { readFileSync } from "node:fs";
import { drawTarnishedChalice, drawPassEmblem, drawWandererDyed, ASHFALL_DYE } from "../game/render/sprites";
import type { IsoFacing, AnimName } from "../game/render/sprites";

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
const ref = (path: string) =>
  readFileSync(`public/assets/design-system.nosync/assets/${path}.svg`, "utf8").trim();

let fail = 0;
const G = (x: unknown) => x as unknown as Grid;
function diff(name: string, path: string, frames: { g: Grid; w: number }[], H: number) {
  let off = 0;
  const rects = frames.flatMap(({ g, w }) => {
    const rs = gridRects(g).map((r) => ({ ...r, x: r.x + off }));
    off += w;
    return rs;
  });
  const mine = svg(rects, off, H);
  if (mine === ref(path)) console.log(`OK   ${name}`);
  else { fail++; console.error(`DIFF ${name}: mine ${mine.length}b vs ref ${ref(path).length}b`); }
}

diff("tarnished_chalice", "battlepass/tarnished_chalice",
  [0, 1, 2].map((f) => ({ g: G(drawTarnishedChalice(f)), w: 64 })), 64);
diff("pass_emblem", "battlepass/pass_emblem",
  [{ g: G(drawPassEmblem(false)), w: 32 }], 32);
diff("pass_emblem-mono", "battlepass/pass_emblem-mono",
  [{ g: G(drawPassEmblem(true)), w: 32 }], 32);

// ashfall_dye: a wanderer sheet. Rows = facings (40px tall each), columns =
// idle(2)+walk(6)+swing(4) frames left-to-right (32px each). Matches the DS
// ashfallDyeSheetGrids layout. Compare the whole 384×200 sheet.
{
  const FACINGS: IsoFacing[] = ["s", "se", "e", "ne", "n"];
  const ANIMS: [AnimName, number][] = [["idle", 2], ["walk", 6], ["swing", 4]];
  type R = { x: number; y: number; w: number; c: string; a?: number };
  const all: R[] = [];
  FACINGS.forEach((fc, rowI) => {
    let xoff = 0;
    ANIMS.forEach(([anim, n]) => {
      for (let f = 0; f < n; f++) {
        const g = G(drawWandererDyed(fc, anim, f, ASHFALL_DYE));
        for (const r of gridRects(g)) all.push({ ...r, x: r.x + xoff, y: r.y + rowI * 40 });
        xoff += 32;
      }
    });
  });
  const mine = svg(all, 384, 200);
  if (mine === ref("battlepass/ashfall_dye")) console.log("OK   ashfall_dye");
  else { fail++; console.error(`DIFF ashfall_dye: mine ${mine.length}b vs ref ${ref("battlepass/ashfall_dye").length}b`); }
}

console.log(fail === 0 ? "\nALL MATCH" : `\n${fail} DIFF`);
process.exit(fail === 0 ? 0 : 1);
