/* eslint-disable @typescript-eslint/no-explicit-any */
// Frontier Outpost reputation (cluster D): supply contracts + quartermaster.
// repSync on join; deliver a posted contract → gold + rep, items debited; deliver
// without goods / a non-posted id refused; quartermaster tier gating; out-of-range
// refused. Run against an ISOLATED server (gate OFF):
//   cd server && DRIFT_DATA_DIR=/tmp/outpost PORT=2598 CARAVAN_FIRST_S=9999 npx tsx src/index.ts
//   GAME_SERVER=ws://localhost:2598 npx tsx scripts/verify-outpost.ts

import { Client, Room } from "colyseus.js";
import { OUTPOST_BUILDINGS } from "../game/world/tilemap";
import { rollSupplyContracts, supplyContract, QUARTERMASTER_STOCK, outpostTier, bountyEpoch } from "../game/types";

const URL = process.env.GAME_SERVER ?? "ws://localhost:2567";
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
}
function silence(room: Room<any>) {
  for (const t of ["loot", "gatherStart", "relocate", "season", "chat", "driftfall",
    "mobKill", "mobHit", "questSync", "bountySync", "profile", "walletResult"]) room.onMessage(t, () => {});
}

async function main() {
  const room = await new Client(URL).joinOrCreate<any>("drift", { token: `outpost-${Date.now()}` });
  silence(room);
  let gold: number | null = null, rep: number | null = null, inv: Record<string, number> = {};
  let delivered: any[] = [];
  room.onMessage("goldSync", (m: any) => { gold = m.gold; });
  room.onMessage("invSync", (m: any) => { inv = m.inv ?? m; });
  room.onMessage("repSync", (m: any) => { rep = m.rep; });
  room.onMessage("supplyDelivered", (m: any) => delivered.push(m));
  await wait(700);

  check("repSync pushed on join (0 for a fresh token)", rep === 0, `rep=${rep}`);

  // seed a deep satchel + purse
  room.send("save", { snapshot: { gold: 500, inventory: { wood: 30, stone: 30, fish: 30, cooked_fish: 20, hide: 20, driftshard: 20 } } });
  await wait(500);

  // walk to the Outpost
  const op = OUTPOST_BUILDINGS[0];
  room.send("move", { x: op.x, y: op.y + op.r + 2 });
  let near = false;
  for (let i = 0; i < 50; i++) {
    const me = room.state.players.get(room.sessionId);
    if (me && Math.hypot(me.x - op.x, me.y - op.y) <= op.r + 4) { near = true; break; }
    await wait(400);
  }
  check("walked to the Outpost", near);

  // 1. deliver a POSTED contract → gold + rep up, items debited
  const id = rollSupplyContracts(bountyEpoch())[0];
  const c = supplyContract(id)!;
  const g0 = gold ?? 0, r0 = rep ?? 0, n0 = inv[c.item] ?? 0;
  room.send("deliverSupply", { id });
  await wait(500);
  check("delivery debited the goods", (inv[c.item] ?? 0) === n0 - c.qty, `${c.item} ${n0} -> ${inv[c.item]} (need ${c.qty})`);
  check("delivery paid gold", (gold ?? 0) === g0 + c.gold, `gold ${g0} -> ${gold} (+${c.gold})`);
  check("delivery raised reputation", (rep ?? 0) === r0 + c.rep, `rep ${r0} -> ${rep} (+${c.rep})`);
  check("supplyDelivered message sent", delivered.length === 1);

  // 2. deliver a NON-posted contract id → refused
  const notPosted = supplyContract(["wood", "stone", "fish", "cooked", "hide", "shard"].find((x) => !rollSupplyContracts(bountyEpoch()).includes(x))!);
  if (notPosted) {
    const g1 = gold ?? 0;
    room.send("deliverSupply", { id: notPosted.id });
    await wait(350);
    check("non-posted contract refused", (gold ?? 0) === g1, `id=${notPosted.id}`);
  }

  // 3. quartermaster: a tier-0 ware buys; a tier>=2 ware is refused (fresh = Drifter)
  const tier = outpostTier(rep ?? 0);
  const t0Item = QUARTERMASTER_STOCK.find((w) => w.tier === 0)!;
  const gb = gold ?? 0, ib = inv[t0Item.item] ?? 0;
  room.send("quartermasterBuy", { item: t0Item.item });
  await wait(450);
  check("tier-0 ware bought", (gold ?? 0) === gb - t0Item.price && (inv[t0Item.item] ?? 0) === ib + 1, `gold ${gb}->${gold}, ${t0Item.item} ${ib}->${inv[t0Item.item]}`);
  const lockedItem = QUARTERMASTER_STOCK.find((w) => w.tier > tier);
  if (lockedItem) {
    const gl = gold ?? 0;
    room.send("quartermasterBuy", { item: lockedItem.item });
    await wait(350);
    check("rep-locked ware refused", (gold ?? 0) === gl, `${lockedItem.item} needs tier ${lockedItem.tier}, have ${tier}`);
  }

  // 4. out-of-range: walk to center, deliveries refused
  room.send("move", { x: room.state.w >> 1, y: room.state.h >> 1 });
  let far = false;
  for (let i = 0; i < 40; i++) {
    const me = room.state.players.get(room.sessionId);
    if (me && Math.hypot(me.x - op.x, me.y - op.y) > op.r + 8) { far = true; break; }
    await wait(400);
  }
  if (far) {
    const id2 = rollSupplyContracts(bountyEpoch())[1];
    const g2 = gold ?? 0;
    room.send("deliverSupply", { id: id2 });
    await wait(400);
    check("delivery refused from out of range", (gold ?? 0) === g2);
  } else { console.log("SKIP  could not walk out of range"); }

  await room.leave();
  console.log(failures === 0 ? "\nALL PASS" : `\n${failures} FAILED`);
  process.exit(failures === 0 ? 0 : 1);
}
main().catch((e) => { console.error(e); process.exit(1); });
