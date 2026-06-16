/* eslint-disable @typescript-eslint/no-explicit-any */
// Cluster B: waystation gold fast-travel. Walk to a waygate → leap to another for
// gold (position changes, gold debited); leaping from off a waygate is refused.
// Run against an ISOLATED server (gate OFF):
//   cd server && DRIFT_DATA_DIR=/tmp/ft PORT=2598 CARAVAN_FIRST_S=9999 npx tsx src/index.ts
//   GAME_SERVER=ws://localhost:2598 npx tsx scripts/verify-fasttravel.ts
import { Client, Room } from "colyseus.js";
import { WAYSTATIONS, waystationAt } from "../game/world/tilemap";
import { WAYSTATION_GOLD } from "../game/types";

const URL = process.env.GAME_SERVER ?? "ws://localhost:2598";
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
let fails = 0;
const check = (n: string, ok: boolean, d = "") => { console.log(`${ok ? "PASS" : "FAIL"}  ${n}${d ? ` — ${d}` : ""}`); if (!ok) fails++; };
function silence(room: Room<any>) {
  for (const t of ["loot", "gatherStart", "relocate", "season", "chat", "driftfall", "mobKill", "mobHit", "questSync", "bountySync", "repSync", "burnResult"]) room.onMessage(t, () => {});
}
async function walkTo(room: any, x: number, y: number, ms = 25000) {
  room.send("move", { x, y });
  const end = Date.now() + ms;
  while (Date.now() < end) {
    const me = room.state.players.get(room.sessionId);
    if (me && Math.hypot(me.x - x, me.y - y) <= 2) return true;
    await wait(400);
  }
  return false;
}
// approach a waystation by trying walkable cells around its (solid) footprint
async function walkToWaystation(room: any, ws: { x: number; y: number }, ms = 30000) {
  const offsets = [[0, 3], [3, 0], [0, -3], [-3, 0], [2, 2], [-2, 2], [2, -2], [-2, -2]];
  const end = Date.now() + ms;
  for (const [dx, dy] of offsets) {
    room.send("move", { x: ws.x + dx, y: ws.y + dy });
    const t = Date.now() + 6000;
    while (Date.now() < t && Date.now() < end) {
      const me = room.state.players.get(room.sessionId);
      if (me && waystationAt(Math.round(me.x), Math.round(me.y)) >= 0) return true;
      await wait(400);
    }
  }
  return false;
}
async function main() {
  const room = await new Client(URL).joinOrCreate<any>("drift", { token: `ft-${Date.now()}` });
  silence(room);
  let gold: number | null = null, traveled: any = null;
  room.onMessage("goldSync", (m: any) => { gold = m.gold; });
  room.onMessage("traveled", (m: any) => { traveled = m; });
  await wait(600);
  room.send("save", { snapshot: { gold: 500, inventory: {} } });
  await wait(400);

  // walk to waystation 0
  const w0 = WAYSTATIONS[0], w1 = WAYSTATIONS[1];
  const at0 = await walkToWaystation(room, w0);
  const me0 = room.state.players.get(room.sessionId);
  check("walked to a waygate", at0 && waystationAt(Math.round(me0.x), Math.round(me0.y)) >= 0, `@${me0?.x?.toFixed(1)},${me0?.y?.toFixed(1)}`);

  // leap to waystation 1 for gold
  const g0 = gold ?? 0;
  room.send("waystationGoldTravel", { to: 1 });
  await wait(700);
  const me1 = room.state.players.get(room.sessionId);
  check("gold debited for the leap", (gold ?? 0) === g0 - WAYSTATION_GOLD, `gold ${g0} -> ${gold} (-${WAYSTATION_GOLD})`);
  check("teleported to the far waygate", Math.hypot(me1.x - w1.x, me1.y - w1.y) <= 4, `@${me1.x.toFixed(1)},${me1.y.toFixed(1)} vs ${w1.x},${w1.y}`);
  check("traveled message sent", !!traveled && traveled.to === 1);

  // leap from OFF a waygate → refused
  await walkTo(room, room.state.w >> 1, room.state.h >> 1);
  const off = waystationAt(Math.round((room.state.players.get(room.sessionId)).x), Math.round((room.state.players.get(room.sessionId)).y)) < 0;
  if (off) {
    const g1 = gold ?? 0;
    const me2 = room.state.players.get(room.sessionId);
    const before = { x: me2.x, y: me2.y };
    room.send("waystationGoldTravel", { to: 0 });
    await wait(600);
    const me3 = room.state.players.get(room.sessionId);
    check("leap refused away from a waygate", (gold ?? 0) === g1 && Math.hypot(me3.x - before.x, me3.y - before.y) < 3, `gold=${gold}`);
  } else { console.log("SKIP  could not move off a waygate"); }

  await room.leave();
  console.log(fails === 0 ? "\nALL PASS" : `\n${fails} FAILED`);
  process.exit(fails === 0 ? 0 : 1);
}
main().catch((e) => { console.error(e); process.exit(1); });
