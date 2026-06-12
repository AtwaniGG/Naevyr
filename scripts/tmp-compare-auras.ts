// TEMP: verify the prestige aura port matches the DS SVG exports exactly.
import { readFileSync } from "node:fs";
import { PRESTIGE_AURAS, PrestigeAuraKey } from "../game/render/sprites";

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

const ref = (name: string) =>
  readFileSync(`public/assets/design-system.nosync/assets/auras/${name}.svg`, "utf8").trim();

let fail = 0;
const G = (x: unknown) => x as unknown as Grid;
(Object.keys(PRESTIGE_AURAS) as PrestigeAuraKey[]).forEach((key) => {
  const spec = PRESTIGE_AURAS[key];
  const rects = Array.from({ length: spec.frames }, (_, f) =>
    gridRects(G(spec.fn(f))).map((r) => ({ ...r, x: r.x + f * 64 }))).flat();
  const mine = svg(rects, spec.frames * 64, 64);
  if (mine === ref(key)) console.log(`OK   ${key} (${spec.frames}f)`);
  else { fail++; console.error(`DIFF ${key}: mine ${mine.length}b vs ref ${ref(key).length}b`); }
});

if (fail) { console.error(`${fail} aura(s) differ`); process.exit(1); }
console.log("All prestige auras byte-identical to DS exports.");
