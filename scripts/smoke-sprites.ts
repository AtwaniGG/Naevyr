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

console.log(
  failures === 0
    ? `All ${frames} beast frames generated cleanly.`
    : `${failures}/${frames} frames FAILED.`,
);
process.exit(failures === 0 ? 0 : 1);
