# Driftlands

A dark-fantasy, browser-based isometric play-to-earn MMO — built in the spirit of Kintara but with its own world and economy. A crumbling realm is being consumed by **the Drift**, a creeping corruption that keeps the resource map alive and shifting.

> Status: **Phase 2 complete + economy slice.** Multiplayer (Phase 3) is on hold until the pixel-art design package lands; token phases come after.

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

### HUD
Dark-fantasy overlay: inventory (click food to eat), hotbar (keys `1–6`), live skill XP bars, vitality bar, quest board, Forge & Trader panels, activity log.

## Run it

```bash
npm install
npm run dev
# open http://localhost:3000
```

Click the ground to walk. Click a tree / rock / fishing ripple to gather. Click a beast to fight. Cook fish, eat to heal, forge gear, finish dailies, sell loot.

## Roadmap (see plan)

1. ✅ **Phase 1** — playable core loop
2. ✅ **Phase 2** — Drift seasons, cooking, crafting, combat
3. ⏸️ **Phase 3** — multiplayer (Colyseus authoritative server) — *on hold for the design package*
4. 🔜 **Phase 4** — persistence (Neon Postgres), land claims, marketplace, Caravans — *gold + dailies + local saves shipped early*
5. Phase 5 — wallet + token gating + burns on **Solana devnet**
6. Phase 6 — hardening + **pump.fun** mainnet launch

Art note: current visuals are placeholder programmer art. A full **pixel-art** design package (logo, UI design system, tiles, sprites, character animations) is being generated externally; the renderer (64×32 iso diamonds, bottom-center anchors, `image-rendering: pixelated`) is built to take it as a drop-in swap.

## Tech

Next.js (App Router) · HTML5 Canvas (world) · React DOM (HUD) · Zustand · Tailwind · TypeScript.

```
app/                  Next.js routes; mounts <GameCanvas/> + <Hud/>
components/           GameCanvas + HUD (inventory, hotbar, quests, Forge, Trader)
game/
  engine/             fixed-timestep loop + render orchestration
  render/             iso transforms, camera/zoom
  world/              tilemap, A* pathfinding, the Drift (node relocation + corruption)
  entities/           player, mobs
  systems/            gathering, combat, cooking, crafting
  state/              zustand store + localStorage persistence
```

### The token (later phases)

The game reads `NEXT_PUBLIC_TOKEN_MINT`. During development this points at a **devnet test SPL mint**; at launch it's swapped to the real **pump.fun** mint — no game-logic changes. The token is **utility + sink + governance** (hold ≥1 to play; burn for land claims, rare crafting, fast-travel, spins with a burn/treasury split) — deliberately *not* a direct cash faucet. Gold is the in-game grind currency; the token captures value through access demand + recurring burns (the Drift reshapes land every season, so land claims re-burn structurally).
