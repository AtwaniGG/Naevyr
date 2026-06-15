// TEMP: verify the campcraft + claimworks ports match the _interaction_pkg
// exports byte-for-byte. Run: ./server/node_modules/.bin/tsx scripts/tmp-compare-campclaim.ts
import { readFileSync } from "node:fs";
import {
  drawCampTannery, drawCampAnvil, drawCampCookfire, drawSalvageGlint, drawDigPuff,
  drawClaimStash, drawClaimWorkbench, drawClaimWard, drawRuneAnvil,
} from "../game/render/sprites";

type Pixel = { c: string; a?: number };
type Grid = { w: number; h: number; d: (Pixel | null)[] };
const G = (x: unknown) => x as unknown as Grid;

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
function compare(dir: string, name: string, cell: [number, number], frameFns: (() => Grid)[]) {
  const ref = readFileSync(`public/assets/_interaction_pkg/${dir}/${name}.svg`, "utf8").trim();
  const rects = frameFns.flatMap((fn, i) => gridRects(fn()).map((r) => ({ ...r, x: r.x + i * cell[0] })));
  const mine = svg(rects, cell[0] * frameFns.length, cell[1]);
  if (mine === ref) { console.log(`OK   ${name}`); return; }
  fails++;
  console.error(`DIFF ${name}: mine ${mine.length}b vs ref ${ref.length}b`);
  for (let i = 0; i < Math.min(mine.length, ref.length); i++) {
    if (mine[i] !== ref[i]) { console.error(`  @${i}: mine …${mine.slice(i, i + 60)}\n        ref  …${ref.slice(i, i + 60)}`); break; }
  }
}

compare("campcraft", "camp_tannery", [40, 48], [() => G(drawCampTannery(0)), () => G(drawCampTannery(1))]);
compare("campcraft", "camp_anvil", [36, 40], [() => G(drawCampAnvil(0)), () => G(drawCampAnvil(1))]);
compare("campcraft", "camp_cookfire", [36, 40], [() => G(drawCampCookfire(0)), () => G(drawCampCookfire(1)), () => G(drawCampCookfire(2))]);
compare("campcraft", "salvage_glint", [16, 16], [() => G(drawSalvageGlint(0)), () => G(drawSalvageGlint(1))]);
compare("campcraft", "dig_puff", [24, 20], [() => G(drawDigPuff(0)), () => G(drawDigPuff(1)), () => G(drawDigPuff(2))]);
compare("claimworks", "claim_stash", [32, 28], [() => G(drawClaimStash())]);
compare("claimworks", "claim_workbench", [36, 28], [() => G(drawClaimWorkbench())]);
compare("claimworks", "claim_ward", [24, 44], [() => G(drawClaimWard(0)), () => G(drawClaimWard(1))]);
compare("claimworks", "rune_anvil", [32, 40], [() => G(drawRuneAnvil(0)), () => G(drawRuneAnvil(1))]);

console.log(fails === 0 ? "\nALL byte-exact" : `\n${fails} DIFF`);
process.exit(fails === 0 ? 0 : 1);
