// TEMP: verify the wilds port matches the DS SVG exports exactly.
import { readFileSync } from "node:fs";
import {
  makeBuildingSprite, drawReedClump, drawDeadTree, drawBoneSpike,
  drawMireBubble, drawHerbRack, drawWallTimberCharms, drawLostTombstone,
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

const ref = (name: string) =>
  readFileSync(`public/assets/design-system.nosync/assets/wilds/${name}.svg`, "utf8").trim();

let fail = 0;
/** exports emit rects frame by frame (x offset per frame), not row-major */
function diff(name: string, frames: Grid[]) {
  const fw = frames[0].w, fh = frames[0].h;
  const rects = frames.flatMap((f, i) =>
    gridRects(f).map((r) => ({ ...r, x: r.x + i * fw })));
  const mine = svg(rects, fw * frames.length, fh);
  if (mine === ref(name)) console.log(`OK   ${name}`);
  else { fail++; console.error(`DIFF ${name}: mine ${mine.length}b vs ref ${ref(name).length}b`); }
}

const G = (x: unknown) => x as unknown as Grid;
diff("husk_den", [G(makeBuildingSprite("huskden", 0)), G(makeBuildingSprite("huskden", 1))]);
diff("ash_obelisk", [0, 1, 2].map((f) => G(makeBuildingSprite("obelisk", f))));
diff("mirewife_hut", [G(makeBuildingSprite("mirehut"))]);
diff("reed_clump", [G(drawReedClump(0)), G(drawReedClump(1))]);
diff("dead_tree", [G(drawDeadTree(0)), G(drawDeadTree(1))]);
diff("bone_spike", [G(drawBoneSpike(0)), G(drawBoneSpike(1))]);
diff("mire_bubble", [G(drawMireBubble(0)), G(drawMireBubble(1))]);
diff("herb_rack", [G(drawHerbRack())]);
diff("wall_timber_charms", [G(drawWallTimberCharms())]);
diff("lost_tombstone", [G(drawLostTombstone(false)), G(drawLostTombstone(true))]);
process.exit(fail ? 1 : 0);
