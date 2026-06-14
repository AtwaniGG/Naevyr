# Naevyr launch trailer (Remotion)

1920×1080 · 30fps · ~48s. Brand scenes use DS SVG exports + LIVE procedural
sprites from `game/render/sprites.ts`; the six middle beats are REAL gameplay
footage of the live game.

## Social clip set (10 short Twitter clips, all 1920×1080)

A second family of clips built to be CROWDED (lots of wanderers — a hard rule)
and fully RENDERED from the real game art, so they need no live server:

- `WheelClip` (`naevyr-wheel.mp4`) — both wheels: a real captured gold-wheel
  spin + the rendered Drift Wheel landing on the 1% relic + the full Drift
  Wheel prize pool with odds.
- `CosmeticsClip` (`naevyr-cosmetics.mp4`) — the 4 premium characters, cloak
  dyes + eye-glows, the Drift-touched auras, companion pets.
- `BattlePassClip` (`naevyr-battlepass.mp4`) — "The Drift Ledger" S1 Ashfall:
  emblem, the 50-tier two-track ladder, milestone rewards, the Tier-50
  Tarnished Chalice. (DS art copied from the `battlepass` branch into
  `public/assets/battlepass/`.)
- `Building-<X>` (`naevyr-<x>.mp4`) — one per building: START in the crowded
  realm → walk IN → DO the thing inside → see what you get. Dyeworks, Vault,
  Lantern, Furnisher, Menagerie, Mine, Mirewife.

The engine kit reuses the game's `SpriteCache` + iso projection straight onto a
`<canvas>` (`src/engine.tsx`): pixel-identical tiles/wanderers/keepers/buildings/
interior fixtures, plus a deterministic crowd generator (`makeCrowd`). Reusable
scenes (`src/scenes.tsx`): `RealmCanvas` (crowded overworld), `RoomCanvas` (a
faithful port of the engine's `drawInterior`), `ShowcaseCanvas` (item parade),
and the DOM overlays (`Caption`/`TitlePlate`/`PlayNow`). Building configs live in
`src/BuildingClip.tsx` (`BUILDINGS`); add a building by adding one entry.

```bash
bash scripts/render-all.sh            # render all 10 social clips -> out/
npx remotion render WheelClip out/naevyr-wheel.mp4   # one clip
npx remotion still Building-Mine out/f.png --frame=160
```

GOTCHA: configs that hold React elements (goods/captions) must NOT ride
`defaultProps` (Remotion JSON-serializes them → React error #31). Pass an `id`
and look the config up inside the component. The `<canvas>` is `position:
absolute` so opaque scene backdrops layer behind it in DOM order.

```bash
cd video
npm install            # first time only
npm run studio         # live preview + timeline scrubbing (localhost:3000)
npm run render         # -> out/naevyr-launch.mp4
npx remotion still NaevyrLaunch out/frame.png --frame=N   # single frame
```

## Capturing fresh gameplay footage

`scripts/capture.mjs` (full tour) and `scripts/capture-combat.mjs` (one beast
kill) drive the REAL game in headless Chromium with real canvas clicks and
record webm to `public/gameplay/`. They need `npm run dev` (port 3000) and
`npm run server` (port 2567) running. The `?demo=1` query arms a read-only
coordinate bridge in the engine (`window.__demo` in game.ts) — positions out,
clicks in; nothing in the sim behaves differently. Each script prints `MARK
<seconds> <beat>` timestamps; footage time ≈ mark + ~3s (the recording starts
at page open). Update the `fromSec` props in `src/Trailer.tsx` to re-cut.

## Tweaking

- **Timing:** the scene cut list lives at the top of `src/Trailer.tsx`
  (`CUTS`, in frames @30fps). Change a number, everything re-flows.
- **Copy:** scene `<Line>` children and GameplayScene `caption` props.
- **Music:** an original dark-fantasy score (license-free, synthesized in
  `scripts/score.mjs`) lives at `public/music.mp3` and is wired via `<Audio>`
  in `Trailer.tsx`, scored to the cut points (impacts on the wordmark/combat/
  CTA, a war-horn into the gate). Regenerate after re-timing scenes:
  `node scripts/score.mjs && ffmpeg -y -i public/music.wav -af
  "aecho=0.8:0.85:60|140:0.25|0.18,loudnorm=I=-15:TP=-1.5" -b:a 192k
  public/music.mp3 && rm public/music.wav`. Edit the `chords`/`impact`/`horn`
  timings in score.mjs to re-sync.
- **New scenes:** any sprites.ts generator can be drawn via `<PixelSprite>`
  (grids render as crisp SVG rects); any DS frame-sheet SVG animates via
  `<FrameSheet>`; gameplay clips ride `<GameplayScene src fromSec caption>`.

Scene order: cold open → wordmark → town walk → gathering → combat → keeper →
vista + Drift wash → **Drift Wheel** (spins onto the 1% relic) → **guilds**
(banner) → **the Exchange** (scales) → prestige auras → the gate → PLAY NOW.
The economy scenes (E1-E3) are NOT gameplay capture — those features need a
wallet, so they're drawn live from the procedural sprites (drawDarkWheelFace /
drawGuildBanner / drawExchangeCounter), same as the prestige auras. The score
(scripts/score.mjs) is re-timed to the ~58s cut; re-run it after any retiming.
