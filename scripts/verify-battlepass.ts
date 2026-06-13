/* eslint-disable @typescript-eslint/no-explicit-any */
// THE DRIFT LEDGER (battle pass) verification. Self-hosted, isolated servers
// with compressed season clocks. Covers, without needing a devnet burn:
//   - passSync on join (season 1, week 0 challenges match the shared roll)
//   - a weekly challenge advancing + completing banks its season XP → tier
//   - free-track claim pays the ledger; double-claim is idempotent
//   - premium claim refused until the track is unlocked
//   - passOnly relic (tarnished_chalice) is never buyable, but IS relic-kind
//   - season rollover auto-grants earned-but-unclaimed tiers, then resets
// The actual buyPass DRIFTS burn is exercised by verify-economy/verify-burns
// (real devnet). Run from repo root:
//   ./server/node_modules/.bin/tsx scripts/verify-battlepass.ts

import { spawn, ChildProcess } from "node:child_process";
import { rmSync } from "node:fs";
import { resolve } from "node:path";
import { Client, Room } from "colyseus.js";
import { rollWeeklyChallenges, BP_CHALLENGE_POOL } from "../game/types";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` (${detail})` : ""}`);
  if (!ok) failures++;
}

const MUTE = [
  "loot", "gatherStart", "relocate", "season", "chat", "driftfall", "profile",
  "mobKill", "mobHit", "questSync", "questClaimed", "caravanDepart",
];

async function bootServer(port: number, dataDir: string, env: Record<string, string>) {
  const server = spawn("./node_modules/.bin/tsx", ["src/index.ts"], {
    cwd: resolve(process.cwd(), "server"),
    env: {
      ...process.env,
      PORT: String(port),
      DRIFT_DATA_DIR: dataDir,
      CARAVAN_FIRST_S: "9999",
      GATE_TOKENS: "0",
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

function track(room: Room<any>) {
  let pass: any = null;
  let gold: number | null = null;
  const results: any[] = [];
  room.onMessage("passSync", (m: any) => { pass = m; });
  room.onMessage("goldSync", (m: any) => { gold = m.gold; });
  room.onMessage("invSync", () => {});
  room.onMessage("passResult", (m: any) => results.push(m));
  room.onMessage("prestigeResult", (m: any) => results.push({ prestige: m }));
  room.onMessage("relicResult", (m: any) => results.push({ relic: m }));
  for (const t of MUTE) room.onMessage(t, () => {});
  return { pass: () => pass, gold: () => gold, results };
}

async function lifecycle() {
  const dataDir = resolve(process.cwd(), "server/.data/bp-life.nosync");
  rmSync(dataDir, { recursive: true, force: true });
  const epoch = Date.now();
  const server = await bootServer(2587, dataDir, {
    BATTLEPASS_EPOCH_MS: String(epoch),
    BATTLEPASS_PERIOD_MS: String(3_600_000), // 1h: no rollover during the test
  });
  if (!server) { check("lifecycle server booted", false); return null; }
  try {
    const room = await new Client("ws://localhost:2587").joinOrCreate<any>("drift", { token: `bp-${Date.now()}` });
    const t = track(room);
    await wait(600);

    // 1. passSync on join, season 1, week 0 challenges match the shared roll
    const p = t.pass();
    check("passSync pushed on join", !!p, p ? `S${p.season} ${p.name}` : "none");
    const expected = rollWeeklyChallenges(p?.season ?? 1, p?.week ?? 0).sort().join(",");
    const got = (p?.challenges ?? []).map((c: any) => c.id).sort().join(",");
    check("week challenges match rollWeeklyChallenges", expected === got, got);
    check("tier starts at 0", p?.tier === 0, `tier=${p?.tier}`);
    check("premium starts locked", p?.premium === false, `premium=${p?.premium}`);

    // 2. drive bp_cook (cook 25 fish) to completion → banks its XP → tier 1
    const hasCook = (p?.challenges ?? []).some((c: any) => c.id === "bp_cook");
    check("bp_cook present in S1 W0", hasCook);
    const cookDef = BP_CHALLENGE_POOL.find((d) => d.id === "bp_cook")!;
    room.send("save", { snapshot: { gold: 100, inventory: { fish: cookDef.target } } });
    await wait(400);
    room.send("cook", { qty: cookDef.target });
    await wait(600);
    const p2 = t.pass();
    const cook = p2?.challenges.find((c: any) => c.id === "bp_cook");
    check("bp_cook completed", cook?.claimed === true, `progress=${cook?.progress}/${cookDef.target}`);
    check("challenge banked its XP", p2?.xp >= cookDef.passXp, `xp=${p2?.xp}`);
    check("tier advanced past 0", p2?.tier >= 1, `tier=${p2?.tier}`);

    // 3. claim tier 1 free reward (gold 50) on the ledger
    const goldBefore = t.gold() ?? 0;
    room.send("claimPassTier", { tier: 1, track: "free" });
    await wait(500);
    const claimedFree = (t.pass()?.claimedFree ?? []).includes(1);
    check("tier 1 free claimed", claimedFree);
    check("free claim paid gold on the ledger", (t.gold() ?? 0) === goldBefore + 50, `gold ${goldBefore} -> ${t.gold()}`);

    // double-claim pays nothing
    const goldDouble = t.gold() ?? 0;
    room.send("claimPassTier", { tier: 1, track: "free" });
    await wait(400);
    check("double-claim paid nothing", (t.gold() ?? 0) === goldDouble, `gold=${t.gold()}`);

    // 4. premium claim refused while the track is locked
    t.results.length = 0;
    room.send("claimPassTier", { tier: 1, track: "premium" });
    await wait(400);
    const refused = t.results.some((r) => r.ok === false && /Premium/i.test(r.reason ?? ""));
    check("premium claim refused without unlock", refused, JSON.stringify(t.results));
    check("premium stays unclaimed", !(t.pass()?.claimedPremium ?? []).includes(1));

    // 5. the season relic is never buyable (passOnly), but IS relic-kind
    t.results.length = 0;
    room.send("prestige", { key: "tarnished_chalice", burnSig: "x".repeat(88) });
    await wait(400);
    const notBuyable = t.results.some((r) => r.prestige && r.prestige.ok === false && /Unknown rite/i.test(r.prestige.reason));
    check("tarnished_chalice not buyable at the Dyeworks", notBuyable, JSON.stringify(t.results));

    t.results.length = 0;
    room.send("relicList", { key: "tarnished_chalice", price: 100_000 });
    await wait(400);
    // not owned → "You do not own that relic" (proves it passed the tradeable-kind gate)
    const tradeKind = t.results.some((r) => r.relic && r.relic.ok === false && /do not own/i.test(r.relic.reason));
    check("tarnished_chalice is relic-tradeable kind (rejected on ownership, not kind)", tradeKind, JSON.stringify(t.results));

    await room.leave();
    return server;
  } finally { /* server killed by caller */ }
}

async function rollover() {
  const dataDir = resolve(process.cwd(), "server/.data/bp-roll.nosync");
  rmSync(dataDir, { recursive: true, force: true });
  const epoch = Date.now();
  const server = await bootServer(2586, dataDir, {
    BATTLEPASS_EPOCH_MS: String(epoch),
    BATTLEPASS_PERIOD_MS: String(15_000), // season every 15s
  });
  if (!server) { check("rollover server booted", false); return null; }
  try {
    const room = await new Client("ws://localhost:2586").joinOrCreate<any>("drift", { token: `bproll-${Date.now()}` });
    const t = track(room);
    await wait(600);
    const startSeason = t.pass()?.season ?? 1;

    // bank tier 1 by completing bp_cook (in S1 W0), DON'T claim it
    const cookDef = BP_CHALLENGE_POOL.find((d) => d.id === "bp_cook")!;
    room.send("save", { snapshot: { gold: 0, inventory: { fish: cookDef.target } } });
    await wait(400);
    room.send("cook", { qty: cookDef.target });
    await wait(600);
    check("rollover: tier 1 earned (unclaimed)", (t.pass()?.tier ?? 0) >= 1, `tier=${t.pass()?.tier}`);
    const goldBeforeRoll = t.gold() ?? 0;

    // wait out the season, then poke any pass handler — claimPassTier runs
    // ensureFreshBattlePass first, which auto-grants the closing season and resets
    await wait(16_000);
    room.send("claimPassTier", { tier: 1, track: "free" });
    await wait(800);
    const after = t.pass();
    check("season advanced", (after?.season ?? 0) > startSeason, `${startSeason} -> ${after?.season}`);
    check("xp reset on rollover", after?.xp === 0, `xp=${after?.xp}`);
    check("premium reset on rollover", after?.premium === false, `premium=${after?.premium}`);
    // the unclaimed tier-1 free gold (50) was auto-granted before the wipe
    check("rollover auto-granted the unclaimed tier", (t.gold() ?? 0) >= goldBeforeRoll + 50, `gold ${goldBeforeRoll} -> ${t.gold()}`);

    await room.leave();
    return server;
  } finally { /* killed by caller */ }
}

async function main() {
  const a = await lifecycle();
  if (a) { a.kill("SIGKILL"); await wait(500); }
  const b = await rollover();
  if (b) { b.kill("SIGKILL"); await wait(500); }
  // make sure no stray listeners survive
  for (const s of [a, b]) { try { (s as ChildProcess | null)?.kill("SIGKILL"); } catch { /* ignore */ } }
  console.log(failures === 0 ? "\nALL PASS" : `\n${failures} FAILED`);
  process.exit(failures === 0 ? 0 : 1);
}
main().catch((e) => { console.error(e); process.exit(1); });
