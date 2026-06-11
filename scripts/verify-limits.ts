/* eslint-disable @typescript-eslint/no-explicit-any */
// Phase 6 hardening verification: per-session rate limits drop floods, the
// Pit rolls its own damage, and mob swing damage clamps to the player's
// last-saved combat level. Run with the server up:
//   npx tsx scripts/verify-limits.ts

import { Client, Room } from "colyseus.js";

const URL = process.env.GAME_SERVER ?? "ws://localhost:2567";
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
}

const MUTE = [
  "loot", "gatherStart", "relocate", "season", "driftfall", "claimPlaced",
  "claimFallen", "goldSync", "invSync", "caravanDepart", "ambush",
  "waveCleared", "caravanLost", "caravanArrived", "caravanPayout", "mobHit",
  "mobKill", "donateResult", "duelRefused", "colossus",
];
function mute(room: Room<any>) {
  for (const t of MUTE) room.onMessage(t, () => {});
}

interface MobSnap { id: number; kind: string; level: number; x: number; y: number; hp: number; maxHp: number; state: string }
function mobs(room: Room<any>): MobSnap[] {
  const out: MobSnap[] = [];
  (room.state.mobs as Map<string, MobSnap>).forEach((m) => out.push({ ...m }));
  return out;
}
function mobById(room: Room<any>, id: number): MobSnap | null {
  return mobs(room).find((m) => m.id === id) ?? null;
}
function selfPos(room: Room<any>): { x: number; y: number } {
  const p = (room.state.players as Map<string, any>).get(room.sessionId);
  return { x: p?.x ?? 0, y: p?.y ?? 0 };
}
const cheby = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.max(Math.abs(Math.round(a.x) - Math.round(b.x)), Math.abs(Math.round(a.y) - Math.round(b.y)));

/** walk adjacent to a mob (server pathfinds; we poll) */
async function approach(room: Room<any>, id: number, timeoutMs = 45_000): Promise<boolean> {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    const m = mobById(room, id);
    if (!m || m.state === "dead") return false;
    if (cheby(selfPos(room), m) <= 1) return true;
    room.send("move", { x: Math.round(m.x), y: Math.round(m.y) });
    await wait(900);
  }
  return false;
}

async function main() {
  const a = await new Client(URL).joinOrCreate<any>("drift", { token: `lim-a-${Date.now()}` });
  const b = await new Client(URL).joinOrCreate<any>("drift", { token: `lim-b-${Date.now()}` });
  mute(a); mute(b);
  await wait(500);

  // ---- floods get dropped -----------------------------------------------------
  let profiles = 0;
  a.onMessage("profile", () => { profiles++; });
  for (let i = 0; i < 10; i++) a.send("getProfile");
  await wait(1500);
  check("getProfile flood dropped (10 sent)", profiles <= 4, `${profiles} answered`);

  let chats = 0;
  b.onMessage("chat", () => { chats++; });
  for (let i = 0; i < 12; i++) a.send("chat", { text: `flood ${i}` });
  await wait(800);
  check("chat flood dropped (12 sent)", chats <= 4, `${chats} broadcast`);

  let spins = 0;
  a.onMessage("spinResult", () => { spins++; });
  a.send("save", { snapshot: { gold: 500, day: 0 } }); // fund the wheel
  await wait(400);
  for (let i = 0; i < 5; i++) a.send("spin");
  await wait(1200);
  check("spin flood: one roll per cooldown (5 sent)", spins === 1, `${spins} rolled`);

  // the window passes and honest play resumes
  await wait(9000);
  profiles = 0;
  a.send("getProfile");
  await wait(800);
  check("honest traffic flows once the window resets", profiles === 1, `${profiles}`);

  // ---- the Pit rolls its own damage ---------------------------------------------
  const challenged = new Promise<any>((res) => {
    const to = setTimeout(() => res(null), 4000);
    b.onMessage("challenged", (m: any) => { clearTimeout(to); res(m); });
  });
  a.send("challenge", { target: b.sessionId, wager: 0 });
  const ch = await challenged;
  check("duel challenge lands", !!ch);
  const hits: number[] = [];
  a.onMessage("duelHp", (m: any) => { hits.push(100 - Math.min(m.hpA, m.hpB)); });
  b.send("acceptDuel", { from: ch?.from, wager: 0 });
  await wait(600);
  a.send("duelHit", { dmg: 9999 }); // the payload is dead — the house rolls
  await wait(600);
  a.send("duelHit", { dmg: 9999 });
  await wait(1200);
  const worst = Math.max(0, ...hits);
  check("duel damage is server-rolled (≤24 per swing, 9999 requested)",
    hits.length >= 1 && worst <= 24 * 2 && hits[0] >= 6 && hits[0] <= 24,
    `first hit ${hits[0]}, worst total ${worst}`);
  a.leave(); // forfeit ends the duel
  await wait(600);

  // ---- mob swings clamp to the saved combat level ---------------------------------
  const c = await new Client(URL).joinOrCreate<any>("drift", { token: `lim-c-${Date.now()}` });
  mute(c);
  await wait(500);
  // a den elite has 34 hp — enough to read the clamp off a single swing
  const elite = mobs(c).find(
    (m) => m.kind === "husk" && m.level === 5 && m.state !== "dead" &&
      Math.max(Math.abs(m.x - 8), Math.abs(m.y - 8)) <= 6,
  );
  check("found a den elite to test against", !!elite, elite ? `hp ${elite.hp}` : "none alive");
  if (elite) {
    const reached = await approach(c, elite.id);
    check("reached the elite", reached);
    if (reached) {
      c.send("attack", { id: elite.id, dmg: 50 });
      await wait(700);
      const after1 = mobById(c, elite.id)!.hp;
      check("level-1 swing clamps at 27 (50 requested)", elite.hp - after1 === 27,
        `hp ${elite.hp} → ${after1}`);

      // a saved combat level raises the ceiling (cross-checked trust)
      c.send("save", {
        snapshot: { gold: 0, day: 0, skills: { combat: { xp: 99999, level: 20 } } },
      });
      await wait(1200); // outlive the swing cap; save lands instantly
      c.send("attack", { id: elite.id, dmg: 50 });
      await wait(700);
      const after2 = mobById(c, elite.id)?.hp ?? 0;
      check("level-20 swing clamps at 46 (kills the 7hp elite)",
        after2 === 0 || mobById(c, elite.id)?.state === "dead" || after2 < after1,
        `hp ${after1} → ${after2}`);
    }
  }

  await c.leave();
  await b.leave();
  console.log(failures === 0 ? "\nAll hardening checks passed." : `\n${failures} check(s) FAILED.`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("verify-limits crashed:", e);
  process.exit(1);
});
