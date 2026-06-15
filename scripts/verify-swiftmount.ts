/* eslint-disable @typescript-eslint/no-explicit-any */
// Cluster B: the Swift Steed stable upgrade. Buy a steed, then the swift upgrade
// (gold debited, flag set + persisted); the upgrade is refused without a steed;
// the shared speed channel is genuinely faster when swift. Run isolated:
//   cd server && DRIFT_DATA_DIR=/tmp/sm PORT=2598 CARAVAN_FIRST_S=9999 npx tsx src/index.ts
//   GAME_SERVER=ws://localhost:2598 npx tsx scripts/verify-swiftmount.ts
import { Client } from "colyseus.js";
import { effectiveMoveSpeed, MOUNT_COST, SWIFT_MOUNT_COST } from "../game/types";

const URL = process.env.GAME_SERVER ?? "ws://localhost:2598";
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
let fails = 0;
const check = (n: string, ok: boolean, d = "") => { console.log(`${ok ? "PASS" : "FAIL"}  ${n}${d ? ` — ${d}` : ""}`); if (!ok) fails++; };

async function main() {
  // 0. the shared speed channel is faster when swift (both ends compute this)
  const m = effectiveMoveSpeed({ mounted: true, onRoad: true });
  const sw = effectiveMoveSpeed({ mounted: true, swift: true, onRoad: true });
  check("swift steed is faster on the road", sw > m, `${m.toFixed(2)} -> ${sw.toFixed(2)} tiles/s`);

  const token = `swift-${Date.now()}`;
  const room = await new Client(URL).joinOrCreate<any>("drift", { token });
  for (const t of ["loot", "gatherStart", "relocate", "season", "chat", "driftfall", "mobKill", "mobHit", "questSync", "bountySync", "repSync"]) room.onMessage(t, () => {});
  let gold: number | null = null; const results: any[] = [];
  room.onMessage("goldSync", (x: any) => { gold = x.gold; });
  room.onMessage("mountResult", (x: any) => results.push(x));
  await wait(600);
  room.send("save", { snapshot: { gold: 10000, inventory: {} } });
  await wait(400);

  // 1. swift refused without a steed
  results.length = 0;
  room.send("buySwiftMount", {});
  await wait(400);
  check("swift refused without a steed", results.some((r) => !r.ok), results[0]?.reason ?? "");

  // 2. buy the steed
  const g0 = gold ?? 0;
  results.length = 0;
  room.send("buyMount", {});
  await wait(500);
  check("bought a steed", results.some((r) => r.ok && r.owns) && (gold ?? 0) === g0 - MOUNT_COST, `gold ${g0} -> ${gold}`);

  // 3. buy the swift upgrade
  const g1 = gold ?? 0;
  results.length = 0;
  room.send("buySwiftMount", {});
  await wait(500);
  check("bought the swift upgrade", results.some((r) => r.ok && r.swift) && (gold ?? 0) === g1 - SWIFT_MOUNT_COST, `gold ${g1} -> ${gold}`);

  // 4. persists across reconnect (profile carries ownsSwiftMount)
  await room.leave();
  await wait(500);
  const room2 = await new Client(URL).joinOrCreate<any>("drift", { token });
  for (const t of ["loot", "gatherStart", "relocate", "season", "chat", "driftfall", "mobKill", "mobHit", "questSync", "bountySync", "repSync", "goldSync"]) room2.onMessage(t, () => {});
  let prof: any = null;
  room2.onMessage("profile", (x: any) => { prof = x; });
  room2.send("getProfile", {});
  await wait(1200);
  check("swift steed persists across reconnect", !!prof && prof.ownsMount === true && prof.ownsSwiftMount === true, `owns=${prof?.ownsMount}, swift=${prof?.ownsSwiftMount}`);
  await room2.leave();

  console.log(fails === 0 ? "\nALL PASS" : `\n${fails} FAILED`);
  process.exit(fails === 0 ? 0 : 1);
}
main().catch((e) => { console.error(e); process.exit(1); });
