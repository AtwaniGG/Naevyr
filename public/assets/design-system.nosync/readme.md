# Naevyr — Design System

A dark-fantasy, browser-based **isometric play-to-earn MMO**. A crumbling realm is being
devoured by **the Drift** — a creeping purple corruption that spreads across the land each
season and keeps the resource map alive and shifting. The core loop is OSRS-style: gather
(Woodcutting / Mining / Fishing), level skills, and survive the Drift.

This project is the **pixel-art design system** for the product: one cohesive pixel language
across the **logo**, the **HUD/UI overlay**, and the **isometric world art direction**. It is
the overlay/UI system plus the art-direction spec — it does **not** restyle the `<canvas>`
world (sprites are authored separately by the engine).

> **Aesthetic is non-negotiable pixel art:** hard edges, no anti-aliasing, 1 art-pixel = 1
> unit, nearest-neighbour scaling (`image-rendering: pixelated`). Depth comes from limited
> palettes + dithering, never soft blur.

---

## Sources

- **GitHub:** [`AtwaniGG/Driftlands`](https://github.com/AtwaniGG/Driftlands) — the live
  Next.js + HTML5-Canvas + React/Tailwind/Zustand/TypeScript build (the source repo predates the
  rename to **Naevyr**; update this link if/when the repo itself is renamed). At time of authoring the
  public repo contains the README/design brief; the engine constants, the locked `drift.*`
  Tailwind palette, and the HUD requirements below come from that brief. **Explore the repo**
  for the authoritative `tailwind.config.ts` token names and the `components/Hud` structure
  before building production UI.

> ⚠️ **The repo ships no fonts or sprite binaries.** Type uses open-license Google-Fonts
> substitutes (see *Fonts*), and the world art is authored **in this system** as rect-grid
> SVG pixel masters under `assets/` — rasterize 1:1 to PNG for the engine.

---

## How this system is organised

| Path | What |
|---|---|
| `styles.css` | Global entry — `@import`s only. Consumers link this one file. |
| `tokens/` | `colors.css` · `typography.css` · `spacing.css` · `effects.css` · `base.css` · `fonts.css` |
| `components/core/` | `Panel` · `Button` · `Badge` + `SeasonBadge` |
| `components/game/` | `Slot` · `Hotbar` · `XPBar` · `ActivityLog` |
| `components/icons/` | `Icon` — the pixel icon set (6 tools + resources + HUD) |
| `ui_kits/hud/` | The full in-game HUD overlay over a representative iso scene |
| `guidelines/` | Foundation specimen cards (colours, type, spacing, frame, logo) |
| `SKILL.md` | Agent-Skill manifest for reuse in Claude Code |

The Design System tab renders every `@dsCard`-tagged file. Components are consumed at
`window.DriftLandsDesignSystem_3de3e2.<Name>` after loading `_ds_bundle.js` (that `window.<…>`
symbol is the compiler-generated runtime namespace bound to the project ID — not the brand
name — so it stays literal even though the brand is now Naevyr).

---

# 1 · Logo / brand mark

A pixel/bitmap **NAEVYR** wordmark (Pixelify Sans) with the Drift corruption bleeding
**up** through the letters via a clipped bone→purple ramp, plus a square **emblem**: a stone
iso-tile cradling a glowing Drift mote. See `guidelines/logo.card.html`.

| Lockup | Use | Export size (transparent PNG) |
|---|---|---|
| Horizontal | Headers, loaders | 512×96 @1×, also @2×/@4× |
| Stacked / compact | Splash, square slots | 256×220 |
| Square icon | favicon / app / social — reads at 16/32/64 | 64×64, 32×32, 16×16 |
| Monochrome bone | Busy or light surfaces | matches the above |

Glow & veins are **dithered pixels**, never a soft blur. The emblem is true 16×16 pixel art →
scales by integer nearest-neighbour to any size.

---

# 2 · Art direction (one-pager)

> Moody, melancholic, **decaying beauty** — eroded ruins, ashen forests, cold moonlight, and
> bioluminescent purple corruption. The Drift's glowing veins and floating motes are the
> signature motif and recur in the logo, the UI accents, and the world. Everything is the same
> disciplined pixel language: hard edges, tight ramps, dithered glow. Not grimdark-edgelord,
> not cute/chibi — **quiet dread and faded grandeur.**

**Resolution scale.** Character ≈ **30px tall** at zoom 1.0 (≈ one tile-width). Ground tile =
**64×32** diamond. "Pixel density" is uniform: author every asset at 1× on the same grid as
the tiles so the logo, icons, tiles and character all share one pixel size.

**Do**
- Limit each material to a 3–4 step ramp; shade with the ramp, not new hues.
- Dither for gradients, water shimmer, and the corruption bloom.
- Keep a 1px near-black (`void`) outline on world objects so they read when overlapped.
- Cold moonlight key + warm ember/gold accents + the Drift's purple as the only "neon".

**Don't**
- No anti-aliased / soft edges, no Gaussian glow, no gradient-bake into sprites.
- No rounded corners in UI; use the corner **notch** instead.
- No full-screen opaque panels over the world; panels stay semi-transparent.
- Don't introduce hues outside the master palette.

**Touchstones:** *Hyper Light Drifter* (corruption palette, melancholy), *Eastward* (ashen
density, moody interiors), *Death's Door* (restrained dark fantasy), *Tunic* (clean iso
readability), classic *RuneScape* (the gather-loop HUD logic).

---

# 3 · Master palette

Locked base mirrors Tailwind `drift.*`; each material extends into a **light→shadow ramp** so
every sprite shades consistently. Total ≈ **48 hues**. Full tokens in `tokens/colors.css`;
specimens in `guidelines/colors-*.card.html`.

**Base (locked):** `void #0a0810` · `ash #171320` · `stone #2a2438` · `bone #d8cfe0` ·
`corrupt #a855f7` · `corruptDim #6b21a8` · `ember #f59e0b` · `blood #dc2626` · `moss #4d7c4d` ·
`gold #e7c873`.

**Ramps (hi → base → shadow → deep):**
- **Terrain / grass** `#7fae5e #4d7c4d #356037 #20402a`
- **Dirt / path** `#7a6048 #50402e #36291c #241a11`
- **Stone / ore body** `#4a4360 #322b46 #211c30 #14101e`
- **Water (moonlit)** `#4a7fa0 #2c5775 #173a52 #0d2336`
- **The Drift (glow)** core `#f3e8ff` → `#d8b4fe #a855f7 #6b21a8 #3b1162`
- **Ember** `#fcd34d #f59e0b #b45309 #7c3a06`
- **Gold / value** `#f6e0a6 #e7c873 #b8943f #7c5f23`
- **Blood** `#ef4444 #dc2626 #991b1b #5f1212`
- **Bone / text** `#efe9f4 #d8cfe0 #a99fb8 #6f6781`

**UI/text:** chrome neutrals `--ui-100…--ui-0`; HUD washes (`--ash-80` panel fill, `--void-82`
scrim) keep panels semi-transparent over the scene.

---

# 4 · Tileset (each 64×32 diamond)

Author the **top face** as a flat ramp-0 diamond + a 3px south "lip" in ramp-1 for depth +
a 1px `void` north edge. Corruption is a **separate overlay layer** (it spreads at runtime
over any tile) — never bake it into a base tile.

| Tile | Top face | Transition | Animated layer |
|---|---|---|---|
| **grass** | ramp-0 with sparse 1px ramp-2 speckle | 2px dither band into dirt/stone | — |
| **dirt** | ramp-0, occasional ramp-2 pebble | dither into grass | — |
| **stone** | ramp-0, 1px ramp-hi chip highlights | hard 1px void seam to grass | — |
| **water** | ramp-1 base | 2px foam dither at land edge | **shimmer: 4 frames**, ±1px ramp-hi specular drift |
| **corrupt (overlay)** | `corrupt-32` tint + 2px purple dither | radial dither falloff at spread edge | **pulse: 6 frames**, alpha 0.18→0.34 + motes |

Spread model (from the engine): depleted nodes re-form elsewhere; the corrupt overlay grows
from seed tiles each season. Drive the overlay alpha from a per-tile `driftLevel` 0–1.

---

# 5 · Resource nodes (sit on a tile, anchor **bottom-center**)

| Node | Skill | Size (w×h) | Anchor offset (from bottom-center) | Full → near-depleted |
|---|---|---|---|---|
| **Tree** | Woodcutting | 48×56 | (0, 0) feet at tile center | full canopy (3 greens) → thin canopy, bare branches, 1–2 leaf clusters |
| **Rock / ore vein** | Mining | 40×30 | (0, 0) | gold/ore flecks visible → cracked, flecks spent, rubble at base |
| **Fishing spot** | Fishing | 40×20 | (0, −2) floats on water | active ripple (**4 frames**) → faint single-ring ripple |

Each near-depleted state signals "almost gone" without a number. Keep the 1px `void` outline
so nodes read over busy ground.

---

# 6 · Character — hooded Drift-touched wanderer

≈ **30px tall**. Silhouette: a stooped, hooded cloak (stone ramp) with a void hood-shadow,
two **Drift-purple eye pixels**, and a corruption hem-glow at the feet. Read in the iso world:
distinct hood peak + cloak triangle, accent only at eyes + hem.

**Facing: 8-directional.** Iso needs more than 4 — diagonals (NE/SE/SW/NW) are the natural
walk directions on a 2:1 grid, and 8 keeps motion legible without doubling the art budget vs
a true 16-way set. Mirror E↔W and the diagonals, so you draw **5 unique facings** (S, SE, E,
NE, N) and flip.

**Sheet layout** (one PNG, transparent, grid of equal cells, e.g. 32×40 per cell):

| Anim | Frames / dir | Notes |
|---|---|---|
| idle | 2 | slow cloak sway + mote blink |
| walk | 6 | feet under tile center each frame |
| gather/swing | 4 | tool arcs; sync hit-feedback on frame 3 |

Grid: rows = facings (5), columns = frames; group by animation (idle block, walk block, swing
block). Atlas JSON gives each frame `{x,y,w,h}` + the bottom-center `anchor`.

---

# 7 · FX & atmosphere (cheap Canvas 2D)

- **Drift motes** — 2×2 `corrupt`/`drift-core` pixels drifting up; **additive** blend. ~1 in 4
  ambient particles.
- **Embers** — 1px `ember` rising near fires; additive, short life.
- **Falling ash** — 1px `bone-45` drifting down-left, slow, non-additive.
- **Gather progress ring** — pixel/stepped ring in `corrupt` over the node; fills over the
  action duration; on complete, pop + hit-flash (white frame, 1 tick).
- **Floating XP / loot** — pixel font (Silkscreen), `corrupt` for XP and `gold` for value,
  float up ~46px over ~1.1s with `steps()` easing then fade.
- **Lighting/fog** — global cold-moonlight multiply (cool blue-violet) + a soft `void` vignette
  + a faint top `corrupt` glow. Implemented in the overlay as a non-interactive scrim layer
  (see `ui_kits/hud/index.html` `#stage::after`), so it sits between world and HUD without
  touching sprite art.

---

# 8 · UI / HUD design system

React + Tailwind DOM overlay over the canvas. **Skin only** — no canvas restyle. Panels are
**semi-transparent** (`--ash-80`) with a **9-slice pixel frame**: 4px corner **notch**
(`--clip-notch`), a hard bevel (light top-left / dark bottom-right), a thin **corruption-purple
edge**, a hard drop shadow, and purple corner pips. No backdrop blur — it fights the grid.

### Full-screen wireframe

```
┌──────────────────────────────────────────────────────────────────┐
│ [S03 Ashfall · Drift 42%]                          ┌───Satchel───┐ │
│ [♥♥♥♥♡  ⛁ 1,284]                                   │ ▦▦▦▦         │ │
│                                                    │ ▦▦▦· (4×3)   │ │
│                                                    └──────────────┘ │
│                                                                    │
│                         ◉  ← gather ring + floating +128 XP        │
│                        (player, world canvas)                      │
│                                                                    │
│ ┌──── Gathering ────┐                            ┌──── Activity ──┐ │
│ │ ⛏ Woodcutting L42 │                            │ • +128 XP      │ │
│ │ ▰▰▰▰▰▰▱▱  6280/9k │                            │ • Ashen log x3 │ │
│ │ ⛏ Mining     L31  │                            │ • Drift crept… │ │
│ │ ⛏ Fishing    L28  │                            │ • …            │ │
│ └───────────────────┘                            └────────────────┘ │
│                       [ Gather ]                                    │
│                   ▣ ▣ ▣ ▣ ▣ ▣   ← hotbar (keys 1–6)                │
└──────────────────────────────────────────────────────────────────┘
```

### Components (reuse these — don't re-implement)
`Panel` · `Button` (primary/gold/ghost/danger) · `Badge` + `SeasonBadge` · `Slot` (rarity,
count, keybind, Drift selection glow) · `Hotbar` (6 slots) · `XPBar` (per-skill tint) ·
`ActivityLog` (xp/loot/info/warning/danger/drift) · `Icon`. Cards: `components/*/​*.card.html`.
Live composition: `ui_kits/hud/`.

### Fonts (Google Fonts / open-license — **substitution flagged**)
- **Pixelify Sans** — pixel/bitmap display → wordmark + headings (`--font-display`).
- **Silkscreen** — crisp 5px bitmap → micro-labels, keybind caps, badge (`--font-pixel`).
- **Sora** — clean readable sans → UI numbers, XP counts, log body (`--font-ui`).

Loaded via Google Fonts CDN in `tokens/fonts.css` (not self-hosted). Ask and we'll vendor the
`.woff2` into `assets/fonts/` and rewrite the `@font-face` rules.

---

# 9 · Handoff

### Folder convention (`public/assets/`)
```
public/assets/
  tiles/        grass.png dirt.png stone.png water.png         (+ water.json shimmer frames)
  overlays/     corrupt.png  corrupt.json                      (pulse frames, separate layer)
  nodes/        tree.png tree.json  rock.png rock.json  fish.png fish.json   (full + depleted)
  character/    wanderer.png wanderer.json                     (8-dir sheet + anchors)
  fx/           motes.png embers.png ash.png ring.png
  ui/           frame9.png  icons/*.png                        (9-slice + pixel icons)
  brand/        logo-horizontal.png logo-stacked.png icon-{16,32,64}.png logo-mono.png
  fonts/        (optional self-hosted .woff2)
```
**Naming:** `kebab-case`, state suffix `-full` / `-depleted`, facing suffix `-s/-se/-e/-ne/-n`,
frame index `_00`. Atlas filename mirrors the sheet (`tree.png` → `tree.json`).

### Atlas JSON schema
```jsonc
{
  "image": "nodes/tree.png",
  "tile": { "w": 64, "h": 32 },          // world diamond reference
  "frames": {
    "tree-full": {
      "x": 0, "y": 0, "w": 48, "h": 56,
      "anchor": { "x": 24, "y": 56 },    // bottom-center, in frame px
      "states": ["full"]
    },
    "tree-depleted": { "x": 48, "y": 0, "w": 48, "h": 56, "anchor": { "x": 24, "y": 56 } }
  },
  "animations": {                         // optional, for sheets
    "walk-s": { "frames": ["walk-s_00","walk-s_01", "…"], "fps": 8, "loop": true }
  }
}
```

### Generation prompts (alternates — SVG masters for all of these now ship in `assets/`)
Use a pixel-art image model, **transparent background, no anti-aliasing, limited palette**,
authored at 1× on the 64×32 iso grid:

- **Tree (woodcutting node):** *"isometric 2:1 pixel-art dead/ashen oak tree, 48×56px,
  bottom-center anchored, dark-fantasy, 3-step green canopy (#7fae5e/#4d7c4d/#356037), brown
  trunk, 1px near-black outline, transparent background, no anti-aliasing, limited palette."*
- **Ore vein (mining node):** *"isometric pixel-art rock with glowing gold ore flecks, 40×30px,
  stone ramp #4a4360/#322b46/#211c30, gold fleck #e7c873, 1px outline, transparent, no AA."*
- **Hooded wanderer (character):** *"isometric 2:1 pixel-art hooded cloaked wanderer, ~30px
  tall, stone-grey cloak, void hood shadow, two glowing purple #a855f7 eye pixels, purple
  corruption hem-glow, 8-direction turnaround sheet, transparent background, no anti-aliasing,
  limited palette."*
- **Corruption overlay tile:** *"isometric 64×32 diamond corruption overlay, purple #a855f7
  dithered bloom with floating motes, semi-transparent, tileable, no anti-aliasing."*

---

# Content fundamentals — how Naevyr writes

The voice is **terse, melancholic, and diegetic** — the world narrating itself, not a UI
talking to a user. It treats the player as a wary traveller in a dying realm.

- **Person & address.** Second person, sparing. Log lines are often impersonal/world-first:
  *"The Drift crept into Hollowmere."* · *"A rock vein re-formed nearby."* Player actions read
  as quiet statements: *"You fell the ashen oak."*
- **Casing.** Titles & labels in HUD chrome are **UPPERCASE** pixel labels (`INVENTORY`,
  `ACTIVITY`, `XP TO NEXT`). Proper nouns and body sentences use normal Title/sentence case.
  Seasons are named (*Ashfall*, *Hollowmere*, *the Drift*) — evocative, place-like.
- **Tone.** Decaying beauty over edginess. *"faded grandeur"*, *"the node will re-form
  elsewhere by nightfall"* — loss framed as natural cycle, not gore. Never jokey, never
  cutesy, never hype-y. No exclamation spam.
- **Numbers.** Concrete and tabular: `+128 XP`, `Lv 42`, `6,280 / 9,000`, `x3`, `Drift 42%`.
  Values feel like resources, not score.
- **Emoji:** **never.** The brand's "emoji" are its **pixel icons** (axe, ore, drift mote).
- **Micro-copy examples.** Buttons are verbs: *Gather · Claim · Track node · Drop · Destroy.*
  Empty states stay in-world: *"Your satchel is light."* Warnings are quiet: *"Corruption
  damages you."*

---

# Visual foundations

**Palette & vibe.** Cold, low-key, desaturated base (void/ash/stone) so the few saturated
accents — Drift purple, ember, gold — carry all the energy. Imagery reads **cool & moonlit**
with a single bioluminescent purple "neon". No warm photographic look; everything is night.

**Type.** Pixel/bitmap display (Pixelify Sans) + crisp pixel labels (Silkscreen) + a clean
sans for numbers (Sora). Headings get the bone→corrupt bleed on the wordmark only; elsewhere
pixel type stays single-colour for legibility.

**Spacing & layout.** 8px grid; dense game UI lands mostly on 8/12px. HUD is **edge-anchored**
(16px safe inset) and **corner-clustered** — vitals + season top-left, satchel top-right,
skills bottom-left, log bottom-right, hotbar bottom-center. Nothing floats mid-screen except
transient world feedback (gather ring, floating numbers).

**Backgrounds.** The world is the background — a busy moving iso canvas. Over it the UI uses
**semi-transparent** panels + a global cold-moonlight/vignette scrim, never a full opaque
sheet. Decorative fills are **dithered**, not gradient-blurred. A faint corruption dither
bleeds from each panel's top-right corner.

**Borders, bevels & shadows.** No `border-radius` — **corner notches** (4px) instead. Depth is
**hard**: 1px bevel lines (light TL / dark BR), inset wells for slots/bars, and **hard offset
drop shadows** (`3px 3px 0`). The signature panel edge is a 1px **corruption-purple** line.

**The Drift glow.** Built from **stepped, zero-blur spread rings** (`0 0 0 Npx`) so it reads as
pixels, not a gaussian haze — used for selection, focus, active corruption, and the season
mote. Reserve it; over-use kills its menace.

**Corner radii / cards.** "Cards" = the pixel `Panel`: notched corners, semi-transparent fill,
purple edge + bevel + hard drop. Slots/wells are inset (dark TL bevel). Buttons are notched
chips with a 3px bottom shadow that collapses on `:active`.

**Animation.** Snappy and **stepped** (`steps()`), not smooth-eased — pixel UIs move in
discrete frames. Durations: 90/150/300ms; the ambient Drift pulse is a slow 2s 6-step loop.
**Hover** = brighten ~4% / show the lighter variant. **Press** = translate **down 2px** +
collapse the drop shadow (physical button feel), never a colour-only change. Respect
`prefers-reduced-motion` (ambient loops gated).

**Transparency & blur.** Transparency: **yes** (panels, washes, scrims). Blur: **no** —
explicitly avoided so it never fights the pixel grid.

---

# Iconography

**Approach: a single hand-built pixel icon family**, authored on a **16×16 grid** with a 1px
`void` outline + a 2–3 step shade ramp per material — the *same* pixel language as the tiles,
nodes, and logo. Rendered as crisp `<rect>`-grid SVG (`shape-rendering: crispEdges`,
`image-rendering: pixelated`) so they scale by integer nearest-neighbour and can also be
exported as PNG. See `components/icons/Icon.jsx` and `components/icons/icons.card.html`.

- **The 6 tools (required set):** `axe` · `pickaxe` · `rod` · `sword` · `ward` · `sigil`.
- **Resources:** `log` · `ore` · `fish` · `coin` · `drift` (the signature mote).
- **HUD glyphs:** `heart` · `leaf` · `bag` · `bolt` · `chevronRight` · `x`.

**No icon font, no emoji, no Unicode glyphs as icons** — the pixel set is the only icon system,
which keeps the HUD cohesive with the world. Usage: `<Icon name="axe" size={32} />`; `glow`
adds the Drift drop-shadow; icons inherit the palette ramp baked into each grid.

> If you need a vector/line icon outside this set, author it on the 16-grid first — don't drop
> in a smooth icon-library glyph; it will read as foreign against the pixel world.

---

## Index / manifest

- **`styles.css`** — link this; it `@import`s all of `tokens/`.
- **`tokens/`** — `colors.css` (palette + ramps + aliases), `typography.css`, `spacing.css`
  (+ iso constants), `effects.css` (bevels, glow, notch, dither, motion), `base.css`
  (`.drift-panel`, `.drift-pixel-btn`, helpers), `fonts.css`.
- **`components/`** — `core/` (Panel, Button, Badge, SeasonBadge), `game/` (Slot, Hotbar,
  XPBar, ActivityLog), `icons/` (Icon). Each has `.d.ts`, `.prompt.md`, and a `.card.html`.
- **`ui_kits/hud/`** — `index.html` (mount) · `Scene.jsx` (iso backdrop) · `Hud.jsx` (overlay).
- **`guidelines/`** — foundation cards: colours (base / ramps / overlay), type (display /
  pixel-label / ui / scale), spacing (scale / HUD geometry), brand (logo / frame / bevel-glow).
- **`assets/`** — **the shipped world art** (rect-grid SVG pixel sprites + atlas JSON, ready to
  rasterize 1:1 to PNG):
  - `world/` — `grass` `dirt` `stone` (base + transition variants), `water` (4 shimmer frames
    + foam), `corrupt-overlay` (6 pulse frames, the only alpha sprite). Tiles are 64×35
    (32px face + 3px lip); anchor = diamond center (32,16).
  - `nodes/` — `tree` 48×56, `rock` 40×30 (full + depleted), `fish` 40×20 (4 ripple frames +
    depleted). Bottom-center anchors in each `.json`.
  - `character/` — `wanderer.svg` 384×200 (5 facings × idle 2 / walk 6 / gather 4, 32×40
    cells, anchor 16,39) + `wanderer.json` (frames + animations, fps 2/8/10).
  - `fx/` — `motes` `embers` `ash` `ring` (8-step gather progress).
  - `beasts/` — **the creature set** (rect-grid SVG sheets + atlas JSON): `husk` 32×32,
    `stalker` 36×40, `colossus` 64×64, `raider` 32×40. Each sheet is rows = 5 facings
    (s/se/e/ne/n; engine mirrors w/sw/nw) × the anim frames; atlas gives per-frame rect +
    bottom-center anchor + named animations w/ fps + loop. Every cell reserves its **top 4px**
    for engine HP-bar / level-tag clearance, and each atlas carries a `hurtFlash` ramp
    (husk→drift-hi, stalker/raider→blood-hi, colossus→bone-hi then drift-hi).
  - `brand/` — `logo-horizontal` 512×96, `logo-stacked` 256×220, `emblem-16/32/64`, each with
    a `-mono` bone variant.
  - `town/` — **the Waystation set** (rect-grid SVG + atlas JSON): `dyeworks` `vault` `casino`
    `tavern` `furnisher` `menagerie` (144×152 houses, bottom-center anchor 72,151), `shrine`
    112×128 (3 pale-flame flicker frames), `pit` 240×120 (flat arena, center anchor,
    `drawUnderEntities`). Iso 2:1, 3×3-tile footprint, top 6px reserved for the name label;
    each house has a south door, a warm lit window, and a purpose sign/feature. The **mine**
    (`interiors/mine.svg`, 144×120) joins this set as a 9th overworld structure.
  - `interiors/` — **building interiors** (rect-grid SVG + atlas JSON): floor tiles
    `floor_wood/stone/cave` (64×36, 3 seed variants each); wall segments (64×56, NW lit / NE
    shadowed) in timber / stone-block / cave, with plain / window / banner (block&timber) and
    plain / seam / lantern (cave) variants; fixtures `counter` `shelf` `table` `barrel` `cage`
    `anvil` `wheel_stand` `ore_cart`, plus `vat` (6 liquid variants), `hearth` (3 flame frames,
    4fps), `gold_vein` (rich 2-frame sparkle + spent), `rug` (accent-colorable, under-entities),
    and `mine` (the overworld structure). Bottom-center anchors + animation tables in each JSON.
    > ⚠️ The flat `wall_*` segments here are **superseded by `walls/wall2_*`** (corrected iso
    > geometry) — kept only for back-compat; use `wall2_*` for new rooms.
  - `walls/` — **corrected iso wall set** (`wall2_*`): skewed parallelogram faces on the 2:1
    slope (32×72 cell, bottom drops 16, face 48, +6 cap) that **tile seamlessly** along the
    diagonal (place adjacent at +32x,±16y). `ne` falls / shadowed, `nw` rises / moonlit, in
    timber / block / cave; feature variants window (lit), banner (accent-colorable, shadow),
    cave seam & lantern; plus 16×72 `_corner` wedges per material. Each JSON carries exact
    corner coords, the anchor (bottom-left), and the tiling step.
  - `wilds/` — **The Wilds pack** (rect-grid SVG + atlas JSON): structures `husk_den` 120×88
    (2-frame burrow-eye glow), `ash_obelisk` 64×112 (3-frame rune pulse), `mirewife_hut`
    120×116 (stilts over bog); doodads `reed_clump` `dead_tree` `bone_spike` (2 variants each)
    and `mire_bubble` (2-frame); Mirewife interior `herb_rack` + `wall_timber_charms`; and
    `lost_tombstone` (default + sunken lore-grave states). Same conventions, 3×3 footprints for
    the structures.
  - `landing/` — **landing-page art pack** (rect-grid SVG + atlas JSON): `hero_vista` 480×270
    (2-frame backdrop scene — Waystation at dusk, warm windows, shrine flame, corruption from
    both edges; center third kept calm/dark for overlaid UI), `nav_icons` 16×16 sheet (gauge,
    scroll, banner, book, trophy, ledger, discord, telegram, x_bird — single-ramp tintable),
    `gate_door` 96×128 (3 frames: shut → runes pulsing → opening glow; the token-gate visual),
    `wordmark_plate` 320×96 (2-frame inlay pulse — bone-and-gold frame with drift inlay to sit
    behind the NAEVYR wordmark).
  - `social/` — **social / launch pack** (PNG, nearest-neighbor upscaled, opaque sRGB) for the
    **$DRIFTS** coin: `pfp_coin.png` 1024×1024 (pump.fun coin — the warded gate rune struck in
    gold over a drift field with the **$DRIFTS** ticker on the lower face, 128px grid ×8),
    `pfp_coin_clean.png` (same, no ticker), `pfp_x.png` 800×800 (X avatar, sigil only so it
    reads at tiny sizes, meaning inside the inner 80% circular-crop safe zone, 100px grid ×8),
    `banner_x.png` 1500×500 (X banner — night vista, moon, Waystation rooftops, corruption from
    both edges, wordmark plate + tagline "THE DRIFT TAKES THE REALM" + the **$DRIFTS** ticker;
    lower-left 400×200 kept clear for the profile photo, text above the bottom 15%). Each ships
    a `*-2x-native.png` archive at 2× the native grid. **`banner_pumpfun.png`** 1500×500 is the
    pump.fun coin-page banner (3:1, ≤4.3MB) — same scene with the wordmark **dead-centered**
    (the coin page has no profile-photo overlap, unlike X).
  - `threshold/` — **"The Threshold" tutorial micro-set** (rect-grid SVG + atlas JSON):
    `gate` 96×128 (exit structure — sealed + open states, 3 rune-pulse frames each @4fps,
    triangle-in-circle keystone sigil), `gatewarden` 32×40 (bone-robed keeper on the wanderer
    rig — 5 facings, idle 2f, gold eye-glows + staff with a bobbing drift mote), `beacon` 64×64
    (objective marker — rune tile + rising gold light, 3f rise/peak/fall) and `arrow_pip` 16×16
    (2f bob), `drift_wall` 64×96 (advancing corruption front — 3f boil, **seam-continuous**
    left/right so it tiles along iso rows), `ground` 64×36 (2 cracked pale-flagstone path
    accents with gold rune fragments, drawn under entities over grass).
  - `auras/` — **prestige auras** (premium orbiting-mote cosmetics; rect-grid SVG strips +
    atlas JSON, frames emitted left-to-right with per-frame x offsets). Each is a 64×64 canvas
    that surrounds the 32×40 wanderer; the aura's bottom-center FEET anchor (32,56) aligns to
    the wanderer's bottom-center anchor (16,39). Loops bake per-frame; draw back motes behind
    the figure, front motes over it:
    - `ashen_crown` — **gold + bone + ash** — slow ring of drifting ash flecks under a curved
      gold tiara arc crowning the head (8f @6fps).
    - `corruption_halo` — **drift** — pulsing violet ring with motes spiraling into a small
      Drift-core at the chest (6f @8fps).
    - `ember_cinder` — **ember + blood** — sparks rising from the feet, swirling up and cooling
      to blood-ash (6f @8fps).
    - `bonewisp` — **bone** — pale skeletal wisps orbiting low around the feet, with cold drift
      glints; eerie (8f @6fps).
  - `battlepass/` — **Battle Pass "Ashfall" (Season 1)** — ornate, gilded-but-corrupted,
    season-exclusive cosmetics (rect-grid SVG + atlas JSON; gold recovered from decay, never
    shiny). Ramps per asset:
    - `tarnished_chalice` — **gold + drift** — a 64×64 prestige aura (auras.js conventions, anchor
      32,56 → wanderer 16,39): a small generic two-handled trophy cup hovering above the head,
      gilded but rim-rot with the Drift creeping in; its detached lid orbits the head while gilded
      motes rise from the feet (3f @4fps, `orbit`).
    - `ashfall_dye` — **stone(base) + gold(trim) + drift(corrupt)** — a wanderer cloak colorway
      delivered through the **existing dye-channel ramp swap** (same locked-ramp channels +
      resolve as `avatars.js`; baked at draw time, drop-in on the 32×40 rig — no new rig): ash-grey
      base, banded gold trim (collar + two hem bands), faint drift-purple corruption up the hem.
      Full sheet — 5 facings × idle 2f / walk 6f / swing 4f, anchor 16,39.
    - `pass_emblem` (+ `-mono`) — **gold(chalice + trim) + bone(parchment) + drift(flecks)**; mono =
      bone only — a 32×32 "seasonal ledger" sigil: a gilded two-handled chalice mark over a furled
      parchment banner with drift-corruption flecks. For panel headers / docs (not the in-HUD
      16×16 button).
  - `world-art-preview.html` — every tile/node/character/FX/brand asset at 1× and 4×.
  - `creatures-preview.html` — every creature, facing & animation cycling live.
  - `town-preview.html` — all eight structures with anchor pins & label-clearance guides.
  - `interiors-preview.html` — floors, walls, fixtures & the mine with label-clearance guides.
  - `walls-preview.html` — corrected iso walls (`wall2_*`) tiled 4-in-a-row to prove seams.
  - `wilds-preview.html` — wild structures, doodads, interior additions & lore graves.
  - `landing-preview.html` — hero composition (vista + plate + nav + buttons), icons, gate.
  - `social-preview.html` — coin/avatar marks, banner & an X-profile mock with safe-zone notes.
  - `threshold-preview.html` — gate (sealed/open), gatewarden facings, beacon, drift-wall tiling & path accents, all cycling live.
  - `systems-preview.html` — wheel faces (with segment angles), guild banner sway + fallen, drift cache states, the Exchange counter.
  - `avatars-preview.html` — the four premium avatars animating (idle/walk/swing) beside the wanderer for scale, with channel swatches & shop portraits.
  - `mirror-preview.html` — the Drift Mirror rippling beside the hearth for scale.
  - `arena-preview.html` — composed Pit scene + catalog: floors, ring/gate tiling, torch, watchers, victory plate, blood decals.
  - `auras-preview.html` — the four prestige auras animating over the wanderer (back/front motes).
  - `battlepass-preview.html` — Battle Pass "Ashfall": the tarnished_chalice aura over the wanderer, the ashfall_dye colorway (default vs dyed walk + facings) with channel swatches, and the pass_emblem sigil (color + mono, 1×/2×/5×).
  - `avatars/` — **four premium playable avatars** (DRIFTS cosmetics, drop-in on the wanderer
    rig: 32×40, 5 facings, idle 2f/walk 6f/swing 4f, identical swing pivot/arc + hit-spark, so
    baked gear overlays still line up). `ashbound` (burned penitent — ember seams, chest straps,
    topknot), `mireborn` (bog seer — reed shawl, belt lantern, root-staff), `bonecaller` (skull-
    mask priest — hanging-bone mantle, bandage arms), `veilborn` (weightless — floating veil,
    drift-mote feet, afterimage). Each has two ramp-swap cosmetic channels (5 locked-ramp
    options each, baked at draw time — `look {a,b}`), a `<kind>_<channel>_options.svg` proof
    strip per channel, and a `portrait_<kind>` 48×64 shop bust (2f idle). Ramps per kind in JSON.
  - `wheel/` — **spin-wheel faces** (DOM HUD art, 240×240, 2-frame rim shimmer @2fps):
    `wheel_of_the_drift` (gold, 6 segments — house/coin_poor/coin_rich/jackpot/drift_shard/coin_mid)
    and `the_drift_wheel` (dark gacha, 8 segments incl. a searing relic sliver). Each JSON lists
    every segment's `startAngle` (deg, 0 = up, clockwise) so the HUD can land its pointer.
    Ramps: gold+stone+drift / stone+drift+gold.
  - `guild/` — **guild war-banner** (48×96, bottom-center anchor 24,95): `guild_banner` (bone
    cloth, drift trim, 3-frame sway @3fps, with a blank `labelPlate` rect for the engine's tag
    text) and `guild_banner_fallen` (1f, tattered/corruption-eaten). Ramp: bone+dirt+drift.
  - `cache/` — **drift_cache** (64×64, anchor 32,58): one sheet, 3 states — `sealed` (1f),
    `opening` (2f, lid cracking with violet light), `burst` (2f, light column + motes); JSON
    `states` table gives each state's start frame + fps. Ramp: iron(stone)+drift+gold.
  - `interiors/exchange_counter` — **the Exchange** (48×48, anchor 24,47): brass balance scales,
    gold pan vs violet-glow DRIFTS pan, 2-frame tip-totter @2fps. Ramp: gold(brass)+drift+dirt.
  - `interiors/mirror` — **the Drift Mirror** (32×48, anchor 16,47): tall bone-and-iron standing
    mirror whose glass is NOT reflective — it swirls dark with drift motes (2-frame ripple @2fps),
    a faint figure hint deep inside. Stands in the Dyeworks for premium-avatar try-on. Ramp:
    drift(glass) + bone/stone(frame).
  - `arena/` — **the Arena Set ("The Pit")** — a torch-lit duel ring floating in the Drift's
    void. `arena_floor` (64×32 blood-sand, variants a/b/c + blood-flecked), `arena_ring`
    (modular palisade ne/nw ×2 variants — blackstone kerb, bone-capped posts, iron-chain swag;
    tiles +32x,±16y with NO side seam), `arena_gate` (ne/nw, raised iron portcullis), `arena_torch`
    (32×64 brazier, 3-frame flame @4fps, the only light), `watcher_{bone,blood,void}` (32×40
    wanderer-rig spectators, idle + cheer 2f each, ember eyes), `victory_plate` (96×48, crossed
    gold blades + finger-bone laurel on void, 2-frame shimmer), `blood_fx` (48×24 ground decals
    ×3). All inside the locked RAMP — no palette seam beside the town.
  - `_gen/` — the deterministic generators (`pixlib.js`, `tiles.js`, `nodes.js`,
    `character.js`, `avatars.js`, `beasts.js`, `town.js`, `interiors.js`, `walls.js`, `wilds.js`,
    `landing.js`, `social.js`, `threshold.js`, `auras.js`, `battlepass.js`, `wheelfaces.js`, `guildbanner.js`,
    `cache.js`, `exchange.js`, `arena.js`, `fxlogo.js`) + `sheet_*.png` preview rasters; re-run to regenerate any sprite.
- **`SKILL.md`** — Agent-Skill manifest.

**Starting points:** `Button`, `Panel`, `XPBar` (components) and the HUD screen.

