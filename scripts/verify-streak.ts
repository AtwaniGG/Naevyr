/* eslint-disable @typescript-eslint/no-explicit-any */
// Living economy: daily login streak + the streak leaderboard board.
// Fresh token → streak 1, escalating reward credited; same-day reconnect grants
// nothing again (idempotent); the streak surfaces on GET /leaderboard. Run isolated:
//   cd server && DRIFT_DATA_DIR=/tmp/st PORT=2598 CARAVAN_FIRST_S=9999 npx tsx src/index.ts
//   GAME_SERVER=ws://localhost:2598 npx tsx scripts/verify-streak.ts
import { Client } from "colyseus.js";

const WS = process.env.GAME_SERVER ?? "ws://localhost:2598";
const HTTP = WS.replace(/^ws/, "http");
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
let fails = 0;
const check = (n: string, ok: boolean, d = "") => { console.log(`${ok ? "PASS" : "FAIL"}  ${n}${d ? ` — ${d}` : ""}`); if (!ok) fails++; };
function listen(room: any) {
  for (const t of ["loot", "gatherStart", "relocate", "season", "chat", "driftfall", "mobKill", "mobHit", "questSync", "bountySync", "repSync", "goldSync"]) room.onMessage(t, () => {});
  let streak: any = null;
  room.onMessage("streakSync", (m: any) => { streak = m; });
  return () => streak;
}

async function main() {
  const token = `streak-${Date.now()}`;
  // 1. fresh token → streak 1, reward 55 (40 + 1*15)
  const r1 = await new Client(WS).joinOrCreate<any>("drift", { token });
  const s1 = listen(r1);
  await wait(900);
  check("fresh token starts a streak", s1()?.streak === 1, `streak=${s1()?.streak}`);
  check("first-day reward paid", s1()?.reward === 55, `reward=${s1()?.reward}`);
  await r1.leave();
  await wait(500);

  // 2. same-day reconnect → streak unchanged, no reward (idempotent)
  const r2 = await new Client(WS).joinOrCreate<any>("drift", { token });
  const s2 = listen(r2);
  await wait(900);
  check("same-day reconnect keeps the streak", s2()?.streak === 1, `streak=${s2()?.streak}`);
  check("same-day reconnect pays nothing again", s2()?.reward === 0, `reward=${s2()?.reward}`);
  await r2.leave();

  // 3. the streak surfaces on the leaderboard
  await wait(400);
  try {
    const boards = await fetch(`${HTTP}/leaderboard`, { signal: AbortSignal.timeout(4000) }).then((r) => r.json());
    check("leaderboard exposes a streak board", Array.isArray(boards.streak), `streak board len=${boards.streak?.length}`);
    check("our streak is on the board", (boards.streak ?? []).some((row: any) => row.value >= 1), JSON.stringify(boards.streak?.slice(0, 3)));
    check("the wealth (gold) board still exists", Array.isArray(boards.gold));
  } catch (e) { check("leaderboard fetch", false, String(e)); }

  console.log(fails === 0 ? "\nALL PASS" : `\n${fails} FAILED`);
  process.exit(fails === 0 ? 0 : 1);
}
main().catch((e) => { console.error(e); process.exit(1); });
