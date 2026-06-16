# Naevyr — The Frontier Expansion Pack

A drop-in world-art package for the **40×40 → 80×80** map expansion, authored to be
**stylistically identical** to the existing Naevyr packs (`wilds.js` / `town.js` /
`interiors.js` / `walls.js` / `threshold.js`). Same pixlib generators, same export format.

> **Locked style (matched exactly):** RAMP ramps only · 1px `#0a0810` void outline on every
> silhouette · dither, never blur · hard pixel edges (`crispEdges` / `image-rendering: pixelated`)
> · iso 64×32 tile diamonds · bottom-center anchors · structures on the iso ground plane ·
> moonlit-left / shadowed-right · top 6px reserved for the engine label.

Build (re-run to regenerate any sprite): eval, in order, `pixlib.js → tiles.js → town.js →
interiors.js → wilds.js → walls.js → threshold.js` then the new generator, then call each
registry entry's `fn(i)` → `gridSvg` (single) / `sheetSvg` (frames or variants, laid out
left-to-right) for the `.svg`, plus a `.json` (cell dims, tile, footprint, anchor,
`labelClearTop`, frames, animations / states, and `solid` for fixtures).

---

## Contents

### `_gen/` — generators
`waystation.js` · `camps.js` · `crypt.js` · `outpost.js` · `frontier.js`
(same helper structure: `makeGrid`/`P`/`fillRect`/`outline`, `hash2`, `diamondRows`, and the
shared pack helpers `foundation`/`door`/`litWindow`/`gableRoof`/`isoCuboid`/`driftVeins`/
`boneSpikeShape`/`tDisc`/`gateSigil`).

### `waystation/` — fast-travel monolith
| Asset | Cell | Anchor | Frames / anim | Notes |
|---|---|---|---|---|
| `waystation` | 64×112 | 72,111 → 32,111 | 4f sheet; **states** `sealed`{f0} / `active`{f1–3, `rune_pulse` @4fps, loop} | Rune-arch standing-stone gateway, kin to the Ash Obelisk; drift-crystal crown + keystone gate-sigil; portal dark when sealed, glow-swirl + rising light column + escaping motes when active. **Sits on a DIRT apron** (its `foundation()` pad uses packed earth + stone plinth, never grass). 3×3 footprint. |
| `waystation_pip` | 16×16 | 8,8 | 2f, `pulse` @2fps | HUD / minimap fast-travel marker; arch glyph + a pulsing gateway mote. Matches the `nav_icon` / `arrow_pip` style. |

### `camps/` — wild camps / mini-dungeons (3×3 footprint, 2-frame idle)
| Asset | Cell | Anchor | Theme | Idle |
|---|---|---|---|---|
| `drowned_ruins` | 120×96 | 60,95 | Palewater | half-sunken pale stone arches in shallow water; 2-frame water shimmer (pale speculars drift ±1px). |
| `barrow_crypt` | 116×100 | 58,99 | Bonefields | grass-grown burial mound + dark stone trilithon door, bone ribs/skulls/marker; 2-frame doorway drift-glow blink. |
| `ashen_warcamp` | 120×104 | 60,103 | frontier | raider hide + blood tents, crude sharpened palisade, skull-on-stake, blood war-banner, ember campfire; 2-frame ember flicker. |

### `crypt/` — dungeon interior tileset (crypt / ruin)
Floor tiles 64×36 (`tiles.js` diamond format); fixtures bottom-center anchored, each JSON
carries a **`solid`** collision flag (same export shape as the interiors pack + the new flag).

| Asset | Cell | Anchor | `solid` | Frames |
|---|---|---|---|---|
| `floor_crypt` | 64×36 | 32,16 | — | 3 seed variants (coarse cracked flagstone, bone/gold flecks, dim drift seep in the joints) |
| `sarcophagus` | 44×36 | 22,35 | `true` | carved-lid stone coffin, gold trim, drift-seep crack |
| `rubble_pile` | 34×24 | 17,23 | `true` | heaped broken blocks + gravel |
| `standing_brazier` | 24×40 | 12,37 | `true` | iron tripod bowl, `flame` 2f @4fps |
| `broken_pillar` | 24×40 | 12,37 | `true` | snapped fluted column on a plinth + fallen chunk |
| `bone_pile` | 30×20 | 15,19 | `false` | bones + two skulls (passable decor) |

### `outpost/` — frontier outpost (second settlement, matches the town pack)
South-facing doors + warm lit windows + the town pack's roof/door conventions, so the outpost
**faces town** correctly.

| Asset | Cell | Anchor | Footprint | Notes |
|---|---|---|---|---|
| `palisade_gate` | 144×128 | 72,127 | 3×3 | two log gate-towers, iron-banded double doors, sharpened stake runs, ember tower-braziers, warning skull. |
| `trading_post` | 120×130 | 60,129 | 3×3 | small timber trade house, lean-to market awning (striped cloth) + wares (crates / sacks / coin stack), coin sign, chimney smoke. |
| `watchtower` | 80×152 | 40,151 | 2×2 | tall four-post timber tower, X-braces, railed lookout platform + shingle roof, warning bell, signal brazier, ladder, drift banner. |

### `frontier/` — ground accents + doodads
| Asset | Cell | Anchor | Notes |
|---|---|---|---|
| `ash_ground` | 64×36 | 32,16 | 2 variants drawn **under entities** — **a:** pale wind-blown ash drift + scorch blotches · **b:** drift-purple corruption stain (void core, dithered bloom, welling motes, crawling veins). Heavier than the threshold ground accent. |
| `drift_crystal` | 28×44 | 14,41 | 2 variants — clustered glowing drift shards on a dark rocky base. |
| `ash_dune` | 26×16 | 13,15 | 2 variants — low wind-drifted ash mound + reed/bone shard. |
| `scorched_stump` | 24×22 | 12,21 | 2 variants — charred broken trunk with ember-smoulder in the cracks. |

---

## Accent-hex → ramp map

Every asset is painted from the locked `RAMP` ramps in `pixlib.js` — **no new hues were
introduced.** The few literal hex strings in the generators all resolve to a ramp step:

| Literal | Ramp step | Where |
|---|---|---|
| `#0a0810` | `RAMP.void` | the 1px outline on every silhouette |
| `#171320` | `RAMP.ash` | warcamp ground, `ash_ground` face |
| `#3b1162` | `RAMP.drift[4]` (deep) | waystation dormant rune fallback |
| `#5c4a1e` | unlit `RAMP.gold` (inherited from `threshold.gateSigil`) | the waystation keystone sigil when **sealed** |

Ramp usage by pack:
- **Waystation** — `stone` (monolith), `drift` (runes / crystal / portal glow), `gold` (keystone
  sigil), `dirt` (apron via `foundation`).
- **Drowned Ruins** — `water` + `bone`/`stone` (pale arches) + `grass` (algae/reeds) + `dirt` (shore).
- **Barrow-Crypt** — `grass` (mound) + `dirt` (earth) + `stone` (door) + `bone` + `drift` (glow).
- **Ashen Warcamp** — `dirt`/`ash` (ground, hide tent, stakes) + `blood` (raider tent, banner) +
  `bone` (skulls) + `ember`/`gold` (campfire).
- **Crypt** — `stone` (deep) + `bone` + `gold` + `drift` (seep); brazier `ember`/`gold`.
- **Outpost** — `dirt` (timber) + `stone` (iron, roof) + `ember`/`gold` (braziers, coin) +
  `bone` (skull, banner) + `blood` (awning stripe) + `drift` (watchtower emblem).
- **Frontier ground/doodads** — `ash`/`stone`/`bone` (ash) + `drift` (corruption, crystals) +
  `ember` (scorched stump) + `dirt`/`grass` (dune).

## Animation cadences (match the existing sets)
- Rune / flame pulses — **waystation** `rune_pulse` 3f @4fps · **standing_brazier** `flame` 2f @4fps.
- Eye / glow blinks — **barrow_crypt** doorway 2f idle · **camps** idles 2f.
- Light columns — the waystation active state rises a dithered drift column (3-step over f1–3).
- Pip — `pulse` 2f @2fps.

## Files
`frontier-preview.html` — every asset at 2× with anchor pins + label-clear guides (an
`@dsCard` in the **World Art** group). `_gen/*.js` — the deterministic generators.
