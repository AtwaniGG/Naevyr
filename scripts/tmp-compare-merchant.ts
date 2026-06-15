// TEMP: verify the merchant (roaming_trader + pack_mule) ports match the
// _interaction_pkg exports byte-for-byte. Facing-sheets: rows = facings, cols =
// frames (idle then walk). Run: ./server/node_modules/.bin/tsx scripts/tmp-compare-merchant.ts
import { readFileSync } from "node:fs";
import { drawTrader, drawPackMule, TRADER_CLOTH_RAMPS } from "../game/render/sprites";
import { RAMP } from "../game/render/sprites";

type Pixel = { c: string; a?: number };
type Grid = { w: number; h: number; d: (Pixel | null)[] };
const G = (x: unknown) => x as unknown as Grid;
const DIR = "public/assets/_interaction_pkg/merchant";

function gridRects(g: Grid) {
  const out: { x: number; y: number; w: number; c: string; a?: number }[] = [];
  for (let y = 0; y < g.h; y++) {
    let x = 0;
    while (x < g.w) {
      const v = g.d[y * g.w + x];
      if (!v) { x++; continue; }
      let x2 = x + 1;
      while (x2 < g.w) { const v2 = g.d[y * g.w + x2]; if (!v2 || v2.c !== v.c || (v2.a ?? 1) !== (v.a ?? 1)) break; x2++; }
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
let fails = 0;
function compare(name: string, sheetW: number, sheetH: number, cells: { g: Grid; ox: number; oy: number }[]) {
  const ref = readFileSync(`${DIR}/${name}.svg`, "utf8").trim();
  const rects = cells.flatMap((c) => gridRects(c.g).map((r) => ({ ...r, x: r.x + c.ox, y: r.y + c.oy })));
  const mine = svg(rects, sheetW, sheetH);
  if (mine === ref) { console.log(`OK   ${name}`); return; }
  fails++;
  console.error(`DIFF ${name}: mine ${mine.length}b vs ref ${ref.length}b`);
  for (let i = 0; i < Math.min(mine.length, ref.length); i++) {
    if (mine[i] !== ref[i]) { console.error(`  first diff @${i}: mine …${mine.slice(i, i + 70)}\n              ref  …${ref.slice(i, i + 70)}`); break; }
  }
}

const FACINGS = ["s", "se", "e", "ne", "n"] as const;
const ANIMS: [("idle" | "walk"), number][] = [["idle", 2], ["walk", 6]];
// roaming_trader 256×200: rows = facings, cols = idle(2)+walk(6)
const traderCells: { g: Grid; ox: number; oy: number }[] = [];
FACINGS.forEach((fc, r) => {
  let col = 0;
  for (const [anim, n] of ANIMS) for (let f = 0; f < n; f++) {
    traderCells.push({ g: G(drawTrader(fc, anim, f)), ox: col * 32, oy: r * 40 });
    col++;
  }
});
compare("roaming_trader", 256, 200, traderCells);

// cloth options strip 160×40: s-idle-f0 in the five cloth ramps
compare("roaming_trader_cloth_options", 160, 40,
  TRADER_CLOTH_RAMPS.map((name, i) => ({ g: G(drawTrader("s", "idle", 0, RAMP[name])), ox: i * 32, oy: 0 })));

// pack_mule 112×112: rows = facings [s,se,e,n], cols = walk 4
const MULE: ("s" | "se" | "e" | "n")[] = ["s", "se", "e", "n"];
const muleCells: { g: Grid; ox: number; oy: number }[] = [];
MULE.forEach((fc, r) => { for (let f = 0; f < 4; f++) muleCells.push({ g: G(drawPackMule(fc, f)), ox: f * 28, oy: r * 28 }); });
compare("pack_mule", 112, 112, muleCells);

console.log(fails === 0 ? "\nALL byte-exact" : `\n${fails} DIFF`);
process.exit(fails === 0 ? 0 : 1);
