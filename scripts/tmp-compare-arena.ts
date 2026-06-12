// TEMP: verify the arena-set ports match the DS SVG exports exactly
// (floor variants, ring segments, gate, torch, watchers, victory plate, blood).
import { readFileSync } from "node:fs";
import {
  drawArenaFloor, drawArenaRing, drawArenaGate, drawArenaTorch,
  drawArenaWatcher, drawVictoryPlate, drawBloodFx,
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

// export seeds: a=1, b=8, c=15, blood=22 (recovered by brute force vs the sheet)
diff("arena_floor", "arena/arena_floor",
  (["a", "b", "c", "blood"] as const).map((v, i) => ({ g: G(drawArenaFloor(v, 1 + i * 7)), w: 64 })), 36);
diff("arena_ring", "arena/arena_ring",
  ([["ne", "a"], ["ne", "b"], ["nw", "a"], ["nw", "b"]] as const).map(([s, v]) => ({ g: G(drawArenaRing(s, v)), w: 32 })), 72);
diff("arena_gate", "arena/arena_gate",
  (["ne", "nw"] as const).map((s) => ({ g: G(drawArenaGate(s)), w: 32 })), 72);
diff("arena_torch", "arena/arena_torch",
  [0, 1, 2].map((f) => ({ g: G(drawArenaTorch(f)), w: 32 })), 64);
for (const v of ["bone", "blood", "void"] as const) {
  diff(`watcher_${v}`, `arena/watcher_${v}`,
    ([["idle", 0], ["idle", 1], ["cheer", 0], ["cheer", 1]] as const)
      .map(([a, f]) => ({ g: G(drawArenaWatcher(v, a, f)), w: 32 })), 40);
}
diff("victory_plate", "arena/victory_plate",
  [0, 1].map((f) => ({ g: G(drawVictoryPlate(f)), w: 96 })), 48);
diff("blood_fx", "arena/blood_fx",
  [0, 1, 2].map((v) => ({ g: G(drawBloodFx(v)), w: 48 })), 24);

console.log(fail === 0 ? "\nARENA SET: all exports match byte-for-byte." : `\n${fail} sprite(s) DIFFER.`);
process.exit(fail === 0 ? 0 : 1);
