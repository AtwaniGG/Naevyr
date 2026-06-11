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
./server/node_modules/.bin/tsx scripts/verify-wallet.ts        # SELF-HOSTED (port 2597): sign-message wallet link/conflict/unlink
./server/node_modules/.bin/tsx scripts/verify-token.ts         # SELF-HOSTED (port 2596): devnet RPC balance reads + in-game holder gate
./server/node_modules/.bin/tsx scripts/verify-burns.ts         # SELF-HOSTED (port 2595): REAL devnet burns end-to-end (spin/cleanse/replay)
./server/node_modules/.bin/tsx scripts/verify-night.ts         # SELF-HOSTED (port 2594): Long Night survive→dawn + fail→realm reset
./server/node_modules/.bin/tsx scripts/verify-gate.ts          # SELF-HOSTED (port 2591): token ENTRY gate (/gate + onAuth, real devnet mint)
./server/node_modules/.bin/tsx scripts/verify-limits.ts        # Phase 6: rate limits, server-rolled duel damage, level-scaled swing clamp
./server/node_modules/.bin/tsx scripts/verify-ledger.ts        # Phase 6: gold + inventory ledgers (seeding, caps, cook/craft, persistence)
./server/node_modules/.bin/tsx scripts/verify-mobs.ts          # SELF-HOSTED (port 2592): shared mobs + den + Colossus kill/loot/respawn
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
- **DB:** Drizzle ORM. Local dev = **PGlite** (embedded Postgres,
  `server/.data/driftlands.nosync/`, gitignored; MUST stay *.nosync — iCloud's
  agent deleted `base/5` out of the old un-suffixed cluster and killed it).
  Production = set `DATABASE_URL` (Neon planned) — config-only swap.
  Schema in `server/src/db/schema.ts`; bootstrap is `CREATE TABLE IF NOT EXISTS` +
  `ALTER ... ADD COLUMN IF NOT EXISTS` on boot (no drizzle-kit migrations yet).
- **Identity:** guest device token (uuid in localStorage, `getDeviceToken()`), validated
  in `onAuth`. `players.wallet_address` binds a Solana wallet after the Phase 5
  sign-message link (NULL for pure guests; both keep working).
- **Sync model:** clients send intents (`move`, `gather`, `chat`, `claim`, `buy`,
  `bank`, `spin`, `donate`, `placeProp`, `challenge`/`acceptDuel`/`duelHit`, `save`,
  `identity`, `engage`/`attack` (shared mobs), `goldDelta`/`itemDelta` (capped
  client-trusted income), `cook`/`craft` (ledger-validated conversions),
  `walletNonce`/`linkWallet`/`unlinkWallet`, `burnQuote`, `buyAura`,
  `obeliskBurn`); server validates + broadcasts. Client **polls schema state each frame**
  (no per-property callbacks — deliberate, avoids colyseus.js callback API churn).
  XP/quests/buffs/gear/vitals are still **client-side and trusted** (gold,
  items and all overworld mobs are server-authoritative — see Phase 6 status).
  Progress snapshot pushed to server every 8s (`buildSnapshot()` in
  `game/state/persistence.ts`), localStorage is the offline fallback.
- **Offline mode:** no server → full local sim keeps working (claims/market/town
  server-features show "needs shared world" notes). Never break this.
- **HUD ↔ engine bridge:** typed event bus `game/state/bus.ts` (chat, emote, stake,
  market*, bank, spin, donate, placeProp, challenge, duelAccept, walletLink,
  spinBurn, cleanseBurn, auraBurn, obeliskBurn).

## Art system (important)

All art is **procedural rect-grid pixel generation in code** — no image files at
runtime. The art SOURCE OF TRUTH is the Claude Design packages the user drops as a zip
named `DriftLands Design System.zip` into `public/assets/`, extracted to
`public/assets/design-system.nosync/` (MUST be *.nosync — iCloud's agent
half-deleted a fresh plain-named extraction mid-session on 2026-06-11; the
zip itself is the durable copy). Key contents:
- `assets/_gen/*.js` — the pixel **generators** (pixlib.js helpers + tiles.js,
  nodes.js, character.js, beasts.js…). These are the files you PORT to TypeScript in
  `game/render/sprites.ts` (faithful translation, then cache via `SpriteCache`).
- `assets/<category>/*.svg + *.json` — rendered exports + frame metadata (cell dims,
  anchors, facings, anim names/counts). Use the JSON to get anchors/frame tables right.
- `tokens/*.css`, `readme.md`, preview HTMLs — palette/typography reference. HUD design
  tokens already live in `app/driftlands.css` + `components/ds/`.

**Integration workflow when the user says "zip uploaded / new design dropped":**
1. `rm -rf public/assets/design-system.nosync && unzip -o "public/assets/DriftLands
   Design System.zip" -d public/assets/design-system.nosync`
2. Read the new `_gen/*.js` generators + their `.json` metadata.
3. Port to TS in `game/render/sprites.ts` (same names/structure as existing ports),
   register in `SpriteCache.init()` (or lazy maps), add draw method, wire into
   `game/engine/game.ts`. EXCEPTION — art for DOM pages (the landing) uses the
   SVG exports directly from public/ (CSS steps() sheets per the JSON frame
   tables; classes in driftlands.css), no engine port.
4. Extend `scripts/smoke-sprites.ts` to cover the new generators; run it + tsc + build.
   Byte-diff ports against exports (`scripts/tmp-compare-walls.ts` /
   `tmp-compare-wilds.ts` pattern: exports emit rects FRAME BY FRAME with
   per-frame x offsets, not row-major across the sheet).

Locked palette = `RAMP` ramps (stone/drift/ember/gold/blood/bone/grass/dirt/water,
void outline `#0a0810`). Rules: dither not blur, 1px void outline, 64×32 iso diamonds,
bottom-center anchors, `crispEdges`. Wanderer: 32×40, 5 facings s/se/e/ne/n + engine
mirror, anims idle 2f/walk 6f/swing 4f. Beasts ported: husk (lv1-2), stalker (lv3+),
colossus (boss), raider (caravan ambushes + Long Night). Equipment, dyes, eye glows,
auras are baked into lazily-cached frames (`drawChar` key includes the gear/look sig).
Small one-off sprites: hand-build in the same style; big batches go to Claude Design.

**INTERIOR SET (done):** `_gen/interiors.js` is ported — verified
pixel-identical to all 28 DS SVG exports. Floors (wood/stone/cave, DS seeds
1-3 via `drawFloor`), 13 fixture kinds incl. hearth 3f (4fps) + goldVein 2f
sparkle (animated inside `drawFixture`), DS `drawMine`. Accent hex →
ramp/liquid maps: `ACCENT_RAMP`/`ACCENT_LIQUID`.
**WALL SET v2 (done):** `_gen/walls.js` ported (`makeWall2`/`makeWall2Corner`,
15/15 byte-exact). Skewed 32×72 parallelogram segments follow the 2:1 iso
edge and tile at +32x,±16y; NO side outline (seams). Placement in
`drawInteriorWalls`: nw per column-0 tile anchored at its WEST corner
(anchor 0,71), ne per row-0 tile at its NORTH corner (anchor 0,55), corner
wedge at the junction. The flat v1 `makeWallSegment` set is dead art (kept
only for the smoke test); never place flat billboards along iso diagonals.

**WILDS SET (done):** `_gen/wilds.js` ported — 10/10 byte-exact vs exports
(`tmp-compare-wilds.ts`). Husk Den 120×88 2f eye-blink (2fps), Ash Obelisk
64×112 3f rune pulse (4fps; animated via `drawBuilding` frame like the
shrine), Mirewife Hut 120×116. Wild doodads via `makeWildDoodad` (reed_clump/
dead_tree/bone_spike 2 variants, mire_bubble 2f): placed regionally in the
game.ts clutter pass (bone spikes + dead trees ring the den; reeds + bog
bubbles crowd the mire + Hollowmere; `drawDoodad` is now native-size
bottom-anchored). `herbrack` fixture stands in the Mirewife's hut interior.
`drawLostTombstone(sunken)`: rich slab = the gold lost-tomb, sunken = the
Drowned Field lore graves (`drawLostTomb`). `drawWallTimberCharms` is ported
for export parity but NOT placed (it builds on the dead flat v1 wall set).

**LANDING SET (done):** `_gen/landing.js` is used as DOM art, not an engine
port: hero_vista 480×270 2f, wordmark_plate 320×96 2f, gate_door 96×128 3f,
nav_icons 9×16×16 — all served straight from the design-system.nosync SVG
exports and animated with CSS steps() classes in driftlands.css
(`.landing-hero/-plate/-door/-icon`, icon picked via `--icon-index`).

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
  killing the SHARED raider mobs (Phase 6: real deaths feed `waveKills`),
  wagon hp gnaw-down fail state, pro-rata payouts live or via escrow; env
  knobs `CARAVAN_FIRST_S/PERIOD_S/SPEED/GNAW` + `DRIFT_DATA_DIR` for isolated
  test instances) ✅

- Phase 5 slice 1: **wallet link** ✅ — browser wallet (Phantom/Solflare/Backpack via
  `window.solana`, no adapter deps) signs a server nonce (`walletLinkMessage` in
  types.ts is the canonical text); server verifies ed25519 (tweetnacl+bs58) and
  binds `players.wallet_address` (unique; conflict + tamper rejected; unlink works).
  UI in the You panel. Wallet shown via `profile` message → store.wallet.

- Phase 5 slice 2: **token plumbing + holder gate** ✅ — `server/src/solana.ts`
  (RPC balance reads, 60s cache, `SOLANA_RPC`/`TOKEN_MINT` env; unset mint = token
  features dormant). `walletResult`/`profile` carry tokenBalance + holder (≥1);
  Holder badge in the You panel. Mint script: `cd server && npx tsx
  scripts/create-devnet-mint.ts [--mint-to <addr> <amt>]` (authority + mint
  recorded in server/.data, gitignored). **Devnet mint is LIVE:**
  `5oEhDEBED6DYroyuB99sGpGEZLWcMF1Dh1yr4QV6CsLH` (authority
  `7hNDW…3q7z`, funded). Server mint resolution: `TOKEN_MINT` env →
  `server/.data/devnet-mint.json` fallback → dormant. Client env in `.env.local`
  (`NEXT_PUBLIC_TOKEN_MINT`). Holder-true path verified end-to-end on devnet.

- Phase 5 slice 3: **token burns** ✅ — protocol: client `burnQuote` → server
  builds burnChecked tx (authority = fee payer, so players need ZERO devnet
  SOL; partial-signed, base64) → wallet countersigns + submits → action message
  carries the tx signature → `consumeBurn` (insert-first replay protection in
  the `burns` table, then on-chain verify of mint/owner/amount/confirmation).
  Burn rails: Wheel `spin` (1◆), `claim` (5◆, AUTO for holders in claim mode),
  Dyeworks `buyAura` (3◆), Shrine `donate` cleanse (2◆ → +150g pot).
  Costs in `BURN_COSTS` (DriftRoom). HUD: burn buttons appear only for holders.
  Client dep: @solana/web3.js (Transaction deserialize/sign only).
  **PHASE 5 COMPLETE** (devnet). Wallet must be ON DEVNET to sign burns.
- **Building interiors** ✅ — walking to a town building steps INSIDE a
  client-local room (`game/world/interior.ts` specs; engine scene swap in
  `enterInterior`/`updateInterior`/`drawInterior`; same accepted caveat as
  mobs: others see you waiting at the door, server gets no move intents while
  inside). 6 rooms (shrine/pit stay open-air): floors+fixtures+keeper (re-uses
  wanderer rig with per-room dye), counter-adjacent opens the shop panel, the
  lit doorway (or clicking beyond the room) exits. World sim/HUD-store sync
  pauses while inside.
- **The Mine** ✅ — 9th structure (now at 31,29 in the SE rocks), cave interior (11×9) with 7
  gold veins: walk adjacent + swing (mining-skill timing/speed buffs apply),
  each strike pays 3+lvl/2+rand gold + mining XP, veins hold 3 charges then
  regrow in 60s. Client-trusted like all gathering (Phase 6). No counter/shop;
  the overseer is flavor. Vein tunables: `VEIN_CHARGES`/`VEIN_REGROW_MS` in game.ts.
- **Keeper dialogue** ✅ — keeper-run shops (dyeworks/vault/wheel/lantern/
  furnisher/menagerie/mine) are CONVERSATIONS, not modals: named keepers
  (`KEEPERS` in Hud.tsx) greet at the counter, options are clickable replies
  (Dyeworks has submenus), keeper responds in voice. Bottom-center
  `KeeperDialogue` panel. Shrine/Pit keep their panels (open-air, no keeper).
- **The wild quadrants** ✅ — `WILD_STRUCTURES` in tilemap (NOT Drift-immune,
  unlike town): Ashen Flats (NW) has the **Husk Den** (5 elite husks guard a
  war-chest: clear pack → loot 60-100g + 2 shards, re-seeds in 15 min; pack
  mobs use `Mob.persistDeath`) and the **Ash Obelisk** (dialogue: quest reroll
  75g or 1◆ burn via `obeliskBurn` server rail, gather blessing 60g).
  Hollowmere Reach (SW) has **the Hollowmere** (second pond in world gen +4
  rich fish nodes), the **Mirewife's Hut** (interior + keeper: brews cost gold
  AND materials via `applyBuff`, "Read the Drift" forecasts corruption
  direction from the minimap), and the **Drowned Field** (lore graves + a lost
  tombstone with 30-80g surfacing every 6-10 min, client-local).
- **THE LONG NIGHT (endgame)** ✅ — at ≥90% corruption a realm-wide assault hits
  the Waystation: shared kill quota (real deaths of the server-spawned night
  horde — Phase 6) on a 3-min timer, schema-synced (`nightActive/EndsIn/Kills/
  Need`, HUD banner top-center).
  Survive → dawn cleanses corruption back to 35% (burns outward from town) +
  250g per defender; fail (or ≥97% failsafe) → **realm reset**: fresh world +
  Drift, claims/props wiped, nodes resynced, season 1; bank/cosmetics/wallet
  persist. Re-arms when corruption drops below 50%. Tunables + env overrides
  (`SEASON_MS`, `LONG_NIGHT_PCT/MS/KILLS`) at the top of DriftRoom. A "season"
  is a 15-MINUTE decay tick (production pace; default in drift.ts, override
  with SEASON_MS env). Full corruption cycle to the Long Night ≈ a day; claims
  last ~5h unsieged.

### World layout (current map, 40×40)
- Town spread organically around spawn (20,20), region "Wanderer's Rest"
  (radius 13 in `regionAt`, game.ts): shrine (17,13), dyeworks (12,17),
  vault (24,16), lantern (21,22), menagerie (28,22), furnisher (14,24),
  wheel (13,29), pit (20,32) r2, mine (31,29 — wild-adjacent, in Bonefields).
- **Layout rule (comment above TOWN_BUILDINGS):** doors are south-facing; a
  building with depth gap Δ(x+y) ∈ (0,8] behind another needs screen-column
  gap |Δ(x-y)| > 4 or it covers that door. East-of-center houses render
  MIRRORED (drawBuilding mirror flag) to face town.
- Lakes: Palewater pool NE (~28.8,11.2 r3.2+ring), the Hollowmere SW
  (~w*0.18, h*0.86) with +4 rich fish on its banks.
- `WILD_STRUCTURES` (huskden 8,8 · obelisk 15,5 · mirehut 5,24) share
  walkability/claim-blocking via `ALL_STRUCTURES`/`buildingAt` but are NOT in
  `townProtected` (the Drift can besiege them). `nearBuilding(pad=2)` keeps
  nodes from clipping any structure sprite (gen + relocation).
- Drowned Field graves: client-local decor cells in game.ts `DROWNED_FIELD`.

### PHASE 6 — IN PROGRESS
Goal: production-harden, then deploy, then (on explicit go-ahead only) mainnet.

**Slice 1 DONE: the server gold ledger** (built, all suites green, committed):
`players.gold` column is the authoritative pocket balance, held in
`PlayerSim.gold` (write-through via db `setGold`, seeded on first join from the
old snapshot's gold; a brand-new row waits for the client's FIRST snapshot push
to seed, exactly once — `sim.goldSeeded`). Server-side debits/credits for
everything the server adjudicates: wheel spin (50g), vault deposit/withdraw
(fee server-side), market buy → seller ledger or escrow, claim staking (250g),
Furnisher props, duel wagers at accept + pot at end (`duelRefused` if either
purse is light), shrine donations (`donateResult` drives the client log),
caravan payouts, night rewards, escrow delivery on profile. Client-trusted
income flows through ONE rail: `store.addGold/spendGold(amount, reason)` emits
a `goldDelta` bus event → engine forwards → DriftRoom clamps per reason
(`GOLD_DELTA_CAPS`: per-event + rolling per-minute budgets; reasons in
`GoldReason`, types.ts). Death drops record `tombGold` server-side; tomb
reclaim pays back at most what fell, once. After every ledger change the server
pushes `goldSync` and the client display adopts it (`store.setGold`). The
client no longer pre-pays/refunds for server transactions; snapshot gold can
never re-seed a live ledger (no minting). Offline mode unchanged (local sim;
bus forwarder no-ops). Verify suites were adapted: fresh tokens seed their
purse via the first-save rail (`room.send("save", {snapshot:{gold:N}})`).

**Slice 2 DONE: the inventory ledger** (all suites green, committed):
`players.inv` jsonb mirrors the gold rail exactly (`PlayerSim.inv`,
`creditItem`/`debitItems`, `invSync` after every change, same seed-once
migration via `sim.invSeeded`). Server-granted: gather loot (the server rolls
rich strikes now — `RICH_STRIKE_P`; `loot` carries `qty`/`rich` and the client
only applies items locally when OFFLINE), wheel shards, market list (debits
the ledger; ghost listings refused) / unlist / buy (credits). Server-validated
intents: `cook` (fish → cooked, clamped to real fish) and `craft` (debits
RECIPES costs; gear itself stays client-side). Client-trusted drops ride
`itemDelta` with per-reason caps AND item whitelists (`ITEM_DELTA_CAPS`: mob →
shards/hide, chest → shards); negative deltas (eat/brew/vendor sell) floor at
zero. Ordering rule: any message paired with an invSync must NOT addItem
client-side (the sync precedes it — double-count then snap-back otherwise).

**Slice 3 DONE: shared server-side mobs** (ambient + den; all suites green,
committed): ambient Drift Beasts (8, lv1-3) and the Husk Den elite pack
(5× lv5, reseeds 15 min after the last falls; env `MOB_COUNT`/`DEN_RESEED_S`)
live in `ServerMob` sims inside DriftRoom — same wander-and-retaliate behavior
as the old client sim, synced via `MobState` schema map. Client mirrors them as
PUPPETS injected into `combat.mobs` (`Mob.netId` set, `updatePuppet()` cosmetic
tick) so all draw/click/minimap code is untouched. Combat: `engage` intent
freezes the beast (adjacency-checked); each client swing sends `attack {id,
dmg}` (server: adjacency, 900ms rate cap, dmg clamp 50); retaliation comes
back as `mobHit` (client applies its ward reduction — gear still
client-trusted); deaths are server-rolled with shard/hide loot landing
straight on the inventory ledger + `mobKill` to the killer (XP/quests/log
client-side). Realm reset respawns all shared mobs. Den chest stays
client-local (capped deltas) but gates on the SHARED pack. Offline: the local
CombatManager sim is unchanged (puppets only exist online).

**Slice 4 DONE: ALL mobs are shared** (raiders + Colossus converted; all
suites green, committed): caravan-ambush waves and the Long Night horde are
server-spawned raider `ServerMob`s (`eventTag` "ambush"/"night"); the
`raiderKill` intent is GONE — the attack handler counts REAL raider deaths
into `waveKills`/`nightKills` and pays raider gold (5-10g) on the killer's
ledger. The Colossus is a shared world boss: server-side `watchBoss()` wakes
one per corruption threshold (`bossThresholds`, env `BOSS_PCTS`) anchored on a
corrupt tile (fallback: walkable ground ≥10 from town), 140hp/120xp, pays
50g + 5 shards on the ledgers; `colossus` broadcast drives the client banner.
Dead raiders/colossi prune from the schema 2.5s after the death anim. New env:
`CARAVAN_GNAW` (wagon hp/s while swarmed; suites lower it because real kills
take real walking). verify-caravan/night now WALK to each raider and kill it
via attack intents; verify-mobs is self-hosted (port 2592, BOSS_PCTS=0) and
covers the Colossus end-to-end.

**Token ENTRY GATE + landing page DONE** (Kintara-style door; committed):
the app now opens on `components/Landing.tsx` (full-screen, DS-styled:
wordmark → tagline → PLAY NOW; `app/page.tsx` only mounts GameCanvas/Hud
after the gate). Flow: PLAY → GET `/gate` on the game server (HTTP endpoint
on the same port as the ws transport — `server/src/index.ts` now builds its
own `createServer` + `WebSocketTransport`; returns `{gate, mint, balance,
ok, online}`) → if `gate > 0`: connect a browser wallet, re-check `/gate?
address=`, denied screen shows balance vs requirement; a previously cleared
wallet (localStorage `driftlands-gate-wallet`, helpers in persistence.ts)
skips the popup → fresh players (no local save) name their wanderer (seeds
the save's cosmetics) → enter. ENFORCED server-side: `onAuth` rejects joins
without an `address` option whose balance ≥ `gateTokens()` (solana.ts;
`GATE_TOKENS` env, DEFAULT 0/OFF so dev + every verify suite stays open;
production sets `GATE_TOKENS=1000`). No server reachable → "Wander offline"
(offline-solo invariant holds). Caveat (hardening follow-up): the join
address is balance-checked but not signature-proven; the in-game link flow
remains the binding proof. NO tutorial yet (explicitly deferred).
The landing is a full Kintara-style SITE now: real routes sharing
`components/LandingShell.tsx` (sticky nav: Dashboard / Updates / Events /
How to Play / Leaderboard / Index / Docs + socials + balance chip + Connect;
wallet/gate plumbing shared via `components/gate.ts` `useGate()`). Pages:
`/docs` = the full whitepaper (20 anchored chapters, sticky contents);
`/how-to-play` = the 7-step guide; `/updates` = the phase chronicle;
`/events` = the reckonings; `/leaderboard` = categorized boards from GET
`/leaderboard` (db `leaderboards()`: gold = ledger+vault, kills + total
levels from snapshots); `/dashboard` = reads the browser save (profile,
title, skills, satchel, wallet standing); `/codex` (nav label "Index") = the
encyclopedia GENERATED from the shared catalogs (ITEM_META/RECIPES/
DRINK_CATALOG/AURA/PET/PROP + tilemap structures) so it can't go stale.
GOTCHA: an app route literally named `index/` crashes Next's prerenderer
(clientReferenceManifest invariant) — hence `codex`. Home (`/`) is the pure
hero landing; PLAY NOW links to `/play`, which auto-runs the gate flow
(check → wallet → name) and then mounts GameCanvas+Hud. The viewport lock
(`overflow:hidden` + `user-select:none`) is NOT global anymore: it's
`body.app-locked` in globals.css, toggled by /play only while the engine is
mounted — every other page scrolls and selects like a normal site.

1. **Anti-cheat — mostly DONE.** Still client-trusted (accepted until server
   XP exists): XP/levels, quest progress (rewards capped via goldDelta
   "quest"), cosmetics purchases (gold ones; spends can't mint), buff
   application, equipment/gear (ward reduction vs mobHit; per-swing mob dmg
   client-reported but clamped to min(50, 26 + last-saved combat level)),
   player vitals/death, mine veins / den chest / lost-tomb gold (capped
   deltas). Server-authoritative: movement, gather timers + loot grants,
   gold + inventory ledgers, ALL overworld mobs (hp/deaths/loot/quotas),
   claims, market escrow (gold AND goods), vault, wheel, shrine pot, Pit
   damage rolls AND wagers, token burns (on-chain), the entry gate.
2. **Rate limits + validation hardening — DONE.** Every message handler runs
   through `allow(sim, key, n, windowMs)` (per-session token buckets on
   `PlayerSim.rates`; floods are silently dropped). Budgets are generous for
   honest play AND for the verify suites (suites send bursts — keep that in
   mind before tightening any). Existing ad-hoc caps stayed (save 4s, spin
   2.5s, duelHit 900ms, attack 900ms, delta budgets). Pit damage is
   SERVER-ROLLED now (6-12, 12% crit ×2, max 24; the duelHit payload is
   dead — client floaters are cosmetic approximations). Mob swing damage
   clamps to `min(50, 26 + sim.combatLevel)` where combatLevel comes from
   the last snapshot (cross-checked trust until server XP). RPC robustness:
   solana.ts wraps every read in `withDeadline` (balance 3.5s → cached/0,
   burn-tx build 8s, verifyBurn polls 6s each) because the public devnet RPC
   throttles by HANGING, which used to stall walletResult/profile/gate joins
   forever.
3. **Economy tuning pass — NEXT UP (start here).** Gold is fully server-held
   now; balance the faucets against each other and the sinks, then tighten
   the anti-cheat budgets to "just above legit maximums". The audit data:
   - FAUCETS (gold/hr-ish): Mine veins 3+lvl/2+rand(3) per ~1.8s swing, 7
     veins × 3 charges, 60s regrow (`VEIN_CHARGES`/`VEIN_REGROW_MS`,
     game.ts) — likely the richest camp; Husk Den chest 60-100g + 2 shards
     per 15min reseed; lost tombstones 30-80g per 6-10min; raiders 5-10g
     each (ambushes spawn waveNeed=3/5/7…, nights spawn need×1.3); caravan
     pool 120 + 3×corruption% per ~6min run, pro-rata; night reward 250g
     per defender; Colossus 50g+5 shards per threshold; quests 25-60g/day
     ×3; vendor sells (ITEM_META sellValue: wood 2, stone 3, fish 3,
     cooked 6, hide 8, shard 15); Wheel EV ≈ 42.5g gold + 0.16 shards per
     50g spin (house edge ~10-15% — it IS a sink, verified math).
   - SINKS: claims 250g, dyes 200, eyes 350, auras (AURA_CATALOG), pets,
     drinks 30-40, brews 50-80 + materials, props 100-300, obelisk 75/60,
     vault fee 2%, death drops (half the purse), duel losses. A rich
     veteran runs out of sinks fast — consider scaling sinks or new ones.
   - METHOD: compute gold/hr per archetype (vein-camper vs caravan escort
     vs beast farmer vs fisher-seller), flatten outliers via the tunables
     (all live near their features: DriftRoom consts, game.ts vein consts,
     types.ts catalogs), then tighten `GOLD_DELTA_CAPS`/`ITEM_DELTA_CAPS`
     (DriftRoom) to just above the new legit maximums. The verify suites
     SEED purses via first-save and send delta bursts — re-run everything
     after tightening (several suites assume specific costs: town seeds
     5000/100, claims 1000, market 200; update seeds if costs change).
   - The leaderboard (`/leaderboard`) + players table show the live wealth
     distribution; the user playtests on localhost:2567 and their "feels
     too rich/poor" calls outrank the spreadsheet.
4. **Deploy:** client → Vercel; server → Railway/Fly (`NEXT_PUBLIC_GAME_SERVER`
   ws URL env, `DATABASE_URL` → Neon, `TOKEN_MINT`/`SOLANA_RPC` envs; the
   devnet authority keypair lives in server/.data and must move to a secret).
5. **pump.fun mainnet launch** — REQUIRES the user's explicit go-ahead. New
   mint, env swap, real RPC provider; never assume.

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
  column. Column children are `flexShrink: 0` (a shrunken child paints its
  overflow UNDER later siblings — the Activity-covers-Forge bug) with ONE
  exception: the Activity panel is the designated flexible item (`flexGrow: 1`
  + `flexShrink: 1`, `minHeight: 170`, `Panel fill` + internal `overflowY:
  auto` on the log) so it absorbs ALL leftover column space and short windows
  shrink the log instead of cropping the chat input. The Satchel collapses to
  a slim "Satchel · N" button (`store.satchelOpen`; closing it also closes the
  trade popout) and the Activity log grows into the freed room.
  Pop-out panels (Forge/Market/You/Trade) must go through `DockPopout`
  (absolute overlay anchored left of the button, zIndex 20, own scroll):
  they take zero column space, so opening one can never shift or hide anything.
- Never run `npm run build` while the dev server is running (shared build dir
  corrupts → garbled runtime TypeErrors). Stop dev, build, restart dev.
- **The repo lives on the iCloud-synced Desktop.** iCloud's agent (bird)
  DELETES freshly written build artifacts mid-session (proven with a canary
  file). Hence `distDir: ".next.nosync"` in next.config.mjs (iCloud skips
  *.nosync). If the app ever serves unstyled white HTML with 404 CSS/chunks,
  it's this class of corruption: stop dev, rm -rf .next.nosync, restart.
  It also ate the live PGlite cluster (2026-06-11; corpse backed up at
  `~/driftlands-db-corrupt-backup-2026-06-11`) — hence the *.nosync data dir.
  It also EVICTS .git object files: `git push` then dies with "fatal: mmap
  failed: Operation timed out". Fix: materialize and retry —
  `find .git -type f -exec cat {} + > /dev/null`.
  The devnet keypair JSONs in server/.data are still unprotected (small,
  static, lower risk — but check them if mint features go dormant).
  Long-term fix: move the repo out of Desktop.
- The public devnet RPC (api.devnet.solana.com) rate-limits PER METHOD —
  heavy suite days exhaust `getParsedTransaction`/`getTokenLargestAccounts`
  budgets and verify-token/verify-burns fail with 429s that are NOT code
  bugs. verifyBurn polls through transient errors (bounded:
  `disableRetryOnRateLimit` on all Connections) and verify-token SKIPs its
  live-USDC layer when throttled. If burns fail with "429", wait an hour or
  set `SOLANA_RPC` to a keyed endpoint (Helius/QuickNode free tier).
- Regression flow without touching the user's live server: boot an isolated
  instance (`cd server && DRIFT_DATA_DIR=/tmp/x PORT=2598 CARAVAN_FIRST_S=9999
  npx tsx src/index.ts`), run suites with `GAME_SERVER=ws://localhost:2598`,
  kill it after (verify port 2598 actually died — a stale listener once made
  suites silently test old code). PGlite is single-process: never point two
  servers at the same data dir.
- After server-side changes, RESTART the user's `npm run server` (and tell
  them to reload) — they playtest continuously against localhost:2567.
- Keeper voice lines live in `game/world/keeperTalk.ts` (enter/idle/greet);
  engine draws idle bubbles over keepers in interiors, HUD picks a random
  greet per conversation. Names/swatches in `KEEPERS` (Hud.tsx).
- Right-rail popouts are mutually exclusive via `store.openDock`
  (forge/market/you/trade) — one open at a time, by user request.
- Tunables live near their feature: claim cost/erosion in types.ts + DriftRoom consts;
  wheel odds in DriftRoom `WHEEL`; drink buffs in `DRINK_CATALOG`.
- The user's flow: they say "next!"/"go" — proceed autonomously, verify everything,
  summarize with what's verified vs caveats. Known accepted caveats (all Phase 6
  targets): ALL overworld mobs are shared server mobs now (per-swing damage
  values still client-reported, clamped at 50); interiors are client-local
  scenes (others see you at the door); XP/quests/buffs/gear/vitals
  client-trusted (gold AND items are server-ledgered; client-reported income
  is capped per reason); remote players don't show equipment; PvP only as Pit
  duels.
- Git: user commits/pushes themselves ("Phase N Complete" milestones); repo is
  github.com/AtwaniGG/Driftlands. Don't commit unless asked (pushing on request
  is fine).
- Token/regulatory stance: utility + burn model, never market guaranteed returns, all
  chain work on devnet until explicit mainnet go-ahead.
