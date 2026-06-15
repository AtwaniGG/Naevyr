// TEMP: verify the connective-pack ports (steed/roads/wayside/ruins) match the
// _connective_pkg SVG exports byte-for-byte. Run from repo root:
//   ./server/node_modules/.bin/tsx scripts/tmp-compare-connective.ts
import { readFileSync } from "node:fs";
import {
  drawSteed, STEED_FACINGS, drawRoad, ROAD_PIECES,
  WAYSIDE_SPECS, WaysideKey, RUIN_SPECS, RuinKey,
} from "../game/render/sprites";

type Pixel = { c: string; a?: number };
type Grid = { w: number; h: number; d: (Pixel | null)[] };
const G = (x: unknown) => x as unknown as Grid;
const DIR = "public/assets/_connective_pkg";

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
let fails = 0;
function compare(name: string, path: string, sheetW: number, sheetH: number, cells: { g: Grid; ox: number; oy: number }[]) {
  const ref = readFileSync(`${DIR}/${path}`, "utf8").trim();
  const rects = cells.flatMap((c) => gridRects(c.g).map((r) => ({ ...r, x: r.x + c.ox, y: r.y + c.oy })));
  const mine = svg(rects, sheetW, sheetH);
  if (mine === ref) { console.log(`OK   ${name}`); return; }
  fails++;
  console.error(`DIFF ${name}: mine ${mine.length}b vs ref ${ref.length}b`);
  for (let i = 0; i < Math.min(mine.length, ref.length); i++) {
    if (mine[i] !== ref[i]) {
      console.error(` first diff @${i}\n  mine …${mine.slice(Math.max(0, i - 50), i + 50)}…\n  ref  …${ref.slice(Math.max(0, i - 50), i + 50)}…`);
      break;
    }
  }
}

// ---- steed: 5 facings (rows) × [idle0,idle1,walk0..5] (cols), 56×48 cells ----
{
  const cols: [string, number][] = [["idle", 0], ["idle", 1], ["walk", 0], ["walk", 1], ["walk", 2], ["walk", 3], ["walk", 4], ["walk", 5]];
  const cells: { g: Grid; ox: number; oy: number }[] = [];
  STEED_FACINGS.forEach((fc, row) => cols.forEach(([anim, f], col) =>
    cells.push({ g: G(drawSteed("frontier_steed", fc, anim, f)), ox: col * 56, oy: row * 48 })));
  compare("frontier_steed", "mounts/frontier_steed.svg", 8 * 56, 5 * 48, cells);
}

// ---- roads: each canonical piece + broken (single 64×36 cell each) ----
for (const name of Object.keys(ROAD_PIECES)) {
  compare(`road_${name}`, `roads/road_${name}.svg`, 64, 36, [{ g: G(drawRoad(ROAD_PIECES[name], false)), ox: 0, oy: 0 }]);
}
compare("road_broken", "roads/road_broken.svg", 64, 36, [{ g: G(drawRoad(ROAD_PIECES.straight, true)), ox: 0, oy: 0 }]);

// ---- wayside: each prop, frames laid left-to-right ----
for (const k of Object.keys(WAYSIDE_SPECS) as WaysideKey[]) {
  const spec = WAYSIDE_SPECS[k];
  const [w, h] = spec.cell;
  const cells = Array.from({ length: spec.frames }, (_, f) => ({ g: G(spec.fn(f)), ox: f * w, oy: 0 }));
  compare(k, `wayside/${k}.svg`, w * spec.frames, h, cells);
}

// ---- ruins: each landmark, frames laid left-to-right ----
for (const k of Object.keys(RUIN_SPECS) as RuinKey[]) {
  const spec = RUIN_SPECS[k];
  const [w, h] = spec.cell;
  const cells = Array.from({ length: spec.frames }, (_, f) => ({ g: G(spec.fn(f)), ox: f * w, oy: 0 }));
  compare(k, `ruins/${k}.svg`, w * spec.frames, h, cells);
}

console.log(fails === 0 ? "\nAll connective ports byte-exact." : `\n${fails} ports DIFFER.`);
process.exit(fails === 0 ? 0 : 1);
