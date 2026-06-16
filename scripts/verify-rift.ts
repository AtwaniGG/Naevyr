/* eslint-disable @typescript-eslint/no-explicit-any */
// Phase F verification: Drift Rifts + the Blood Moon. Self-hosted on its own
// server (port 2589) with env knobs forcing a rift + a blood moon almost
// immediately. Covers: a rift opens at a frontier cell and spawns the new
// species; killing its guardian clears it and pays the reward; the Blood Moon
// raises on schedule and lowers when its window ends.
//   npx tsx scripts/verify-rift.ts
import { spawn } from "node:child_process";
import { rmSync } from "node:fs";
import { resolve } from "node:path";
import { Client, Room } from "colyseus.js";
import { frontierTier } from "@/game/world/tilemap";

const PORT = 2589;
const DATA = "/tmp/naevyr-verify-rift";
const URL = `ws://localhost:${PORT}`;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
}
const me = (room: Room<any>) => room.state.players.get(room.sessionId);
function mobs(room: Room<any>): any[] { const o: any[] = []; room.state.mobs.forEach((m: any) => o.push(m)); return o; }

async function main() {
  rmSync(DATA, { recursive: true, force: true });
  // detached so we can SIGKILL the whole process group on exit — otherwise the
  // npx → tsx → node grandchild leaks and holds the port for the next run
  const server = spawn(resolve(process.cwd(), "server/node_modules/.bin/tsx"), ["src/index.ts"], {
    cwd: resolve(process.cwd(), "server"),
    env: {
      ...process.env, PORT: String(PORT), DRIFT_DATA_DIR: DATA,
      CARAVAN_FIRST_S: "99999", BOSS_PCTS: "",
      RIFT_FIRST_S: "12", RIFT_KILLS: "1", RIFT_MS: "90000", RIFT_PERIOD_S: "9999",
      BLOOD_MOON_FIRST_S: "16", BLOOD_MOON_MS: "8000", BLOOD_MOON_PERIOD_S: "9999",
    },
    stdio: "ignore",
    detached: true,
  });
  const done = (code: number) => {
    try { process.kill(-server.pid!, "SIGKILL"); } catch { try { server.kill("SIGKILL"); } catch {} }
    rmSync(DATA, { recursive: true, force: true });
    process.exit(code);
  };
  try {
    // wait for boot
    let room: Room<any> | null = null;
    for (let i = 0; i < 40 && !room; i++) {
      await wait(500);
      try { room = await new Client(URL).joinOrCreate<any>("drift", { token: `rift-${Date.now()}` }); } catch { /* not up yet */ }
    }
    if (!room) { check("server booted", false); return done(1); }
    const r = room;
    for (const t of ["loot", "gatherStart", "relocate", "season", "chat", "profile", "goldSync", "invSync", "questSync", "mobHit", "mobFx"]) r.onMessage(t, () => {});
    r.send("identity", { name: "Riftcloser" });
    r.send("save", { snapshot: { gold: 100, day: 0, combatLevel: 40 } });

    let riftMsg: any = null; r.onMessage("rift", (m: any) => { riftMsg = m; });
    let reward: any = null; r.onMessage("riftReward", (m: any) => { reward = m; });
    let ended: any = null; r.onMessage("riftEnd", (m: any) => { ended = m; });
    let bmOn = false, bmOff = false;
    r.onMessage("bloodMoon", (m: any) => { if (m.active) bmOn = true; else bmOff = true; });

    // ---- the rift opens ---------------------------------------------------------
    for (let i = 0; i < 50 && !r.state.riftActive; i++) await wait(500);
    check("a Drift Rift opened on the clock", r.state.riftActive === true, `kills/need=${r.state.riftKills}/${r.state.riftNeed}`);
    check("the rift tore open in the frontier ring",
      frontierTier(r.state.w, r.state.h, r.state.riftX, r.state.riftY) === 2,
      `(${r.state.riftX},${r.state.riftY})`);
    check("the rift announced itself", riftMsg !== null, riftMsg ? `need=${riftMsg.need}` : "no broadcast");
    const guardians = mobs(r).filter((m) => ["bogwretch", "wisp", "brute", "wight"].includes(m.kind)
      && Math.hypot(m.x - r.state.riftX, m.y - r.state.riftY) < 8 && m.state !== "dead");
    check("rift guardians (new species) crawled out", guardians.length >= 1,
      guardians.map((g) => g.kind).join(",") || "none");

    // ---- close it: chase the guardians (they wander) and cut them down ----------
    if (guardians.length) {
      for (let i = 0; i < 140 && r.state.riftActive && r.state.riftKills < r.state.riftNeed; i++) {
        // target the nearest live rift guardian's CURRENT cell (it wanders)
        const live = mobs(r)
          .filter((m) => ["bogwretch", "wisp", "brute", "wight", "bonehusk"].includes(m.kind) && m.state !== "dead"
            && Math.hypot(m.x - r.state.riftX, m.y - r.state.riftY) < 10)
          .sort((p, q) => Math.hypot(p.x - me(r).x, p.y - me(r).y) - Math.hypot(q.x - me(r).x, q.y - me(r).y))[0];
        if (!live) { await wait(300); continue; }
        const p = me(r);
        if (p && Math.max(Math.abs(p.x - live.x), Math.abs(p.y - live.y)) <= 1) {
          r.send("engage", { id: live.id });
          r.send("attack", { id: live.id, dmg: 50 });
        } else {
          r.send("move", { x: Math.round(live.x), y: Math.round(live.y) });
        }
        await wait(300);
      }
      check("cut down a rift guardian (kill counted)", r.state.riftKills >= 1, `kills=${r.state.riftKills}/${r.state.riftNeed}`);
    }

    // ---- the rift seals + pays --------------------------------------------------
    for (let i = 0; i < 20 && r.state.riftActive; i++) await wait(400);
    check("the rift sealed once cleared", r.state.riftActive === false);
    check("clearing the rift paid the reward", reward !== null && reward.gold > 0 && reward.shards > 0,
      reward ? `${reward.gold}g +${reward.shards} shards` : "no reward");
    check("riftEnd reported a cleared rift", ended?.cleared === true, JSON.stringify(ended));

    // ---- Blood Moon rises and sets ---------------------------------------------
    for (let i = 0; i < 60 && !bmOn; i++) await wait(500);
    check("a Blood Moon rose on schedule", bmOn === true);
    check("the schema flagged the blood moon", typeof r.state.bloodMoon === "boolean");
    for (let i = 0; i < 40 && !bmOff; i++) await wait(400);
    check("the Blood Moon set when its window closed", bmOff === true);

    if (failures === 0) console.log("\nDrift Rifts + Blood Moon verified end-to-end.");
    else console.log(`\n${failures} check(s) FAILED.`);
    done(failures === 0 ? 0 : 1);
  } catch (e) { console.error(e); done(1); }
}
main();
