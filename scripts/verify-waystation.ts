/* eslint-disable @typescript-eslint/no-explicit-any */
// Phase B verification: the waystation fast-travel network + its DRIFTS-burn
// teleport gate. Covers the parts testable WITHOUT devnet — the network shape,
// the departure gate (must stand at a waygate), destination validation, and
// that the burn gate holds (no teleport without a verified burn). The
// successful teleport itself rides consumeBurn, devnet-verified like
// verify-burns. Run with the server up:  npx tsx scripts/verify-waystation.ts
import { Client, Room } from "colyseus.js";
import { WAYSTATIONS, waystationAt, TOWN_CENTER } from "@/game/world/tilemap";

const URL = process.env.GAME_SERVER ?? "ws://localhost:2567";
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
}
const MUTE = ["loot", "gatherStart", "relocate", "season", "chat", "driftfall",
  "profile", "goldSync", "invSync", "questSync", "mobKill"];
function mute(room: Room<any>) { for (const t of MUTE) room.onMessage(t, () => {}); }
function once<T>(room: Room<any>, type: string, ms = 4000): Promise<T | null> {
  return new Promise((resolve) => {
    const to = setTimeout(() => resolve(null), ms);
    room.onMessage(type, (m: any) => { clearTimeout(to); resolve(m); });
  });
}
const me = (room: Room<any>) => room.state.players.get(room.sessionId);

async function walkTo(room: Room<any>, x: number, y: number, within = 2) {
  for (let i = 0; i < 60; i++) {
    room.send("move", { x, y });
    await wait(400);
    const p = me(room);
    if (p && Math.max(Math.abs(p.x - x), Math.abs(p.y - y)) <= within) return true;
  }
  return false;
}

async function main() {
  // ---- network shape (the shared truth server + client both read) ---------------
  check("waystation network exists (>= 4 nodes)", WAYSTATIONS.length >= 4, `${WAYSTATIONS.length} waygates`);
  const hubIdx = waystationAt(TOWN_CENTER.x, TOWN_CENTER.y + 6);
  check("a hub waygate stands near town", hubIdx >= 0, `hub idx=${hubIdx}`);
  check("town center is NOT a waygate (departure must be earned)",
    waystationAt(TOWN_CENTER.x, TOWN_CENTER.y) < 0);

  const token = `way-${Date.now()}`;
  const a = await new Client(URL).joinOrCreate<any>("drift", { token });
  mute(a);
  a.send("identity", { name: "Leyfarer" });
  a.send("save", { snapshot: { gold: 500, day: 0 } });
  await wait(500);

  // ---- departure gate: travel from open ground is refused -----------------------
  const start = me(a);
  const startPos = { x: start.x, y: start.y };
  let r = once<any>(a, "burnResult");
  a.send("waystationTravel", { to: 1, burnSig: "x".repeat(88) });
  let res = await r;
  check("travel from open ground refused", res?.ok === false && /stand at a waystation/i.test(res?.reason ?? ""),
    res?.reason ?? "no response");
  await wait(300);
  const afterGate = me(a);
  check("refused travel did not move the wanderer",
    Math.abs(afterGate.x - startPos.x) < 4 && Math.abs(afterGate.y - startPos.y) < 4,
    `at (${afterGate.x.toFixed(1)},${afterGate.y.toFixed(1)})`);

  // ---- walk to the hub waygate --------------------------------------------------
  const hub = WAYSTATIONS[hubIdx];
  const arrived = await walkTo(a, hub.x, hub.y + 2, 2);
  check("reached the hub waygate on foot", arrived,
    `at (${me(a).x.toFixed(1)},${me(a).y.toFixed(1)}) hub=(${hub.x},${hub.y})`);

  // ---- destination validation (at a waygate now) --------------------------------
  r = once<any>(a, "burnResult");
  a.send("waystationTravel", { to: 999, burnSig: "x".repeat(88) });
  res = await r;
  check("unknown destination refused", res?.ok === false && /no such waygate/i.test(res?.reason ?? ""),
    res?.reason ?? "no response");

  r = once<any>(a, "burnResult");
  a.send("waystationTravel", { to: hubIdx, burnSig: "x".repeat(88) });
  res = await r;
  check("travel to your own waygate refused", res?.ok === false && /already stand/i.test(res?.reason ?? ""),
    res?.reason ?? "no response");

  // ---- the burn gate holds: no verified burn → no teleport ----------------------
  const dest = hubIdx === 0 ? 1 : 0;
  const before = me(a);
  const beforePos = { x: before.x, y: before.y };
  r = once<any>(a, "burnResult");
  a.send("waystationTravel", { to: dest, burnSig: "not-a-real-burn-signature" });
  res = await r;
  check("travel without a verified burn refused", res?.ok === false, res?.reason ?? "no response");
  await wait(400);
  const after = me(a);
  check("the leap did not happen (still at the hub)",
    Math.max(Math.abs(after.x - beforePos.x), Math.abs(after.y - beforePos.y)) < 6,
    `at (${after.x.toFixed(1)},${after.y.toFixed(1)})`);

  await a.leave();
  if (failures === 0) console.log("\nWaystation network verified (gates hold; teleport rides the devnet burn rail).");
  else console.log(`\n${failures} check(s) FAILED.`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
