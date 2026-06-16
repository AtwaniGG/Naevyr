// TEMP: verify the Fill-the-Realm ports match the _fill_the_realm_pkg SVG
// exports byte-for-byte. Run: ./server/node_modules/.bin/tsx scripts/tmp-compare-fill.ts
import { readFileSync } from "node:fs";
import { makeBiomeDoodad, BIOME_DOODAD_KEYS, BiomeDoodadKey, makeCritter, CRITTER_SPECS, CritterKind, makeMicroPoi, MICROPOI_KEYS, MicroPoiKey, makeBiomeTile, BIOME_TILE_KEYS, BiomeTileKey } from "../game/render/sprites";

type Pixel = { c: string; a?: number };
type Grid = { w: number; h: number; d: (Pixel | null)[] };
const G = (x: unknown) => x as unknown as Grid;
const DIR = "public/assets/_fill_the_realm_pkg";

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
function compare(name: string, path: string, sheetW: number, sheetH: number, cells: { g: Grid; ox: number; oy: number }[]) {
  const ref = readFileSync(`${DIR}/${path}`, "utf8").trim();
  const rects = cells.flatMap((c) => gridRects(c.g).map((r) => ({ ...r, x: r.x + c.ox, y: r.y + c.oy })));
  const mine = svg(rects, sheetW, sheetH);
  if (mine === ref) { console.log(`OK   ${name}`); return; }
  fails++;
  console.error(`DIFF ${name}: mine ${mine.length}b vs ref ${ref.length}b`);
  for (let i = 0; i < Math.min(mine.length, ref.length); i++) {
    if (mine[i] !== ref[i]) { console.error(` @${i}\n  mine …${mine.slice(Math.max(0, i - 50), i + 50)}…\n  ref  …${ref.slice(Math.max(0, i - 50), i + 50)}…`); break; }
  }
}
interface FrameMeta { x: number; y: number; w: number; h: number }
function readJson(path: string): { cell: { w: number; h: number }; frames: Record<string, FrameMeta> } {
  return JSON.parse(readFileSync(`${DIR}/${path}`, "utf8"));
}

// ---- groundcover: frames keyed name_v{V} or name_v{V}_{F} ----
for (const key of BIOME_DOODAD_KEYS as BiomeDoodadKey[]) {
  const meta = readJson(`groundcover/${key}.json`);
  const names = Object.keys(meta.frames);
  let sheetW = 0, sheetH = meta.cell.h;
  const cells = names.map((fk) => {
    const fr = meta.frames[fk];
    const m = fk.replace(`${key}_`, "").match(/^v(\d+)(?:_0*(\d+))?$/);
    const v = m ? +m[1] : 0, f = m && m[2] != null ? +m[2] : 0;
    sheetW = Math.max(sheetW, fr.x + fr.w);
    return { g: G(makeBiomeDoodad(key, v, f)), ox: fr.x, oy: fr.y };
  });
  compare(`groundcover/${key}`, `groundcover/${key}.svg`, sheetW, sheetH, cells);
}

// ---- critters: frames keyed {kind}-{anim}[-{facing}]_{frame} ----
for (const kind of Object.keys(CRITTER_SPECS) as CritterKind[]) {
  const meta = readJson(`critters/${kind}.json`);
  let sheetW = 0, sheetH = 0;
  const cells = Object.keys(meta.frames).map((fk) => {
    const fr = meta.frames[fk];
    const rest = fk.replace(`${kind}-`, "");        // idle-s_00 | perch_00
    const [animFacing, frameStr] = rest.split("_");
    const parts = animFacing.split("-");
    const anim = parts[0], facing = parts.length === 2 ? parts[1] : "_";
    sheetW = Math.max(sheetW, fr.x + fr.w); sheetH = Math.max(sheetH, fr.y + fr.h);
    return { g: G(makeCritter(kind, facing, anim, +frameStr)), ox: fr.x, oy: fr.y };
  });
  compare(`critters/${kind}`, `critters/${kind}.svg`, sheetW, sheetH, cells);
}

// ---- micro-POIs: frames keyed {key}_{NN} laid left-to-right ----
for (const key of MICROPOI_KEYS as MicroPoiKey[]) {
  const meta = readJson(`micropoi/${key}.json`);
  let sheetW = 0, sheetH = 0;
  const cells = Object.keys(meta.frames).map((fk) => {
    const fr = meta.frames[fk];
    const f = +fk.replace(`${key}_`, "");
    sheetW = Math.max(sheetW, fr.x + fr.w); sheetH = Math.max(sheetH, fr.y + fr.h);
    return { g: G(makeMicroPoi(key, f)), ox: fr.x, oy: fr.y };
  });
  compare(`micropoi/${key}`, `micropoi/${key}.svg`, sheetW, sheetH, cells);
}

// ---- biome tiles: single 64×36 cell ----
for (const key of BIOME_TILE_KEYS as BiomeTileKey[]) {
  const meta = readJson(`biometiles/${key}.json`);
  compare(`biometiles/${key}`, `biometiles/${key}.svg`, meta.cell.w, 36, [{ g: G(makeBiomeTile(key)), ox: 0, oy: 0 }]);
}

console.log(fails === 0 ? "\nAll Fill-the-Realm ports byte-exact." : `\n${fails} DIFFER.`);
process.exit(fails === 0 ? 0 : 1);
