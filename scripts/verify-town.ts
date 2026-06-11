/* eslint-disable @typescript-eslint/no-explicit-any */
// Waystation verification: Vault banking, Wheel spins, Shrine donations,
// Furnisher props (on own claim), and a full Pit duel between two clients.
// Run with the server up:  npx tsx scripts/verify-town.ts

import { Client, Room } from "colyseus.js";

const URL = process.env.GAME_SERVER ?? "ws://localhost:2567";
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
}

const MUTE = [
  "loot", "gatherStart", "relocate", "season", "chat", "driftfall", "profile",
  "claimPlaced", "claimFallen", "listResult", "unlistResult", "buyResult", "sold",
  "bankResult", "spinResult", "cleansing", "propResult", "challenged",
  "duelStart", "duelHp", "duelEnd", "claimResult", "goldSync", "invSync",
  "donateResult", "duelRefused",
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

const TILE = ["grass", "dirt", "stone", "water", "corrupt"];

function findPlot(state: any): { x: number; y: number } | null {
  const w = state.w;
  const tile = (x: number, y: number) => TILE[state.tiles[y * w + x]];
  outer: for (let y = 2; y < state.h - 2; y++) {
    for (let x = 2; x < w - 2; x++) {
      if (Math.hypot(x - 20, y - 20) < 12) continue; // town exclusion
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const t = tile(x + dx, y + dy);
          if (t === "water" || t === "corrupt") continue outer;
        }
      let clash = false;
      state.claims.forEach((c: any) => {
        if (Math.max(Math.abs(c.x - x), Math.abs(c.y - y)) < 3) clash = true;
      });
      if (!clash) return { x, y };
    }
  }
  return null;
}

async function main() {
  const tokenA = `town-a-${Date.now()}`;
  const tokenB = `town-b-${Date.now()}`;
  const a = await new Client(URL).joinOrCreate<any>("drift", { token: tokenA });
  const b = await new Client(URL).joinOrCreate<any>("drift", { token: tokenB });
  mute(b);
  a.send("identity", { name: "Vaultsworn" });
  b.send("identity", { name: "Pitfighter" });
  // Phase 6: town rites pay from the server ledger — seed both purses via the
  // first-snapshot rail (fresh tokens are unseeded)
  a.send("save", { snapshot: { gold: 5000, day: 0 } });
  b.send("save", { snapshot: { gold: 100, day: 0 } });
  await wait(500);

  // ---- Vault -------------------------------------------------------------------
  let bank = once<any>(a, "bankResult");
  a.send("bank", { delta: 300 });
  let br = await bank;
  check("vault deposit accepted", br?.ok === true && br.banked === 300, `banked=${br?.banked}`);
  bank = once<any>(a, "bankResult");
  a.send("bank", { delta: -100 });
  br = await bank;
  check("vault withdrawal works", br?.ok === true && br.banked === 200, `banked=${br?.banked}`);
  bank = once<any>(a, "bankResult");
  a.send("bank", { delta: -999 });
  br = await bank;
  check("overdraw rejected", br?.ok === false, br?.reason ?? "no response");

  // banked survives reconnect
  await a.leave();
  await wait(400);
  const a2 = await new Client(URL).joinOrCreate<any>("drift", { token: tokenA });
  const prof = once<any>(a2, "profile");
  mute(a2);
  a2.send("getProfile");
  const p = await prof;
  check("banked gold survives reconnect", p?.banked === 200, `banked=${p?.banked}`);

  // ---- Wheel -------------------------------------------------------------------
  const spin = once<any>(a2, "spinResult");
  a2.send("spin");
  const sp = await spin;
  check(
    "wheel returns a result",
    sp?.ok === true && typeof sp.gold === "number" && typeof sp.shards === "number" && !!sp.label,
    sp ? sp.label ?? sp.reason : "timed out",
  );

  // ---- Shrine -------------------------------------------------------------------
  const potBefore = a2.state.shrinePot ?? 0;
  a2.send("donate", { amount: 120 });
  await wait(500);
  check(
    "shrine pot rises",
    (a2.state.shrinePot ?? 0) >= potBefore + 120 || (a2.state.shrinePot ?? 0) < potBefore, // (a cleansing may have fired and reset it)
    `pot ${potBefore} → ${a2.state.shrinePot}`,
  );

  // ---- Furnisher (needs a claim) --------------------------------------------------
  const plot = findPlot(a2.state);
  check("found ground for a claim", !!plot);
  if (plot) {
    const cr = once<any>(a2, "claimResult");
    a2.send("claim", { x: plot.x, y: plot.y });
    const claim = await cr;
    check("claim staked for furnishing test", claim?.ok === true, claim?.reason ?? "");
    const pr = once<any>(a2, "propResult");
    a2.send("placeProp", { kind: "campfire", x: plot.x, y: plot.y });
    const prop = await pr;
    check("campfire placed on own claim", prop?.ok === true, prop?.reason ?? "");
    const pr2 = once<any>(a2, "propResult");
    a2.send("placeProp", { kind: "banner", x: 5, y: 5 });
    const prop2 = await pr2;
    check("prop off-claim rejected", prop2?.ok === false, prop2?.reason ?? "no response");
    await wait(300);
    check("prop synced to other clients", b.state.props.size >= 1, `props=${b.state.props.size}`);
  }

  // ---- The Pit ---------------------------------------------------------------------
  const challenged = once<any>(b, "challenged");
  a2.send("challenge", { target: b.sessionId, wager: 50 });
  const ch = await challenged;
  check("challenge arrives with name + wager", ch?.wager === 50 && ch?.name === "Vaultsworn", ch ? `${ch.name}/${ch.wager}g` : "timed out");

  const started = once<any>(a2, "duelStart");
  b.send("acceptDuel", { from: ch.from, wager: ch.wager });
  const ds = await started;
  check("duel starts", ds !== null && ds.wager === 50, ds ? `${ds.nameA} vs ${ds.nameB}` : "timed out");

  // A pounds on B until the duel ends (server caps swing rate at ~1/s)
  const ended = once<any>(a2, "duelEnd", 20_000);
  const hitTimer = setInterval(() => a2.send("duelHit", { dmg: 25 }), 950);
  const de = await ended;
  clearInterval(hitTimer);
  check("duel ends with A victorious", de?.winner === a2.sessionId, de ? `winner=${de.winnerName}, pot=${de.pot}g` : "timed out");
  check("pot equals both wagers", de?.pot === 100, `pot=${de?.pot}`);

  await a2.leave();
  await b.leave();
  console.log(failures === 0 ? "\nAll Waystation checks passed." : `\n${failures} check(s) FAILED.`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("verify-town crashed:", e);
  process.exit(1);
});
