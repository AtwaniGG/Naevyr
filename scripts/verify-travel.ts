/* eslint-disable @typescript-eslint/no-explicit-any */
// Travel layer verification: roads + the gold-bought Stable steed. SELF-HOSTED
// (port 2590, GATE_TOKENS unset so it stays open). Covers: the shared
// effectiveMoveSpeed channel + road-network determinism (unit), buyMount gold
// debit + ownership persistence across reconnect, non-owner mount rejection,
// the mount toggle syncing to the schema, and a behavioural check that a
// mounted wanderer outruns an unmounted one over the same path.
// Run from repo root:  ./server/node_modules/.bin/tsx scripts/verify-travel.ts

import { spawn } from "node:child_process";
import { rmSync } from "node:fs";
import { resolve } from "node:path";
import { Client, Room } from "colyseus.js";
import {
  effectiveMoveSpeed, MOVE_ROAD_MUL, MOVE_MOUNT_MUL, MOVE_SPEED_CAP,
  PLAYER_BASE_SPEED, MOUNT_COST,
} from "@/game/types";
import { buildRoadNetwork, roadAt, MAP_W, MAP_H } from "@/game/world/tilemap";

const PORT = 2590;
const URL = `ws://localhost:${PORT}`;
const DATA_DIR = `/tmp/naevyr-verify-travel-${Date.now()}`;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
}

const MUTE = [
  "loot", "gatherStart", "relocate", "season", "chat", "driftfall", "profile",
  "claimPlaced", "claimFallen", "invSync", "caravanDepart", "ambush",
  "waveCleared", "caravanLost", "caravanArrived", "caravanPayout", "mobHit",
  "mobKill", "colossus",
];
function mute(room: Room<any>) { for (const t of MUTE) room.onMessage(t, () => {}); }

function selfPS(room: Room<any>): any {
  return (room.state.players as Map<string, any>).get(room.sessionId) ?? {};
}
const pos = (room: Room<any>) => { const p = selfPS(room); return { x: p.x ?? 0, y: p.y ?? 0 }; };
const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);

/** drive a standing-start run toward target T for `ms`, return distance covered */
async function runFrom(room: Room<any>, T: { x: number; y: number }, ms: number): Promise<number> {
  const start = pos(room);
  room.send("move", { x: T.x, y: T.y });
  await wait(ms);
  return dist(start, pos(room));
}

/** walk back to S and wait until standing there again */
async function returnTo(room: Room<any>, S: { x: number; y: number }) {
  for (let i = 0; i < 20; i++) {
    room.send("move", { x: Math.round(S.x), y: Math.round(S.y) });
    await wait(700);
    if (dist(pos(room), S) < 0.7) return;
  }
}

async function main() {
  // ---- unit: the shared speed channel + road-network determinism ----------------
  check("base speed unchanged", effectiveMoveSpeed({}) === PLAYER_BASE_SPEED, `${effectiveMoveSpeed({})}`);
  check("road speeds travel up", effectiveMoveSpeed({ onRoad: true }) === PLAYER_BASE_SPEED * MOVE_ROAD_MUL);
  check("mount speeds travel up", effectiveMoveSpeed({ mounted: true }) === PLAYER_BASE_SPEED * MOVE_MOUNT_MUL);
  check("the Drift severs the road bonus on corrupt ground",
    effectiveMoveSpeed({ onRoad: true, corrupt: true }) === PLAYER_BASE_SPEED);
  check("combined multiplier is capped",
    effectiveMoveSpeed({ onRoad: true, mounted: true }) === PLAYER_BASE_SPEED * MOVE_SPEED_CAP,
    `cap ${MOVE_SPEED_CAP}`);

  const r1 = buildRoadNetwork(MAP_W, MAP_H);
  const r2 = buildRoadNetwork(MAP_W, MAP_H);
  check("road network is non-empty", r1.size > 50, `${r1.size} cells`);
  check("road network is deterministic (memoised, identical set)", r1 === r2 && r1.size === r2.size);
  const sample = [...r1][0];
  check("roadAt agrees with the set", roadAt(MAP_W, MAP_H, sample % MAP_W, (sample / MAP_W) | 0));

  // ---- boot an isolated server --------------------------------------------------
  const server = spawn("./node_modules/.bin/tsx", ["src/index.ts"], {
    cwd: resolve(process.cwd(), "server"),
    env: { ...process.env, PORT: String(PORT), DRIFT_DATA_DIR: DATA_DIR, CARAVAN_FIRST_S: "9999", MOB_COUNT: "0" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const ready = await new Promise<boolean>((res) => {
    const to = setTimeout(() => res(false), 30_000);
    server.stdout.on("data", (d: Buffer) => { if (d.toString().includes("listening")) { clearTimeout(to); res(true); } });
    server.stderr.on("data", (d: Buffer) => process.stderr.write(`[server] ${d}`));
    server.on("exit", () => res(false));
  });
  check("isolated server boots", ready);
  if (!ready) { server.kill(); process.exit(1); }
  const cleanup = () => { server.kill(); try { rmSync(DATA_DIR, { recursive: true, force: true }); } catch {} };

  try {
    const token = `travel-${Date.now()}`;
    const room = await new Client(URL).joinOrCreate<any>("drift", { token });
    mute(room);
    let gold = -1;
    room.onMessage("goldSync", (m: any) => { gold = m.gold; });
    const mountMsgs: any[] = [];
    room.onMessage("mountResult", (m: any) => mountMsgs.push(m));
    await wait(600);

    // ---- seed a purse via the first-save rail -----------------------------------
    room.send("save", { snapshot: { gold: 5000 } });
    await wait(500);
    check("purse seeded via first save", gold === 5000, `gold=${gold}`);

    // ---- buy a steed: gold debited exactly MOUNT_COST ---------------------------
    room.send("buyMount");
    await wait(700);
    check("buyMount confirmed ok", mountMsgs.some((m) => m.ok), JSON.stringify(mountMsgs));
    check("gold debited exactly MOUNT_COST", gold === 5000 - MOUNT_COST, `gold=${gold} (want ${5000 - MOUNT_COST})`);

    // ---- buying twice is refused (already owned) --------------------------------
    mountMsgs.length = 0;
    room.send("buyMount");
    await wait(500);
    check("second buy refused (already owns)", mountMsgs.some((m) => !m.ok), JSON.stringify(mountMsgs));
    check("no double-charge on the refused buy", gold === 5000 - MOUNT_COST, `gold=${gold}`);

    // ---- the mount toggle syncs to the schema -----------------------------------
    room.send("mount", { on: true });
    await wait(400);
    check("mounted flag syncs true", selfPS(room).mounted === true);
    room.send("mount", { on: false });
    await wait(400);
    check("dismount flag syncs false", selfPS(room).mounted === false);

    // ---- a non-owner cannot mount ----------------------------------------------
    const room2 = await new Client(URL).joinOrCreate<any>("drift", { token: `travel-poor-${Date.now()}` });
    mute(room2);
    await wait(500);
    room2.send("mount", { on: true });
    await wait(500);
    check("non-owner mount rejected", selfPS(room2).mounted !== true, `mounted=${selfPS(room2).mounted}`);
    await room2.leave();

    // ---- behavioural: mounted outruns unmounted over the same path --------------
    // find a direction where an unmounted standing-start run actually covers ground
    let best: { T: { x: number; y: number }; d1: number } | null = null;
    const S0 = pos(room);
    for (const [dx, dy] of [[0, -14], [14, 0], [-14, 0], [0, 14], [10, 10], [-10, -10]] as const) {
      const S = pos(room);
      const T = { x: Math.round(S.x + dx), y: Math.round(S.y + dy) };
      const d1 = await runFrom(room, T, 1600);
      if (d1 > 3) { best = { T, d1 }; break; }
      await returnTo(room, S0);
    }
    check("found a clear run for the speed test", best !== null, best ? `covered ${best!.d1.toFixed(1)}` : "no open direction");
    if (best) {
      await returnTo(room, S0);
      room.send("mount", { on: true });
      await wait(400);
      const d2 = await runFrom(room, best.T, 1600);
      check("mounted outruns unmounted over the same path", d2 > best.d1 + 1,
        `unmounted ${best.d1.toFixed(1)} vs mounted ${d2.toFixed(1)} tiles`);
      room.send("mount", { on: false });
    }

    // ---- ownership survives a reconnect (server column persisted) ---------------
    await room.leave();
    await wait(400);
    const room3 = await new Client(URL).joinOrCreate<any>("drift", { token });
    mute(room3);
    const prof = await new Promise<any>((res) => {
      const to = setTimeout(() => res(null), 6000);
      room3.onMessage("profile", (m: any) => { clearTimeout(to); res(m); });
      room3.send("getProfile");
    });
    check("steed ownership survives reconnect", prof?.ownsMount === true, `ownsMount=${prof?.ownsMount}`);
    await room3.leave();
  } finally {
    await wait(200);
    cleanup();
  }

  console.log(failures === 0 ? "\nAll travel checks passed." : `\n${failures} travel checks FAILED.`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
