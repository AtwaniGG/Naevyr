// TEMP: verify the economy-art ports match the DS SVG exports exactly
// (wheel faces, guild banner + fallen, drift cache states, exchange counter).
import { readFileSync } from "node:fs";
import {
  drawGoldWheelFace, drawDarkWheelFace,
  drawGuildBanner, drawGuildBannerFallen,
  drawCacheSealed, drawCacheOpening, drawCacheBurst,
  drawExchangeCounter,
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

diff("wheel_of_the_drift", "wheel/wheel_of_the_drift",
  [0, 1].map((f) => ({ g: G(drawGoldWheelFace(f).g), w: 240 })), 240);
diff("the_drift_wheel", "wheel/the_drift_wheel",
  [0, 1].map((f) => ({ g: G(drawDarkWheelFace(f).g), w: 240 })), 240);
diff("guild_banner", "guild/guild_banner",
  [0, 1, 2].map((f) => ({ g: G(drawGuildBanner(f)), w: 48 })), 96);
diff("guild_banner_fallen", "guild/guild_banner_fallen",
  [{ g: G(drawGuildBannerFallen()), w: 48 }], 96);
diff("drift_cache", "cache/drift_cache",
  [
    { g: G(drawCacheSealed()), w: 64 },
    { g: G(drawCacheOpening(0)), w: 64 }, { g: G(drawCacheOpening(1)), w: 64 },
    { g: G(drawCacheBurst(0)), w: 64 }, { g: G(drawCacheBurst(1)), w: 64 },
  ], 64);
diff("exchange_counter", "interiors/exchange_counter",
  [0, 1].map((f) => ({ g: G(drawExchangeCounter(f)), w: 48 })), 48);

if (fail) { console.error(`${fail} economy sprite(s) differ`); process.exit(1); }
console.log("All economy art byte-identical to DS exports.");
