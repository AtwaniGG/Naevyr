// TEMP: verify the frontier keeper NPC ports match the expansion exports exactly.
import { readFileSync } from "node:fs";
import { drawKeeper, drawKeeperPortrait, type KeeperKind, type IsoFacing } from "../game/render/sprites";

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
  readFileSync(`public/assets/expansion.nosync/_naevyr_expansion_pkg/npcs/${name}.svg`, "utf8").trim();
const G = (x: unknown) => x as unknown as Grid;
const FACINGS: IsoFacing[] = ["s", "se", "e", "ne", "n"];
let fail = 0;
function diffSheet(kind: KeeperKind) {
  // facings as rows, idle 2f as columns
  const cells: { g: Grid; cx: number; cy: number }[] = [];
  FACINGS.forEach((fc, row) => { for (let f = 0; f < 2; f++) cells.push({ g: G(drawKeeper(kind, fc, f)), cx: f * 32, cy: row * 40 }); });
  const rects = cells.flatMap(({ g, cx, cy }) => gridRects(g).map((r) => ({ ...r, x: r.x + cx, y: r.y + cy })));
  const mine = svg(rects, 64, 200);
  if (mine === ref(kind)) console.log(`OK   ${kind}`);
  else { fail++; console.error(`DIFF ${kind}: mine ${mine.length}b vs ref ${ref(kind).length}b`); }
}
function diffPortrait(kind: KeeperKind) {
  const frames = [0, 1].map((f) => G(drawKeeperPortrait(kind, f)));
  const rects = frames.flatMap((g, i) => gridRects(g).map((r) => ({ ...r, x: r.x + i * 48 })));
  const mine = svg(rects, 96, 64);
  if (mine === ref(`portrait_${kind}`)) console.log(`OK   portrait_${kind}`);
  else { fail++; console.error(`DIFF portrait_${kind}: mine ${mine.length}b vs ref ${ref(`portrait_${kind}`).length}b`); }
}

for (const k of ["quartermaster", "scout", "hermit"] as KeeperKind[]) { diffSheet(k); diffPortrait(k); }

if (fail) { console.error(`${fail} NPC sprite(s) differ`); process.exit(1); }
console.log("frontier keeper NPCs: all byte-exact");
