/* eslint-disable @typescript-eslint/no-explicit-any */
// The Roaming Trader (cluster A): a moving frontier vendor.
//   MODE=move  → walking circuit: the trader departs a waystation and arrives at
//                a DIFFERENT one (mirrors the proven caravan stepper).
//   default    → the vendor: buy (gold→item), buy-out-of-stock refused, sell at a
//                premium (item→gold), and adjacency gating (no deal from afar).
// Run against an ISOLATED server (gate OFF). Examples:
//   cd server && DRIFT_DATA_DIR=/tmp/tr-move PORT=2598 CARAVAN_FIRST_S=9999 TRADER_DWELL_S=4 TRADER_SPEED=8 npx tsx src/index.ts
//   MODE=move GAME_SERVER=ws://localhost:2598 npx tsx scripts/verify-trader.ts
//   cd server && DRIFT_DATA_DIR=/tmp/tr-shop PORT=2599 CARAVAN_FIRST_S=9999 TRADER_DWELL_S=600 npx tsx src/index.ts
//   GAME_SERVER=ws://localhost:2599 npx tsx scripts/verify-trader.ts

import { Client, Room } from "colyseus.js";
import { rollTraderStock, traderBuyback, TRADER_STOCK_POOL, TRADER_RANGE, bountyEpoch, ItemKey } from "../game/types";

const URL = process.env.GAME_SERVER ?? "ws://localhost:2567";
const MODE = process.env.MODE ?? "shop";
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
}
function silence(room: Room<any>) {
  for (const t of ["loot", "gatherStart", "relocate", "season", "chat", "driftfall",
    "mobKill", "mobHit", "questSync", "bountySync", "profile", "walletResult", "caravanDepart"]) {
    room.onMessage(t, () => {});
  }
}
function trackNum(room: Room<any>, type: string) { let last: number | null = null; room.onMessage(type, (m: any) => { last = m.gold; }); return () => last; }
function trackInv(room: Room<any>) { let last: Record<string, number> = {}; room.onMessage("invSync", (m: any) => { last = m.inv ?? m; }); return (k: string) => last[k] ?? 0; }
const dist = (ax: number, ay: number, bx: number, by: number) => Math.hypot(ax - bx, ay - by);

async function main() {
  const room = await new Client(URL).joinOrCreate<any>("drift", { token: `trader-${Date.now()}` });
  silence(room);
  await wait(700);
  const t = () => room.state.trader;

  if (MODE === "move") {
    check("trader active on join", !!t() && t().active, t() ? `stop=${t().stop} @${t().x.toFixed(1)},${t().y.toFixed(1)}` : "none");
    const startStop = t().stop;
    let sawMoving = false, arrivedStop = startStop;
    const end = Date.now() + 30_000;
    while (Date.now() < end) {
      if (t().moving) sawMoving = true;
      if (!t().moving && t().stop >= 0 && t().stop !== startStop) { arrivedStop = t().stop; break; }
      await wait(400);
    }
    check("trader departed (walked)", sawMoving);
    check("trader arrived at a DIFFERENT waystation", arrivedStop !== startStop, `${startStop} -> ${arrivedStop}`);
    await room.leave();
    return finish();
  }

  // ---- vendor mode (trader parked the whole run via TRADER_DWELL_S=600) ----
  const gold = trackNum(room, "goldSync");
  const inv = trackInv(room);
  check("trader parked on join", !!t() && t().active && !t().moving && t().stop >= 0, t() ? `stop=${t().stop}` : "none");

  room.send("save", { snapshot: { gold: 500, inventory: { hide: 5, driftshard: 3 } } });
  await wait(500);

  // walk onto the trader's waystation (its center cell is walkable)
  const tx = Math.round(t().x), ty = Math.round(t().y);
  room.send("move", { x: tx, y: ty });
  let arrived = false;
  for (let i = 0; i < 40; i++) {
    const me = room.state.players.get(room.sessionId);
    if (me && dist(me.x, me.y, t().x, t().y) <= TRADER_RANGE) { arrived = true; break; }
    await wait(400);
  }
  check("walked into dealing range", arrived);

  // 1. BUY a stock item: gold drops by its price, the item lands on the ledger
  const stock = rollTraderStock(bountyEpoch(), t().stop);
  const item = stock[0].item, price = stock[0].price;
  const g0 = gold() ?? 0, n0 = inv(item);
  room.send("traderBuy", { item });
  await wait(500);
  check("buy debited the price", (gold() ?? 0) === g0 - price, `gold ${g0} -> ${gold()} (price ${price})`);
  check("buy credited the item", inv(item) === n0 + 1, `${item} ${n0} -> ${inv(item)}`);

  // 2. BUY something NOT on this shelf → refused
  const offStock = TRADER_STOCK_POOL.map((s) => s.item).find((it) => !stock.some((s) => s.item === it));
  if (offStock) {
    const g1 = gold() ?? 0;
    room.send("traderBuy", { item: offStock });
    await wait(400);
    check("buy of an out-of-stock item refused", (gold() ?? 0) === g1, `item=${offStock}`);
  }

  // 3. SELL loot at the premium buyback
  const sellItem: ItemKey = "driftshard";
  const each = traderBuyback(sellItem);
  const sN = inv(sellItem), sG = gold() ?? 0;
  room.send("traderSell", { item: sellItem, qty: sN });
  await wait(500);
  check("sell debited the items", inv(sellItem) === 0, `${sellItem} ${sN} -> ${inv(sellItem)}`);
  check("sell paid the premium", (gold() ?? 0) === sG + each * sN, `gold ${sG} -> ${gold()} (+${each}×${sN})`);

  // 4. adjacency gate: walk away, then a deal is refused
  room.send("move", { x: room.state.w >> 1, y: room.state.h >> 1 });
  let far = false;
  for (let i = 0; i < 30; i++) {
    const me = room.state.players.get(room.sessionId);
    if (me && dist(me.x, me.y, t().x, t().y) > TRADER_RANGE + 3) { far = true; break; }
    await wait(400);
  }
  if (far) {
    const g2 = gold() ?? 0;
    room.send("traderBuy", { item: stock[0].item });
    room.send("traderSell", { item: "hide", qty: 1 });
    await wait(500);
    check("deals refused from out of range", (gold() ?? 0) === g2, `gold=${gold()}`);
  } else {
    console.log("SKIP  could not walk out of range");
  }

  await room.leave();
  finish();
}
function finish() {
  console.log(failures === 0 ? "\nALL PASS" : `\n${failures} FAILED`);
  process.exit(failures === 0 ? 0 : 1);
}
main().catch((e) => { console.error(e); process.exit(1); });
