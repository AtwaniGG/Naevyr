# Naevyr — GROWTH SET (Echoes · Streaks · Spectator)

Four new generators in the established Naevyr pixel pipeline: procedural rect-grid sprites built
with `assets/_gen/pixlib.js` helpers, exported to `assets/<category>/*.svg` + `*.json`. Locked
RAMP only (`stone/drift/ember/gold/blood/bone/grass/dirt/water`), 1px void `#0a0810` outline on
objects, **dither not blur**, `crispEdges`, bottom-center anchors. One preview HTML per set
(`@dsCard`-tagged, lives in `assets/`).

## 1 — Echo FX  ·  `_gen/echofx.js` → `assets/echofx/`
Drift-ghost overlays sized to the **32×40 wanderer rig** (feet row y=37, anchor **[16,37]**), so
they composite over a half-alpha wanderer to read as an *Echo* (a replayed past wanderer).
Alpha + dither, **no** void outline (drift FX are never outlined).

| asset | cell | frames | anim | use |
|---|---|---|---|---|
| `echo_veil` | 32×40 | 3 | shimmer @3fps loop | persistent ghost overlay — faint edge wisps + rising motes |
| `echo_fade` | 32×40 | 4 | materialize @8fps one-shot | spawn (play forward) / despawn (play reversed) puff |

`echo_veil.json` / `echo_fade.json` carry the anchor so they line up over the wanderer body.

## 2 — Streak Set  ·  `_gen/streak.js` → `assets/streak/`
Retention HUD art, DOM-rendered like the landing/brand set. Clean SVG sheets + `steps()`-friendly
JSON frame tables. Object glyphs get the 1px void outline.

| asset | cell | frames | notes |
|---|---|---|---|
| `streak_ember` | 24×24 | 4 (flicker @6fps) | small flame marking an active login streak (gold core → ember body) |
| `streak_pip` | 16×16 | 2 states (`unlit`/`lit`) | one gem pip; HUD tiles **7** into a 120×16 week meter (stride 17, pad 2) lighting 1..7 — see `meter` block in JSON |
| `milestone_seal_7` | 32×32 | 1 | gold wax medallion for the day-7 reward popup |
| `milestone_seal_30` | 32×32 | 1 | drift-purple wax medallion for the day-30 reward popup |

## 3 — PWA + Notification Icons  ·  `_gen/appicon.js` → `assets/appicon/`
Reuses the Naevyr/DRIFTS **emblem** (`fxlogo.js` `emblemGrid`). Art is authored on a small native
grid; each SVG carries that native viewBox sized to the exact target px, so PNG rasterization is
crisp and files stay tiny.

| asset | size | purpose |
|---|---|---|
| `app_icon_512` | 512×512 | `any` — full-bleed emblem on a dark drift-stone field |
| `app_icon_192` | 192×192 | `any` — home-screen / favicon |
| `app_icon_maskable_512` | 512×512 | `maskable` — emblem inside the Android safe-zone (≈57% of field) |
| `notif_badge` | 96×96 | monochrome flat white silhouette — Android status-bar badge (OS-tinted) |

`appicon/manifest.json` maps purpose (`any` / `maskable` / monochrome badge) — feeds
`public/manifest.json`. Rasterize the SVGs to PNG at the stated sizes if PNG is required.

## 4 — Spectator / Demo Set  ·  `_gen/spectate.js` → `assets/spectate/`
Read-only "watching the realm" chrome.

| asset | cell | frames | notes |
|---|---|---|---|
| `eye_icon` | 16×16 | 1 | open eye, drift iris — joins the **nav_icons** family (same 16×16 cell + style, tintable) |
| `watch_frame` | 480×270 | 2 (pulse @2fps loop) | drift-rune border + soft corner darkening; transparent center so the world reads through; overlay, no outline |
| `watch_plate` | 200×28 | 1 | "You are watching the realm" banner in the landing `wordmark_plate` style (bone bevel · gold rails · drift inlay) |

## Palette notes (no new ramp colors)
Everything is locked RAMP. Two non-ramp values, both intentional:
- `#2a2342` — a subtle **drift-stone** background lift behind the emblem on app icons (sits between `stone[2]` and `stone[3]`; derived, not a new accent).
- `#ffffff` — the **monochrome** notif badge silhouette only (Android tints it at runtime; it is not used as a palette color anywhere else).

## Layout
```
_gen/echofx.js  _gen/streak.js  _gen/appicon.js  _gen/spectate.js   ← generators (eval after pixlib/tiles/fxlogo)
echofx/   streak/   appicon/   spectate/                            ← per-category SVG + JSON exports
echofx-preview.html  streak-preview.html  appicon-preview.html  spectate-preview.html   ← @dsCard preview boards
```
All four generators eval after `pixlib.js` (+ `tiles.js` for `hash2`; `appicon.js` also needs
`fxlogo.js` for the emblem).
