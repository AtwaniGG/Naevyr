// TEMP: verify the premium avatar set + Drift Mirror ports match the DS SVG
// exports exactly (4 char sheets, 8 channel-option sheets, 4 portraits, mirror).
import { readFileSync } from "node:fs";
import {
  drawAvatar, drawAvatarPortrait, fxMirror,
  AVATAR_KINDS, AVATAR_CHANNELS,
  type AvatarKind, type IsoFacing, type AnimName,
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
/** exports emit rects cell by cell (per-cell x/y offsets), not row-major */
function diff(name: string, path: string, cells: { g: Grid; cx: number; cy: number }[], W: number, H: number) {
  const rects = cells.flatMap(({ g, cx, cy }) =>
    gridRects(g).map((r) => ({ ...r, x: r.x + cx, y: r.y + cy })));
  const mine = svg(rects, W, H);
  if (mine === ref(path)) console.log(`OK   ${name}`);
  else { fail++; console.error(`DIFF ${name}: mine ${mine.length}b vs ref ${ref(path).length}b`); }
}

const FACINGS: IsoFacing[] = ["s", "se", "e", "ne", "n"];
const ANIMS: [AnimName, number][] = [["idle", 2], ["walk", 6], ["swing", 4]];

for (const kind of AVATAR_KINDS) {
  // full sheet: rows=facings, cols=12 (idle0-1, walk0-5, swing0-3)
  diff(kind, `avatars/${kind}`, FACINGS.flatMap((fc, row) => {
    const cells: { g: Grid; cx: number; cy: number }[] = [];
    let col = 0;
    for (const [anim, n] of ANIMS) for (let f = 0; f < n; f++)
      cells.push({ g: G(drawAvatar(kind as AvatarKind, fc, anim, f)), cx: (col++) * 32, cy: row * 40 });
    return cells;
  }), 384, 200);

  // channel-option sheets: s-facing idle row (idle0,idle1) per option
  const ch = AVATAR_CHANNELS[kind] as Record<string, readonly string[]>;
  Object.keys(ch).forEach((chan, ci) => {
    const opts = ch[chan];
    diff(`${kind}.${chan}`, `avatars/${kind}_${chan}_options`, opts.flatMap((opt, oi) =>
      [0, 1].map((f) => ({
        g: G(drawAvatar(kind as AvatarKind, "s", "idle", f, ci === 0 ? { a: opt } : { b: opt })),
        cx: (oi * 2 + f) * 32, cy: 0,
      }))), opts.length * 64, 40);
  });

  // portrait: 48×64 bust, 2f idle
  diff(`portrait_${kind}`, `avatars/portrait_${kind}`,
    [0, 1].map((f) => ({ g: G(drawAvatarPortrait(kind as AvatarKind, f)), cx: f * 48, cy: 0 })), 96, 64);
}

diff("mirror", "interiors/mirror",
  [0, 1].map((f) => ({ g: G(fxMirror(f)), cx: f * 32, cy: 0 })), 64, 48);

if (fail) { console.error(`${fail} avatar sprite(s) differ`); process.exit(1); }
console.log("avatar + mirror port: all byte-exact");
