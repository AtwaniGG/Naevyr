/* eslint-disable @typescript-eslint/no-explicit-any */
// Living economy: daily login streak + the streak leaderboard board.
// A new UTC day records the streak; the gold reward pays for SEEDED (returning)
// ledgers and is deferred for a brand-new account so it can't block the
// first-save gold seed (regression: that clobbered a new player's starting gold).
// Same-day reconnect is idempotent; the streak surfaces on GET /leaderboard.
// Run isolated:
//   cd server && DRIFT_DATA_DIR=/tmp/st PORT=2598 CARAVAN_FIRST_S=9999 npx tsx src/index.ts
//   GAME_SERVER=ws://localhost:2598 npx tsx scripts/verify-streak.ts
import { Client } from "colyseus.js";

const WS = process.env.GAME_SERVER ?? "ws://localhost:2598";
const HTTP = WS.replace(/^ws/, "http");
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
let fails = 0;
const check = (n: string, ok: boolean, d = "") => { console.log(`${ok ? "PASS" : "FAIL"}  ${n}${d ? ` — ${d}` : ""}`); if (!ok) fails++; };
function listen(room: any) {
  for (const t of ["loot", "gatherStart", "relocate", "season", "chat", "driftfall", "mobKill", "mobHit", "questSync", "bountySync", "repSync"]) room.onMessage(t, () => {});
  let streak: any = null, gold: number | null = null;
  room.onMessage("streakSync", (m: any) => { streak = m; });
  room.onMessage("goldSync", (m: any) => { gold = m.gold; });
  return { streak: () => streak, gold: () => gold };
}

async function main() {
  const token = `streak-${Date.now()}`;
  // 1. fresh (brand-new, unseeded) token → streak 1, reward DEFERRED (0)
  const r1 = await new Client(WS).joinOrCreate<any>("drift", { token });
  const t1 = listen(r1);
  await wait(900);
  check("fresh token starts a streak", t1.streak()?.streak === 1, `streak=${t1.streak()?.streak}`);
  check("reward deferred on a brand-new (unseeded) ledger", t1.streak()?.reward === 0, `reward=${t1.streak()?.reward}`);

  // 2. REGRESSION: the first-save gold seed must still land (not blocked by the
  //    streak credit). Seed 500 → the ledger should read 500, not a streak value.
  r1.send("save", { snapshot: { gold: 500, inventory: {} } });
  await wait(600);
  check("first-save gold seed not clobbered by the streak", t1.gold() === 500, `gold=${t1.gold()}`);
  await r1.leave();
  await wait(500);

  // 3. same-day reconnect → streak unchanged, no reward (idempotent)
  const r2 = await new Client(WS).joinOrCreate<any>("drift", { token });
  const t2 = listen(r2);
  await wait(900);
  check("same-day reconnect keeps the streak", t2.streak()?.streak === 1, `streak=${t2.streak()?.streak}`);
  check("same-day reconnect pays nothing again", t2.streak()?.reward === 0, `reward=${t2.streak()?.reward}`);
  await r2.leave();

  // 4. the streak surfaces on the leaderboard, and the wealth board still exists
  await wait(400);
  try {
    const boards = await fetch(`${HTTP}/leaderboard`, { signal: AbortSignal.timeout(4000) }).then((r) => r.json());
    check("leaderboard exposes a streak board", Array.isArray(boards.streak), `len=${boards.streak?.length}`);
    check("our streak is on the board", (boards.streak ?? []).some((row: any) => row.value >= 1), JSON.stringify(boards.streak?.slice(0, 3)));
    check("the wealth (gold) board still exists", Array.isArray(boards.gold));
  } catch (e) { check("leaderboard fetch", false, String(e)); }

  console.log(fails === 0 ? "\nALL PASS" : `\n${fails} FAILED`);
  process.exit(fails === 0 ? 0 : 1);
}
main().catch((e) => { console.error(e); process.exit(1); });
