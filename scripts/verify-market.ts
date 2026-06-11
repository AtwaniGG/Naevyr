/* eslint-disable @typescript-eslint/no-explicit-any */
// Phase 4 slice-3 verification: the player marketplace. List, buy, live seller
// payout, offline escrow delivery, withdraw, and validation.
// Run with the server up:  npx tsx scripts/verify-market.ts

import { Client, Room } from "colyseus.js";

const URL = process.env.GAME_SERVER ?? "ws://localhost:2567";
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
}

function mute(room: Room<any>) {
  for (const t of [
    "loot", "gatherStart", "relocate", "season", "chat", "driftfall",
    "profile", "claimPlaced", "claimFallen", "listResult", "unlistResult",
    "buyResult", "sold", "goldSync", "invSync",
  ]) room.onMessage(t, () => {});
}

function once<T>(room: Room<any>, type: string, timeoutMs = 3000): Promise<T | null> {
  return new Promise((resolve) => {
    const to = setTimeout(() => resolve(null), timeoutMs);
    room.onMessage(type, (m: any) => {
      clearTimeout(to);
      resolve(m);
    });
  });
}

async function main() {
  const sellerToken = `mkt-seller-${Date.now()}`;
  const buyerToken = `mkt-buyer-${Date.now()}`;

  const seller = await new Client(URL).joinOrCreate<any>("drift", { token: sellerToken });
  const buyer = await new Client(URL).joinOrCreate<any>("drift", { token: buyerToken });
  mute(seller);
  mute(buyer);
  seller.send("identity", { name: "Sellsword" });
  // Phase 6: both ledgers live on the server — seed the buyer's purse and the
  // seller's satchel (listings debit the inventory ledger now)
  buyer.send("save", { snapshot: { gold: 200, day: 0 } });
  seller.send("save", {
    snapshot: { inventory: { wood: 5, stone: 3, hide: 2 }, gold: 0, day: 0 },
  });
  await wait(400);

  // ---- list ------------------------------------------------------------------------
  const lr = once<any>(seller, "listResult");
  seller.send("list", { item: "wood", qty: 5, price: 50 });
  const listed = await lr;
  check("listing accepted", listed?.ok === true, listed?.reason ?? "");
  await wait(300);
  check("listing synced to all clients", buyer.state.listings.size >= 1, `listings=${buyer.state.listings.size}`);

  // ---- validation --------------------------------------------------------------------
  const bad = once<any>(seller, "listResult");
  seller.send("list", { item: "moon_rock", qty: 1, price: 10 });
  const badRes = await bad;
  check("unknown item rejected", badRes?.ok === false, badRes?.reason ?? "no response");

  // Phase 6: the inventory ledger escrows listings — can't list ghost goods
  const over = once<any>(seller, "listResult");
  seller.send("list", { item: "wood", qty: 99, price: 10 });
  const overRes = await over;
  check("listing more than the ledger holds rejected", overRes?.ok === false,
    overRes?.reason ?? "no response");

  // ---- buy: live seller gets paid by message ------------------------------------------
  const soldMsg = once<any>(seller, "sold", 4000);
  const br = once<any>(buyer, "buyResult");
  buyer.send("buy", { id: listed.id });
  const bought = await br;
  check("purchase succeeds", bought?.ok === true && bought.item === "wood" && bought.qty === 5,
    bought ? `${bought.qty}× ${bought.item} for ${bought.price}g` : "timed out");
  const sold = await soldMsg;
  check("online seller paid instantly", sold?.gold === 50, sold ? `+${sold.gold}g from ${sold.buyer}` : "no sold message");

  // ---- buying own listing rejected -----------------------------------------------------
  const lr2 = once<any>(seller, "listResult");
  seller.send("list", { item: "stone", qty: 3, price: 30 });
  const listed2 = await lr2;
  const own = once<any>(seller, "buyResult");
  seller.send("buy", { id: listed2.id });
  const ownRes = await own;
  check("buying your own stall rejected", ownRes?.ok === false, ownRes?.reason ?? "no response");

  // ---- offline escrow -------------------------------------------------------------------
  await seller.leave();
  await wait(400);
  const br2 = once<any>(buyer, "buyResult");
  buyer.send("buy", { id: listed2.id });
  const bought2 = await br2;
  check("buying from offline seller works", bought2?.ok === true);
  await wait(400);

  const seller2 = await new Client(URL).joinOrCreate<any>("drift", { token: sellerToken });
  const prof = once<any>(seller2, "profile");
  mute(seller2);
  seller2.send("getProfile");
  const p = await prof;
  check("escrow delivered on rejoin", p?.escrowGold === 30, `escrowGold=${p?.escrowGold}`);

  // ---- withdraw --------------------------------------------------------------------------
  const lr3 = once<any>(seller2, "listResult");
  seller2.send("list", { item: "hide", qty: 2, price: 20 });
  const listed3 = await lr3;
  const ur = once<any>(seller2, "unlistResult");
  seller2.send("unlist", { id: listed3.id });
  const un = await ur;
  check("withdraw returns the goods", un?.ok === true && un.item === "hide" && un.qty === 2);

  await seller2.leave();
  await buyer.leave();
  console.log(failures === 0 ? "\nAll market checks passed." : `\n${failures} check(s) FAILED.`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("verify-market crashed:", e);
  process.exit(1);
});
