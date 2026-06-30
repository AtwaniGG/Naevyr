# Naevyr — Fill the Realm (world pack)

Procedural art to make the **80×80** world feel full and alive: dense biome ground cover, ambient
wildlife, scattered micro-POIs, and biome tile accents — so each of the five regions reads as a
distinct, inhabited place instead of empty grass. Authored to be **stylistically identical** to the
existing Naevyr packs (`tiles.js` / `beasts.js` / `character.js` / `wilds.js` / the connective pack).

> **Locked style (matched exactly):** RAMP ramps only (stone / drift / ember / gold / blood / bone /
> grass / dirt / water) · void outline `#0a0810` · dither, never blur · 1px void outline on
> billboards · bottom-center anchors · `crispEdges` / `image-rendering: pixelated` ·
> moonlit-left / shadowed-right.
>
> **Exception (ground-flat decor):** `clover`, `lilypad`, `mud`, `rubble`, `charred_bone`, and the
> `biometiles` sink into the ground like floor tiles — soft dithered edges, **no** billboard
> outline on ground-facing sides. (`flat: true` in the registry; `sink: true` on biome tiles.)

Every export's `.json` carries cell dims, anchors, facings, and anim names / counts / fps so the
TS port lands byte-exact.

**Build (re-run to regenerate):** eval, in order, `pixlib.js → tiles.js → beasts.js` then the
target generator, then call each registry entry's `fn(...)` → `gridSvg` (single) / `sheetSvg`
(variants×frames or facings×anim-frames, laid left-to-right) for the `.svg`, plus the `.json`.
(`biometiles.js` also needs `beasts.js` for `ell`.)

---

## 1 · Ground cover & biome doodads — `_gen/groundcover.js` → `groundcover/`

Small native-size doodads, bottom-center anchored, **2 variants each** (the engine picks per cell),
grouped by biome. Sheet = variants major, frames minor (cols = `variants * frames`); JSON frames
keyed `name_v{V}` (or `name_v{V}_{F}` when animated). `lilypad` additionally bobs (2f).

| Biome | Doodads |
|---|---|
| **Heartland / meadow** | `wildflower` 14×14 · `daisies` 14×10 · `clover` 12×8 *(flat)* · `bush` 20×18 · `fern` 16×16 · `tallgrass` 16×16 · `meadow_mushroom` 12×10 |
| **Woodland / groves** | `grove_tree` 32×40 *(2 silhouettes, walk-through)* · `log` 24×12 · `stump` 16×14 · `sapling` 14×20 · `toadstool` 12×12 |
| **Highland** | `boulder` 22×16 · `rubble` 16×10 *(flat)* |
| **Marsh (Hollowmere)** | `cattail` 14×20 · `lilypad` 16×8 *(flat, 2f bob)* · `mud` 16×8 *(flat)* |
| **Ash / war** | `ash_tuft` 14×10 · `charred_bone` 16×10 *(flat)* · `war_debris` 20×12 |
| **Bonefields** | `skull` 12×10 · `grave_nub` 14×16 · `dead_shrub` 16×14 |

## 2 · Ambient wildlife — `_gen/critters.js` → `critters/`

Small wandering creatures for movement/life, style-matched to the pet/beast rigs. Sheet rows =
facings, cols = anim frames left-to-right. Flyers are flat (no facings) and carry a `fly`
`{height, shadow:{rx,ry}}` hint — the engine offsets the sprite up by `height` and draws a ground
shadow at the anchor.

| Critter | Cell | Facings | Anims | Notes |
|---|---|---|---|---|
| `deer` | 24×28 | s / e / n + mirror | idle 2f@2, walk 4f@6 | calm; flees the player |
| `rabbit` | 14×14 | e + mirror | idle 2f@2, hop 3f@8 | quick; flees |
| `frog` | 12×10 | e + mirror | idle 2f@2, hop 2f@6 | marsh / water edge |
| `songbird` | 12×10 | e + mirror | hop 2f@4, fly 2f@8 | meadow woods · flyer |
| `crow` | 16×16 | flat | perch 2f@2, fly 2f@6 | Ashen Flats / Bonefields · flyer |
| `vulture` | 18×16 | flat | glide 2f@2, flap 2f@4 | Bonefields · flyer |
| `dragonfly` | 12×8 | flat | hover 2f@12 | marsh, fast flit · flyer |
| `firefly` | 8×8 | flat | pulse 2f@3 | marsh/meadow night · flyer, **additive**, flat |
| `butterfly` | 10×10 | flat | flutter 3f@6 | meadow day · flyer |

## 3 · Micro-POIs — `_gen/micropoi.js` → `micropoi/`

Small decorative landmarks, bottom-center anchored, 1px void outline; a few animate.

| POI | Cell | Notes |
|---|---|---|
| `well` | 32×40 | stone well + roof + windlass bucket |
| `signpost` | 24×40 | weathered post, two arrow boards |
| `wagon_wreck` | 64×40 | toppled cart, broken wheel, spilled crates (2×1) |
| `ruined_hut` | 80×72 | collapsed cottage, caved roof, grass reclaiming (3×3) |
| `grave_row` | 64×32 | row of 4 leaning headstones (ground decor) |
| `standing_stones` | 64×72 | monolith pair + back pair, drift runes, fallen lintel, 2f `shimmer`@2 (2×2) |
| `scarecrow` | 24×44 | straw figure on a cross-post, burlap head, ragged blood-cloth |
| `beehive` | 20×28 | woven skep on a stand, 2f `bees`@3 motes |
| `hay_bales` | 40×24 | three stacked round bales (gold ramp) |
| `old_campfire` | 32×28 | cold stone ring + charred logs, faint 2f `embers`@2 |
| `fence` | 48×20 | split-rail segment, **tileable end-to-end** (`tileable:'x'`) |
| `fishing_spot` | 40×28 | plank jetty + bobbing float, 2f `water_lap`@2 |
| `bridge` | 96×40 | arched plank footbridge, posts + rails (3×1) |

## 4 · Biome tile accents — `_gen/biometiles.js` → `biometiles/`

64×32 iso ground-tile variants, **diamond-center anchored (32,16)** like `drawFloor` — floor tiles,
not billboards (`sink:true`, no outline). Drawn as the base tile per region so terrain itself differs.

| Tile | Base | Look |
|---|---|---|
| `meadow_flower` | grass | scattered tiny drift / gold / bone blooms |
| `ash_dirt` | dirt | grey scorched dirt + ember flecks + soot |
| `highland_stone` | stone | cracked grey flagstone + embedded rocks |
| `marsh_mud` | dirt | wet dark dirt + dithered puddles + reeds |

---

## Region → palette guide (no new hues, RAMP only)
- **Heartland / meadow** — grass + drift/gold/bone blooms · bushes, ferns, butterflies, fireflies.
- **Palewater (NE, water)** — grass + water + reed/lily/cattail · songbirds, fishing spots.
- **Ashen Flats (NW, war/ash)** — dirt/stone/ember + bone · ash tufts, war debris, crows, highland stone.
- **Hollowmere (SW, marsh)** — water/grass/bone + drift · cattails, toadstools, frogs/dragonflies, mud.
- **Bonefields (SE, death)** — dirt/bone/stone · skulls, graves, dead shrubs, vultures.

## Animation cadences
lilypad `bob` 2f@2 · standing_stones `shimmer` 2f@2 · beehive `bees` 2f@3 · old_campfire `embers`
2f@2 · fishing_spot `water_lap` 2f@2 · deer walk 4f@6 · rabbit hop 3f@8 · birds fly 2f@6–8 ·
dragonfly hover 2f@12 · firefly pulse 2f@3 · butterfly flutter 3f@6.

## Files
`fill-the-realm-preview.html` — every asset at 3–5× (ground cover on biome-tinted swatches showing
both variants, critters with full frame strips + anchor pins, micro-POIs, biome diamonds); an
`@dsCard` in the **World Art** group.
`_gen/{groundcover,critters,micropoi,biometiles}.js` — the deterministic generators.
