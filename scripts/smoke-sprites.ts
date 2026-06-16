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
          } else if (pixels < (kind === "wisp" && sheetAnim === "death" ? 8 : 20)) {
            // the Drift Wisp's final death frame is a deliberately sparse mote
            // scatter (byte-exact vs the authored export); exempt it from the floor
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
  mine: [144, 120], stable: [144, 152],
  huskden: [120, 88], obelisk: [64, 112], mirehut: [120, 116],
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

// biome ground cover (Fill the Realm placeholders): every kind × 2 variants
import { makeBiomeDoodad, BIOME_DOODAD_KEYS } from "../game/render/sprites";
for (const k of BIOME_DOODAD_KEYS) {
  for (let v = 0; v < 2; v++) {
    try {
      const g = makeBiomeDoodad(k, v);
      const px = g.d.filter(Boolean).length;
      frames++;
      if (g.w < 8 || g.h < 6) { failures++; console.error(`FAIL biome ${k}#${v}: grid ${g.w}×${g.h}`); }
      else if (px < 6) { failures++; console.error(`FAIL biome ${k}#${v}: only ${px} pixels`); }
    } catch (e) { failures++; console.error(`THROW biome ${k}#${v}:`, e); }
  }
}

// Fill-the-Realm critters / micro-POIs / biome tiles (DS port)
import {
  makeCritter, CRITTER_SPECS, CritterKind, makeMicroPoi, MICROPOI_KEYS, MicroPoiKey,
  makeBiomeTile, BIOME_TILE_KEYS, BiomeTileKey,
} from "../game/render/sprites";
for (const kind of Object.keys(CRITTER_SPECS) as CritterKind[]) {
  const spec = CRITTER_SPECS[kind];
  for (const fc of spec.facings) for (const [anim, n] of spec.anims) for (let f = 0; f < n; f++) {
    try { const g = makeCritter(kind, fc, anim, f); frames++; if (g.w !== spec.cell[0] || g.h !== spec.cell[1]) { failures++; console.error(`FAIL critter ${kind}/${fc}/${anim}#${f}: ${g.w}×${g.h}`); } else if (g.d.filter(Boolean).length < 6) { failures++; console.error(`FAIL critter ${kind}/${fc}/${anim}#${f}: sparse`); } }
    catch (e) { failures++; console.error(`THROW critter ${kind}/${fc}/${anim}#${f}:`, e); }
  }
}
for (const key of MICROPOI_KEYS as MicroPoiKey[]) {
  for (let f = 0; f < 2; f++) {
    try { const g = makeMicroPoi(key, f); frames++; if (g.d.filter(Boolean).length < 40) { failures++; console.error(`FAIL micropoi ${key}#${f}: sparse`); } }
    catch (e) { failures++; console.error(`THROW micropoi ${key}#${f}:`, e); }
  }
}
for (const key of BIOME_TILE_KEYS as BiomeTileKey[]) {
  try { const g = makeBiomeTile(key); frames++; if (g.w !== 64 || g.h !== 36 || g.d.filter(Boolean).length < 500) { failures++; console.error(`FAIL biometile ${key}: ${g.w}×${g.h}`); } }
  catch (e) { failures++; console.error(`THROW biometile ${key}:`, e); }
}

// the connective pack (DS port): steed, roads, wayside, ruins
import {
  drawSteed, STEED_FACINGS, drawRoad, ROAD_PIECES, roadDirsFromMask,
  WAYSIDE_SPECS, WaysideKey, RUIN_SPECS, RuinKey, drawTrader, drawPackMule,
} from "../game/render/sprites";
// the Stable steed: 5 facings × idle 2f / walk 6f, 56×48
for (const fc of STEED_FACINGS) {
  for (const [anim, n] of [["idle", 2], ["walk", 6]] as const) {
    for (let f = 0; f < n; f++) {
      try {
        const g = drawSteed("frontier_steed", fc, anim, f);
        const px = g.d.filter(Boolean).length;
        frames++;
        if (g.w !== 56 || g.h !== 48) { failures++; console.error(`FAIL steed ${fc}-${anim}#${f}: grid ${g.w}×${g.h}`); }
        else if (px < 150) { failures++; console.error(`FAIL steed ${fc}-${anim}#${f}: only ${px} pixels`); }
      } catch (e) { failures++; console.error(`THROW steed ${fc}-${anim}#${f}:`, e); }
    }
  }
}
if (JSON.stringify(drawSteed("frontier_steed", "e", "walk", 0).d) === JSON.stringify(drawSteed("frontier_steed", "e", "walk", 3).d)) {
  failures++; console.error("FAIL steed: walk gait frames 0 and 3 identical");
}
// roads: every canonical piece + broken, 64×36, no outline; all 16 masks generate
for (const name of Object.keys(ROAD_PIECES)) {
  try {
    const g = drawRoad(ROAD_PIECES[name], false);
    frames++;
    if (g.w !== 64 || g.h !== 36) { failures++; console.error(`FAIL road ${name}: grid ${g.w}×${g.h}`); }
    else if (name !== "isolated" && g.d.filter(Boolean).length < 60) { failures++; console.error(`FAIL road ${name}: too sparse`); }
  } catch (e) { failures++; console.error(`THROW road ${name}:`, e); }
}
for (let mask = 0; mask < 16; mask++) {
  try { drawRoad(roadDirsFromMask(mask), false); frames++; }
  catch (e) { failures++; console.error(`THROW road mask ${mask}:`, e); }
}
try { drawRoad(ROAD_PIECES.straight, true); frames++; } catch (e) { failures++; console.error("THROW road_broken:", e); }
// wayside decor: every key × frame at its declared cell
for (const k of Object.keys(WAYSIDE_SPECS) as WaysideKey[]) {
  const spec = WAYSIDE_SPECS[k];
  for (let f = 0; f < spec.frames; f++) {
    try {
      const g = spec.fn(f); frames++;
      if (g.w !== spec.cell[0] || g.h !== spec.cell[1]) { failures++; console.error(`FAIL wayside ${k}#${f}: grid ${g.w}×${g.h}`); }
      else if (g.d.filter(Boolean).length < 60) { failures++; console.error(`FAIL wayside ${k}#${f}: too sparse`); }
    } catch (e) { failures++; console.error(`THROW wayside ${k}#${f}:`, e); }
  }
}
if (JSON.stringify(WAYSIDE_SPECS.campfire.fn(0).d) === JSON.stringify(WAYSIDE_SPECS.campfire.fn(1).d)) {
  failures++; console.error("FAIL campfire: flame frames 0 and 1 identical");
}
// the Roaming Trader (wanderer rig) + pack mule
for (const fc of ["s", "se", "e", "ne", "n"] as IsoFacing[])
  for (const [anim, n] of [["idle", 2], ["walk", 6]] as [BeastAnim, number][])
    for (let f = 0; f < n; f++) {
      try { const g = drawTrader(fc, anim as never, f); frames++; if (g.w !== 32 || g.h !== 40) { failures++; console.error(`FAIL trader ${fc}-${anim}#${f}: ${g.w}×${g.h}`); } }
      catch (e) { failures++; console.error(`THROW trader ${fc}-${anim}#${f}:`, e); }
    }
for (const fc of ["s", "se", "e", "n"] as const)
  for (let f = 0; f < 4; f++) {
    try { const g = drawPackMule(fc, f); frames++; if (g.w !== 28 || g.h !== 28) { failures++; console.error(`FAIL mule ${fc}#${f}: ${g.w}×${g.h}`); } }
    catch (e) { failures++; console.error(`THROW mule ${fc}#${f}:`, e); }
  }
// ruin landmarks: every key × frame
for (const k of Object.keys(RUIN_SPECS) as RuinKey[]) {
  const spec = RUIN_SPECS[k];
  for (let f = 0; f < spec.frames; f++) {
    try {
      const g = spec.fn(f); frames++;
      if (g.w !== spec.cell[0] || g.h !== spec.cell[1]) { failures++; console.error(`FAIL ruin ${k}#${f}: grid ${g.w}×${g.h}`); }
      else if (g.d.filter(Boolean).length < 80) { failures++; console.error(`FAIL ruin ${k}#${f}: too sparse`); }
    } catch (e) { failures++; console.error(`THROW ruin ${k}#${f}:`, e); }
  }
}
if (JSON.stringify(RUIN_SPECS.drift_monolith.fn(0).d) === JSON.stringify(RUIN_SPECS.drift_monolith.fn(1).d)) {
  failures++; console.error("FAIL drift_monolith: shimmer frames identical");
}

// shrine frames must actually differ (the flame flickers)
{
  const a = JSON.stringify(makeBuildingSprite("shrine", 0).d);
  const b = JSON.stringify(makeBuildingSprite("shrine", 1).d);
  if (a === b) { failures++; console.error("FAIL shrine: frames 0 and 1 are identical"); }
}

// interior set (DS port): floors × styles × seeds, walls × registry, fixtures
import {
  makeInteriorFloor, makeFixture, makeWallSegment,
  FixtureSpriteKind, InteriorFloorStyle, WallSide, WallMatKind, WallVariant,
} from "../game/render/sprites";
for (const style of ["wood", "stone", "cave", "crypt"] as InteriorFloorStyle[]) {
  for (let v = 1; v <= 3; v++) {
    try {
      const g = makeInteriorFloor(style, v);
      const px = g.d.filter(Boolean).length;
      frames++;
      if (px < 500) { failures++; console.error(`FAIL floor ${style}#${v}: only ${px} pixels`); }
    } catch (e) { failures++; console.error(`THROW floor ${style}#${v}:`, e); }
  }
}
const WALL_COMBOS: [WallSide, WallMatKind, WallVariant][] = [
  ["nw", "timber", "plain"], ["ne", "timber", "plain"], ["nw", "timber", "window"], ["nw", "timber", "banner"],
  ["nw", "block", "plain"], ["ne", "block", "plain"], ["nw", "block", "window"], ["nw", "block", "banner"],
  ["nw", "cave", "plain"], ["ne", "cave", "plain"], ["nw", "cave", "seam"], ["nw", "cave", "lantern"],
];
for (const [side, mat, variant] of WALL_COMBOS) {
  try {
    const g = makeWallSegment(side, mat, variant);
    const px = g.d.filter(Boolean).length;
    frames++;
    if (g.w !== 64 || g.h !== 56) { failures++; console.error(`FAIL wall ${side}/${mat}/${variant}: grid ${g.w}×${g.h}`); }
    else if (px < 500) { failures++; console.error(`FAIL wall ${side}/${mat}/${variant}: only ${px} pixels`); }
  } catch (e) { failures++; console.error(`THROW wall ${side}/${mat}/${variant}:`, e); }
}
const FIXTURES: [FixtureSpriteKind, number][] = [
  ["counter", 1], ["vat", 1], ["shelf", 1], ["table", 1], ["barrel", 1],
  ["cage", 1], ["anvil", 1], ["rug", 1], ["wheelDisc", 1],
  ["goldVein", 2], ["goldVeinEmpty", 1], ["hearth", 3], ["oreCart", 1],
  // crypt pack (Barrow-Crypt): brazier flickers 2f
  ["sarcophagus", 1], ["rubblePile", 1], ["standingBrazier", 2], ["brokenPillar", 1], ["bonePile", 1],
];
for (const [kind, nFrames] of FIXTURES) {
  for (let f = 0; f < nFrames; f++) {
    try {
      const g = makeFixture(kind, "#a855f7", f);
      const px = g.d.filter(Boolean).length;
      frames++;
      if (px < 60) { failures++; console.error(`FAIL fixture ${kind}#${f}: only ${px} pixels`); }
    } catch (e) { failures++; console.error(`THROW fixture ${kind}#${f}:`, e); }
  }
}
// wall2: skewed segments + corners (DS walls.js port)
import { makeWall2, makeWall2Corner } from "../game/render/sprites";
import {
  drawArenaFloor, drawArenaRing, drawArenaGate, drawArenaTorch,
  drawArenaWatcher, drawVictoryPlate, drawBloodFx,
} from "../game/render/sprites";
import {
  makeWildDoodad, drawLostTombstone, drawWallTimberCharms, WildDoodadKey,
  makeFrontierDoodad, drawAshGround, FrontierDoodadKey, ASH_GROUND_VARIANTS,
} from "../game/render/sprites";
const WALL2_COMBOS: [WallSide, WallMatKind, WallVariant][] = [
  ["nw", "timber", "plain"], ["ne", "timber", "plain"], ["nw", "timber", "window"], ["ne", "timber", "banner"],
  ["nw", "block", "plain"], ["ne", "block", "plain"], ["nw", "block", "window"], ["ne", "block", "banner"],
  ["nw", "cave", "plain"], ["ne", "cave", "plain"], ["nw", "cave", "seam"], ["ne", "cave", "lantern"],
];
for (const [side, mat, variant] of WALL2_COMBOS) {
  try {
    const g = makeWall2(side, mat, variant);
    const px = g.d.filter(Boolean).length;
    frames++;
    if (g.w !== 32 || g.h !== 72) { failures++; console.error(`FAIL wall2 ${side}/${mat}/${variant}: grid ${g.w}×${g.h}`); }
    else if (px < 400) { failures++; console.error(`FAIL wall2 ${side}/${mat}/${variant}: only ${px} pixels`); }
  } catch (e) { failures++; console.error(`THROW wall2 ${side}/${mat}/${variant}:`, e); }
}
for (const mat of ["timber", "block", "cave"] as WallMatKind[]) {
  try {
    const g = makeWall2Corner(mat);
    frames++;
    if (g.w !== 16 || g.h !== 72) { failures++; console.error(`FAIL wall2 corner ${mat}`); }
  } catch (e) { failures++; console.error(`THROW wall2 corner ${mat}:`, e); }
}

// frontier pack (frontier.js port): standing doodads + ash ground accents
for (const k of ["drift_crystal", "ash_dune", "scorched_stump"] as FrontierDoodadKey[]) {
  for (const v of [0, 1]) {
    try {
      const g = makeFrontierDoodad(k, v);
      const px = g.d.filter(Boolean).length;
      frames++;
      if (px < 20) { failures++; console.error(`FAIL frontier doodad ${k}#${v}: only ${px} pixels`); }
    } catch (e) { failures++; console.error(`THROW frontier doodad ${k}#${v}:`, e); }
  }
}
for (let v = 0; v < ASH_GROUND_VARIANTS; v++) {
  try {
    const g = drawAshGround(v);
    const px = g.d.filter(Boolean).length;
    frames++;
    if (g.w !== 64 || g.h !== 36) { failures++; console.error(`FAIL ash_ground#${v}: grid ${g.w}×${g.h}`); }
    else if (px < 100) { failures++; console.error(`FAIL ash_ground#${v}: only ${px} pixels`); }
  } catch (e) { failures++; console.error(`THROW ash_ground#${v}:`, e); }
}

// wilds pack (DS wilds.js port): structures animate, doodads + extras generate
for (const k of ["reed_clump", "dead_tree", "bone_spike", "mire_bubble"] as WildDoodadKey[]) {
  for (const v of [0, 1]) {
    try {
      const g = makeWildDoodad(k, v);
      const px = g.d.filter(Boolean).length;
      frames++;
      if (px < 20) { failures++; console.error(`FAIL wild doodad ${k}#${v}: only ${px} pixels`); }
    } catch (e) { failures++; console.error(`THROW wild doodad ${k}#${v}:`, e); }
  }
}
for (const sunken of [false, true]) {
  try {
    const g = drawLostTombstone(sunken);
    frames++;
    if (g.d.filter(Boolean).length < 40) { failures++; console.error(`FAIL lost tombstone sunken=${sunken}`); }
  } catch (e) { failures++; console.error(`THROW lost tombstone:`, e); }
}
try {
  const g = drawWallTimberCharms();
  frames++;
  if (g.d.filter(Boolean).length < 400) { failures++; console.error("FAIL wall_timber_charms"); }
} catch (e) { failures++; console.error("THROW wall_timber_charms:", e); }
if (JSON.stringify(makeBuildingSprite("huskden", 0).d) === JSON.stringify(makeBuildingSprite("huskden", 1).d)) {
  failures++; console.error("FAIL huskden: eye frames are identical");
}
if (JSON.stringify(makeBuildingSprite("obelisk", 0).d) === JSON.stringify(makeBuildingSprite("obelisk", 2).d)) {
  failures++; console.error("FAIL obelisk: rune frames are identical");
}

// the Threshold tutorial set (DS threshold.js port)
import {
  drawThresholdGate, drawGatewarden, drawBeacon, drawArrowPip,
  drawDriftWall, drawThresholdTile, PRESTIGE_AURAS, PrestigeAuraKey,
  drawPassEmblem,
} from "../game/render/sprites";

// battle-pass sigil (DS battlepass.js): 32×32 color + mono, must differ
for (const mono of [false, true]) {
  try {
    const g = drawPassEmblem(mono); frames++;
    if (g.w !== 32 || g.h !== 32) { failures++; console.error(`FAIL pass_emblem mono=${mono}: grid ${g.w}×${g.h}`); }
    else if (g.d.filter(Boolean).length < 100) { failures++; console.error(`FAIL pass_emblem mono=${mono}: too few pixels`); }
  } catch (e) { failures++; console.error(`THROW pass_emblem mono=${mono}:`, e); }
}
if (JSON.stringify(drawPassEmblem(false).d) === JSON.stringify(drawPassEmblem(true).d)) {
  failures++; console.error("FAIL pass_emblem: color and mono are identical");
}
for (const open of [false, true]) for (let f = 0; f < 3; f++) {
  try {
    const g = drawThresholdGate(open, f);
    const px = g.d.filter(Boolean).length;
    frames++;
    if (g.w !== 96 || g.h !== 128) { failures++; console.error(`FAIL gate ${open ? "open" : "sealed"}#${f}: grid ${g.w}×${g.h}`); }
    else if (px < 1000) { failures++; console.error(`FAIL gate ${open ? "open" : "sealed"}#${f}: only ${px} pixels`); }
  } catch (e) { failures++; console.error(`THROW gate ${open}#${f}:`, e); }
}
if (JSON.stringify(drawThresholdGate(false, 0).d) === JSON.stringify(drawThresholdGate(true, 0).d)) {
  failures++; console.error("FAIL gate: sealed and open are identical");
}
if (JSON.stringify(drawThresholdGate(true, 0).d) === JSON.stringify(drawThresholdGate(true, 1).d)) {
  failures++; console.error("FAIL gate: open frames 0 and 1 are identical");
}
for (const fc of FACINGS) for (let f = 0; f < 2; f++) {
  try {
    const g = drawGatewarden(fc, f);
    const px = g.d.filter(Boolean).length;
    frames++;
    if (g.w !== 32 || g.h !== 40) { failures++; console.error(`FAIL gatewarden ${fc}#${f}: grid ${g.w}×${g.h}`); }
    else if (px < 100) { failures++; console.error(`FAIL gatewarden ${fc}#${f}: only ${px} pixels`); }
  } catch (e) { failures++; console.error(`THROW gatewarden ${fc}#${f}:`, e); }
}
for (let f = 0; f < 3; f++) {
  try {
    const g = drawBeacon(f); frames++;
    if (g.w !== 64 || g.h !== 64 || g.d.filter(Boolean).length < 200) { failures++; console.error(`FAIL beacon#${f}`); }
  } catch (e) { failures++; console.error(`THROW beacon#${f}:`, e); }
  try {
    const g = drawDriftWall(f); frames++;
    if (g.w !== 64 || g.h !== 96 || g.d.filter(Boolean).length < 1000) { failures++; console.error(`FAIL drift_wall#${f}`); }
  } catch (e) { failures++; console.error(`THROW drift_wall#${f}:`, e); }
}
if (JSON.stringify(drawDriftWall(0).d) === JSON.stringify(drawDriftWall(1).d)) {
  failures++; console.error("FAIL drift_wall: frames 0 and 1 are identical");
}
for (let f = 0; f < 2; f++) {
  try {
    const g = drawArrowPip(f); frames++;
    if (g.w !== 16 || g.h !== 16 || g.d.filter(Boolean).length < 20) { failures++; console.error(`FAIL arrow_pip#${f}`); }
  } catch (e) { failures++; console.error(`THROW arrow_pip#${f}:`, e); }
  try {
    const g = drawThresholdTile(f); frames++;
    if (g.w !== 64 || g.h !== 36 || g.d.filter(Boolean).length < 500) { failures++; console.error(`FAIL threshold ground#${f}`); }
  } catch (e) { failures++; console.error(`THROW threshold ground#${f}:`, e); }
}

// animated fixtures must actually animate
if (JSON.stringify(makeFixture("hearth", "", 0).d) === JSON.stringify(makeFixture("hearth", "", 1).d)) {
  failures++; console.error("FAIL hearth: frames 0 and 1 are identical");
}

// economy art (DS wheelfaces/guildbanner/cache/exchange ports)
import {
  drawGoldWheelFace, drawDarkWheelFace, drawGuildBanner, drawGuildBannerFallen,
  drawCacheSealed, drawCacheOpening, drawCacheBurst, drawExchangeCounter,
} from "../game/render/sprites";
for (let f = 0; f < 2; f++) {
  for (const [name, g] of [
    [`goldwheel#${f}`, drawGoldWheelFace(f).g],
    [`darkwheel#${f}`, drawDarkWheelFace(f).g],
  ] as const) {
    frames++;
    if (g.w !== 240 || g.h !== 240 || g.d.filter(Boolean).length < 5000) {
      failures++; console.error(`FAIL ${name}`);
    }
  }
}
if (JSON.stringify(drawGoldWheelFace(0).g.d) === JSON.stringify(drawGoldWheelFace(1).g.d)) {
  failures++; console.error("FAIL goldwheel: shimmer frames identical");
}
for (let f = 0; f < 3; f++) {
  const g = drawGuildBanner(f); frames++;
  if (g.w !== 48 || g.h !== 96 || g.d.filter(Boolean).length < 500) { failures++; console.error(`FAIL banner#${f}`); }
}
{
  const g = drawGuildBannerFallen(); frames++;
  if (g.w !== 48 || g.h !== 96 || g.d.filter(Boolean).length < 300) { failures++; console.error("FAIL banner fallen"); }
}
for (const [name, g] of [
  ["cache sealed", drawCacheSealed()],
  ["cache opening0", drawCacheOpening(0)], ["cache opening1", drawCacheOpening(1)],
  ["cache burst0", drawCacheBurst(0)], ["cache burst1", drawCacheBurst(1)],
] as const) {
  frames++;
  if (g.w !== 64 || g.h !== 64 || g.d.filter(Boolean).length < 400) { failures++; console.error(`FAIL ${name}`); }
}
for (let f = 0; f < 2; f++) {
  const g = drawExchangeCounter(f); frames++;
  if (g.w !== 48 || g.h !== 48 || g.d.filter(Boolean).length < 300) { failures++; console.error(`FAIL exchange#${f}`); }
}
if (JSON.stringify(drawExchangeCounter(0).d) === JSON.stringify(drawExchangeCounter(1).d)) {
  failures++; console.error("FAIL exchange: totter frames identical");
}

// prestige auras (burn-only cosmetics, DS auras.js port): every frame, 64×64, animated
for (const key of Object.keys(PRESTIGE_AURAS) as PrestigeAuraKey[]) {
  const spec = PRESTIGE_AURAS[key];
  for (let f = 0; f < spec.frames; f++) {
    try {
      const g = spec.fn(f); frames++;
      if (g.w !== 64 || g.h !== 64) { failures++; console.error(`FAIL aura ${key}#${f}: grid ${g.w}×${g.h}`); }
      else if (g.d.filter(Boolean).length < 20) { failures++; console.error(`FAIL aura ${key}#${f}: too few pixels`); }
    } catch (e) { failures++; console.error(`THROW aura ${key}#${f}:`, e); }
  }
  if (JSON.stringify(spec.fn(0).d) === JSON.stringify(spec.fn(1).d)) {
    failures++; console.error(`FAIL aura ${key}: frames 0 and 1 are identical`);
  }
}

// premium avatars (DS avatars.js port): every kind × facing × anim frame,
// 32×40, plus channel swaps, portraits and the Drift Mirror fixture
import {
  drawAvatar, drawAvatarPortrait, fxMirror, AVATAR_KINDS, AVATAR_CHANNELS,
} from "../game/render/sprites";
{
  const AV_ANIMS = [["idle", 2], ["walk", 6], ["swing", 4]] as const;
  for (const kind of AVATAR_KINDS) {
    for (const facing of FACINGS) {
      for (const [anim, n] of AV_ANIMS) {
        for (let f = 0; f < n; f++) {
          try {
            const g = drawAvatar(kind, facing, anim, f); frames++;
            if (g.w !== 32 || g.h !== 40) { failures++; console.error(`FAIL avatar ${kind} ${facing}-${anim}#${f}: grid ${g.w}×${g.h}`); }
            else if (g.d.filter(Boolean).length < 100) { failures++; console.error(`FAIL avatar ${kind} ${facing}-${anim}#${f}: too few pixels`); }
          } catch (e) { failures++; console.error(`THROW avatar ${kind} ${facing}-${anim}#${f}:`, e); }
        }
      }
    }
    // both channels swap pixels (option 1 vs the default must differ)
    const [aOpts, bOpts] = Object.values(AVATAR_CHANNELS[kind]);
    const base = drawAvatar(kind, "s", "idle", 0);
    for (const [chan, look] of [["a", { a: aOpts[1] }], ["b", { b: bOpts[1] }]] as const) {
      const g = drawAvatar(kind, "s", "idle", 0, look); frames++;
      if (JSON.stringify(g.d) === JSON.stringify(base.d)) {
        failures++; console.error(`FAIL avatar ${kind}: channel ${chan} swap changed nothing`);
      }
    }
    for (let f = 0; f < 2; f++) {
      const g = drawAvatarPortrait(kind, f); frames++;
      if (g.w !== 48 || g.h !== 64 || g.d.filter(Boolean).length < 300) { failures++; console.error(`FAIL portrait ${kind}#${f}`); }
    }
  }
  for (let f = 0; f < 2; f++) {
    const g = fxMirror(f); frames++;
    if (g.w !== 32 || g.h !== 48 || g.d.filter(Boolean).length < 400) { failures++; console.error(`FAIL mirror#${f}`); }
  }
  if (JSON.stringify(fxMirror(0).d) === JSON.stringify(fxMirror(1).d)) {
    failures++; console.error("FAIL mirror: ripple frames identical");
  }
}

// ---- the arena set (the Pit's ring: floor, palisade, torch, watchers, plate) ----
{
  for (const v of ["a", "b", "c", "blood"] as const) {
    const g = drawArenaFloor(v, v === "blood" ? 22 : 1); frames++;
    if (g.w !== 64 || g.h !== 36 || g.d.filter(Boolean).length < 800) { failures++; console.error(`FAIL arena floor ${v}`); }
  }
  for (const side of ["ne", "nw"] as const) {
    for (const v of ["a", "b"] as const) {
      const g = drawArenaRing(side, v); frames++;
      if (g.w !== 32 || g.h !== 72 || g.d.filter(Boolean).length < 300) { failures++; console.error(`FAIL arena ring ${side}-${v}`); }
    }
    const gg = drawArenaGate(side); frames++;
    if (gg.w !== 32 || gg.h !== 72 || gg.d.filter(Boolean).length < 300) { failures++; console.error(`FAIL arena gate ${side}`); }
  }
  for (let f = 0; f < 3; f++) {
    const g = drawArenaTorch(f); frames++;
    if (g.w !== 32 || g.h !== 64 || g.d.filter(Boolean).length < 200) { failures++; console.error(`FAIL arena torch#${f}`); }
  }
  if (JSON.stringify(drawArenaTorch(0).d) === JSON.stringify(drawArenaTorch(1).d)) {
    failures++; console.error("FAIL arena torch: flame frames identical");
  }
  for (const v of ["bone", "blood", "void"] as const) {
    for (const anim of ["idle", "cheer"] as const) {
      for (let f = 0; f < 2; f++) {
        const g = drawArenaWatcher(v, anim, f); frames++;
        if (g.w !== 32 || g.h !== 40 || g.d.filter(Boolean).length < 150) { failures++; console.error(`FAIL watcher ${v}-${anim}#${f}`); }
      }
    }
  }
  for (let f = 0; f < 2; f++) {
    const g = drawVictoryPlate(f); frames++;
    if (g.w !== 96 || g.h !== 48 || g.d.filter(Boolean).length < 150) { failures++; console.error(`FAIL victory plate#${f}`); }
  }
  for (let v = 0; v < 3; v++) {
    const g = drawBloodFx(v); frames++;
    if (g.w !== 48 || g.h !== 24 || g.d.filter(Boolean).length < 20) { failures++; console.error(`FAIL blood fx#${v}`); }
  }
}

console.log(
  failures === 0
    ? `All ${frames} sprites (beasts + buildings + interiors) generated cleanly.`
    : `${failures}/${frames} sprites FAILED.`,
);
process.exit(failures === 0 ? 0 : 1);
