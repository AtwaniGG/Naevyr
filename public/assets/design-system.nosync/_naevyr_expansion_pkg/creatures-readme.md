# Naevyr — Frontier Creatures & Events Pack

A follow-on to the **Frontier Expansion** structures: the living things and world-events that
populate the 80×80 map. Authored to be **rig-identical** to the existing `beasts.js` /
`character.js` / `avatars.js` — same draw signature, facings, frame cadence, sheet layout and
JSON export, so everything drops straight into the engine's atlas loader.

> **Locked style (matched exactly):** RAMP ramps only · 1px `#0a0810` void outline on solid
> bodies · **drift-corruption FX get NO outline** (the boil/mote seams bleed) · dither, never
> blur · iso 64×32 tiles · bottom-center anchors · moonlit-left / shadowed-right · **top 4px of
> every creature cell left clear** for the engine HP-bar / level-tag.

## Rig conventions (unchanged from the base packs)

- **Creatures / bosses** — `draw(facing, anim, f)` → grid. Facings `s · se · e · ne · n`
  (engine mirrors `w←e`, `sw←se`, `nw←ne`). Sheet = **facings as rows, anim-frames as columns**.
  JSON frame ids `"<name>-<anim>-<facing>_NN"`; `animations` keyed `"<anim>-<facing>"`.
- **Avatars (Driftwarden)** — wanderer-compatible 32×40, feet row `y=37`, shoulder `y=18`, swing
  pivot `(cx+off+4, shoulderY+2)`, arc `[-2.1,-1.35,-0.45,0.35]`, hit-spark on `f2`, walk-bob
  `[0,-1,0,0,-1,0]`. Two cosmetic **ramp-swap channels** baked at draw time via `look {a,b}`.
- **Keeper NPCs** — 32×40, **idle 2f only**, 5 facings, planted feet (no step).
- **fps:** idle 2 · walk 8 · action (cast/summon/slam/dive/swing/attack) 10 · boil/pulse 4–6.
  Action + death loops are `loop:false`; idle/walk/boil are `loop:true`.

---

## 1 · New mob species  → `mobs/`  (rig-compatible with `beasts.js`)

| Asset | Cell | Anims | Theme / behavior |
|---|---|---|---|
| `bogwretch` | 32×40 | idle 2 · walk 6 · **cast 4** | Palewater ranged spitter — hunched toad-thing, throat-sac inflates + maw opens on cast |
| `barrow_wight` | 32×44 | idle 2 · walk 6 · **summon 4** | Bonefields summoner — robed, raises skeletal arms; bone shards rise on summon |
| `bone_husk` | 28×36 | idle 2 · walk 6 · **swing 4** | the Wight's add — small skeleton with a bone club |
| `ash_brute` | 48×52 | idle 2 · walk 6 · **slam 4** | Ashen AoE slammer — ember-cracked hulk, two-fist slam + impact dust |
| `drift_wisp` | 28×32 | **hover 4 · dive 3** | flying corrupted mote — body hovers in the upper cell; bottom rows empty |
| `drift_wisp_shadow` | 16×8 | bob 4 | **separate** ground shadow (so the wisp can hover off the ground) |

### Projectiles & FX → `mobs/`
| Asset | Cell | Frames | Pairs with |
|---|---|---|---|
| `bog_spit` | 12×12 | `travel` 3 + `splat` 2 | Bogwretch |
| `drift_bolt` | 10×10 | `travel` 3 (engine rotates to heading) | Drift Wisp |
| `ash_shockwave` | 48×24 | `ring` 4 (centered, expanding ember ring) | Ash Brute slam |

## 2 · Camp mini-bosses  → `beasts/`  (Colossus-scale; one per Frontier camp)

| Asset | Cell | Anims | Camp |
|---|---|---|---|
| `drowned_king` | 110×110 | idle 2 · walk 6 · attack 4 | Drowned Ruins — barnacled monarch, broken crown, drags a rusted anchor-cleaver |
| `barrow_lord` | 110×116 | idle 2 · walk 6 · attack 4 | Barrow-Crypt — crowned skeletal giant, great bone blade, drift-fire sockets |
| `ash_warlord` | 100×110 | idle 2 · walk 6 · attack 4 | Ashen Warcamp — ember-armored champion, horned helm, blood war-cloak, ember greatsword |
| `portrait_<boss>` | 48×64 | idle 2 | boss-alert "banner" bust for the event UI |

## 3 · New playable avatar  → `avatars/`  (5th; frontier-themed)

| Asset | Cell | Notes |
|---|---|---|
| `driftwarden` | 32×40 | wanderer-rig: idle 2 · walk 6 · swing 4 · 5 facings. Hooded ranger; travel-cloak parts over a leather jerkin; ward-stud pauldron; hooked **warden's glaive** on swing |
| `portrait_driftwarden` | 48×64 | s-facing shop bust, 2f |
| `driftwarden_cloak_options` | strip | channel **a = cloak**: `stone · dirt · grass · blood · drift` |
| `driftwarden_ward_options` | strip | channel **b = ward** (lantern/trim/glaive glow): `drift · ember · gold · water · blood` |

`look {a,b}` resolves to two locked ramps and is baked at draw time, exactly like the existing
`ashbound / mireborn / bonecaller / veilborn`. Worn-gear lines up with the shared rig.

## 4 · New NPCs  → `npcs/`  (keeper rig + portraits)

| Asset | Cell | Notes |
|---|---|---|
| `quartermaster` (+ `portrait_`) | 32×40 / 48×64 | gruff frontier trader — flat cap, beard, leather apron, ledger, belt key-ring |
| `scout` (+ `portrait_`) | 32×40 / 48×64 | hooded watcher — hand shading the eyes, bow slung on the back |
| `hermit` (+ `portrait_`) | 32×40 / 48×64 | ragged lore-keeper — bent over a gnarled staff topped with a drift trinket |

Keeper rig = idle 2f, 5 facings (engine mirrors). Portraits are s-facing dialog busts, 2f.

## 5 · Event art  → `events/`

| Asset | Cell | Frames | Notes |
|---|---|---|---|
| `drift_rift` | 96×128 | **states** `sealed`(2) → `opening`(4) → `active`(4, **boil** loop @6fps) → `closing`(4) | vertical world-tear on the ground plane; dithered drift core + bone-white boil seam; **seam un-outlined** (bleeds), like the `drift_wall` FX |
| `rift_mote` | 16×16 | 2 | small mote that drifts around an active rift (no outline — it glows) |
| `blood_moon` | 64×64 | 2 | dark-red corrupted moon phase — maria/craters + crawling drift-purple vein + halo |
| `blood_aura` | 96×48 | 3 (pulse) | iso ground ring placed **under buffed mobs** during the Blood Moon |
| `blood_sky` | 64×128 | — | full-screen **sky-tint gradient reference** (banded-dither swatch); exact stops below |

### Blood-Moon sky tint — exact hex stops (overlay top→horizon at ~0.5 strength)
| at | hex | band |
|---|---|---|
| 0.00 | `#1a0610` | zenith — near-void, faint red |
| 0.35 | `#2a0810` | upper sky |
| 0.62 | `#3b0d14` | mid sky |
| 0.82 | `#5f1212` | low sky (= `blood-dp`) |
| 1.00 | `#991b1b` | horizon glow (= `blood-lo`) |

---

## Accent-hex → ramp map

Everything is painted from the locked `RAMP` ramps in `pixlib.js`; **no new hues**. The only
literal hex strings introduced are the Blood-Moon **sky-gradient stops** (a deliberate dark-red
atmospheric ramp, listed above) and `#0a0810` (`RAMP.void`, the outline). Their relation to the
base palette:

| Literal | Nearest ramp step | Use |
|---|---|---|
| `#0a0810` | `RAMP.void` | 1px outline on solid bodies |
| `#1a0610` / `#2a0810` | between `void` and `blood-dp` `#5f1212` | upper Blood-Moon sky |
| `#3b0d14` | between `blood-dp` and `void` | mid Blood-Moon sky |
| `#5f1212` | `RAMP.blood[3]` (blood-dp) | low sky |
| `#991b1b` | `RAMP.blood[2]` (blood-lo) | horizon glow |

Ramp usage by group:
- **Bogwretch** `water` + `grass` (slime) + `bone` (eyes) + `drift` (bile). **Barrow Wight / Bone
  Husk** `stone`/`bone` + `drift` (eyes/magic). **Ash Brute** `dirt`/`stone` + `ember`/`gold`
  (forge cracks). **Drift Wisp** `drift` (all steps).
- **Drowned King** `water` + `stone`(robe) + `bone`(barnacle) + `gold`(crown) + `grass`(kelp) +
  `drift`. **Barrow Lord** `bone` + `stone`(mantle) + `gold`(crown) + `drift`. **Ash Warlord**
  `dirt`/`stone`(plate) + `ember`(blade/cracks) + `gold`(trim) + `blood`(cloak) + `bone`(horns).
- **Driftwarden** `stone`/`dirt`/`grass`/`blood`/`drift`(cloak channel) + `dirt`(jerkin) +
  `drift`/`ember`/`gold`/`water`/`blood`(ward channel).
- **NPCs** `dirt`(leather) + `stone`(tunic/robe) + `bone`(skin/beard) + `gold`(coins/keys) +
  `grass`(scout cloak) + `drift`(hermit trinket).
- **Events** `drift` (rift, mote) + `dirt`/`ash` (rift apron) + `blood` (moon, aura, sky) +
  `drift` (moon vein, aura flecks).

## Build (regenerate any sprite)
Eval, in order: `pixlib.js → tiles.js → beasts.js` (+ `character.js` + `avatars.js` for the
avatar/keeper rig helpers `rig`/`drawFeet`/`drawSwingArm`), then the new generator
(`mobs.js` defines `DIRMAP` used by `minibosses.js`). Call each registry entry's draw fn across
facings × anims → `sheetSvg` (facings as rows), and write the matching `.json`. Portraits and
option-strips render from the s-facing idle frames.

## Files
`creatures-preview.html` — every asset on one board (an `@dsCard` in the **Creatures** group).
`_gen/*.js` — the deterministic generators (`mobs`, `mobfx`, `minibosses`, `driftwarden`,
`npcs`, `events`).
