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

All art is **procedural rect-grid pixel generation in code** — no image files. Source
philosophy comes from the Claude Design packages in `public/assets/design-system/`
(generators in `assets/_gen/*.js` were hand-ported to TS in `game/render/sprites.ts`).
Locked palette = `RAMP` ramps (stone/drift/ember/gold/blood/bone/grass/dirt/water,
void outline `#0a0810`). Rules: dither not blur, 1px void outline, 64×32 iso diamonds,
bottom-center anchors, `crispEdges`. Wanderer: 32×40, 5 facings s/se/e/ne/n + engine
mirror, anims idle 2f/walk 6f/swing 4f. Beasts ported from design package: husk (lv1-2),
stalker (lv3+), colossus (boss), raider (unused — awaiting Caravans). Equipment, dyes,
eye glows, auras are baked into lazily-cached frames (`drawChar` key includes the
gear/look signature). New sprites: hand-build in the same style; only commission
Claude Design for big batches (next planned: caravan wagon, land-claim banners already
done, marketplace stall, waystation building props).

## Current status (everything below is BUILT and verified, all uncommitted at last session)

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
  Menagerie, Shrine cleansing ritual, Pit wagered duels) ✅

### Next up (in order)
1. **Caravans** (last Phase 4 slice): server-side wagon departs the Waystation every
   ~6 min toward a map-edge gate (A* route, schema-synced HP/position), Raider ambush
   waves (kill-count resolved across escorts), contribution payouts via escrow rails,
   risk scales with corruption. Design was agreed with the user — see README/plan.
2. **Phase 5:** Solana devnet — wallet-adapter connect, sign-message auth, link guest
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
- Tunables live near their feature: claim cost/erosion in types.ts + DriftRoom consts;
  wheel odds in DriftRoom `WHEEL`; drink buffs in `DRINK_CATALOG`.
- The user's flow: they say "next!"/"go" — proceed autonomously, verify everything,
  summarize with what's verified vs caveats. Known accepted caveats: mobs/combat
  per-client; remote players don't show equipment; PvP only as Pit duels.
- Don't commit unless asked. There is a LARGE uncommitted pile — committing it (or
  asking the user to) is the first thing to address in a new session.
- Token/regulatory stance: utility + burn model, never market guaranteed returns, all
  chain work on devnet until explicit mainnet go-ahead.
