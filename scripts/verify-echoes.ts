/* eslint-disable @typescript-eslint/no-explicit-any */
// Ambient Echoes verification: boots its OWN server (port 2586, throwaway PGlite
// dir, tiny ECHO_TARGET + fast murmur cadence), then proves the fill-the-gap
// population logic, the wander, the murmur rail, and the isolation guarantees
// (Echoes never deplete nodes, never carry a PlayerSim, never mint anything).
// Run:  ./server/node_modules/.bin/tsx scripts/verify-echoes.ts

import { spawn } from "node:child_process";
import { rmSync } from "node:fs";
import { resolve } from "node:path";
import { Client, Room } from "colyseus.js";

const PORT = 2586;
const WS_URL = `ws://localhost:${PORT}`;
const DATA_DIR = `/tmp/naevyr-verify-echoes-${Date.now()}`;
const ECHO_TARGET = 4; // total presence target the controller aims for
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` (${detail})` : ""}`);
  if (!ok) failures++;
}

const MUTE = [
  "loot", "gatherStart", "relocate", "season", "driftfall", "profile",
  "goldSync", "invSync", "streakSync", "questSync", "bountySync", "passSync",
  "caravanDepart", "caravanArrived", "caravanPayout",
];
function mute(room: Room<any>) {
  for (const t of MUTE) room.onMessage(t, () => {});
}

/** every Echo currently in the synced player map */
function echoes(room: Room<any>): any[] {
  const out: any[] = [];
  (room.state.players as Map<string, any>).forEach((p) => { if (p.echo) out.push(p); });
  return out;
}
/** real (non-Echo) players in the map */
function realCount(room: Room<any>): number {
  let n = 0;
  (room.state.players as Map<string, any>).forEach((p) => { if (!p.echo) n++; });
  return n;
}
function nodeTotal(room: Room<any>): number {
  let sum = 0;
  (room.state.nodes as Map<string, any>).forEach((n) => { sum += n.amount; });
  return sum;
}

/** poll until pred holds (schema patches land continuously) */
async function until(room: Room<any>, pred: () => boolean, timeoutMs: number, label: string): Promise<boolean> {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    if (pred()) return true;
    await wait(150);
  }
  console.log(`      …timeout waiting for ${label}`);
  return false;
}

async function main() {
  // ---- boot an isolated, calm realm with a tiny Echo target -------------------
  const server = spawn("./node_modules/.bin/tsx", ["src/index.ts"], {
    cwd: resolve(process.cwd(), "server"),
    env: {
      ...process.env,
      PORT: String(PORT),
      DRIFT_DATA_DIR: DATA_DIR,
      ECHO_TARGET: String(ECHO_TARGET),
      ECHO_MAX: "5",
      ECHO_CHAT_MIN_S: "1",   // force murmurs fast enough to observe in a test
      ECHO_CHAT_SPAN_S: "1",
      CARAVAN_FIRST_S: "9999", // keep the realm quiet (no events touching nodes)
      RIFT_FIRST_S: "9999",
      BLOOD_MOON_FIRST_S: "9999",
      BOSS_PCTS: "",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const ready = await new Promise<boolean>((res) => {
    const to = setTimeout(() => res(false), 30_000);
    server.stdout.on("data", (d: Buffer) => {
      if (d.toString().includes("listening")) { clearTimeout(to); res(true); }
    });
    server.stderr.on("data", (d: Buffer) => process.stderr.write(`[server] ${d}`));
    server.on("exit", () => res(false));
  });
  check("isolated server boots", ready);
  if (!ready) return finish(server, 1);

  try {
    // ---- one observer: counts as 1 real player → want = TARGET - 1 -------------
    const obs = await new Client(WS_URL).joinOrCreate<any>("drift", { token: `echo-obs-${Date.now()}` });
    const echoChats: { id: string; name: string }[] = [];
    obs.onMessage("chat", (m: any) => { if (typeof m?.id === "string" && m.id.startsWith("echo:")) echoChats.push(m); });
    mute(obs);
    await until(obs, () => obs.state.w > 0, 5000, "initial state");

    const node0 = nodeTotal(obs);

    // fill the gap: with 1 real player and TARGET 4, expect 3 Echoes
    const wantWithObs = ECHO_TARGET - 1;
    const filled = await until(obs, () => echoes(obs).length >= wantWithObs, 25_000, `${wantWithObs} echoes`);
    check("Echoes spawn to fill the gap", filled, `${echoes(obs).length}/${wantWithObs} echoes`);
    check("Echo count never exceeds the ceiling", echoes(obs).length <= 5, `${echoes(obs).length} echoes`);

    // each Echo carries the honesty flag, a name, and a namespaced id
    const sample = echoes(obs);
    check("Echoes flagged echo=true", sample.every((e) => e.echo === true));
    check("Echoes have namespaced ids", sample.every((e) => e.id.startsWith("echo:")), sample.map((e) => e.id).join(","));
    check("Echoes have names + no guild tag", sample.every((e) => e.name && !e.guildTag));

    // they wander: at least one Echo's position changes over a couple seconds
    const pos0 = new Map(sample.map((e) => [e.id, { x: e.x, y: e.y }]));
    await wait(2500);
    const moved = echoes(obs).some((e) => {
      const p = pos0.get(e.id);
      return p && Math.hypot(e.x - p.x, e.y - p.y) > 0.2;
    });
    check("Echoes wander the realm", moved);

    // they murmur on the shared chat rail (fast cadence forced via env)
    const murmured = await until(obs, () => echoChats.length > 0, 20_000, "an Echo murmur");
    check("Echoes murmur on the chat rail", murmured, `${echoChats.length} murmurs`);

    // ---- crowding: two more real players push Echoes back out -------------------
    const a = await new Client(WS_URL).joinOrCreate<any>("drift", { token: `echo-a-${Date.now()}` });
    const b = await new Client(WS_URL).joinOrCreate<any>("drift", { token: `echo-b-${Date.now()}` });
    mute(a); mute(b);
    await until(obs, () => realCount(obs) === 3, 5000, "3 real players");
    // now want = TARGET - 3 = 1: Echoes despawn down toward 1
    const thinned = await until(obs, () => echoes(obs).length <= ECHO_TARGET - 3, 25_000, "echoes thin out");
    check("Echoes fade as real players arrive", thinned, `${echoes(obs).length} echoes with 3 real`);

    // ---- the room empties again: Echoes refill toward the target ---------------
    await a.leave(); await b.leave();
    await until(obs, () => realCount(obs) === 1, 8000, "back to 1 real");
    const refilled = await until(obs, () => echoes(obs).length >= ECHO_TARGET - 1, 25_000, "echoes refill");
    check("Echoes refill when the realm quiets", refilled, `${echoes(obs).length} echoes`);

    // ---- isolation: Echoes never touched the economy ---------------------------
    check("Echoes never deplete resource nodes", nodeTotal(obs) === node0, `nodes ${node0} → ${nodeTotal(obs)}`);

    await obs.leave();
  } catch (e) {
    check("no exceptions during the run", false, (e as Error).message);
  }
  finish(server, failures === 0 ? 0 : 1);
}

function finish(server: ReturnType<typeof spawn>, code: number) {
  server.kill();
  try { rmSync(DATA_DIR, { recursive: true, force: true }); } catch {}
  console.log(failures === 0 ? "\nAmbient Echoes verified end-to-end." : `\n${failures} Echo checks FAILED.`);
  process.exit(code);
}

main();
