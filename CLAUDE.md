# Driftlands — CLAUDE.md

Browser-based isometric play-to-earn MMO ("Kintara-inspired, not a clone"). Dark-fantasy
pixel art. A creeping corruption ("the Drift") relocates resource nodes and eats the map
each season. Real Solana token planned via pump.fun — **devnet first, mainnet only on
explicit go-ahead**. Owner: solo dev, ships fast, wants features verified before claimed done.

## Run / verify

```bash
npm run dev                # Next.js client, localhost:3000 (works offline-solo)
npm run server             # Colyseus game server + embedded Postgres, ws://localhost:2567
npm run build              # must stay green
npx tsc --noEmit                                   # client typecheck
cd server && npx tsc --noEmit -p tsconfig.json     # server typecheck

# Verification scripts (server must be running; all must pass before claiming done):
./server/node_modules/.bin/tsx scripts/smoke-sprites.ts        # all procedural sprites generate
./server/node_modules/.bin/tsx scripts/verify-multiplayer.ts   # 2-client move/gather/chat/cosmetics sync
./server/node_modules/.bin/tsx scripts/verify-persistence.ts   # progress/identity/position survive reconnect
./server/node_modules/.bin/tsx scripts/verify-claims.ts        # land claims stake/reject/cap/persist
./server/node_modules/.bin/tsx scripts/verify-market.ts        # list/buy/escrow/withdraw
./server/node_modules/.bin/tsx scripts/verify-town.ts          # vault/wheel/shrine/props/duels
./server/node_modules/.bin/tsx scripts/verify-caravan.ts       # SELF-HOSTED: boots its own server (port 2599, fast timers), full escort run
```

**The workflow rule:** after any change — typecheck both sides, build, run the relevant
verify scripts. Extend the verify scripts when adding server features. Don't claim
something works without running these.

## Architecture

- **Client:** Next.js App Router + HTML5 Canvas world + React DOM HUD. Zustand store
  (`game/state/store.ts`) holds HUD-facing state; the `Game` class
  (`game/engine/game.ts`, ~2k lines) owns the per-frame simulation/render.
- **Server:** `server/` — Colyseus 0.16 authoritative server. Owns: world map, the Drift
  (node relocation + corruption seasons + driftfall events), player movement (A* +
  20Hz walk), gather timers, claims, marketplace, vault, wheel, shrine, duels.
  Reuses `game/world/*` + `game/types.ts` via tsconfig path alias `@/*` → repo root.
  **`useDefineForClassFields: false` is required** in server/tsconfig (Colyseus schema
  decorators break under ES2022 field semantics).
- **DB:** Drizzle ORM. Local dev = **PGlite** (embedded Postgres, `server/.data/`,
  gitignored). Production = set `DATABASE_URL` (Neon planned) — config-only swap.
  Schema in `server/src/db/schema.ts`; bootstrap is `CREATE TABLE IF NOT EXISTS` +
  `ALTER ... ADD COLUMN IF NOT EXISTS` on boot (no drizzle-kit migrations yet).
- **Identity:** guest device token (uuid in localStorage, `getDeviceToken()`), validated
  in `onAuth`. `players.wallet_address` column exists, NULL until Phase 5 wallet link.
- **Sync model:** clients send intents (`move`, `gather`, `chat`, `claim`, `buy`,
  `bank`, `spin`, `donate`, `placeProp`, `challenge`/`acceptDuel`/`duelHit`, `save`,
  `identity`); server validates + broadcasts. Client **polls schema state each frame**
  (no per-property callbacks — deliberate, avoids colyseus.js callback API churn).
  Inventory/XP/quests/combat-vs-mobs are still **client-side and trusted** (anti-cheat
  is Phase 6). Progress snapshot pushed to server every 8s (`buildSnapshot()` in
  `game/state/persistence.ts`), localStorage is the offline fallback.
- **Offline mode:** no server → full local sim keeps working (claims/market/town
  server-features show "needs shared world" notes). Never break this.
- **HUD ↔ engine bridge:** typed event bus `game/state/bus.ts` (chat, emote, stake,
  market*, bank, spin, donate, placeProp, challenge, duelAccept).

## Art system (important)

All art is **procedural rect-grid pixel generation in code** — no image files at
runtime. The art SOURCE OF TRUTH is the Claude Design packages the user drops as a zip
named `DriftLands Design System.zip` into `public/assets/`, extracted to
`public/assets/design-system/`. Key contents:
- `assets/_gen/*.js` — the pixel **generators** (pixlib.js helpers + tiles.js,
  nodes.js, character.js, beasts.js…). These are the files you PORT to TypeScript in
  `game/render/sprites.ts` (faithful translation, then cache via `SpriteCache`).
- `assets/<category>/*.svg + *.json` — rendered exports + frame metadata (cell dims,
  anchors, facings, anim names/counts). Use the JSON to get anchors/frame tables right.
- `tokens/*.css`, `readme.md`, preview HTMLs — palette/typography reference. HUD design
  tokens already live in `app/driftlands.css` + `components/ds/`.

**Integration workflow when the user says "zip uploaded / new design dropped":**
1. `rm -rf public/assets/design-system && unzip -o "public/assets/DriftLands Design
   System.zip" -d public/assets/design-system`
2. Read the new `_gen/*.js` generators + their `.json` metadata.
3. Port to TS in `game/render/sprites.ts` (same names/structure as existing ports),
   register in `SpriteCache.init()` (or lazy maps), add draw method, wire into
   `game/engine/game.ts`.
4. Extend `scripts/smoke-sprites.ts` to cover the new generators; run it + tsc + build.

Locked palette = `RAMP` ramps (stone/drift/ember/gold/blood/bone/grass/dirt/water,
void outline `#0a0810`). Rules: dither not blur, 1px void outline, 64×32 iso diamonds,
bottom-center anchors, `crispEdges`. Wanderer: 32×40, 5 facings s/se/e/ne/n + engine
mirror, anims idle 2f/walk 6f/swing 4f. Beasts ported: husk (lv1-2), stalker (lv3+),
colossus (boss), raider (unused — awaiting Caravans). Equipment, dyes, eye glows,
auras are baked into lazily-cached frames (`drawChar` key includes the gear/look sig).
Small one-off sprites: hand-build in the same style; big batches go to Claude Design.

**TOWN SET (done):** `_gen/town.js` is ported in `makeBuildingSprite()` —
verified pixel-identical to the DS SVG exports. Key mapping: DS `casino` → our
`wheel`, DS `tavern` → our `lantern`. Houses 144×152, shrine 112×128 (3 flame
frames, 4fps flicker via `drawBuilding(..., frame)`), pit 240×120 flat
center-anchored ground decor.

## Current status (everything below is BUILT, verified, and committed)

- Phase 0–2: core loop, Drift, crafting/cooking/combat, gold, daily quests ✅
- Phase 3: multiplayer (shared world, authoritative movement/gathering) ✅
- World polish: tile variants/transitions/foam, doodads, atmosphere, day/night ✅
- Identity: names, bought dyes/eyes/auras, earned titles, pets; all synced ✅
- Juice: floaters, crits, rich strikes, screen shake, level-up FX, procedural WebAudio ✅
- Living world: chat/emotes/bubbles, minimap, roster, regions, ash-storms ✅
- Events: Colossus at corruption thresholds (per-client), Driftfall (server-authoritative) ✅
- Danger: corruption ground damage, tombstone gold drops/reclaim ✅
- Phase 4: guest accounts + Postgres persistence ✅ · land claims (erosion → re-claim
  loop) ✅ · player marketplace (escrow for offline sellers) ✅ ·
  **the Waystation town** (8 buildings: Dyeworks, Vault, Wheel, Lantern, Furnisher,
  Menagerie, Shrine cleansing ritual, Pit wagered duels) ✅ ·
  **Caravans** (server-authoritative wagon: departs every ~6 min via A* to a
  map-edge gate, schema-synced `CaravanState`, raider ambush waves cleared by
  escort kill-counts (`raiderKill` intent, 12-tile proximity gate), wagon hp
  gnaw-down fail state, pro-rata payouts live or via escrow; raiders are
  per-client mobs (accepted caveat); env knobs `CARAVAN_FIRST_S/PERIOD_S/SPEED`
  + `DRIFT_DATA_DIR` for isolated test instances) ✅

### Next up (in order)
1. **Phase 5:** Solana devnet — wallet-adapter connect, sign-message auth, link guest
   token → wallet, token gate (hold ≥1), burns (Wheel spins, claims, Dyeworks auras,
   Shrine cleansing become token burns), devnet test SPL mint via
   `NEXT_PUBLIC_TOKEN_MINT` env.
3. **Phase 6:** anti-cheat (move trusted client systems server-side: inventory, combat,
   duel damage), rate limits, economy tuning, deploy (Vercel + Railway/Fly for the
   server, `NEXT_PUBLIC_GAME_SERVER` env), then pump.fun mainnet launch.

## Conventions & gotchas

- User runs `/model` between opus/fable — irrelevant to code decisions.
- Path alias `@/*` everywhere; server resolves it via its own tsconfig (tsx honors it).
- Repo path contains a space (`MMO Game`) — quote paths; use `fileURLToPath` not
  `URL.pathname` (already bitten once).
- macOS: no `timeout` command. Background long-running processes via the harness.
- Schema buffer: `Encoder.BUFFER_SIZE = 64KB` set in `server/src/index.ts` (full-state
  joins overflow the 8KB default).
- Hotbar slots are static UI icons, NOT equipment (confused the user once) — gear comes
  from the Forge and auto-equips; it renders on the character (held blade, shoulder
  tool, chest ward).
- Writing voice: dark-fantasy laconic ("The Drift takes you…", "the stalls stand
  empty"). Keep log lines/copy in that voice. No emoji in game UI (pixel `Icon`s only).
  **No em dashes (—) in any user-facing text** (user rule; use periods, commas, or "·").
- HUD panels scale via `--hud-scale` in driftlands.css (0.8): anchored containers
  apply `scale(var(--hud-scale))` with a matching transform-origin.
  **HUD invariant: the right edge is ONE flex column** (`RightColumn` in Hud.tsx:
  satchel → rail/minimap → activity, space-between, height pre-divided by the
  scale). Never absolutely position a new panel on the right edge; add it to the
  column so panels can stack but physically cannot overlap. Pop-out panels
  (Forge/Market/Trade/You) open leftward so they don't grow the column.
- Never run `npm run build` while the dev server is running (shared `.next` dir
  gets corrupted → garbled runtime TypeErrors). Stop it or skip the build check.
- Tunables live near their feature: claim cost/erosion in types.ts + DriftRoom consts;
  wheel odds in DriftRoom `WHEEL`; drink buffs in `DRINK_CATALOG`.
- The user's flow: they say "next!"/"go" — proceed autonomously, verify everything,
  summarize with what's verified vs caveats. Known accepted caveats: mobs/combat
  per-client; remote players don't show equipment; PvP only as Pit duels.
- Don't commit unless asked.
- Token/regulatory stance: utility + burn model, never market guaranteed returns, all
  chain work on devnet until explicit mainnet go-ahead.
