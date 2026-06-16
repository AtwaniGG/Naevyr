/* eslint-disable @typescript-eslint/no-explicit-any */
// Phase 6 verification: shared server-side mobs. SELF-HOSTED (port 2592,
// BOSS_PCTS=0 so a Colossus rises immediately). Covers: schema presence, den
// pack placement, attack range gating, the server-side swing rate cap,
// engagement + retaliation, ledger-paid kill loot, ambient respawn, and the
// shared Colossus (spawn + kill + 50g/5-shard ledger payout).
// Run from repo root:  ./server/node_modules/.bin/tsx scripts/verify-mobs.ts

import { spawn } from "node:child_process";
import { rmSync } from "node:fs";
import { resolve } from "node:path";
import { Client, Room } from "colyseus.js";
import { WILD_STRUCTURES } from "@/game/world/tilemap";

const DEN = WILD_STRUCTURES.find((s) => s.key === "huskden")!;

const PORT = 2592;
const URL = `ws://localhost:${PORT}`;
const DATA_DIR = `/tmp/naevyr-verify-mobs-${Date.now()}`;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
}

const MUTE = [
  "loot", "gatherStart", "relocate", "season", "chat", "driftfall", "profile",
  "claimPlaced", "claimFallen", "goldSync", "invSync", "caravanDepart",
  "ambush", "waveCleared", "caravanLost", "caravanArrived", "caravanPayout",
  "mobHit", "mobKill",
];
function mute(room: Room<any>) {
  for (const t of MUTE) room.onMessage(t, () => {});
}

interface MobSnap {
  id: number; kind: string; level: number;
  x: number; y: number; hp: number; maxHp: number; state: string;
}
function mobs(room: Room<any>): MobSnap[] {
  const out: MobSnap[] = [];
  (room.state.mobs as Map<string, MobSnap>).forEach((m) => out.push({ ...m }));
  return out;
}
function mobById(room: Room<any>, id: number): MobSnap | null {
  return mobs(room).find((m) => m.id === id) ?? null;
}
function self(room: Room<any>): { x: number; y: number } {
  const p = (room.state.players as Map<string, any>).get(room.sessionId);
  return { x: p?.x ?? 0, y: p?.y ?? 0 };
}
const cheby = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.max(Math.abs(Math.round(a.x) - Math.round(b.x)), Math.abs(Math.round(a.y) - Math.round(b.y)));

async function main() {
  // ---- boot an isolated server with an instant Colossus ---------------------------
  const server = spawn("./node_modules/.bin/tsx", ["src/index.ts"], {
    cwd: resolve(process.cwd(), "server"),
    env: {
      ...process.env,
      PORT: String(PORT),
      DRIFT_DATA_DIR: DATA_DIR,
      CARAVAN_FIRST_S: "9999",
      BOSS_PCTS: "0", // the Colossus rises with the realm
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
  if (!ready) { server.kill(); process.exit(1); }
  const cleanup = () => {
    server.kill();
    try { rmSync(DATA_DIR, { recursive: true, force: true }); } catch {}
  };

  const room = await new Client(URL).joinOrCreate<any>("drift", {
    token: `mobs-${Date.now()}`,
  });
  mute(room);
  await wait(600);

  // ---- presence -----------------------------------------------------------------
  const all = mobs(room);
  check("shared mobs in the schema", all.length >= 10, `${all.length} mobs`);
  const den = all.filter(
    (m) => m.kind === "husk" && m.level === 5 &&
      Math.max(Math.abs(m.x - DEN.x), Math.abs(m.y - DEN.y)) <= 6,
  );
  check("den pack holds the Husk Den (lv5 elites)", den.length >= 3, `${den.length}/5 near (${DEN.x},${DEN.y})`);

  // ---- range gate: a swing from across the map does nothing ------------------------
  const me = self(room);
  const ambient = (m: MobSnap) =>
    m.state !== "dead" && m.kind !== "colossus" && !den.some((d) => d.id === m.id);
  const far = [...all].filter(ambient).sort((a, b) => cheby(me, b) - cheby(me, a))[0];
  check("found a far target", !!far && cheby(me, far) > 2, `dist=${far ? cheby(me, far) : "?"}`);
  room.send("attack", { id: far.id, dmg: 50 });
  await wait(500);
  check("attack out of range ignored", mobById(room, far.id)!.hp === far.hp,
    `hp ${far.hp} → ${mobById(room, far.id)!.hp}`);

  // ---- approach + engage the nearest ambient beast (den elites never respawn) ---------
  const target = [...all].filter(ambient).sort((a, b) => cheby(me, a) - cheby(me, b))[0];
  let gotHit = false;
  room.onMessage("mobHit", () => { gotHit = true; });
  const invBox: { inv: Record<string, number> | null } = { inv: null };
  room.onMessage("invSync", (m: any) => { invBox.inv = m.inv; });

  let engaged = false;
  const t0 = Date.now();
  while (Date.now() - t0 < 60_000) {
    const m = mobById(room, target.id)!;
    if (cheby(self(room), m) <= 1) {
      room.send("engage", { id: target.id });
      await wait(350);
      if (mobById(room, target.id)!.state === "engaged") { engaged = true; break; }
    } else {
      room.send("move", { x: Math.round(m.x), y: Math.round(m.y) });
      await wait(1200);
    }
  }
  check("walked to the beast and engaged it", engaged,
    `${Math.round((Date.now() - t0) / 1000)}s, state=${mobById(room, target.id)!.state}`);

  const hpBefore = mobById(room, target.id)!.hp;
  room.send("attack", { id: target.id, dmg: 10 });
  room.send("attack", { id: target.id, dmg: 10 });
  room.send("attack", { id: target.id, dmg: 10 });
  await wait(600);
  check("server swing cap: rapid swings land once", mobById(room, target.id)!.hp === hpBefore - 10,
    `hp ${hpBefore} → ${mobById(room, target.id)!.hp}`);

  await wait(2500);
  check("the beast retaliates (mobHit arrives)", gotHit);

  // ---- the kill: loot lands on the inventory ledger -----------------------------------
  const killMsg = new Promise<any>((res) => {
    const to = setTimeout(() => res(null), 12_000);
    room.onMessage("mobKill", (m: any) => { clearTimeout(to); res(m); });
  });
  for (let i = 0; i < 8; i++) {
    if (mobById(room, target.id)!.state === "dead") break;
    room.send("attack", { id: target.id, dmg: 50 });
    await wait(1000);
  }
  const kill = await killMsg;
  check("kill confirmed by the server", kill !== null && kill.id === target.id,
    kill ? `${kill.kind} lv${kill.level}` : "timed out");
  check("beast marked dead in the schema", mobById(room, target.id)!.state === "dead");
  await wait(300);
  check("shard loot landed on the inventory ledger", (invBox.inv?.driftshard ?? 0) >= 1,
    `shards=${invBox.inv?.driftshard}`);

  // ---- respawn -------------------------------------------------------------------------
  let respawned = false;
  const r0 = Date.now();
  while (Date.now() - r0 < 15_000) {
    const m = mobById(room, target.id)!;
    if (m.state !== "dead" && m.hp === m.maxHp) { respawned = true; break; }
    await wait(500);
  }
  check("ambient beast respawns (6-10s)", respawned, `${Math.round((Date.now() - r0) / 1000)}s`);

  // ---- the shared Colossus ---------------------------------------------------------------
  const boss = mobs(room).find((m) => m.kind === "colossus");
  check("a Colossus rises with the realm (BOSS_PCTS=0)", !!boss && boss?.maxHp === 140,
    boss ? `hp ${boss.hp}/${boss.maxHp} at ${Math.round(boss.x)},${Math.round(boss.y)}` : "absent");
  if (boss) {
    const goldBox: { gold: number } = { gold: -1 };
    room.onMessage("goldSync", (m: any) => { goldBox.gold = m.gold; });
    const bossKill = new Promise<any>((res) => {
      const to = setTimeout(() => res(null), 75_000);
      room.onMessage("mobKill", (m: any) => {
        if (m.kind === "colossus") { clearTimeout(to); res(m); }
      });
    });
    const t1 = Date.now();
    while (Date.now() - t1 < 75_000) {
      const m = mobById(room, boss.id);
      if (!m || m.state === "dead") break;
      if (cheby(self(room), m) <= 1) {
        room.send("attack", { id: boss.id, dmg: 50 });
        await wait(950);
      } else {
        room.send("move", { x: Math.round(m.x), y: Math.round(m.y) });
        await wait(800);
      }
    }
    const bk = await bossKill;
    check("Colossus falls to server-validated swings (140 hp)", bk !== null,
      bk ? `xp=${bk.xp}` : "timed out");
    await wait(300);
    check("Colossus pays 50g + 5 shards on the ledgers",
      bk?.gold === 50 && bk?.shards === 5 && goldBox.gold >= 50 &&
        (invBox.inv?.driftshard ?? 0) >= 6,
      `gold=${goldBox.gold} shards=${invBox.inv?.driftshard}`);
  }

  await room.leave();
  cleanup();
  console.log(failures === 0 ? "\nAll shared-mob checks passed." : `\n${failures} check(s) FAILED.`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("verify-mobs crashed:", e);
  process.exit(1);
});
