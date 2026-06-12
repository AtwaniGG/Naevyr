# Naevyr

A dark-fantasy, browser-based isometric play-to-earn MMO — built in the spirit of Kintara but with its own world and economy. A crumbling realm is being consumed by **the Drift**, a creeping corruption that keeps the resource map alive and shifting.

> Status: **Phase 3 multiplayer is live** (shared world on a Colyseus server), on top of Phase 2 + the economy slice and the full pixel-art design package. Token phases come after persistence.

## What works now

### Core loop (Phase 1)
- Isometric tile world, click-to-move with **A\*** pathfinding (paths around water & nodes)
- Scroll-wheel zoom, camera follows the player
- Three gathering skills — **Woodcutting / Mining / Fishing** — with timed actions, loot, and XP/leveling
- **The Drift:** depleted nodes don't respawn in place — after a delay they **re-form elsewhere**, and corruption spreads across the land each season

### Combat, cooking & crafting (Phase 2)
- **Drift Beasts** wander the world — click one to fight: auto-attack exchange, HP, loot (Drift Shards + Beast Hides), Combat XP, death → respawn at spawn
- **Cooking:** cook raw Hollowfish at camp, click food to heal
- **The Forge:** 6 recipes across 3 equipment slots (weapon / tool / ward), two tiers each. Bonuses are live in the sim — weapons add damage, tools speed up gathering, wards reduce damage taken. Top tiers gate on Combat level

### Economy slice (Phase 4, pulled forward)
- **Gold** balance + **Wandering Trader** — sell any loot for gold
- **Daily Quest Board** — 3 quests/day rolled deterministically from the date; progress tracks real play events (gather/kill/cook); claim for gold + bonus XP
- **localStorage save** — inventory, skills, HP, gear, gold, season, and quest progress survive refresh; quest board re-rolls on a new calendar day

### Multiplayer (Phase 3)
- **Authoritative Colyseus server** owns the world: map, resource nodes, the Drift (relocation + corruption seasons), and player movement. Clients send intents (`move`, `gather`); the server pathfinds, walks players at 20Hz, and runs gather timers
- Other wanderers render live in your world (full sprite animations + name tags); the HUD shows how many share the Drift
- Nodes are **shared** — watch another player's mining tick a rock's charges down, and the Drift relocate it for everyone at once
- **Offline fallback:** no server running → the entire game runs as a local sim, exactly as before
- Loot/XP/inventory still apply client-side (server persistence is Phase 4); mobs/combat are per-client until the creature design package lands

### The Waystation (town at Wanderer's Rest)
Eight buildings, each a real economic system — walk up and click to enter:
- **The Dyeworks** — buy cloak dyes (200g), eye glows (350g), and **auras** (orbiting motes, 1000g+); cosmetics are owned, persisted, and visible to everyone
- **The Vault** — bank gold so tombstones can't touch it; 2% withdrawal fee; server-held
- **Wheel of the Drift** — 50g a spin, server-rolled prizes up to a 500g jackpot (the Phase 5 burn-to-spin wheel, in gold form)
- **The Last Lantern** — drink buffs: Emberwine (+15% gather speed), Boneale (+1 damage), Driftgin (see node charges everywhere), 5 min each
- **The Furnisher** — claim furniture: campfires, banners, drift lamps, statues; placed on your land, synced to all, falls when your claim falls
- **The Menagerie** — pets that trail you (Drift Wisp, Bone Crow, Emberling), multiplayer-visible
- **Shrine of the Pale Flame** — a communal pot; when it fills, a cleansing fires and burns back the corruption nearest town (community-scale recurring sink → Phase 5 community burn)
- **The Pit** — wagered PvP duels: challenge from the roster, both stake gold, server referees, winner takes the pot, no tombstone for the loser
The town blocks corruption, claims, and nodes — a permanent safe harbor in a decaying world.

### Identity & social
- **Name, cloak dyes (8), eye glow (5), earned titles** — all in the "You" panel, all synced so other players see your look. Titles come from deeds: *Stonebreaker*, *Beastbane*, *Gilded*, *Thrice-fallen*…
- **Chat & emotes** — press Enter, type, see pixel speech bubbles over heads; `/wave /sit /point /dance`. Server relays with your name; works offline too
- **Online roster** — who shares the Drift, with their titles
- **Lifetime stats** — deaths, gathered, crits, gold earned, driftfalls witnessed (persisted)

### Danger & depth
- **Corrupted ground burns** — stand on the purple and the Drift eats you (wards resist it); red vignette pulse warns you
- **Tombstones** — death drops half your gold at the spot; reclaim within 5 minutes or it dissolves. Grave marker on the world + minimap
- **Critical hits** (2×, 12%) and **rich strikes** (double gather yield, 10%) with their own sounds and floaters
- **Named regions** — Wanderer's Rest, Palewater, The Ashen Flats, Hollowmere Reach, The Bonefields — banner on entry
- **Ash-storms** — periodic weather that triples the ash and dims the world

### World events
- **The Colossus** — at corruption thresholds (10/25/40/60/80%) the 64×64 world boss rises at the corruption front. 140 HP, slam attacks, 5 shards + 50g on the kill, stays dead until the next threshold
- **Driftfall** — every few minutes a shard crashes (violet beam, shockwave): 3× rich nodes for 90 seconds, server-authoritative online

### Feel
- **Procedural WebAudio** — every sound synthesized in code (gather/combat/UI SFX, war-horn, ambient drone with eerie pad notes); mute in the "You" panel
- **Juice** — damage floaters, hit sparks, screen shake, level-up light pillar, footstep dust
- **Atmosphere** — moonlight radius, pulsing corruption light pools, day/night cycle, vignette
- **Minimap** — terrain + corruption spread, nodes, beasts (boss in amber), players, your grave

### Pixel-art design system
The full Claude Design package is integrated: procedural rect-grid sprites (world tiles, tree/rock/fish nodes, the hooded wanderer with idle/walk/swing animations), ambient drift-mote/ash FX that thicken with corruption, pixel HUD components, and brand assets. Source generators live in `public/assets/design-system/`; the TS port is `game/render/sprites.ts`.

### HUD
Dark-fantasy overlay: inventory (click food to eat), hotbar (keys `1–6`), live skill XP bars, vitality bar, quest board, Forge & Trader panels, activity log, online presence.

## Run it

```bash
npm install
npm run dev        # game at http://localhost:3000 (offline solo mode)
```

For the shared world, also run the game server in a second terminal:

```bash
cd server && npm install   # first time only
npm run server             # from the repo root — ws://localhost:2567
```

Open two browser tabs to see two wanderers sharing the same Drift. `npm run verify:mp` runs an automated two-client sync check against a running server.

Click the ground to walk. Click a tree / rock / fishing ripple to gather. Click a beast to fight. Cook fish, eat to heal, forge gear, finish dailies, sell loot.

## Roadmap (see plan)

1. ✅ **Phase 1** — playable core loop
2. ✅ **Phase 2** — Drift seasons, cooking, crafting, combat
3. ✅ **Phase 3** — multiplayer (Colyseus authoritative server, shared world, intent-based movement/gathering)
4. 🔜 **Phase 4** — persistence (Neon Postgres), server-side inventory/XP, land claims, marketplace, Caravans — *gold + dailies + local saves shipped early*
5. Phase 5 — wallet + token gating + burns on **Solana devnet**
6. Phase 6 — hardening + **pump.fun** mainnet launch

Art note: world art + HUD use the integrated pixel design system. Remaining placeholders: Drift Beast mobs (creature design package pending) and the CSS wordmark (pixel logo available, intentionally unused for now).

## Tech

Next.js (App Router) · HTML5 Canvas (world) · React DOM (HUD) · Zustand · **Colyseus** (multiplayer) · Tailwind · TypeScript.

```
app/                  Next.js routes; mounts <GameCanvas/> + <Hud/>
components/           GameCanvas + HUD (inventory, hotbar, quests, Forge, Trader)
game/
  engine/             fixed-timestep loop + render orchestration + online mode
  net/                Colyseus client wrapper (intents out, state polled in)
  render/             iso transforms, camera/zoom, procedural pixel sprites
  world/              tilemap, A* pathfinding, the Drift (node relocation + corruption)
  entities/           player, mobs
  systems/            gathering, combat, cooking, crafting
  state/              zustand store + localStorage persistence
server/               authoritative Colyseus game server (reuses game/world logic)
scripts/              verify-multiplayer.ts — automated two-client sync check
public/assets/        pixel design system package (generators, brand, tokens)
```

The server imports the same `game/world` code the client uses (one source of truth for map gen, walkability, A*, and the Drift). `NEXT_PUBLIC_GAME_SERVER` overrides the default `ws://localhost:2567` for deployed environments.

### The token (later phases)

The game reads `NEXT_PUBLIC_TOKEN_MINT`. During development this points at a **devnet test SPL mint**; at launch it's swapped to the real **pump.fun** mint — no game-logic changes. The token is **utility + sink + governance** (hold ≥1 to play; burn for land claims, rare crafting, fast-travel, spins with a burn/treasury split) — deliberately *not* a direct cash faucet. Gold is the in-game grind currency; the token captures value through access demand + recurring burns (the Drift reshapes land every season, so land claims re-burn structurally).
