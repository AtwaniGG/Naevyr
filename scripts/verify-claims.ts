/* eslint-disable @typescript-eslint/no-explicit-any */
// Phase 4 slice-2 verification: land claims. Stake, see it sync, reject
// overlaps/bad ground, enforce the per-player cap, persist across reconnects.
// Run with the server up:  npx tsx scripts/verify-claims.ts

import { Client, Room } from "colyseus.js";

const URL = process.env.GAME_SERVER ?? "ws://localhost:2567";
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
}

function mute(room: Room<any>) {
  for (const t of ["loot", "gatherStart", "relocate", "season", "chat", "driftfall", "profile", "claimPlaced", "claimFallen", "goldSync", "invSync"])
    room.onMessage(t, () => {});
}

const TILE = ["grass", "dirt", "stone", "water", "corrupt"];

/** find centers of stakeable 3×3 plots (grass/dirt only), far from other picks */
function findPlots(state: any, count: number, taken: { x: number; y: number }[]): { x: number; y: number }[] {
  const w = state.w, h = state.h;
  const tile = (x: number, y: number) => TILE[state.tiles[y * w + x]];
  const out: { x: number; y: number }[] = [];
  outer: for (let y = 2; y < h - 2 && out.length < count; y++) {
    for (let x = 2; x < w - 2 && out.length < count; x++) {
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const t = tile(x + dx, y + dy);
          if (t === "water" || t === "corrupt") continue outer;
        }
      const all = [...out, ...taken];
      if (all.some((p) => Math.max(Math.abs(p.x - x), Math.abs(p.y - y)) < 4)) continue;
      let clash = false;
      state.claims.forEach((c: any) => {
        if (Math.max(Math.abs(c.x - x), Math.abs(c.y - y)) < 3) clash = true;
      });
      if (!clash) out.push({ x, y });
    }
  }
  return out;
}

function claimOnce(room: Room<any>, x: number, y: number): Promise<any> {
  return new Promise((resolve) => {
    const to = setTimeout(() => resolve(null), 3000);
    room.onMessage("claimResult", (m: any) => {
      clearTimeout(to);
      resolve(m);
    });
    room.send("claim", { x, y });
  });
}

async function main() {
  const token = `claims-${Date.now()}`;
  const room = await new Client(URL).joinOrCreate<any>("drift", { token });
  mute(room);
  // Phase 6: claims pay from the server ledger — seed the purse (3 × 250g)
  room.send("save", { snapshot: { gold: 1000, day: 0 } });
  await wait(500);

  const plots = findPlots(room.state, 4, []);
  check("found 4 stakeable plots", plots.length === 4, `found ${plots.length}`);
  if (plots.length < 4) process.exit(1);

  // ---- stake one ---------------------------------------------------------------
  const r1 = await claimOnce(room, plots[0].x, plots[0].y);
  check("first claim accepted", r1?.ok === true, r1?.reason ?? "");
  await wait(300);
  check("claim synced to schema", room.state.claims.size >= 1, `claims=${room.state.claims.size}`);

  // ---- overlap rejected ----------------------------------------------------------
  const r2 = await claimOnce(room, plots[0].x + 1, plots[0].y);
  check("overlapping claim rejected", r2?.ok === false, r2?.reason ?? "no response");

  // ---- water rejected ------------------------------------------------------------
  let waterCell: { x: number; y: number } | null = null;
  for (let y = 0; y < room.state.h && !waterCell; y++)
    for (let x = 0; x < room.state.w && !waterCell; x++)
      if (TILE[room.state.tiles[y * room.state.w + x]] === "water") waterCell = { x, y };
  if (waterCell) {
    const rw = await claimOnce(room, waterCell.x, waterCell.y);
    check("water claim rejected", rw?.ok === false, rw?.reason ?? "no response");
  }

  // ---- cap at 3 -------------------------------------------------------------------
  const r3 = await claimOnce(room, plots[1].x, plots[1].y);
  const r4 = await claimOnce(room, plots[2].x, plots[2].y);
  check("second + third claims accepted", r3?.ok === true && r4?.ok === true);
  const r5 = await claimOnce(room, plots[3].x, plots[3].y);
  check("fourth claim rejected (cap)", r5?.ok === false, r5?.reason ?? "no response");

  // ---- persistence across reconnect ------------------------------------------------
  await room.leave();
  await wait(500);
  const again = await new Client(URL).joinOrCreate<any>("drift", { token });
  const profile = new Promise<any>((resolve) => {
    again.onMessage("profile", (m: any) => resolve(m));
  });
  mute(again);
  again.send("getProfile");
  const p = await Promise.race([profile, wait(3000).then(() => null)]);
  check("myClaims restored on reconnect", (p?.myClaims?.length ?? 0) === 3, `myClaims=${JSON.stringify(p?.myClaims)}`);
  await wait(300);
  check("claims still in world state", again.state.claims.size >= 3, `claims=${again.state.claims.size}`);

  await again.leave();
  console.log(failures === 0 ? "\nAll claim checks passed." : `\n${failures} check(s) FAILED.`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("verify-claims crashed:", e);
  process.exit(1);
});
