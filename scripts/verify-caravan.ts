/* eslint-disable @typescript-eslint/no-explicit-any */
// Caravan verification: boots its OWN server (port 2599, throwaway PGlite dir,
// compressed timers via env), then walks a full run with two escort clients:
// depart → ambush → kills across both escorts → waveCleared (× waves) →
// arrival → pro-rata payouts. Also checks raiderKill is rejected while idle.
// Run from repo root:  ./server/node_modules/.bin/tsx scripts/verify-caravan.ts

import { spawn } from "node:child_process";
import { rmSync } from "node:fs";
import { resolve } from "node:path";
import { Client, Room } from "colyseus.js";

const PORT = 2599;
const WS_URL = `ws://localhost:${PORT}`;
const DATA_DIR = `/tmp/driftlands-verify-caravan-${Date.now()}`;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` (${detail})` : ""}`);
  if (!ok) failures++;
}

const MUTE = [
  "loot", "gatherStart", "relocate", "season", "chat", "driftfall", "profile",
  "claimPlaced", "claimFallen", "listResult", "unlistResult", "buyResult", "sold",
  "bankResult", "spinResult", "cleansing", "propResult", "challenged",
  "duelStart", "duelHp", "duelEnd", "claimResult",
  "caravanDepart", "ambush", "waveCleared", "caravanLost", "caravanArrived", "caravanPayout",
];
function mute(room: Room<any>) {
  for (const t of MUTE) room.onMessage(t, () => {});
}

/** wait until pred(state) holds (poll; schema patches land continuously) */
async function until(room: Room<any>, pred: (s: any) => boolean, timeoutMs: number, label: string): Promise<boolean> {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    if (pred(room.state)) return true;
    await wait(100);
  }
  console.log(`      …timeout waiting for ${label}`);
  return false;
}

async function main() {
  // ---- boot an isolated server with a fast caravan timeline -------------------
  const server = spawn("./node_modules/.bin/tsx", ["src/index.ts"], {
    cwd: resolve(process.cwd(), "server"), // run from repo root
    env: {
      ...process.env,
      PORT: String(PORT),
      DRIFT_DATA_DIR: DATA_DIR,
      CARAVAN_FIRST_S: "3",     // first wagon 3s after boot
      CARAVAN_PERIOD_S: "600",  // no second run during the test
      CARAVAN_SPEED: "3",       // brisk wagon, test stays under a minute
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const ready = await new Promise<boolean>((resolve) => {
    const to = setTimeout(() => resolve(false), 30_000);
    server.stdout.on("data", (d: Buffer) => {
      if (d.toString().includes("listening")) { clearTimeout(to); resolve(true); }
    });
    server.stderr.on("data", (d: Buffer) => process.stderr.write(`[server] ${d}`));
    server.on("exit", () => resolve(false));
  });
  check("isolated server boots", ready);
  if (!ready) return finish(server, 1);

  try {
    // ---- join two escorts ------------------------------------------------------
    const a = await new Client(WS_URL).joinOrCreate<any>("drift", { token: `caravan-a-${Date.now()}` });
    const b = await new Client(WS_URL).joinOrCreate<any>("drift", { token: `caravan-b-${Date.now()}` });
    mute(a); mute(b);
    await until(a, (s) => s.w > 0, 5000, "initial state");
    check("caravan state synced", !!a.state.caravan, `phase=${a.state.caravan?.phase}`);

    // kills before any ambush must not count
    a.send("raiderKill");
    await wait(400);
    check("raiderKill ignored while idle", a.state.caravan.waveKills === 0);

    // ---- departure ---------------------------------------------------------------
    const departed = await until(a, (s) => s.caravan.phase !== "idle", 15_000, "departure");
    check("wagon departs", departed, `run=${a.state.caravan.run}`);
    check("gate on the map edge", (() => {
      const c = a.state.caravan;
      return c.gateX === 0 || c.gateY === 0 || c.gateX === a.state.w - 1 || c.gateY === a.state.h - 1;
    })());
    const x0 = a.state.caravan.x, y0 = a.state.caravan.y;
    await wait(1200);
    const moved = Math.hypot(a.state.caravan.x - x0, a.state.caravan.y - y0);
    check("wagon position advances", a.state.caravan.phase !== "rolling" || moved > 0.5, `moved ${moved.toFixed(1)} tiles`);

    const waves = () => a.state.caravan.waves as number;
    let payA = 0, payB = 0, paidKillsA = 0;
    a.onMessage("caravanPayout", (m: any) => { payA = m.gold; paidKillsA = m.kills; });
    b.onMessage("caravanPayout", (m: any) => { payB = m.gold; });
    let arrived: any = null;
    a.onMessage("caravanArrived", (m: any) => { arrived = m; });
    let lost = false;
    a.onMessage("caravanLost", () => { lost = true; });

    // ---- escort every wave -------------------------------------------------------
    let clearedWaves = 0;
    for (let w = 1; w <= waves() + 2 && !arrived && !lost; w++) {
      const ambushed = await until(a, (s) => s.caravan.phase === "ambushed" || !!arrived || lost, 30_000, `ambush ${w}`);
      if (arrived || lost) break;
      if (!ambushed) break;
      const c = a.state.caravan;
      const need = c.waveNeed as number;
      check(`wave ${c.wave}/${c.waves} ambush declared`, need >= 3, `need ${need} kills`);
      const hpBefore = c.hp;
      // both escorts run to the wagon (server walks them; kills need proximity)
      a.send("move", { x: Math.round(c.x), y: Math.round(c.y) });
      b.send("move", { x: Math.round(c.x), y: Math.round(c.y) });
      // report kills (A does the heavy lifting → bigger payout share)
      let sent = 0;
      const t0 = Date.now();
      while (a.state.caravan.phase === "ambushed" && Date.now() - t0 < 25_000) {
        const before = a.state.caravan.waveKills;
        const fromA = sent % 3 !== 2; // A:B kill ratio 2:1
        (fromA ? a : b).send("raiderKill");
        sent++;
        await wait(350);
        if (a.state.caravan.waveKills === before && a.state.caravan.phase === "ambushed") {
          await wait(350); // still walking into range; try again
        }
      }
      if (w === 1) check("wagon bleeds while ambushed", hpBefore <= 100 && a.state.caravan.hp < 100);
      const clearedNow = a.state.caravan.phase !== "ambushed";
      check(`wave ${w} cleared by escort kills`, clearedNow);
      if (clearedNow) clearedWaves++;
    }
    check("all waves cleared", clearedWaves >= waves(), `${clearedWaves}/${waves()}`);

    // ---- arrival + payouts ---------------------------------------------------------
    const t0 = Date.now();
    while (!arrived && !lost && Date.now() - t0 < 30_000) await wait(200);
    check("caravan arrives at the gate", !!arrived && !lost);
    if (arrived) {
      check("payout pool announced", arrived.pool >= 100, `pool=${arrived.pool}`);
      check("both escorts in the payout list", arrived.payouts.length === 2,
        JSON.stringify(arrived.payouts));
      await wait(500);
      check("escort A paid live", payA > 0, `${payA}g for ${paidKillsA} kills`);
      check("escort B paid live", payB > 0, `${payB}g`);
      check("pro-rata: heavy lifter earns more", payA >= payB, `A=${payA}g B=${payB}g`);
    }
    check("caravan resets to idle", await until(a, (s) => s.caravan.phase === "idle", 5000, "idle reset"));

    a.leave(); b.leave();
  } catch (e) {
    console.error("THROW", e);
    failures++;
  }
  finish(server, failures === 0 ? 0 : 1);
}

function finish(server: ReturnType<typeof spawn>, code: number) {
  server.kill();
  try { rmSync(DATA_DIR, { recursive: true, force: true }); } catch {}
  console.log(failures === 0 ? "\nCaravan run verified end-to-end." : `\n${failures} caravan checks FAILED.`);
  process.exit(code);
}

main();
