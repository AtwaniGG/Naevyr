/* eslint-disable @typescript-eslint/no-explicit-any */
// Phase 4 slice-1 verification: progress + identity + position survive a full
// disconnect, keyed by the device token. Run with the server up:
//   npx tsx scripts/verify-persistence.ts

import { Client } from "colyseus.js";

const URL = process.env.GAME_SERVER ?? "ws://localhost:2567";
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
}

function mute(room: any) {
  for (const t of ["loot", "gatherStart", "relocate", "season", "chat", "driftfall", "profile"])
    room.onMessage(t, () => {});
}

async function main() {
  const token = `persist-${Date.now()}`;

  // ---- bad token rejected -------------------------------------------------------
  let rejected = false;
  try {
    await new Client(URL).joinOrCreate<any>("drift", { token: "x" });
  } catch {
    rejected = true;
  }
  check("too-short token is rejected", rejected);

  // ---- session 1: make progress, set identity, move, leave ----------------------
  const s1 = await new Client(URL).joinOrCreate<any>("drift", { token });
  mute(s1);
  await wait(400);
  const startPos = { ...s1.state.players.get(s1.sessionId) };

  s1.send("identity", { name: "Persephone", dye: "blood", eye: "gold", title: "Gilded" });
  s1.send("save", {
    snapshot: {
      day: Math.floor(Date.now() / 86_400_000),
      gold: 777,
      kills: 13,
      driftSeason: 4,
      inventory: { wood: 42 },
      quests: [],
    },
  });
  for (const t of [{ x: startPos.x + 4, y: startPos.y }, { x: startPos.x, y: startPos.y + 4 }])
    s1.send("move", t);
  await wait(1800); // walk a bit so the saved position differs
  await s1.leave();
  await wait(600); // let onLeave write

  // ---- session 2: same token — everything should come back ----------------------
  const s2 = await new Client(URL).joinOrCreate<any>("drift", { token });
  const profile = new Promise<any>((resolve) => {
    s2.onMessage("profile", (m: any) => resolve(m));
  });
  for (const t of ["loot", "gatherStart", "relocate", "season", "chat", "driftfall"])
    s2.onMessage(t, () => {});
  s2.send("getProfile");
  const p = await Promise.race([profile, wait(3000).then(() => null)]);

  check("profile snapshot survives reconnect", !!p?.snapshot, p ? `gold=${p.snapshot?.gold}` : "timed out");
  check("snapshot values intact", p?.snapshot?.gold === 777 && p?.snapshot?.kills === 13);

  await wait(400);
  const me = s2.state.players.get(s2.sessionId);
  check("identity columns persisted", me.name === "Persephone" && me.dye === "blood" && me.eye === "gold",
    `name=${me.name} dye=${me.dye} eye=${me.eye}`);
  const moved = Math.hypot(me.x - startPos.x, me.y - startPos.y);
  check("wakes near last position (not spawn)", moved > 1.5, `displacement from first spawn=${moved.toFixed(1)}`);

  // ---- different token = different wanderer -------------------------------------
  const s3 = await new Client(URL).joinOrCreate<any>("drift", { token: `${token}-other` });
  const profile3 = new Promise<any>((resolve) => {
    s3.onMessage("profile", (m: any) => resolve(m));
  });
  mute(s3);
  s3.send("getProfile");
  const p3 = await Promise.race([profile3, wait(3000).then(() => null)]);
  check("fresh token starts fresh", p3 !== null && p3.snapshot === null);

  await s2.leave();
  await s3.leave();
  console.log(failures === 0 ? "\nAll persistence checks passed." : `\n${failures} check(s) FAILED.`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("verify-persistence crashed:", e);
  process.exit(1);
});
