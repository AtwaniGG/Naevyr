// Headless smoke test: generate every beast grid (all kinds × facings × anims
// × frames) and assert each produces pixels. Catches porting regressions
// without a browser. Run: server/node_modules/.bin/tsx scripts/smoke-sprites.ts

import { BEAST_SPECS, BeastKind, BeastAnim, IsoFacing } from "../game/render/sprites";

const FACINGS: IsoFacing[] = ["s", "se", "e", "ne", "n"];
const ANIMS: BeastAnim[] = ["idle", "move", "attack", "death"];

let frames = 0;
let failures = 0;

for (const kind of Object.keys(BEAST_SPECS) as BeastKind[]) {
  const spec = BEAST_SPECS[kind];
  for (const facing of FACINGS) {
    for (const anim of ANIMS) {
      const [sheetAnim, n] = spec.anims[anim];
      for (let f = 0; f < n; f++) {
        try {
          const g = spec.draw(facing, sheetAnim, f);
          const pixels = g.d.filter(Boolean).length;
          frames++;
          if (g.w !== spec.w || g.h !== spec.h) {
            failures++;
            console.error(`FAIL ${kind}/${facing}/${sheetAnim}#${f}: grid ${g.w}×${g.h}, expected ${spec.w}×${spec.h}`);
          } else if (pixels < 20) {
            failures++;
            console.error(`FAIL ${kind}/${facing}/${sheetAnim}#${f}: only ${pixels} pixels`);
          }
        } catch (e) {
          failures++;
          console.error(`THROW ${kind}/${facing}/${sheetAnim}#${f}:`, e);
        }
      }
    }
  }
}

// town buildings (DS town set; shrine has 3 flame frames)
import { makeBuildingSprite, BuildingSpriteKey, SHRINE_FRAMES } from "../game/render/sprites";
const CELLS: Record<BuildingSpriteKey, [number, number]> = {
  dyeworks: [144, 152], vault: [144, 152], wheel: [144, 152], lantern: [144, 152],
  furnisher: [144, 152], menagerie: [144, 152], shrine: [112, 128], pit: [240, 120],
};
for (const key of Object.keys(CELLS) as BuildingSpriteKey[]) {
  const nFrames = key === "shrine" ? SHRINE_FRAMES : 1;
  for (let f = 0; f < nFrames; f++) {
    try {
      const g = makeBuildingSprite(key, f);
      const px = g.d.filter(Boolean).length;
      frames++;
      if (g.w !== CELLS[key][0] || g.h !== CELLS[key][1]) {
        failures++;
        console.error(`FAIL building ${key}#${f}: grid ${g.w}×${g.h}, expected ${CELLS[key][0]}×${CELLS[key][1]}`);
      } else if (px < 300) {
        failures++;
        console.error(`FAIL building ${key}#${f}: only ${px} pixels`);
      }
    } catch (e) {
      failures++;
      console.error(`THROW building ${key}#${f}:`, e);
    }
  }
}
// caravan wagon (2 frames, must differ: wheels turn)
import { makeWagon } from "../game/render/sprites";
for (let f = 0; f < 2; f++) {
  try {
    const g = makeWagon(f);
    const px = g.d.filter(Boolean).length;
    frames++;
    if (g.w !== 56 || g.h !== 44) { failures++; console.error(`FAIL wagon#${f}: grid ${g.w}×${g.h}`); }
    else if (px < 300) { failures++; console.error(`FAIL wagon#${f}: only ${px} pixels`); }
  } catch (e) { failures++; console.error(`THROW wagon#${f}:`, e); }
}
if (JSON.stringify(makeWagon(0).d) === JSON.stringify(makeWagon(1).d)) {
  failures++; console.error("FAIL wagon: frames 0 and 1 are identical");
}

// shrine frames must actually differ (the flame flickers)
{
  const a = JSON.stringify(makeBuildingSprite("shrine", 0).d);
  const b = JSON.stringify(makeBuildingSprite("shrine", 1).d);
  if (a === b) { failures++; console.error("FAIL shrine: frames 0 and 1 are identical"); }
}

console.log(
  failures === 0
    ? `All ${frames} sprites (beasts + buildings) generated cleanly.`
    : `${failures}/${frames} sprites FAILED.`,
);
process.exit(failures === 0 ? 0 : 1);
