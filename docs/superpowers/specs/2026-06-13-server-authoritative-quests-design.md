# Server-authoritative daily quests (the quest ledger)

Date: 2026-06-13
Status: approved, ready for implementation plan

## Problem

Daily quests are 100% client-side: `rollDailyQuests()` (deterministic per UTC
day) builds the board, `questEvent` advances progress locally, `claimQuest`
grants gold (capped via the `goldDelta "quest"` rail) and XP locally. Because
nothing about quests is server-owned:

1. **The board can render empty and stay empty.** `applySnapshot`
   (`game/state/persistence.ts:129-137`) only re-rolls when `data.day !=
   today()`. If a save for *today* carries quest ids that no longer resolve in
   `QUEST_POOL` (or an empty `quests: []`), the `flatMap` yields `[]` and the
   board shows nothing until the UTC day rolls over. This is the live bug seen
   on the deployed site.
2. **Progress and claims are client-trusted** — out of step with the Phase 6
   posture where gold, inventory, and all mobs are server-authoritative.

## Goal

Make daily quests the fourth server ledger, mirroring the gold/inventory ledger
pattern exactly: server rolls the board, tracks progress from its own
adjudicated grant events, and validates the claim through the gold ledger.
Offline-solo play is unchanged.

Scope confirmed with the user: **board + progress tracking + reward claim
validation** (all three).

## Why this is clean

The server already adjudicates every event that drives all five quests:

| Quest id      | Driver                  | Server adjudication point (DriftRoom)        |
| ------------- | ----------------------- | -------------------------------------------- |
| `chop_wood`   | gather wood             | gather completion `creditItem` (node grant)  |
| `mine_stone`  | gather stone            | gather completion `creditItem`               |
| `catch_fish`  | gather fish             | gather completion `creditItem`               |
| `slay_beasts` | kill a shared mob       | `mobKill` block (kill credited to killer)    |
| `cook_fish`   | cook fish               | `cook` intent handler                        |

And `QUEST_POOL` + each quest's `matches(e: QuestEvent): number` already live in
shared `game/types.ts`, imported by the server via `@/*`. So the server reuses
the *exact same* quest-matching logic the client uses — zero divergence, one
source of truth.

## Design

### 1. Shared quest roll

Move the pure deterministic picker out of the client store into shared
`game/types.ts`, next to `QUEST_POOL`:

```ts
/** Pick the 3 daily quest ids, deterministic for the given UTC day index. */
export function rollDailyQuestIds(day: number): string[]
```

(Same LCG currently in `store.ts:329`, returning ids instead of `QuestState`.)
`store.ts`'s `rollDailyQuests()` becomes a thin wrapper that maps ids →
`QuestState` via `QUEST_POOL` (used for the offline path). The server calls
`rollDailyQuestIds(today())` directly. Same UTC day ⇒ same board everywhere, by
construction.

`today()` is `Math.floor(Date.now() / 86_400_000)` (UTC day index) — the server
uses the identical expression already present in `persistence.ts:38`.

### 2. Server state + persistence

- `PlayerSim.quests: { day: number; list: { id: string; progress: number; claimed: boolean }[] }`
- New `players.quests` jsonb column. Bootstrap via `ALTER TABLE ... ADD COLUMN
  IF NOT EXISTS quests jsonb` (the existing boot pattern — no drizzle-kit
  migration). Add to `schema.ts`.
- Write-through helper `setQuests(token, quests)` mirroring `setGold`/`persistInv`.
- **No seed-once migration** (unlike gold/inv). Quests are daily-scoped, so a
  stale or missing blob is simply re-rolled. The seed-once machinery
  (`goldSeeded`/`invSeeded`) is intentionally *not* replicated here.
- **Staleness check on every touch:** a helper `ensureFreshQuests(sim)` runs at
  join and before every progress/claim/reroll. If `sim.quests.day != today()`,
  re-roll a fresh board (`rollDailyQuestIds`, all progress 0, unclaimed), set
  `day = today()`, persist, and push `questSync`. This handles day rollover
  mid-session with no timers.
- **No grandfathering** of in-flight client progress on the cutover deploy: a
  player loses at most one partial day's board once. Accepted.

### 3. Progress tracking — three hooks

At each existing adjudication point, after the grant, advance quests through the
shared matcher. A single server helper:

```ts
advanceQuests(sim, e: QuestEvent) {
  ensureFreshQuests(sim);
  let changed = false;
  for (const q of sim.quests.list) {
    if (q.claimed) continue;
    const def = QUEST_POOL.find(d => d.id === q.id);
    if (!def) continue;
    const target = def.target;
    if (q.progress >= target) continue;
    const inc = def.matches(e);
    if (inc > 0) { q.progress = Math.min(target, q.progress + inc); changed = true; }
  }
  if (changed) { this.setQuests(sim); this.sendQuestSync(sim); }
}
```

Hook sites (DriftRoom):
- gather completion, where the node loot is `creditItem`'d → `advanceQuests(sim,
  { type: "gather", item })`. Advance **once per gather completion** (the
  `matches` returns 1 for the matching item), preserving current target
  balance regardless of loot `qty`.
- `mobKill` block, when a shared-mob death is credited to the killer →
  `advanceQuests(sim, { type: "kill" })`. (Only overworld beasts count, exactly
  as today — raiders/colossus use the same `mobKill`? Verify during
  implementation: the kill quest historically counted client `combat` kills;
  match that set. If `mobKill` fires for raiders/colossus too and that widens
  the quest, gate to ambient/den mobs to preserve current behavior.)
- `cook` intent handler, after the fish→cooked conversion → `advanceQuests(sim,
  { type: "cook", qty })` where `qty` is the validated cooked count.

`QuestEvent` type already exists in `types.ts:454`.

### 4. Sync message

After any quest change, push a per-player message (NOT schema — schema is
broadcast to all clients; per-player ledger data uses messages, matching
`goldSync`/`invSync`):

```ts
client.send("questSync", { day, quests: [{ id, progress, claimed }] })
```

Sent on: join (initial board), every `advanceQuests` change, claim, reroll, and
day rollover.

Client (`game/engine/game.ts`, beside the `goldSync`/`invSync` handlers ~line
661): on `questSync`, rebuild `store.quests` wholesale from the payload —
resolve each `id` via `QUEST_POOL`, drop unknown ids, set progress/claimed. A
new store setter `setQuests(list)`. The sync is authoritative; the client never
merges.

### 5. Claim

New intent `claimQuest { id }`:

```
ensureFreshQuests(sim)
find q in sim.quests.list by id; if missing → ignore
if q.claimed → ignore (replay-safe)
def = QUEST_POOL[id]; if !def → ignore
if q.progress < def.target → ignore (early-claim refused)
q.claimed = true
creditGold(sim, def.goldReward, ...)   // the gold ledger; goldSync follows
setQuests(sim)
client.send("questClaimed", { id, xp: def.xpReward })   // XP applied client-side
sendQuestSync(sim)
```

- Gold reward becomes **ledger-real and replay-proof** (the `claimed` flag is
  the idempotency guard; gold rides the existing authoritative credit path).
- XP stays client-applied from `questClaimed` — same accepted caveat as
  `mobKill` XP (XP is not yet server-authoritative).
- Rate-limited via the existing `allow(sim, "claimQuest", ...)` bucket.
- `GOLD_DELTA_CAPS` `quest` reason is **retired from the online rail** (the
  client no longer routes quest gold through `goldDelta` when online). Keep the
  `quest` reason for the offline-local claim only. Re-run verify-ledger.

### 6. Obelisk reroll + gold reroll

The Ash Obelisk dialogue currently offers "quest reroll" (75g or `obeliskBurn`
1◆). The client path calls `store.rerollQuests()`, which re-rolls the *same
deterministic board* — i.e. it's already a silent no-op bug. Move reroll
server-side:

- `obeliskBurn` rail (already server-side for the 1◆ burn) additionally
  re-rolls the board server-side and pushes `questSync`.
- New `questReroll {}` intent for the 75g gold path: debit 75g on the ledger
  (refuse if light), re-roll with a **fresh random** pick (not the deterministic
  daily — a reroll should actually change the board), persist, `questSync`.
- Reroll resets progress/claimed to 0/false for the new board.

### 7. Client offline path (unchanged + one fix)

- Offline (no server): `store.questEvent` / `claimQuest` keep mutating locally
  and granting gold/XP exactly as today. The bus forwarders no-op offline, so
  nothing changes.
- Online: `store.questEvent` becomes a no-op for quest progress (the server
  drives it via `questSync`); the HUD claim button sends the `claimQuest`
  intent instead of granting locally. Respect the ordering rule: never apply
  locally what a sync carries.
- **Empty-board fallback fix** in `applySnapshot` (helps offline + first paint
  before the first `questSync`):
  ```ts
  const rehydrated = (data.day === today() && Array.isArray(data.quests))
    ? data.quests.flatMap(...) : [];
  const quests = rehydrated.length ? rehydrated : rollDailyQuests();
  ```

## Components touched

- `game/types.ts` — add `rollDailyQuestIds(day)`.
- `game/state/store.ts` — `rollDailyQuests` wraps the shared picker; add
  `setQuests(list)` setter; `questEvent`/`claimQuest` gated to offline online.
- `game/state/persistence.ts` — empty-board fallback.
- `game/engine/game.ts` — `questSync` + `questClaimed` handlers; claim button
  wiring sends `claimQuest`; obelisk/reroll send intents.
- `components/Hud/Hud.tsx` — `QuestBoard` claim button sends intent online.
- `server/src/db/schema.ts` — `quests` jsonb column.
- `server/src/db/index.ts` — `setQuests`/`persistQuests` + bootstrap ALTER.
- `server/src/rooms/DriftRoom.ts` — `PlayerSim.quests`, `ensureFreshQuests`,
  `advanceQuests`, `sendQuestSync`, three progress hooks, `claimQuest`
  handler, `questReroll` handler, obelisk reroll, join-time board push +
  persist on save.

## Error handling

- Unknown quest id in claim/advance → ignored.
- Day rollover mid-session → `ensureFreshQuests` re-rolls on next touch.
- Light purse on 75g reroll → refused (no board change).
- Floods → `allow()` token bucket drops them.

## Testing

New `scripts/verify-quests.ts` (guest token, against a dev/isolated server):

1. Board arrives on join via `questSync`, ids match `rollDailyQuestIds(today())`.
2. Gather wood advances `chop_wood` (questSync reflects progress).
3. Cook advances `cook_fish`.
4. Kill advances `slay_beasts`.
5. Claim a completed quest → `goldSync` shows the reward on the ledger,
   `questClaimed` carries XP, quest marked claimed.
6. Double-claim refused (no second payout).
7. Early-claim (progress < target) refused.
8. `questReroll` (75g) swaps the board and resets progress; refused when light.

Plus: `npx tsc --noEmit` (client) + `cd server && npx tsc --noEmit -p
tsconfig.json` (server typecheck) + `npm run build` green + re-run `verify-ledger` (quest cap
change) + `verify-multiplayer` (smoke that questSync doesn't break joins).

## Out of scope

- Server-authoritative XP (quests grant XP client-side, unchanged caveat).
- New quest types or rebalancing rewards.
- Quest streaks / weekly quests.
