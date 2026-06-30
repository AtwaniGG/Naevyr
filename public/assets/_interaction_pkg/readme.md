# Naevyr — The Frontier Interaction Set

The **interaction layer** for the 80×80 world: the props and actors players touch to take
work, trade, craft and upgrade their claim. A drop-in art package authored to be
**stylistically identical** to the existing Naevyr packs (`frontier` / `outpost` / `camps` /
`avatars` / `npcs`). Same pixlib generators, same export format.

> **Locked style (matched exactly):** RAMP ramps only · 1px `#0a0810` void outline on every
> silhouette (salvage FX un-outlined / ADDITIVE) · dither, never blur · hard pixel edges
> (`crispEdges` / `image-rendering: pixelated`) · bottom-center anchors · moonlit-left /
> shadowed-right · top 6px reserved for the engine label on the larger structures.

Build (re-run to regenerate any sprite): eval, in order, `pixlib.js → tiles.js → avatars.js`
(for the wanderer `rig` / `drawFeet`) then the new generators, then call each registry
entry's draw fn → `gridSvg` (single) / `sheetSvg` (frames or facing-sheets, laid out
left-to-right) for the `.svg`, plus a `.json` (cell dims, anchor, `labelClearTop`, frames,
animations / states, `solid` for fixtures, and rig/`facings`/`mirror`/`channels` for actors).

---

## Contents

### `_gen/` — generators
`frontierboards.js` · `campcraft.js` · `merchant.js` · `claimworks.js`
(same helper structure as the base packs: `makeGrid`/`P`/`fillRect`/`outline`/`hash2`; the
merchant reuses the avatar `rig`/`drawFeet`.)

### `frontierboards/` — frontier signage (wood + parchment, drift-stained)
| Asset | Cell | Anchor | Frames / anim | Notes |
|---|---|---|---|---|
| `bounty_board` | 40×56 | 20,55 | 2f `flutter` @2fps | Standing notice board on two posts, nailed bounty slips (one corner flutters), carved skull crown. The flagship "go here to get work" object. `solid`. |
| `supply_post` | 56×56 | 28,55 | 1f | Stacked supply crates + a tall chalk tally board + a hanging lantern — the Quartermaster's contract post at the Outpost. `solid`. |
| `quartermaster_stall` | 64×48 | 32,47 | 1f | A rough frontier trade counter: timber counter, striped canvas canopy, crated wares + barrel behind, coin stack + scale on top. `solid`. |
| `garrison_banner` | 24×72 | 12,71 | **states** `raised`{f0–2 `sway` @3fps} / `lowered`{f3} | Frontier company banner on a spear-pole, drift-tattered fly edge + drift sigil. `lowered` = furled, colour-drained, lashed down (rep not yet earned). |

### `campcraft/` — field workstations + salvage FX
| Asset | Cell | Anchor | Frames / anim | Notes |
|---|---|---|---|---|
| `camp_tannery` | 40×48 | 20,47 | 2f `idle` @2fps | Drying rack of pegged hides (hems sway) beside a scraping beam. `solid`. |
| `camp_anvil` | 36×40 | 18,39 | 2f `ember` @4fps | Field anvil on a stump + a low open coal forge (coals pulse), hammer resting on it. `solid`. |
| `camp_cookfire` | 36×40 | 18,39 | 3f `flame` @4fps | Cauldron on an iron tripod over a fire — same flame language as the shrine/hearth. `solid`. |
| `salvage_glint` | 16×16 | 8,12 | 2f `twinkle` @4fps · **ADDITIVE** | A drift-gold twinkle marking a searchable wreck. **No outline.** |
| `dig_puff` | 24×20 | 12,18 | 3f `burst` @4fps one-shot · **ADDITIVE** | A dust/debris burst for a salvage dig. **No outline**, `loop:false`. |

### `merchant/` — the Roaming Trader (wanderer-rig) + companion
South-facing convention + the wanderer rig, so the trader drops straight into the engine's
atlas loader alongside the avatars / Driftwarden.

| Asset | Cell | Anchor | Rig / frames | Notes |
|---|---|---|---|---|
| `roaming_trader` | 32×40 | 16,39 | wanderer-rig: 5 facings `s/se/e/ne/n` (engine mirrors `w/sw/nw`); `idle` 2f @2fps · `walk` 6f @8fps | A hooded frontier peddler with a tall overloaded backpack (pots, a bedroll, bundles) + a swinging side lantern + walking staff. **One ramp-swap `cloth` channel** (hood/coat/pack). Sheet = facings as rows, frames as columns. |
| `roaming_trader_cloth_options` | strip | — | s-facing idle f0 ×5 | channel **cloth**: `dirt · stone · grass · blood · drift`. |
| `pack_mule` | 28×28 | 14,27 | 4 facings `s/se/e/n` (engine mirrors `w/sw`); `walk` 4f @8fps | A laden pack-beast that trails the trader — barrel body, side panniers, top bundle heap + a strapped pot, lashed down. Style-matched to the beast rigs. |

### `claimworks/` — claim upgrade props (ride the Furnisher prop pipeline)
Placed on claimed ground. Native small cells, bottom-center, each carries a `solid` flag.

| Asset | Cell | Anchor | Frames / anim | Notes |
|---|---|---|---|---|
| `claim_stash` | 32×28 | 16,27 | 1f | Reinforced storage chest — domed lid, vertical iron bands, gold lock plate. Bigger/richer than the loot chest. `solid`. |
| `claim_workbench` | 36×28 | 18,27 | 1f | A crafting bench: benchtop with a vise, hammer/chisels/leaning saw, scattered offcuts + shavings. `solid`. |
| `claim_ward` | 24×44 | 12,43 | 2f `glow` @4fps | A warding totem/brazier with a pale drift-flame bowl + carved glowing drift-runes — the thing that resists the Drift on a claim. `solid`. |
| `rune_anvil` | 32×40 | 16,39 | 2f `rune` @4fps | An enchanter's anvil on a stump, ringed with floating glyphs (alternating pulse) for the Forge "enchant gear" tier; doubles as a HUD panel motif if not placed. `solid`. |

---

## Accent-hex → ramp map

Every asset is painted from the locked `RAMP` ramps in `pixlib.js` — **no new hues were
introduced.** The only literal hex strings used resolve to a ramp step:

| Literal | Ramp step | Where |
|---|---|---|
| `#0a0810` | `RAMP.void` | the 1px outline on every silhouette + dark seams/sockets |
| `#171320` | `RAMP.ash` | the ground scuff under `bounty_board` |

Ramp usage by pack:
- **Frontierboards** — `dirt` (timber, board, crates, awning poles) + `bone` (parchment,
  chalk tallies, skull, sack) + `stone` (iron straps, nails, spear pole) + `gold` (coin
  stack, trade-scale sign) + `blood` (awning stripe, raised banner) + `ember` (lantern) +
  `drift` (board stain, banner sigil); the `lowered` banner is colour-drained `stone`.
- **Campcraft** — `dirt`/`bone` (rack, hides, stump, dust) + `stone` (forge ring, anvil,
  tripod, cauldron) + `ember`/`gold` (coals, cookfire flame, glint) + `drift` (glint tint).
- **Merchant** — `dirt` (default coat/pack/staff/mule) + the four other `cloth` ramps
  (`stone`/`grass`/`blood`/`drift`) + `bone` (bedroll, bundles, muzzle, eye) + `stone`/`ember`
  (lantern, pots).
- **Claimworks** — `dirt` (chest, bench, stump) + `stone` (iron bands, vise, anvil, totem,
  tools) + `gold` (chest lock) + `bone` (workbench tool tips, ward flame core) + `drift`
  (ward runes/flame/halo, anvil glyphs).

## Animation cadences (match the existing sets)
- Flame / ember / glow / rune pulses — `camp_anvil` `ember` 2f @4fps · `camp_cookfire`
  `flame` 3f @4fps · `claim_ward` `glow` 2f @4fps · `rune_anvil` `rune` 2f @4fps.
- Cloth idles — `bounty_board` `flutter` 2f @2fps · `camp_tannery` `idle` 2f @2fps ·
  `garrison_banner` `sway` 3f @3fps.
- Salvage FX — `salvage_glint` `twinkle` 2f @4fps (loop) · `dig_puff` `burst` 3f @4fps
  (one-shot, `loop:false`). Both **ADDITIVE / un-outlined**.
- Actor rig — trader `idle` 2 / `walk` 8 · mule `walk` 8 (same cadence as the wanderer).

## Files
`interaction-preview.html` — every asset at 2× (FX at 3×) with anchor pins + label-clear
guides (an `@dsCard` in the **World Art** group). `_gen/*.js` — the deterministic generators.
