/* eslint-disable @typescript-eslint/no-explicit-any */
// Phase C verification: the frontier camps + the new mob species & behaviors.
// Covers camp/boss presence, the ranged behavior (a spitter fires on a player
// in range WITHOUT being engaged), and the summoner (a wight conjures adds).
// Run against a running 80×80 server:  GAME_SERVER=ws://… npx tsx scripts/verify-camps.ts
import { Client, Room } from "colyseus.js";
import { WILD_STRUCTURES } from "@/game/world/tilemap";

const URL = process.env.GAME_SERVER ?? "ws://localhost:2567";
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
}
const MUTE = ["loot", "gatherStart", "relocate", "season", "chat", "driftfall",
  "profile", "goldSync", "invSync", "questSync", "colossus"];
function mute(room: Room<any>) { for (const t of MUTE) room.onMessage(t, () => {}); }
const me = (room: Room<any>) => room.state.players.get(room.sessionId);
function mobs(room: Room<any>): any[] {
  const out: any[] = [];
  room.state.mobs.forEach((m: any) => out.push(m));
  return out;
}
async function walkNear(room: Room<any>, tx: number, ty: number, within: number) {
  for (let i = 0; i < 90; i++) {
    room.send("move", { x: tx, y: ty });
    await wait(400);
    const p = me(room);
    if (p && Math.hypot(p.x - tx, p.y - ty) <= within) return true;
  }
  return false;
}

async function main() {
  // the camps are declared in the shared tilemap (server + client read the same)
  const campKeys = ["drownedruins", "barrowcrypt", "ashwarcamp"];
  const present = campKeys.filter((k) => WILD_STRUCTURES.some((s) => s.key === k));
  check("the three frontier camps exist in the map", present.length === 3, present.join(", "));

  const a = await new Client(URL).joinOrCreate<any>("drift", { token: `camp-${Date.now()}` });
  mute(a);
  a.send("identity", { name: "Campbane" });
  a.send("save", { snapshot: { gold: 200, day: 0, combatLevel: 30 } });
  await wait(700);

  const all = mobs(a);
  const species = new Set(all.map((m) => m.kind));
  check("new species roam the realm (bogwretch/brute/wisp/wight)",
    ["bogwretch", "brute", "wisp", "wight"].some((k) => species.has(k)),
    [...species].join(","));
  const bosses = all.filter((m) => ["drownedking", "barrowlord", "ashwarlord"].includes(m.kind));
  check("camp mini-bosses stand guard", bosses.length >= 1,
    bosses.map((b) => `${b.kind}(${b.maxHp}hp)`).join(", "));
  check("a mini-boss is Colossus-scale (>= 120 hp)", bosses.some((b) => b.maxHp >= 120),
    bosses.map((b) => b.maxHp).join(","));

  // ---- ranged behavior: a spitter fires on a wanderer it never engaged --------
  const ranged = all.filter((m) => (m.kind === "bogwretch" || m.kind === "wisp") && m.state !== "dead")
    .sort((p, q) => Math.hypot(p.x - me(a).x, p.y - me(a).y) - Math.hypot(q.x - me(a).x, q.y - me(a).y));
  if (ranged.length) {
    const target = ranged[0];
    let gotHit = false; let gotBolt = false;
    a.onMessage("mobHit", () => { gotHit = true; });
    a.onMessage("mobFx", (m: any) => { if (m.fx === "bolt") gotBolt = true; });
    // stand a few tiles off — in fire range (5) but NOT adjacent, and never attack
    const near = await walkNear(a, Math.round(target.x), Math.round(target.y), 4);
    check("reached a spitter's range", near, `me=(${me(a).x.toFixed(1)},${me(a).y.toFixed(1)})`);
    await wait(2600);
    check("the spitter fires without being engaged (mobHit)", gotHit);
    check("a ranged bolt FX was broadcast", gotBolt);
  } else {
    check("a spitter was reachable for the ranged test", false, "none in schema");
  }

  // ---- summoner: a wight conjures bonehusk adds while a wanderer is near -------
  const wights = mobs(a).filter((m) => m.kind === "wight" && m.state !== "dead");
  if (wights.length) {
    const w = wights.sort((p, q) => Math.hypot(p.x - me(a).x, p.y - me(a).y) - Math.hypot(q.x - me(a).x, q.y - me(a).y))[0];
    const before = mobs(a).filter((m) => m.kind === "bonehusk").length;
    let gotSummon = false;
    a.onMessage("mobFx", (m: any) => { if (m.fx === "summon") gotSummon = true; });
    await walkNear(a, Math.round(w.x), Math.round(w.y), 5);
    await wait(8000); // a summon cycle (~5.5-6.5s)
    const after = mobs(a).filter((m) => m.kind === "bonehusk").length;
    check("the wight conjured bonehusk adds", after > before || gotSummon, `bonehusk ${before} -> ${after}`);
  } else {
    check("a wight was reachable for the summon test", false, "none in schema (skipped)");
  }

  await a.leave();
  if (failures === 0) console.log("\nFrontier camps + new behaviors verified.");
  else console.log(`\n${failures} check(s) FAILED.`);
  process.exit(failures === 0 ? 0 : 1);
}
main().catch((e) => { console.error(e); process.exit(1); });
