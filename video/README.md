# Naevyr launch trailer (Remotion)

1920×1080 · 30fps · ~48s. Brand scenes use DS SVG exports + LIVE procedural
sprites from `game/render/sprites.ts`; the six middle beats are REAL gameplay
footage of the live game.

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

Scene order: cold open → wordmark → town walk → gathering → keeper interior →
combat → caravan → vista + Drift wash → prestige auras → the gate → PLAY NOW.
