/* eslint-disable @typescript-eslint/no-explicit-any */
// Phase 6 verification: the server-side gold AND inventory ledgers.
// Gold: seeding (first snapshot push, exactly once), goldDelta caps +
// per-minute budgets, unknown reasons ignored, ledger-paid spins, vault
// overdrafts, death/tombstone accounting, duel wager refusal, persistence.
// Items: seeding, itemDelta caps, spends floor at zero, cook/craft
// validation against the ledger, persistence.
// Run with the server up:  npx tsx scripts/verify-ledger.ts

import { Client, Room } from "colyseus.js";

const URL = process.env.GAME_SERVER ?? "ws://localhost:2567";
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
}

const MUTE = [
  "loot", "gatherStart", "relocate", "season", "chat", "driftfall",
  "claimPlaced", "claimFallen", "listResult", "unlistResult", "buyResult",
  "sold", "cleansing", "propResult", "challenged", "duelStart", "duelHp",
  "duelEnd", "claimResult", "caravanDepart", "ambush", "waveCleared",
  "caravanLost", "caravanArrived", "caravanPayout", "donateResult",
];
function mute(room: Room<any>) {
  for (const t of MUTE) room.onMessage(t, () => {});
}
function once<T>(room: Room<any>, type: string, timeoutMs = 4000): Promise<T | null> {
  return new Promise((resolve) => {
    const to = setTimeout(() => resolve(null), timeoutMs);
    room.onMessage(type, (m: any) => {
      clearTimeout(to);
      resolve(m);
    });
  });
}

/** track the latest goldSync balance the server pushed */
function trackGold(room: Room<any>): { value: () => number | null } {
  let last: number | null = null;
  room.onMessage("goldSync", (m: any) => { last = m.gold; });
  return { value: () => last };
}

/** track the latest invSync counts the server pushed */
function trackInv(room: Room<any>): { value: () => Record<string, number> | null } {
  let last: Record<string, number> | null = null;
  room.onMessage("invSync", (m: any) => { last = m.inv; });
  return { value: () => last };
}

async function getProfile(room: Room<any>): Promise<any> {
  const p = once<any>(room, "profile");
  room.send("getProfile");
  return p;
}

async function main() {
  const tokenA = `ledger-a-${Date.now()}`;
  const tokenB = `ledger-b-${Date.now()}`;
  const a = await new Client(URL).joinOrCreate<any>("drift", { token: tokenA });
  mute(a);
  const goldA = trackGold(a);
  await wait(300);

  // ---- seeding -------------------------------------------------------------------
  let p = await getProfile(a);
  check("fresh row: profile carries no ledger gold or items",
    p !== null && !("gold" in p) && !("inv" in p), `gold=${p?.gold} inv=${p?.inv}`);

  a.send("save", { snapshot: { gold: 1200, day: 0 } });
  await wait(400);
  check("first snapshot seeds the ledger", goldA.value() === 1200, `sync=${goldA.value()}`);

  a.send("save", { snapshot: { gold: 999_999, day: 0 } });
  await wait(4300); // outlive the 4s save rate limit so the save actually lands
  a.send("save", { snapshot: { gold: 999_999, day: 0 } });
  await wait(400);
  p = await getProfile(a);
  check("later snapshots cannot re-seed (no minting)", p?.gold === 1200, `gold=${p?.gold}`);

  // ---- goldDelta caps --------------------------------------------------------------
  a.send("goldDelta", { amount: 40, reason: "mob" });
  await wait(300);
  check("capped reason credits within the event cap", goldA.value() === 1240,
    `sync=${goldA.value()}`);

  a.send("goldDelta", { amount: 100_000, reason: "mob" });
  await wait(300);
  check("oversized event clamped to the event cap (60)", goldA.value() === 1300,
    `sync=${goldA.value()}`);

  a.send("goldDelta", { amount: 500, reason: "hack" });
  a.send("goldDelta", { amount: 500, reason: "" });
  await wait(300);
  check("unknown reasons ignored", goldA.value() === 1300, `sync=${goldA.value()}`);

  // burn down the per-minute budget (900 for "mob"; 100 already granted)
  for (let i = 0; i < 20; i++) a.send("goldDelta", { amount: 60, reason: "mob" });
  await wait(600);
  check("per-minute budget holds (mob ≤ 900/min)", goldA.value() === 1200 + 900,
    `sync=${goldA.value()}`);

  // ---- death drops + tombstone reclaim ----------------------------------------------
  a.send("goldDelta", { amount: -600, reason: "death" });
  await wait(300);
  const afterDeath = goldA.value();
  check("death drop debits the ledger", afterDeath === 1500, `sync=${afterDeath}`);

  a.send("goldDelta", { amount: 999_999, reason: "tomb" });
  await wait(300);
  check("tomb reclaim capped at what the death dropped", goldA.value() === 2100,
    `sync=${goldA.value()}`);

  a.send("goldDelta", { amount: 600, reason: "tomb" });
  await wait(300);
  check("a tombstone pays only once", goldA.value() === 2100, `sync=${goldA.value()}`);

  // ---- ledger-paid transactions ------------------------------------------------------
  const b = await new Client(URL).joinOrCreate<any>("drift", { token: tokenB });
  mute(b);
  const goldB = trackGold(b);
  b.send("save", { snapshot: { gold: 30, day: 0 } });
  await wait(400);

  let spin = await (async () => {
    const r = once<any>(b, "spinResult");
    b.send("spin");
    return r;
  })();
  check("spin refused on an empty purse", spin?.ok === false, spin?.reason ?? "no response");

  b.send("goldDelta", { amount: 100, reason: "sell" });
  await wait(2700); // spin rate limit
  spin = await (async () => {
    const r = once<any>(b, "spinResult");
    b.send("spin");
    return r;
  })();
  check("funded spin resolves", spin?.ok === true && typeof spin.gold === "number",
    spin?.label ?? "timed out");
  await wait(300);
  check("spin settles on the ledger (130 - 50 + prize)",
    goldB.value() === 130 - 50 + (spin?.gold ?? 0), `sync=${goldB.value()}`);

  const bank = await (async () => {
    const r = once<any>(b, "bankResult");
    b.send("bank", { delta: 5000 });
    return r;
  })();
  check("vault deposit beyond the purse refused", bank?.ok === false,
    bank?.reason ?? "no response");

  // ---- duels: wagers must be covered --------------------------------------------------
  const challenged = once<any>(b, "challenged");
  a.send("challenge", { target: b.sessionId, wager: 2000 });
  const ch = await challenged;
  const refused = once<any>(b, "duelRefused");
  b.send("acceptDuel", { from: ch?.from, wager: ch?.wager });
  const ref = await refused;
  check("uncoverable duel wager refused", ref !== null, ref?.reason ?? "no response");

  // ---- the inventory ledger -----------------------------------------------------------
  const tokenC = `ledger-c-${Date.now()}`;
  const c = await new Client(URL).joinOrCreate<any>("drift", { token: tokenC });
  mute(c);
  const invC = trackInv(c);
  c.send("save", {
    snapshot: { inventory: { wood: 10, fish: 5, driftshard: 2, hide: 3 }, gold: 0, day: 0 },
  });
  await wait(400);
  let inv = invC.value();
  check("first snapshot seeds the inventory ledger",
    inv?.wood === 10 && inv?.fish === 5 && inv?.driftshard === 2, JSON.stringify(inv));

  await wait(4300); // outlive the save rate limit
  c.send("save", { snapshot: { inventory: { wood: 999 }, gold: 0, day: 0 } });
  await wait(400);
  let pc = await getProfile(c);
  check("later snapshots cannot re-seed items (no minting)", pc?.inv?.wood === 10,
    `wood=${pc?.inv?.wood}`);

  c.send("itemDelta", { item: "driftshard", qty: 1, reason: "mob" });
  await wait(300);
  check("capped item reason credits", invC.value()?.driftshard === 3,
    `shards=${invC.value()?.driftshard}`);

  c.send("itemDelta", { item: "driftshard", qty: 999, reason: "mob" });
  await wait(300);
  check("oversized item event clamped (mob ≤ 6)", invC.value()?.driftshard === 9,
    `shards=${invC.value()?.driftshard}`);

  c.send("itemDelta", { item: "wood", qty: 50, reason: "mob" });
  c.send("itemDelta", { item: "driftshard", qty: 5, reason: "hack" });
  await wait(300);
  pc = await getProfile(c);
  check("off-whitelist items and unknown reasons ignored",
    pc?.inv?.wood === 10 && pc?.inv?.driftshard === 9,
    `wood=${pc?.inv?.wood} shards=${pc?.inv?.driftshard}`);

  // cooking: only as many fish as the ledger holds become food
  c.send("cook", { qty: 99 });
  await wait(300);
  inv = invC.value();
  check("cook clamps to the fish you actually hold",
    inv?.fish === 0 && inv?.cooked_fish === 5, JSON.stringify(inv));

  // spends floor at zero — eating more than you carry can't go negative
  c.send("itemDelta", { item: "cooked_fish", qty: -999, reason: "eat" });
  await wait(300);
  check("item spends floor at an empty satchel", invC.value()?.cooked_fish === 0,
    `cooked=${invC.value()?.cooked_fish}`);

  // crafting: the Shard Saber (10 wood, 3 shards, 2 hide) debits the ledger
  c.send("craft", { id: "shard_saber" });
  await wait(300);
  inv = invC.value();
  check("craft debits the recipe materials",
    inv?.wood === 0 && inv?.driftshard === 6 && inv?.hide === 1, JSON.stringify(inv));

  c.send("craft", { id: "shard_saber" });
  await wait(300);
  pc = await getProfile(c);
  check("craft without materials refused (nothing taken)",
    pc?.inv?.driftshard === 6 && pc?.inv?.hide === 1,
    `shards=${pc?.inv?.driftshard} hide=${pc?.inv?.hide}`);

  const finalInvC = pc?.inv;
  await c.leave();
  await wait(400);
  const c2 = await new Client(URL).joinOrCreate<any>("drift", { token: tokenC });
  mute(c2);
  pc = await getProfile(c2);
  check("inventory ledger survives reconnect",
    JSON.stringify(pc?.inv) === JSON.stringify(finalInvC), JSON.stringify(pc?.inv));
  await c2.leave();

  // ---- persistence ----------------------------------------------------------------------
  const finalA = goldA.value();
  await a.leave();
  await wait(400);
  const a2 = await new Client(URL).joinOrCreate<any>("drift", { token: tokenA });
  mute(a2);
  p = await getProfile(a2);
  check("ledger survives reconnect", p?.gold === finalA, `gold=${p?.gold} vs ${finalA}`);

  await a2.leave();
  await b.leave();
  console.log(failures === 0 ? "\nAll ledger checks passed." : `\n${failures} check(s) FAILED.`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("verify-ledger crashed:", e);
  process.exit(1);
});
