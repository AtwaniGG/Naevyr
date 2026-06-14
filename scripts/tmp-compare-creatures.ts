// TEMP: verify the frontier mob species + camp mini-boss ports match the
// expansion-pack SVG exports exactly (idle/walk/action anims; pack ships NO
// death frames, so death is engine-synthesized and not compared here).
import { readFileSync } from "node:fs";
import {
  drawBogwretch, drawBarrowWight, drawBoneHusk, drawAshBrute, drawDriftWisp, drawWispShadow,
  drawDrownedKing, drawBarrowLord, drawAshWarlord, drawBossPortrait,
  type IsoFacing,
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
const FACINGS: IsoFacing[] = ["s", "se", "e", "ne", "n"];

/** creature sheet: facings as ROWS, anim-frames as COLUMNS (col*cw, row*ch) */
function diffSheet(
  dir: string, name: string,
  draw: (f: IsoFacing, a: string, n: number) => Grid,
  cw: number, ch: number, anims: [string, number][],
) {
  const cols = anims.reduce((s, a) => s + a[1], 0);
  const cells: { g: Grid; cx: number; cy: number }[] = [];
  FACINGS.forEach((fc, row) => {
    let col = 0;
    for (const [anim, n] of anims) for (let f = 0; f < n; f++)
      cells.push({ g: G(draw(fc, anim, f)), cx: (col++) * cw, cy: row * ch });
  });
  const rects = cells.flatMap(({ g, cx, cy }) => gridRects(g).map((r) => ({ ...r, x: r.x + cx, y: r.y + cy })));
  const mine = svg(rects, cols * cw, 5 * ch);
  if (mine === ref(dir, name)) console.log(`OK   ${name}`);
  else { fail++; console.error(`DIFF ${name}: mine ${mine.length}b vs ref ${ref(dir, name).length}b`); }
}
/** simple left-to-right frame strip (portraits, wisp shadow) */
function diffStrip(dir: string, name: string, frames: Grid[]) {
  const fw = frames[0].w, fh = frames[0].h;
  const rects = frames.flatMap((f, i) => gridRects(f).map((r) => ({ ...r, x: r.x + i * fw })));
  const mine = svg(rects, fw * frames.length, fh);
  if (mine === ref(dir, name)) console.log(`OK   ${name}`);
  else { fail++; console.error(`DIFF ${name}: mine ${mine.length}b vs ref ${ref(dir, name).length}b`); }
}

// new mob species (sheets now include the authored death anim as the last block)
diffSheet("mobs", "bogwretch",    drawBogwretch,  32, 40, [["idle", 2], ["walk", 6], ["cast", 4], ["death", 4]]);
diffSheet("mobs", "barrow_wight", drawBarrowWight, 32, 44, [["idle", 2], ["walk", 6], ["summon", 4], ["death", 4]]);
diffSheet("mobs", "bone_husk",    drawBoneHusk,   28, 36, [["idle", 2], ["walk", 6], ["swing", 4], ["death", 4]]);
diffSheet("mobs", "ash_brute",    drawAshBrute,   48, 52, [["idle", 2], ["walk", 4], ["slam", 4], ["death", 4]]);
diffSheet("mobs", "drift_wisp",   drawDriftWisp,  28, 32, [["hover", 4], ["dive", 3], ["death", 3]]);
diffStrip("mobs", "drift_wisp_shadow", [0, 1, 2, 3].map((f) => G(drawWispShadow(f))));

// camp mini-bosses + boss-alert portraits (5f death collapse appended)
diffSheet("beasts", "drowned_king", drawDrownedKing, 110, 110, [["idle", 2], ["walk", 6], ["attack", 4], ["death", 5]]);
diffSheet("beasts", "barrow_lord",  drawBarrowLord,  110, 116, [["idle", 2], ["walk", 6], ["attack", 4], ["death", 5]]);
diffSheet("beasts", "ash_warlord",  drawAshWarlord,  100, 110, [["idle", 2], ["walk", 6], ["attack", 4], ["death", 5]]);
for (const b of ["drowned_king", "barrow_lord", "ash_warlord"])
  diffStrip("beasts", `portrait_${b}`, [0, 1].map((f) => G(drawBossPortrait(b, f))));

if (fail) { console.error(`${fail} creature sprite(s) differ`); process.exit(1); }
console.log("frontier creatures + mini-bosses: all byte-exact");
