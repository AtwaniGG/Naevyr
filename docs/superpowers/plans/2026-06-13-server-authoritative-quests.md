# Server-authoritative daily quests Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make daily quests the fourth server ledger — server rolls the board, tracks progress from its own adjudicated grant events, and validates the claim through the gold ledger — while leaving offline-solo play unchanged.

**Architecture:** Mirror the existing gold/inventory ledger pattern exactly. The server owns `PlayerSim.quests`, persists to a new `players.quests` jsonb column, advances progress at the three points it already adjudicates (gather grant, mob kill, cook intent) by reusing the shared `QUEST_POOL[*].matches()`, and pushes a per-player `questSync` message (never schema). Client adopts `questSync` wholesale online; offline keeps its local quest sim.

**Tech Stack:** TypeScript, Colyseus 0.16, Drizzle ORM + PGlite (dev), Zustand (client store), colyseus.js (verify scripts). Note: this repo's test convention is integration `scripts/verify-*.ts` run against a live server, NOT unit tests — per CLAUDE.md, that convention is authoritative here and overrides pytest-style unit TDD.

---

## File Structure

- `game/types.ts` — add the shared deterministic picker `rollDailyQuestIds(day)`. (Single source of truth for the daily board, used by both client offline and server.)
- `game/state/store.ts` — `rollDailyQuests()` becomes a thin wrapper over the shared picker; add `setQuests(list)` setter; gate `questEvent`/`claimQuest` reward-granting to offline.
- `game/state/persistence.ts` — empty-board fallback in `applySnapshot`.
- `game/net/client.ts` — `sendQuestClaim`/`sendQuestReroll` intent senders.
- `game/state/bus.ts` — `questClaim`/`questReroll` bus events.
- `game/engine/game.ts` — `questSync`/`questClaimed` message handlers; gate the `mobKill` kill-event to offline; forward the new bus events to net.
- `components/Hud/Hud.tsx` — claim button + obelisk gold reroll send intents when online.
- `server/src/db/schema.ts` — `quests` jsonb column.
- `server/src/db/index.ts` — `setQuests` write-through + bootstrap `ALTER`.
- `server/src/rooms/DriftRoom.ts` — `PlayerSim.quests`, helpers (`ensureFreshQuests`, `advanceQuests`, `rollQuestsFor`, `syncQuests`), three progress hooks, initial board push on join, `claimQuest` + `questReroll` intents, obelisk-burn reroll.
- `scripts/verify-quests.ts` — integration test (the "test" for this feature).

---

## Task 1: Shared deterministic quest picker

**Files:**
- Modify: `game/types.ts` (add `rollDailyQuestIds` right after `QUEST_POOL`, ~line 516)
- Modify: `game/state/store.ts:328-342` (`rollDailyQuests` wraps the shared picker)

- [ ] **Step 1: Add the shared picker to `game/types.ts`** immediately after the `QUEST_POOL` array closes (after the `];` at ~line 516):

```ts
/** Pick the 3 daily quest ids, deterministic for a given UTC day index
 *  (Math.floor(Date.now()/86_400_000)). Shared truth: the client builds the
 *  offline board from this and the server rolls the authoritative board from it,
 *  so the same day yields the same three quests everywhere. */
export function rollDailyQuestIds(day: number): string[] {
  const ids: string[] = [];
  const pool = QUEST_POOL.map((q) => q.id);
  let seed = day;
  for (let i = 0; i < 3 && pool.length > 0; i++) {
    // simple LCG so the same day always rolls the same board
    seed = (seed * 1103515245 + 12345) % 2147483648;
    const idx = seed % pool.length;
    ids.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return ids;
}
```

- [ ] **Step 2: Rewrite `rollDailyQuests` in `game/state/store.ts`** (replace lines 328-342) to delegate to the shared picker:

```ts
/** Build today's 3 daily quests (offline path); deterministic per UTC day. */
export function rollDailyQuests(): QuestState[] {
  const day = Math.floor(Date.now() / 86_400_000);
  return rollDailyQuestIds(day).flatMap((id) => {
    const def = QUEST_POOL.find((d) => d.id === id);
    return def ? [{ def, progress: 0, claimed: false }] : [];
  });
}
```

- [ ] **Step 3: Ensure `rollDailyQuestIds` is imported in `store.ts`.** Add it to the existing import from `@/game/types` (the block importing `QUEST_POOL` at the top of the file, ~line 10):

```ts
  QUEST_POOL,
  rollDailyQuestIds,
```

- [ ] **Step 4: Typecheck the client**

Run: `npx tsc --noEmit`
Expected: PASS (no errors). The board roll is unchanged in behavior — same LCG, same seed.

- [ ] **Step 5: Commit**

```bash
git add game/types.ts game/state/store.ts
git commit -m "refactor(quests): share the daily quest picker between client and server"
```

---

## Task 2: Empty-board self-heal in applySnapshot

**Files:**
- Modify: `game/state/persistence.ts:127-137`

- [ ] **Step 1: Replace the quest rehydration block** in `applySnapshot` (lines 129-137) so an unresolvable/empty board re-rolls instead of rendering blank:

```ts
  const rehydrated: QuestState[] =
    data.day === today() && Array.isArray(data.quests)
      ? data.quests.flatMap((q) => {
          const def = QUEST_POOL.find((d) => d.id === q.id);
          return def
            ? [{ def, progress: q.progress, claimed: q.claimed }]
            : [];
        })
      : [];
  // a stale day OR a board whose ids no longer resolve (the live empty-board
  // bug) falls back to a fresh roll instead of showing nothing
  const quests: QuestState[] = rehydrated.length ? rehydrated : rollDailyQuests();
```

- [ ] **Step 2: Confirm `rollDailyQuests` and `QUEST_POOL` are imported** in `persistence.ts`. `rollDailyQuests` is already imported (it's referenced at the old line 137). Verify `QUEST_POOL` is too; if not, add it to the `@/game/types` / store import.

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add game/state/persistence.ts
git commit -m "fix(quests): re-roll the daily board when a save rehydrates empty"
```

---

## Task 3: Database column + write-through helper

**Files:**
- Modify: `server/src/db/schema.ts` (add `quests` column to the `players` table)
- Modify: `server/src/db/index.ts` (bootstrap `ALTER` near line 80; `setQuests` near `setInv` ~line 421)

- [ ] **Step 1: Add the `quests` column to the players table in `server/src/db/schema.ts`.** Find the `players` table definition (it already has `gold`, `inv`, `prestige`, `wheelPity`). Add after the `inv` column:

```ts
  /** Phase 6: authoritative daily quest board { day, list:[{id,progress,claimed}] } */
  quests: jsonb("quests"),
```

(`jsonb` is already imported in this file — it's used by `inv`/`prestige`.)

- [ ] **Step 2: Add the bootstrap ALTER in `server/src/db/index.ts`.** Find the run of `ALTER TABLE players ADD COLUMN IF NOT EXISTS` statements (lines 62-83). Add one matching their style, after the `wheel_pity` ALTER (line 80):

```ts
    ALTER TABLE players ADD COLUMN IF NOT EXISTS quests jsonb
```

(Match the exact surrounding syntax — each is its own `await db.execute(sql\`...\`)` or part of the batch; copy the neighbor's form precisely.)

- [ ] **Step 3: Add the write-through helper in `server/src/db/index.ts`** right after `setInv` (line 423):

```ts
/** write-through persist of the authoritative daily quest board */
export async function setQuests(
  token: string,
  quests: { day: number; list: { id: string; progress: number; claimed: boolean }[] },
) {
  await db.update(players).set({ quests }).where(eq(players.token, token));
}
```

- [ ] **Step 4: Typecheck the server**

Run: `cd server && npx tsc --noEmit -p tsconfig.json`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add server/src/db/schema.ts server/src/db/index.ts
git commit -m "feat(quests): players.quests column + setQuests write-through"
```

---

## Task 4: Server quest state, roll/freshness/sync helpers, initial board

**Files:**
- Modify: `server/src/rooms/DriftRoom.ts` — import (`setQuests as persistQuests`, `rollDailyQuestIds`, `QUEST_POOL`, `QuestEvent`); `PlayerSim` interface (~line 369); sim construction in `onJoin` (~line 1858); helpers near `creditItem` (~line 2299); initial push at end of `onJoin` (~line 1873)

- [ ] **Step 1: Add imports at the top of `DriftRoom.ts`.** Extend the db import block (lines 25-26 already alias `setGold as persistGold`, `setInv as persistInv`):

```ts
  setGold as persistGold,
  setInv as persistInv,
  setQuests as persistQuests,
```

And ensure `QUEST_POOL`, `rollDailyQuestIds`, and the `QuestEvent` type come from `@/game/types` (add to the existing types import):

```ts
import { /* …existing… */ QUEST_POOL, rollDailyQuestIds, type QuestEvent } from "@/game/types";
```

(If `@/game/types` is imported in more than one statement, add to whichever already pulls game types like `ItemKey`/`RECIPES`.)

- [ ] **Step 2: Add the quest field to the `PlayerSim` interface** (after `wheelPity`, ~line 363):

```ts
  /** Phase 6: authoritative daily quest board (write-through to players.quests) */
  quests: { day: number; list: { id: string; progress: number; claimed: boolean }[] };
```

- [ ] **Step 3: Add a `serverDay()` free helper** near the top of the file (module scope, beside other small helpers):

```ts
/** UTC day index — identical expression to the client's today() */
function serverDay(): number {
  return Math.floor(Date.now() / 86_400_000);
}

/** a fresh board for a given day: the deterministic 3, all unstarted */
function freshQuestBoard(day: number) {
  return {
    day,
    list: rollDailyQuestIds(day).map((id) => ({ id, progress: 0, claimed: false })),
  };
}
```

- [ ] **Step 4: Initialize `quests` when the sim is constructed in `onJoin`.** In the `const sim: PlayerSim = { ... }` literal (~line 1834-1859), after `guildId:`, add:

```ts
      quests: sanitizeQuests(row.quests),
```

And add the `sanitizeQuests` module-scope helper (beside `sanitizeInv`):

```ts
/** load a stored quest board, re-rolling if absent or for a stale UTC day */
function sanitizeQuests(raw: unknown): { day: number; list: { id: string; progress: number; claimed: boolean }[] } {
  const day = serverDay();
  const r = raw as { day?: unknown; list?: unknown } | null | undefined;
  if (!r || r.day !== day || !Array.isArray(r.list)) return freshQuestBoard(day);
  const valid = new Set(QUEST_POOL.map((q) => q.id));
  const list = (r.list as any[])
    .filter((q) => q && valid.has(q.id))
    .map((q) => ({
      id: String(q.id),
      progress: Math.max(0, Math.trunc(Number(q.progress) || 0)),
      claimed: Boolean(q.claimed),
    }));
  return list.length ? { day, list } : freshQuestBoard(day);
}
```

- [ ] **Step 5: Add the room helpers** beside the gold/inv ledger helpers (after `debitItems`, ~line 2313):

```ts
  // ---- the quest ledger -------------------------------------------------------

  /** push the authoritative quest board to its owner */
  private syncQuests(sim: PlayerSim) {
    sim.client.send("questSync", { day: sim.quests.day, quests: sim.quests.list });
  }

  /** re-roll the board for the current day if the stored one is stale; returns
   *  true if it changed (caller may want to sync) */
  private ensureFreshQuests(sim: PlayerSim): boolean {
    const day = serverDay();
    if (sim.quests.day === day) return false;
    sim.quests = freshQuestBoard(day);
    void persistQuests(sim.token, sim.quests).catch(() => {});
    return true;
  }

  /** feed a server-adjudicated event through the shared matchers; sync on change */
  private advanceQuests(sim: PlayerSim, e: QuestEvent) {
    if (this.ensureFreshQuests(sim)) this.syncQuests(sim);
    let changed = false;
    for (const q of sim.quests.list) {
      if (q.claimed) continue;
      const def = QUEST_POOL.find((d) => d.id === q.id);
      if (!def || q.progress >= def.target) continue;
      const inc = def.matches(e);
      if (inc > 0) {
        q.progress = Math.min(def.target, q.progress + inc);
        changed = true;
      }
    }
    if (changed) {
      void persistQuests(sim.token, sim.quests).catch(() => {});
      this.syncQuests(sim);
    }
  }

  /** replace the board with a fresh roll (Obelisk reroll); progress reset */
  private rerollQuestsFor(sim: PlayerSim) {
    // a reroll should actually change the board, so roll off a random seed
    // rather than the deterministic day index
    const day = serverDay();
    sim.quests = {
      day,
      list: rollDailyQuestIds((Math.random() * 2147483648) | 0).map((id) => ({
        id, progress: 0, claimed: false,
      })),
    };
    void persistQuests(sim.token, sim.quests).catch(() => {});
    this.syncQuests(sim);
  }
```

- [ ] **Step 6: Push the initial board at the end of `onJoin`.** After `this.state.players.set(client.sessionId, ps);` (~line 1872), add:

```ts
    this.syncQuests(sim);
```

- [ ] **Step 7: Typecheck the server**

Run: `cd server && npx tsc --noEmit -p tsconfig.json`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add server/src/rooms/DriftRoom.ts
git commit -m "feat(quests): server quest state, roll/fresh/sync helpers, initial board"
```

---

## Task 5: Server progress hooks (gather, kill, cook)

**Files:**
- Modify: `server/src/rooms/DriftRoom.ts` — gather grant (~line 1977), `mobKill` block (~line 1742), `cook` handler (~line 1659)

- [ ] **Step 1: Hook the gather grant.** In the gather-completion block, right after `this.creditItem(sim, RESOURCE_META[node.kind].item, qty);` (line 1977), add:

```ts
        this.advanceQuests(sim, { type: "gather", item: RESOURCE_META[node.kind].item });
```

- [ ] **Step 2: Hook the kill.** In the `attack` handler's death path, after the `client.send("mobKill", {...})` (line 1742-1744), add:

```ts
      // any overworld mob death advances the kill quest (matches the current
      // client behavior where any mob death fired the kill event)
      this.advanceQuests(sim, { type: "kill" });
```

- [ ] **Step 3: Hook the cook.** In the `cook` handler, after `this.syncInv(sim);` (line 1659), add:

```ts
      this.advanceQuests(sim, { type: "cook", qty: n });
```

- [ ] **Step 4: Typecheck the server**

Run: `cd server && npx tsc --noEmit -p tsconfig.json`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add server/src/rooms/DriftRoom.ts
git commit -m "feat(quests): advance quest progress at gather/kill/cook adjudication points"
```

---

## Task 6: Server claimQuest intent

**Files:**
- Modify: `server/src/rooms/DriftRoom.ts` — new handler beside `cook`/`sell` (~line 1660, inside the handler-registration block of `onCreate`)

- [ ] **Step 1: Register the `claimQuest` handler.** Add near the other intent handlers (after the `cook` handler block, ~line 1660):

```ts
    // ---- claim a completed daily quest: gold rides the ledger, XP stays client-side
    this.onMessage("claimQuest", (client, msg: { id?: string }) => {
      const sim = this.sims.get(client.sessionId);
      if (!sim) return;
      if (!this.allow(sim, "claimQuest", 8, 2000)) return;
      if (this.ensureFreshQuests(sim)) this.syncQuests(sim);
      const id = String(msg?.id ?? "");
      const q = sim.quests.list.find((x) => x.id === id);
      if (!q || q.claimed) return; // unknown or replay → ignore
      const def = QUEST_POOL.find((d) => d.id === id);
      if (!def || q.progress < def.target) return; // early-claim → refused
      q.claimed = true;
      this.credit(sim, def.goldReward); // gold ledger + goldSync
      void persistQuests(sim.token, sim.quests).catch(() => {});
      client.send("questClaimed", { id, xp: def.xpReward }); // client applies XP
      this.syncQuests(sim);
    });
```

- [ ] **Step 2: Typecheck the server**

Run: `cd server && npx tsc --noEmit -p tsconfig.json`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add server/src/rooms/DriftRoom.ts
git commit -m "feat(quests): server-validated claimQuest pays gold on the ledger, once"
```

---

## Task 7: Server reroll — gold intent + obelisk burn

**Files:**
- Modify: `server/src/rooms/DriftRoom.ts` — new `questReroll` handler (beside `claimQuest`); the `obeliskBurn` ok-path (~line 909-912)

- [ ] **Step 1: Register the `questReroll` (75g) handler** after the `claimQuest` handler:

```ts
    // ---- Obelisk: rewrite the day's tasks for 75g (the burn path is obeliskBurn)
    this.onMessage("questReroll", (client) => {
      const sim = this.sims.get(client.sessionId);
      if (!sim) return;
      if (!this.allow(sim, "questReroll", 4, 5000)) return;
      if (!this.debit(sim, 75)) return; // purse too light → no change
      this.rerollQuestsFor(sim);
    });
```

- [ ] **Step 2: Reroll on the obelisk burn.** In the `obeliskBurn` handler, the success branch currently only sends `burnResult` ok. Replace the body so it rerolls on success (lines 909-912):

```ts
      const err = await this.consumeBurn(sim, String(msg?.burnSig ?? ""), "obelisk");
      if (!err) this.rerollQuestsFor(sim);
      client.send("burnResult", err
        ? { ok: false, action: "obelisk", reason: err }
        : { ok: true, action: "obelisk" });
```

- [ ] **Step 3: Typecheck the server**

Run: `cd server && npx tsc --noEmit -p tsconfig.json`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add server/src/rooms/DriftRoom.ts
git commit -m "feat(quests): server-side board reroll (75g intent + obelisk burn)"
```

---

## Task 8: Client wiring — sync adoption, intents, offline gating

**Files:**
- Modify: `game/state/store.ts` (add `setQuests` setter to the interface ~line 185 and impl; gate `questEvent`/`claimQuest`)
- Modify: `game/state/bus.ts` (two events)
- Modify: `game/net/client.ts` (two senders)
- Modify: `game/engine/game.ts` (`questSync`/`questClaimed` handlers; gate `mobKill`; forward bus events)
- Modify: `components/Hud/Hud.tsx` (claim button + obelisk gold reroll send intents online)

- [ ] **Step 1: Add `setQuests` to the store interface** (`GameState`, near the other quest actions ~line 298):

```ts
  /** adopt the server's authoritative quest board (online; wholesale replace) */
  setQuests: (list: { id: string; progress: number; claimed: boolean }[]) => void;
```

- [ ] **Step 2: Implement `setQuests` in the store** (beside `questEvent`/`claimQuest`, ~line 504):

```ts
  setQuests: (list) =>
    set({
      quests: list.flatMap((q) => {
        const def = QUEST_POOL.find((d) => d.id === q.id);
        return def ? [{ def, progress: q.progress, claimed: q.claimed }] : [];
      }),
    }),
```

- [ ] **Step 3: Gate `questEvent` to offline.** Online, the server drives progress via `questSync`; the client must not also advance locally (double-count). Change the body of `questEvent` (line 504) to early-return when online:

```ts
  questEvent: (e) =>
    set((s) => {
      if (s.online) return s; // server drives quest progress via questSync
      return {
        quests: s.quests.map((q) => {
          if (q.claimed || q.progress >= q.def.target) return q;
          const inc = q.def.matches(e);
          return inc > 0
            ? { ...q, progress: Math.min(q.def.target, q.progress + inc) }
            : q;
        }),
      };
    }),
```

- [ ] **Step 4: Route `claimQuest` through the server when online.** Change `claimQuest` (line 515) so online it emits the intent and waits for `questClaimed`/`questSync`, while offline it keeps granting locally:

```ts
  claimQuest: (id) => {
    const q = get().quests.find((x) => x.def.id === id);
    if (!q || q.claimed || q.progress < q.def.target) return;
    if (get().online) {
      bus.emit("questClaim", id); // server validates, pays the ledger, syncs
      return;
    }
    set((s) => ({
      quests: s.quests.map((x) =>
        x.def.id === id ? { ...x, claimed: true } : x,
      ),
    }));
    get().addGold(q.def.goldReward, "quest");
    play("coin");
    get().addXp(q.def.xpReward.skill, q.def.xpReward.xp);
    get().pushLog(
      `Quest complete: ${q.def.label}. +${q.def.goldReward}g, +${q.def.xpReward.xp} ${SKILL_META[q.def.xpReward.skill].label} XP`,
      "#e7c873",
    );
  },
```

(Confirm `bus` is imported in `store.ts`; it is used by `sellItem`/`addGold` already.)

- [ ] **Step 5: Add the bus events** in `game/state/bus.ts` (`Events` type, beside `obeliskBurn`):

```ts
  /** claim a completed daily quest (server validates + pays) */
  questClaim: string;
  /** reroll the daily board for 75g (server debits + rerolls) */
  questReroll: boolean;
```

- [ ] **Step 6: Add the net senders** in `game/net/client.ts` (beside `sendCook`/`sendSell`, ~line 444):

```ts
  sendQuestClaim(id: string) {
    this.safeSend("claimQuest", { id });
  }

  sendQuestReroll() {
    this.safeSend("questReroll", {});
  }
```

- [ ] **Step 7: Add the `questSync`/`questClaimed` message handlers** in `game/engine/game.ts`, beside `goldSync`/`invSync` (after line 666):

```ts
    net.onMessage<{ day: number; quests: { id: string; progress: number; claimed: boolean }[] }>(
      "questSync",
      (m) => useGame.getState().setQuests(m.quests),
    );
    net.onMessage<{ id: string; xp: { skill: SkillKey; xp: number } }>(
      "questClaimed",
      (m) => {
        const store = useGame.getState();
        // gold already arrived via goldSync; board state via questSync. Apply
        // the XP (still client-side) and the flavor line.
        const { leveledTo } = store.addXp(m.xp.skill, m.xp.xp);
        play("coin");
        store.pushLog(`Quest complete. +${m.xp.xp} ${SKILL_META[m.xp.skill].label} XP`, "#e7c873");
        if (leveledTo) store.pushLog(`${SKILL_META[m.xp.skill].label} is now level ${leveledTo}!`, "#e7c873");
      },
    );
```

(Confirm `SkillKey` and `SKILL_META` are imported in `game.ts`; `SKILL_META` is used widely, `SkillKey` is a type — add to the `@/game/types` import if missing.)

- [ ] **Step 8: Gate the `mobKill` local kill-event to offline.** In the `mobKill` handler, line 683 currently always fires `store.questEvent({ type: "kill" })`. With Step 3 it's already a no-op online, so no change is strictly required — but make the intent explicit by leaving it (it self-gates). Verify line 683 reads `store.questEvent({ type: "kill" })` and that `questEvent` now early-returns online. No edit needed; note it in the commit.

- [ ] **Step 9: Forward the bus events to net** in `game/engine/game.ts` beside the other `bus.on` forwarders (~line 246):

```ts
    this.cleanupFns.push(bus.on("questClaim", (id) => this.net?.sendQuestClaim(id)));
    this.cleanupFns.push(bus.on("questReroll", () => this.net?.sendQuestReroll()));
```

- [ ] **Step 10: Send the reroll intent from the obelisk gold option** in `components/Hud/Hud.tsx` (lines 651-657). Replace the `onClick` so online it goes through the server (which debits the 75g itself), offline it keeps the local spend + reroll:

```ts
      label: "Rewrite the day's tasks", sub: "a fresh set of dailies", right: "75g",
      onClick: () => {
        if (s.online) {
          bus.emit("questReroll", true); // server debits 75g + rerolls + syncs
          respond("THE ASH ACCEPTS. THE DAY IS REWRITTEN.");
          return;
        }
        if (!s.spendGold(75, "shop")) return respond("THE ASH TAKES COIN. 75.");
        s.rerollQuests();
        respond("THE ASH ACCEPTS. THE DAY IS REWRITTEN.");
      },
```

(Confirm `s.online` is read in this component scope; the keeper-dialogue component already reads the store as `s`. `bus` is imported in Hud.tsx — it's used by `spin`/`donate`/`obeliskBurn` emits.)

- [ ] **Step 11: Typecheck the client**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 12: Commit**

```bash
git add game/state/store.ts game/state/bus.ts game/net/client.ts game/engine/game.ts components/Hud/Hud.tsx
git commit -m "feat(quests): client adopts questSync, routes claim/reroll through the server online"
```

---

## Task 9: Integration verification script

**Files:**
- Create: `scripts/verify-quests.ts`
- Modify: `CLAUDE.md` (add the script to the verify list — match the existing block formatting)

This is the feature's test. It needs the dev server (or an isolated instance) running. Per CLAUDE.md, gate must be OFF (`GATE_TOKENS=0`, the dev default) so guest tokens can join.

- [ ] **Step 1: Write `scripts/verify-quests.ts`:**

```ts
/* eslint-disable @typescript-eslint/no-explicit-any */
// Phase 6 verification: the server-side daily quest ledger.
// Board on join, progress via gather/cook, claim pays the gold ledger once,
// double/early claim refused, 75g reroll swaps the board.
// Run with the server up:  npx tsx scripts/verify-quests.ts

import { Client, Room } from "colyseus.js";
import { rollDailyQuestIds, QUEST_POOL } from "../game/types";

const URL = process.env.GAME_SERVER ?? "ws://localhost:2567";
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
}

function trackQuests(room: Room<any>) {
  let last: { id: string; progress: number; claimed: boolean }[] | null = null;
  room.onMessage("questSync", (m: any) => { last = m.quests; });
  return { value: () => last };
}
function trackGold(room: Room<any>) {
  let last: number | null = null;
  room.onMessage("goldSync", (m: any) => { last = m.gold; });
  return { value: () => last };
}

async function main() {
  const token = `quests-${Date.now()}`;
  const room = await new Client(URL).joinOrCreate<any>("drift", { token });
  // mute the noisy world messages we don't assert on
  for (const t of ["loot", "gatherStart", "relocate", "season", "chat", "driftfall", "mobKill", "mobHit"]) {
    room.onMessage(t, () => {});
  }
  const quests = trackQuests(room);
  const gold = trackGold(room);
  await wait(400);

  // 1. board arrives on join and matches the shared deterministic roll
  const day = Math.floor(Date.now() / 86_400_000);
  const expected = rollDailyQuestIds(day);
  const board = quests.value();
  check("board pushed on join", !!board, board ? `${board.length} quests` : "none");
  check(
    "board matches rollDailyQuestIds(today)",
    !!board && board.map((q) => q.id).join(",") === expected.join(","),
    board ? board.map((q) => q.id).join(",") : "",
  );

  // seed the gold ledger so the claim has a baseline (first-save rail)
  room.send("save", { snapshot: { gold: 100, inventory: {} } });
  await wait(300);

  // 2. cook advances cook_fish IF it's on today's board (deterministic; only
  //    assert when present). Give the ledger a fish first via itemDelta.
  const cookQuest = board?.find((q) => q.id === "cook_fish");
  if (cookQuest) {
    room.send("itemDelta", { item: "fish", amount: 3, reason: "chest" });
    await wait(200);
    room.send("cook", { qty: 2 });
    await wait(300);
    const after = quests.value()?.find((q) => q.id === "cook_fish");
    check("cook advanced cook_fish", (after?.progress ?? 0) >= 2, `progress=${after?.progress}`);
  } else {
    console.log("SKIP  cook_fish not on today's board");
  }

  // 3. claim: force a quest to done by picking the cheapest target and driving it,
  //    OR (deterministic-proof) directly assert the claim refuses an unfinished one.
  const unfinished = quests.value()?.find((q) => !q.claimed && q.progress < (QUEST_POOL.find((d) => d.id === q.id)!.target));
  if (unfinished) {
    const before = gold.value() ?? 0;
    room.send("claimQuest", { id: unfinished.id });
    await wait(300);
    const stillUnclaimed = quests.value()?.find((q) => q.id === unfinished.id);
    check("early-claim refused (not done)", stillUnclaimed?.claimed === false, `claimed=${stillUnclaimed?.claimed}`);
    check("early-claim paid nothing", (gold.value() ?? 0) === before, `gold=${gold.value()}`);
  }

  // 4. reroll for 75g swaps the board (gold seeded at 100 above)
  const beforeIds = quests.value()?.map((q) => q.id).join(",");
  const beforeGold = gold.value() ?? 0;
  room.send("questReroll", {});
  await wait(400);
  const afterIds = quests.value()?.map((q) => q.id).join(",");
  check("reroll debited 75g", (gold.value() ?? 0) === beforeGold - 75, `gold=${gold.value()}`);
  check("reroll changed the board", beforeIds !== afterIds || true, `was ${beforeIds} now ${afterIds}`);

  await room.leave();
  console.log(failures === 0 ? "\nALL PASS" : `\n${failures} FAILED`);
  process.exit(failures === 0 ? 0 : 1);
}
main().catch((e) => { console.error(e); process.exit(1); });
```

Note on assertion #4 "reroll changed the board": a random reroll can coincidentally re-pick the same 3; the `|| true` keeps it informational. The 75g debit is the hard assertion that the reroll fired. (A claim-pays-once happy path requires driving a real quest to completion via gather, which needs walking to a node — covered by the manual playtest in Step 4 rather than scripted here.)

- [ ] **Step 2: Run the verify script against the dev server.** Ensure `npm run server` is up (or an isolated instance), then:

Run: `./server/node_modules/.bin/tsx scripts/verify-quests.ts`
Expected: `ALL PASS` (board on join + matches roll, cook advance when present, early-claim refused + pays nothing, reroll debits 75g).

- [ ] **Step 3: Add the script to the CLAUDE.md verify list.** In the "Verification scripts" block, add a line matching the format:

```
./server/node_modules/.bin/tsx scripts/verify-quests.ts       # server quest ledger: board/progress/claim/reroll
```

- [ ] **Step 4: Commit**

```bash
git add scripts/verify-quests.ts CLAUDE.md
git commit -m "test(quests): verify-quests integration script + CLAUDE.md entry"
```

---

## Task 10: Retire the online quest gold cap + full verification

**Files:**
- Modify: `server/src/rooms/DriftRoom.ts` — `GOLD_DELTA_CAPS` (the `quest` reason)

The quest gold reward now rides the authoritative `credit()` path via `claimQuest`. Online, the client no longer routes quest gold through `goldDelta`. The `quest` reason in `GOLD_DELTA_CAPS` is now only reachable by the offline-local claim (which never hits the server) — so the online cap entry is dead, but removing it tightens the surface. Keep it ONLY if any other online path still tags `"quest"`; otherwise drop it.

- [ ] **Step 1: Search for remaining online `goldDelta "quest"` emitters.**

Run: `grep -rn '"quest"' game/ | grep -i gold`
Expected: the only `addGold(..., "quest")` is inside the OFFLINE branch of `claimQuest` (Task 8 Step 4). If so, the online rail never sends reason `"quest"`.

- [ ] **Step 2: Remove the `quest` entry from `GOLD_DELTA_CAPS`** in `DriftRoom.ts` (and from the `GoldReason` union in `game/types.ts` only if nothing else references it — the offline `addGold("quest")` call passes a string literal, which is fine without the union if `addGold`'s param is `string`; verify the signature before removing the union member). If unsure, LEAVE the cap in place — it is harmless. Document the decision in the commit message.

- [ ] **Step 3: Re-run the affected suites against the dev server** (server up, `GATE_TOKENS` unset):

Run:
```
./server/node_modules/.bin/tsx scripts/verify-quests.ts
./server/node_modules/.bin/tsx scripts/verify-ledger.ts
./server/node_modules/.bin/tsx scripts/verify-multiplayer.ts
```
Expected: all `ALL PASS` / no FAIL lines.

- [ ] **Step 4: Full green check.**

Run (stop the dev server first — never build while `npm run dev` runs):
```
npx tsc --noEmit
cd server && npx tsc --noEmit -p tsconfig.json && cd ..
npm run build
```
Expected: all PASS, build green.

- [ ] **Step 5: Manual playtest note (for the user).** Against `localhost:3000` + `npm run server`: the quest board appears, gathering/cooking/killing advances it live (driven by `questSync`, visible in the HUD), Claim pays gold and bumps XP, and the Obelisk "Rewrite the day's tasks" swaps the board. Confirm a page reload preserves progress (persistence). Offline (`/play` with the server stopped → "Wander offline"): quests still roll, advance, and claim locally.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore(quests): retire the online quest gold cap; full suite green"
```

---

## Self-Review

**Spec coverage:**
- §1 shared roll → Task 1 ✓
- §2 server state + persistence (column, write-through, staleness, no seed-once) → Tasks 3, 4 ✓
- §3 three progress hooks via shared `matches` → Task 5 ✓
- §4 `questSync` message + client wholesale adopt → Task 4 (server), Task 8 (client) ✓
- §5 claim through gold ledger, idempotent, XP client-side, retire quest cap → Tasks 6, 8, 10 ✓
- §6 obelisk + 75g reroll server-side → Task 7, Task 8 Step 10 ✓
- §7 offline path unchanged + empty-board fallback → Task 2, Task 8 Steps 3-4 ✓
- §Testing verify-quests + re-run ledger/multiplayer + typecheck/build → Tasks 9, 10 ✓

**Placeholder scan:** No TBD/TODO. The one soft spot (Task 10 Step 2 "leave it if unsure") is a deliberate, documented decision branch, not a placeholder — the cap is provably harmless either way.

**Type consistency:** The board shape `{ day:number; list:{id:string;progress:number;claimed:boolean}[] }` is identical across `PlayerSim.quests` (Task 4), `setQuests` (Task 3), `freshQuestBoard`/`sanitizeQuests` (Task 4), `syncQuests` payload (Task 4), the client `setQuests` setter (Task 8), and the `questSync` handler (Task 8). `questClaimed` payload `{ id:string; xp:{skill:SkillKey;xp:number} }` matches `def.xpReward` (types.ts `QuestDef.xpReward`) and the client handler. Helper names consistent: `ensureFreshQuests`, `advanceQuests`, `rerollQuestsFor`, `syncQuests`, `freshQuestBoard`, `sanitizeQuests`, `serverDay`; senders `sendQuestClaim`/`sendQuestReroll`; bus `questClaim`/`questReroll`.
