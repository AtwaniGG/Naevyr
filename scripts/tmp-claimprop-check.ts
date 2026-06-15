/* eslint-disable @typescript-eslint/no-explicit-any */
import { Client } from "colyseus.js";
const URL = process.env.GAME_SERVER ?? "ws://localhost:2598";
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
let fails = 0;
const check = (n: string, ok: boolean, d = "") => { console.log(`${ok ? "PASS" : "FAIL"}  ${n}${d ? ` — ${d}` : ""}`); if (!ok) fails++; };
function once<T>(room: any, type: string, ms = 4000): Promise<T | null> {
  return new Promise((res) => { const t = setTimeout(() => res(null), ms); room.onMessage(type, (m: T) => { clearTimeout(t); res(m); }); });
}
async function main() {
  const room = await new Client(URL).joinOrCreate<any>("drift", { token: `cprop-${Date.now()}` });
  for (const t of ["loot", "gatherStart", "relocate", "season", "chat", "driftfall", "mobKill", "mobHit", "questSync", "bountySync", "repSync", "goldSync", "invSync", "claimResult", "propResult"]) room.onMessage(t, () => {});
  await wait(600);
  room.send("save", { snapshot: { gold: 3000, inventory: {} } });
  await wait(400);
  // find a free walkable claimable plot away from town center (40,40)
  let staked: { x: number; y: number } | null = null;
  for (const [x, y] of [[30, 50], [50, 30], [28, 52], [52, 28], [34, 48]] as [number, number][]) {
    const cr = once<any>(room, "claimResult", 3000);
    room.send("claim", { x, y });
    const r = await cr;
    if (r && r.ok) { staked = { x, y }; break; }
  }
  check("staked a claim", !!staked, staked ? `@${staked.x},${staked.y}` : "no plot");
  if (!staked) { console.log(`\n${fails || 1} FAILED`); process.exit(1); }

  // place each claim upgrade prop on the 3×3 claim
  for (const [kind, dx, dy] of [["claim_ward", 0, 0], ["claim_workbench", 1, 0], ["claim_stash", -1, 0]] as [string, number, number][]) {
    const pr = once<any>(room, "propResult", 3000);
    room.send("placeProp", { kind, x: staked.x + dx, y: staked.y + dy });
    const r = await pr;
    check(`placed ${kind}`, !!r && r.ok, r ? (r.ok ? "ok" : r.reason) : "no reply");
  }
  // confirm they live in world state (let the schema patches settle)
  await wait(800);
  let wardSeen = false, n = 0;
  room.state.props.forEach((p: any) => { n++; if (p.kind === "claim_ward") wardSeen = true; });
  check("claim props in world state", wardSeen && n >= 3, `props=${n}, ward=${wardSeen}`);

  await room.leave();
  console.log(fails === 0 ? "\nALL PASS" : `\n${fails} FAILED`);
  process.exit(fails === 0 ? 0 : 1);
}
main().catch((e) => { console.error(e); process.exit(1); });
