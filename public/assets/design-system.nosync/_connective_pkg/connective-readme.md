# Naevyr — Frontier Connective Tissue

The procedural art that fills the space **between** frontier landmarks: a rideable mount, an
iso road auto-tile set, and wayside / ruin decor (rest stops, resource camps, landmarks).
Authored to be **stylistically identical** to the existing Naevyr packs (`tiles.js` /
`character.js` / `beasts.js` / `frontier.js` / `waystation.js`).

> **Locked style (matched exactly):** RAMP ramps only (stone/drift/ember/gold/blood/bone/
> grass/dirt/water) · 1px `#0a0810` void outline on every billboard silhouette · dither, never
> blur · iso 64×32 diamond grid · bottom-center anchors · `crispEdges` / `image-rendering:
> pixelated` · moonlit-left / shadowed-right.
>
> **Exception (floor-style tiles):** roads sink into the terrain — **diamond-center** anchored,
> soft dithered edges, **no** billboard void outline on the ground-facing sides.

Every export's `.json` carries cell dims, anchors, facings, and anim names / counts / fps so the
TS port lands byte-exact.

Build (re-run to regenerate any sprite): eval, in order, `pixlib.js → tiles.js → beasts.js →
character.js` then the new generator, then call each registry entry's `fn(...)` → `gridSvg`
(single) / `sheetSvg` (frames or facings×frames, laid left-to-right) for the `.svg`, plus the
`.json`. (`mounts.js` needs `character.js` for the rider-composite proof; `roads.js` needs only
`pixlib`+`tiles`; `wayside.js` / `ruins.js` need `beasts.js` for `ell`/`shadeMass`.)

---

## 1 · Mount — `_gen/mounts.js` → `mounts/`  *(key deliverable, wanderer-rig compatible)*

`frontier_steed` — a lean dark-fantasy horse. The generator is built so future variants slot in
(`STEED_KINDS` maps a kind → coat ramp / mane / glow / undead flag; add a kind, ship a sheet, no
rig changes — e.g. a skeletal `coat:'bone', undead:true` drift-horse).

| | |
|---|---|
| Cell | **56×48**, bottom-center anchor **(28,47)**, aligned to the ~1-tile 64×32 footprint |
| Facings | **s / se / e / ne / n** + engine **mirror** (w←e, sw←se, nw←ne) — matches the 32×40 wanderer rig (5 facings + mirror) exactly |
| Anims | **idle 2f** @2 (tail-flick / breath) · **walk 6f** @8 |
| Sheet | rows = facings, cols = idle 0–1, walk 0–5 (8 cols × 5 rows) |
| Shadow | bottom-center contact-shadow ellipse |
| Dye | one coat **dye channel** (RAMP swap); v1 ships a single `stone` (ink) look — `coatDye.swappable` lists `stone / bone / blood / drift` |

**Rig sync — the critical metadata.** The walk gait is timed to the wanderer's 6-frame walk:
body bob `[0,-1,0,0,-1,0]` is **identical** to `drawWanderer`'s walk bob, so a seated rider's bob
lines up; legs stay planted. **Every frame** (per facing, per anim frame) carries a
`saddleAnchor {x,y}` in cell-local px marking where the rider's bottom-center anchor sits — the
engine draws the wanderer at `steedScreenPos + saddleAnchor`, exactly like worn-gear anchors line
up on the rig. The JSON also carries `rideRig:'wanderer'`, `riderCell` and `riderAnchor` (16,39).
`mounts/frontier_steed_ride.svg` is a proof sheet: the real wanderer composited at each saddle
anchor across all five facings.

## 2 · Roads — `_gen/roads.js` → `roads/`  *(iso auto-tile terrain set)*

64×32 diamond, **diamond-center** anchored (32,16), drawn over the ground tile: packed-earth bed +
worn cobble center line + dithered ruts, soft edges blending into the ground, **no** void outline
(`sink:true, outline:false`). A compact set keyed by a **4-neighbour road bitmask**
(`bit 0=NE, 1=SE, 2=SW, 3=NW`); the engine rotates/mirrors these canonical pieces to cover all 16
masks (`ROAD_AUTOTILE` carries the lookup, shipped in every road `.json`).

| Piece | Connects | Mask |
|---|---|---|
| `road_straight` | NE+SW | 5 |
| `road_bend` | SE+SW | 6 |
| `road_tee` | NE+SE+SW | 7 |
| `road_cross` | all four | 15 |
| `road_cap` | SW (stub / end) | 4 |
| `road_isolated` | none (lone worn patch) | 0 |
| `road_broken` | drift-eaten straight variant for corrupt cells (else the engine just hides the road) | 5 |

## 3 · Wayside decor — `_gen/wayside.js` → `wayside/`

Native-size, bottom-center anchored, 1px void outline.

| Group | Assets |
|---|---|
| **Rest stops** | `campfire` 64×64 (3f `flame`@4) · `lean_to` 80×72 · `bedroll` 48×24 · `supply_crates` 48×40 · `cook_pot` 32×32 |
| **Logging** | `log_pile` 64×40 · `sawbuck` 48×40 · `axe_stump` 32×40 |
| **Quarry** | `stone_cart` 64×48 · `cut_blocks` 56×32 · `pick_stump` 32×40 |
| **Fishing** | `pier` 96×48 (2f `water_lap`@2) · `net_rack` 48×56 · `fish_basket` 32×28 |

## 4 · Landmarks / ruins — `_gen/ruins.js` → `ruins/`

| Asset | Cell | Anchor | Notes |
|---|---|---|---|
| `waystone` | 28×44 | 14,43 | leaning marker stone, carved directional rune, 2f `rune_glow`@2 |
| `broken_arch` | 96×88 | 48,87 | ruined ashlar archway, broken past the crown, rubble + drift in the cracks (3×3) |
| `fallen_statue` | 72×72 | 36,71 | toppled stone warrior: empty stepped plinth, snapped legs, cracked cuirass (drift seep), rolled circlet head (2×2) |
| `battlefield_bones` | 80×40 | 40,39 | ground decor — ribcages, skulls, broken spears, cracked shields, drift motes |
| `drift_monolith` | 48×96 | 24,95 | black obelisk + glowing drift-crystal seam, 2f `shimmer`@2, crystal crown. **Ships a full dirt apron pad inside its own canvas** — no clipped south foundation. (2×2) |

---

## Ramp usage (no new hues — RAMP only)
- **Steed** — `stone` coat (ink), `void`/`stone[3]` mane & tail, `drift` eye-glow, `dirt` saddle leather.
- **Roads** — `dirt` bed, `stone`+`bone` cobble, `drift`+`void` on the broken variant.
- **Wayside** — `dirt` timber, `stone` iron/stone, `ember`/`gold` fire & embers, `bone` hide/rope/fish, `blood` tent/blanket, `water` water & fish, `grass` moss.
- **Ruins** — `stone` masonry, `drift` runes/seam/crystal, `bone` battlefield bones, `gold` circlet/veins, `grass` moss, `dirt` apron.

## Animation cadences (match the existing sets)
campfire `flame` 3f@4 · cook_pot embers (static) · pier `water_lap` 2f@2 · waystone `rune_glow`
2f@2 · drift_monolith `shimmer` 2f@2 · steed `idle` 2f@2 / `walk` 6f@8 (walk synced to the
wanderer's 6-frame walk).

## Files
`connective-preview.html` — every asset at 2–4× with bottom-center anchor pins (gold), per-frame
saddle pins (purple), and roads shown over a grass tile; an `@dsCard` in the **World Art** group.
`_gen/{mounts,roads,wayside,ruins}.js` — the deterministic generators.
