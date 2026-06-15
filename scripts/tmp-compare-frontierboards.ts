// TEMP: verify the frontierboards ports match the _interaction_pkg SVG exports
// byte-for-byte. Run: ./server/node_modules/.bin/tsx scripts/tmp-compare-frontierboards.ts
import { readFileSync } from "node:fs";
import { drawBountyBoard, drawSupplyPost, drawQuartermasterStall, drawGarrisonBanner } from "../game/render/sprites";

type Pixel = { c: string; a?: number };
type Grid = { w: number; h: number; d: (Pixel | null)[] };
const G = (x: unknown) => x as unknown as Grid;
const DIR = "public/assets/_interaction_pkg/frontierboards";

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
    if (mine[i] !== ref[i]) { console.error(`  first diff @${i}: mine …${mine.slice(i, i + 60)}\n              ref  …${ref.slice(i, i + 60)}`); break; }
  }
}

compare("bounty_board", 80, 56, [
  { g: G(drawBountyBoard(0)), ox: 0, oy: 0 },
  { g: G(drawBountyBoard(1)), ox: 40, oy: 0 },
]);
compare("supply_post", 56, 56, [{ g: G(drawSupplyPost()), ox: 0, oy: 0 }]);
compare("quartermaster_stall", 64, 48, [{ g: G(drawQuartermasterStall()), ox: 0, oy: 0 }]);
compare("garrison_banner", 96, 72, [
  { g: G(drawGarrisonBanner("raised", 0)), ox: 0, oy: 0 },
  { g: G(drawGarrisonBanner("raised", 1)), ox: 24, oy: 0 },
  { g: G(drawGarrisonBanner("raised", 2)), ox: 48, oy: 0 },
  { g: G(drawGarrisonBanner("lowered", 0)), ox: 72, oy: 0 },
]);

console.log(fails === 0 ? "\nALL byte-exact" : `\n${fails} DIFF`);
process.exit(fails === 0 ? 0 : 1);
