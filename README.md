# Driftlands

A dark-fantasy, browser-based isometric play-to-earn MMO — built in the spirit of Kintara but with its own world and economy. A crumbling realm is being consumed by **the Drift**, a creeping corruption that keeps the resource map alive and shifting.

> Status: **Phase 1 — playable single-player slice.** Token/multiplayer come later (see plan).

## What works now (Phase 1)

- Isometric tile world, click-to-move with **A\*** pathfinding (paths around water & nodes)
- Scroll-wheel zoom, camera follows the player
- Three gathering skills — **Woodcutting / Mining / Fishing** — with timed actions, loot, and XP/leveling
- **The Drift:** depleted nodes don't respawn in place — after a delay they **re-form elsewhere**, and corruption spreads across the land each season
- Dark-fantasy HUD: inventory, hotbar (keys `1–6`), live skill XP bars, activity log

## Run it

```bash
npm install
npm run dev
# open http://localhost:3000
```

Click the ground to walk. Click a tree / rock / fishing ripple to gather. Scroll to zoom.

## Roadmap (see plan)

1. ✅ **Phase 1** — playable core loop (this build)
2. Phase 2 — full Drift seasons, crafting/cooking, light combat
3. Phase 3 — multiplayer (Colyseus authoritative server)
4. Phase 4 — persistence (Neon Postgres), land claims, marketplace, Caravans
5. Phase 5 — wallet + token gating + burns on **Solana devnet**
6. Phase 6 — hardening + **pump.fun** mainnet launch

## Tech

Next.js (App Router) · HTML5 Canvas (world) · React DOM (HUD) · Zustand · Tailwind · TypeScript.

### The token (later phases)

The game reads `NEXT_PUBLIC_TOKEN_MINT`. During development this points at a **devnet test SPL mint**; at launch it's swapped to the real **pump.fun** mint — no game-logic changes. The token is **utility + sink + governance** (hold ≥1 to play; burn for land, rare crafting, fast-travel, spins) — deliberately *not* a direct cash faucet.
# Driftlands
