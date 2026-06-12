/* eslint-disable @typescript-eslint/no-explicit-any */
// Phase 6 verification: the server-side daily quest ledger.
// Board on join + matches the shared roll, cook advances cook_fish when present,
// early-claim refused (no payout), 75g reroll debits gold + swaps the board.
// Run with a server up:  npx tsx scripts/verify-quests.ts
//   (gate OFF — GATE_TOKENS unset/0 — so a guest token can join)

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
  for (const t of ["loot", "gatherStart", "relocate", "season", "chat", "driftfall", "mobKill", "mobHit", "invSync", "questClaimed"]) {
    room.onMessage(t, () => {});
  }
  const quests = trackQuests(room);
  const gold = trackGold(room);
  await wait(500);

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

  // seed gold (100) + fish (5) via the first-save rail
  room.send("save", { snapshot: { gold: 100, inventory: { fish: 5 } } });
  await wait(400);

  // 2. cook advances cook_fish IF it's on today's board
  const cookQuest = board?.find((q) => q.id === "cook_fish");
  if (cookQuest) {
    room.send("cook", { qty: 2 });
    await wait(400);
    const after = quests.value()?.find((q) => q.id === "cook_fish");
    check("cook advanced cook_fish", (after?.progress ?? 0) >= 2, `progress=${after?.progress}`);
  } else {
    console.log("SKIP  cook_fish not on today's board");
  }

  // 3. early-claim (progress < target) is refused and pays nothing
  const unfinished = quests.value()?.find(
    (q) => !q.claimed && q.progress < (QUEST_POOL.find((d) => d.id === q.id)!.target),
  );
  if (unfinished) {
    const before = gold.value() ?? 0;
    room.send("claimQuest", { id: unfinished.id });
    await wait(400);
    const still = quests.value()?.find((q) => q.id === unfinished.id);
    check("early-claim refused (still unclaimed)", still?.claimed === false, `claimed=${still?.claimed}`);
    check("early-claim paid nothing", (gold.value() ?? 0) === before, `gold=${gold.value()}`);
  } else {
    console.log("SKIP  no unfinished quest to test early-claim");
  }

  // 4. reroll for 75g swaps the board and debits gold
  const beforeIds = quests.value()?.map((q) => q.id).join(",");
  const beforeGold = gold.value() ?? 0;
  room.send("questReroll", {});
  await wait(500);
  const afterIds = quests.value()?.map((q) => q.id).join(",");
  check("reroll debited 75g", (gold.value() ?? 0) === beforeGold - 75, `gold ${beforeGold} -> ${gold.value()}`);
  console.log(`INFO  board ${beforeIds} -> ${afterIds}`);

  await room.leave();

  // 5. full happy path on a SECOND client: drive cook_fish to completion and
  //    claim it (proves the cook progress hook + claim pays on the ledger once).
  //    cook_fish is deterministic per day, so reroll until it surfaces.
  const token2 = `quests-cook-${Date.now()}`;
  const r2 = await new Client(URL).joinOrCreate<any>("drift", { token: token2 });
  for (const t of ["loot", "gatherStart", "relocate", "season", "chat", "driftfall", "mobKill", "mobHit", "invSync", "questClaimed"]) {
    r2.onMessage(t, () => {});
  }
  const q2 = trackQuests(r2);
  const g2 = trackGold(r2);
  await wait(400);
  // seed a deep purse (rerolls cost 75g each) and a stack of fish
  r2.send("save", { snapshot: { gold: 5000, inventory: { fish: 30 } } });
  await wait(400);
  let tries = 0;
  while (!q2.value()?.some((q) => q.id === "cook_fish") && tries < 20) {
    r2.send("questReroll", {});
    tries++;
    await wait(250);
  }
  const hasCook = q2.value()?.some((q) => q.id === "cook_fish");
  check("cook_fish reachable via reroll", !!hasCook, `after ${tries} rerolls`);
  if (hasCook) {
    const target = QUEST_POOL.find((d) => d.id === "cook_fish")!.target; // 5
    const reward = QUEST_POOL.find((d) => d.id === "cook_fish")!.goldReward;
    r2.send("cook", { qty: target });
    await wait(500);
    const cooked = q2.value()?.find((q) => q.id === "cook_fish");
    check("cook advanced cook_fish to target", (cooked?.progress ?? 0) >= target, `progress=${cooked?.progress}/${target}`);

    const beforeClaim = g2.value() ?? 0;
    r2.send("claimQuest", { id: "cook_fish" });
    await wait(500);
    const claimed = q2.value()?.find((q) => q.id === "cook_fish");
    check("claim marked the quest claimed", claimed?.claimed === true, `claimed=${claimed?.claimed}`);
    check("claim paid the gold reward on the ledger", (g2.value() ?? 0) === beforeClaim + reward, `gold ${beforeClaim} -> ${g2.value()} (+${reward})`);

    // double-claim must not pay again (idempotent)
    const beforeDouble = g2.value() ?? 0;
    r2.send("claimQuest", { id: "cook_fish" });
    await wait(400);
    check("double-claim paid nothing", (g2.value() ?? 0) === beforeDouble, `gold=${g2.value()}`);
  }
  await r2.leave();

  console.log(failures === 0 ? "\nALL PASS" : `\n${failures} FAILED`);
  process.exit(failures === 0 ? 0 : 1);
}
main().catch((e) => { console.error(e); process.exit(1); });
