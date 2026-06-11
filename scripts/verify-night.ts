/* eslint-disable @typescript-eslint/no-explicit-any */
// THE LONG NIGHT verification. Two isolated servers with compressed timelines
// (fast seasons, instant trigger, short night, 3-kill quota):
//   A) survive: kills meet the quota → nightEnd survived + dawn cleanse,
//      realm continues (no reset).
//   B) fail: no kills → nightEnd failed → realmReset (season 1, claims wiped,
//      fresh world synced).
// Run from repo root:  ./server/node_modules/.bin/tsx scripts/verify-night.ts

import { spawn } from "node:child_process";
import { rmSync } from "node:fs";
import { resolve } from "node:path";
import { Client, Room } from "colyseus.js";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` (${detail})` : ""}`);
  if (!ok) failures++;
}

const MUTE = [
  "loot", "gatherStart", "relocate", "season", "chat", "driftfall", "profile",
  "caravanDepart", "ambush", "waveCleared", "caravanLost", "caravanArrived",
  "caravanPayout", "claimResult", "claimPlaced", "claimFallen",
  "longNight", "nightEnd", "nightReward", "realmReset", "cleansing", "goldSync",
  "invSync",
];

async function bootServer(port: number, dataDir: string, env: Record<string, string> = {}) {
  const server = spawn("./node_modules/.bin/tsx", ["src/index.ts"], {
    cwd: resolve(process.cwd(), "server"),
    env: {
      ...process.env,
      PORT: String(port),
      DRIFT_DATA_DIR: dataDir,
      CARAVAN_FIRST_S: "9999",
      SEASON_MS: "1200",
      LONG_NIGHT_PCT: "0",   // first season tick triggers the night
      LONG_NIGHT_MS: "6000",
      LONG_NIGHT_KILLS: "3",
      ...env,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const ok = await new Promise<boolean>((res) => {
    const to = setTimeout(() => res(false), 30_000);
    server.stdout.on("data", (d: Buffer) => {
      if (d.toString().includes("listening")) { clearTimeout(to); res(true); }
    });
    server.stderr.on("data", (d: Buffer) => process.stderr.write(`[server] ${d}`));
    server.on("exit", () => res(false));
  });
  return ok ? server : null;
}

function listen(room: Room<any>) {
  const events = new Map<string, any[]>();
  for (const t of MUTE) {
    room.onMessage(t, (m: any) => {
      events.set(t, [...(events.get(t) ?? []), m ?? {}]);
    });
  }
  return {
    async waitFor(type: string, timeoutMs: number): Promise<any | null> {
      const t0 = Date.now();
      while (Date.now() - t0 < timeoutMs) {
        const list = events.get(type);
        if (list?.length) return list[0];
        await wait(100);
      }
      return null;
    },
  };
}

interface MobSnap { id: number; kind: string; x: number; y: number; hp: number; state: string }
function liveRaiders(room: Room<any>): MobSnap[] {
  const out: MobSnap[] = [];
  (room.state.mobs as Map<string, MobSnap>).forEach((m) => {
    if (m.kind === "raider" && m.state !== "dead") out.push({ ...m });
  });
  return out.sort((a, b) => a.id - b.id);
}
function selfPos(room: Room<any>): { x: number; y: number } {
  const p = (room.state.players as Map<string, any>).get(room.sessionId);
  return { x: p?.x ?? 0, y: p?.y ?? 0 };
}
const cheby = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.max(Math.abs(Math.round(a.x) - Math.round(b.x)), Math.abs(Math.round(a.y) - Math.round(b.y)));

/** walk to a shared raider and put it down (server-validated swings) */
async function killRaider(room: Room<any>, id: number, timeoutMs = 15_000): Promise<boolean> {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    const m = (room.state.mobs as Map<string, MobSnap>).get(String(id));
    if (!m || m.state === "dead") return true;
    if (cheby(selfPos(room), m) <= 1) {
      room.send("attack", { id: m.id, dmg: 50 });
      await wait(950);
    } else {
      room.send("move", { x: Math.round(m.x), y: Math.round(m.y) });
      await wait(700);
    }
  }
  return false;
}

const TILE = ["grass", "dirt", "stone", "water", "corrupt"];
function findPlot(state: any): { x: number; y: number } | null {
  const w = state.w;
  const tile = (x: number, y: number) => TILE[state.tiles[y * w + x]];
  outer: for (let y = 2; y < state.h - 2; y++) {
    for (let x = 2; x < w - 2; x++) {
      if (Math.hypot(x - 20, y - 20) < 12) continue;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const t = tile(x + dx, y + dy);
          if (t === "water" || t === "corrupt") continue outer;
        }
      return { x, y };
    }
  }
  return null;
}

async function main() {
  // ---- A: the realm holds ------------------------------------------------------
  {
    const dir = `/tmp/driftlands-night-a-${Date.now()}`;
    // real kills take real walking — give the survive path a longer night
    const server = await bootServer(2594, dir, { LONG_NIGHT_MS: "40000" });
    check("survive-path server boots", !!server);
    if (server) {
      const room = await new Client("ws://localhost:2594").joinOrCreate<any>("drift", { token: `night-a-${Date.now()}` });
      const ev = listen(room);
      const night = await ev.waitFor("longNight", 15_000);
      check("the Long Night falls", !!night, `need=${night?.need} level=${night?.level}`);
      await wait(400); // schema patch lands a tick after the broadcast
      check("night state synced", room.state.nightActive === true && room.state.nightNeed === 3,
        `active=${room.state.nightActive} need=${room.state.nightNeed}`);
      const horde = liveRaiders(room);
      check("the horde stands at the Waystation (shared mobs)", horde.length >= 3,
        `${horde.length} raiders`);
      // hold the line: actually cut down 3 of them
      for (const r of horde.slice(0, 3)) {
        if ((room.state.nightKills as number) >= 3) break;
        await killRaider(room, r.id);
      }
      await wait(400);
      check("real deaths counted", room.state.nightKills >= 3, `${room.state.nightKills}/3`);
      const end = await ev.waitFor("nightEnd", 45_000);
      check("dawn comes (survived)", end?.survived === true, `drift=${end?.driftPct}%`);
      const reward = await ev.waitFor("nightReward", 4000);
      check("defenders rewarded", reward?.gold >= 1, `${reward?.gold}g`);
      await wait(800);
      // NOTE: with LONG_NIGHT_PCT=0 a fresh night may legitimately start right
      // away (prod requires corruption to re-climb past 50% first) — the real
      // assertion is that survival never triggered a realm reset.
      const resetAfterDawn = await ev.waitFor("realmReset", 1500);
      check("realm continues (no reset)", !resetAfterDawn && room.state.season >= 2,
        `season=${room.state.season}`);
      room.leave();
      server.kill();
      rmSync(dir, { recursive: true, force: true });
    }
  }

  // ---- B: the dark wins --------------------------------------------------------
  {
    const dir = `/tmp/driftlands-night-b-${Date.now()}`;
    const server = await bootServer(2594, dir);
    check("fail-path server boots", !!server);
    if (server) {
      const room = await new Client("ws://localhost:2594").joinOrCreate<any>("drift", { token: `night-b-${Date.now()}` });
      const ev = listen(room);
      await wait(400);
      // Phase 6: claims pay from the server ledger — seed the purse first
      room.send("save", { snapshot: { gold: 1000, day: 0 } });
      await wait(300);
      // stake a claim so the reset has something to take
      const plot = findPlot(room.state);
      if (plot) room.send("claim", plot);
      await ev.waitFor("claimResult", 5000);
      const hadClaim = room.state.claims.size > 0;
      check("claim staked before the night", hadClaim);

      const night = await ev.waitFor("longNight", 15_000);
      check("the Long Night falls again", !!night);
      // send nothing: the quota is never met
      const end = await ev.waitFor("nightEnd", 12_000);
      check("the dark wins (failed)", end?.survived === false);
      const reset = await ev.waitFor("realmReset", 6000);
      check("the realm resets", !!reset, `season=${reset?.season}`);
      // check before the next 1.2s season tick: with LONG_NIGHT_PCT=0 a fresh
      // night legitimately re-arms on the first tick of the new realm
      await wait(500);
      check("season back to the start", room.state.season <= 2, `season=${room.state.season}`);
      check("claims wiped with the old realm", room.state.claims.size === 0);
      check("fresh world has nodes", room.state.nodes.size > 10, `${room.state.nodes.size} nodes`);
      check("night cleared after reset", room.state.nightActive === false);
      room.leave();
      server.kill();
      rmSync(dir, { recursive: true, force: true });
    }
  }

  console.log(failures === 0 ? "\nThe Long Night verified: dawn and ruin both." : `\n${failures} night checks FAILED.`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => { console.error("THROW", e); process.exit(1); });
