/* eslint-disable @typescript-eslint/no-explicit-any */
// Frontier bounty boards (cluster A): the server-side bounty ledger.
// Board pushed on join + matches the shared roll; accept/reject/cap/dup;
// incomplete-claim refused; region-scoped gathers advance the matching
// contract to completion; turn-in pays gold + shards once; abandon; persist.
// Run against an ISOLATED server (gate OFF). Example:
//   cd server && DRIFT_DATA_DIR=/tmp/bounty PORT=2598 CARAVAN_FIRST_S=9999 npx tsx src/index.ts
//   GAME_SERVER=ws://localhost:2598 npx tsx scripts/verify-bounties.ts

import { Client, Room } from "colyseus.js";
import { regionAt } from "../game/world/tilemap";
import {
  BOUNTY_REGIONS, BountyRegion, rollBountyOffers, bountyEpoch,
  bountyTemplate, MAX_ACTIVE_BOUNTIES,
} from "../game/types";

const URL = process.env.GAME_SERVER ?? "ws://localhost:2567";
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
}

type Contract = { tid: string; region: string; progress: number };
function trackBounties(room: Room<any>) {
  let last: { epoch: number; bounties: Contract[]; offers: { region: string; tids: string[] }[] } | null = null;
  room.onMessage("bountySync", (m: any) => { last = m; });
  return { value: () => last };
}
function trackNum(room: Room<any>, type: string) {
  let last: number | null = null;
  room.onMessage(type, (m: any) => { last = m.gold ?? m; });
  return { value: () => last };
}
function silence(room: Room<any>) {
  for (const t of ["loot", "gatherStart", "relocate", "season", "chat", "driftfall",
    "mobKill", "mobHit", "questSync", "questClaimed", "bountyClaimed", "profile", "walletResult"]) {
    room.onMessage(t, () => {});
  }
}
function inv(room: Room<any>) {
  let last: Record<string, number> = {};
  room.onMessage("invSync", (m: any) => { last = m.inv ?? m; });
  return { shards: () => last["driftshard"] ?? 0 };
}

const tidToKind: Record<string, string> = { wood: "tree", stone: "rock", fish: "fish" };

async function main() {
  const token = `bounty-${Date.now()}`;
  const room = await new Client(URL).joinOrCreate<any>("drift", { token });
  silence(room);
  const bounties = trackBounties(room);
  const gold = trackNum(room, "goldSync");
  const items = inv(room);
  let bountyClaims: any[] = [];
  room.onMessage("bountyClaimed", (m: any) => bountyClaims.push(m));
  await wait(700);

  // 1. board pushed on join with all four regions' offers matching the shared roll
  const epoch = bountyEpoch();
  const sync = bounties.value();
  check("bountySync pushed on join", !!sync, sync ? `${sync.offers.length} boards` : "none");
  const offersOk = !!sync && BOUNTY_REGIONS.every((r) => {
    const got = sync.offers.find((o) => o.region === r);
    return got && got.tids.join(",") === rollBountyOffers(r, epoch).join(",");
  });
  check("offers match rollBountyOffers for all 4 regions", offersOk);
  check("no contracts on a fresh token", !!sync && sync.bounties.length === 0);

  // seed a purse
  room.send("save", { snapshot: { gold: 200, inventory: {} } });
  await wait(400);

  // pick a target region offering a gather bounty that has live in-region nodes
  const w = room.state.w, h = room.state.h;
  let target: { region: BountyRegion; tid: string; kind: string } | null = null;
  for (const region of BOUNTY_REGIONS) {
    const offered = rollBountyOffers(region, epoch);
    for (const tid of offered) {
      const kind = tidToKind[tid];
      if (!kind) continue;
      let count = 0;
      room.state.nodes.forEach((n: any) => {
        if (n.alive && n.kind === kind && regionAt(w, h, n.gx, n.gy) === region) count++;
      });
      if (count >= 2) { target = { region, tid, kind }; break; }
    }
    if (target) break;
  }
  check("found a gather bounty with live in-region nodes", !!target,
    target ? `${target.tid} in ${target.region} (${target.kind})` : "none");
  if (!target) { finish(); return; }

  // 2. accept the target bounty → contract appears at progress 0
  room.send("acceptBounty", { region: target.region, tid: target.tid });
  await wait(400);
  let mine = () => bounties.value()?.bounties ?? [];
  check("accept added the contract", mine().some((b) => b.tid === target!.tid && b.region === target!.region));

  // 3. accept an UNOFFERED tid for that region → refused
  const unoffered = bountyTemplate("hunt") && !rollBountyOffers(target.region, epoch).includes("hunt")
    ? "hunt" : ["cull", "wood", "stone", "fish"].find((t) => !rollBountyOffers(target!.region, epoch).includes(t))!;
  const beforeUnoffered = mine().length;
  room.send("acceptBounty", { region: target.region, tid: unoffered });
  await wait(300);
  check("accept of an unoffered tid refused", mine().length === beforeUnoffered, `tid=${unoffered}`);

  // 4. accept a DUPLICATE → refused
  room.send("acceptBounty", { region: target.region, tid: target.tid });
  await wait(300);
  check("duplicate accept refused", mine().filter((b) => b.tid === target!.tid && b.region === target!.region).length === 1);

  // 5. fill to the cap, then a further accept is refused
  for (const region of BOUNTY_REGIONS) {
    if (mine().length >= MAX_ACTIVE_BOUNTIES) break;
    for (const tid of rollBountyOffers(region, epoch)) {
      if (mine().length >= MAX_ACTIVE_BOUNTIES) break;
      if (mine().some((b) => b.tid === tid && b.region === region)) continue;
      room.send("acceptBounty", { region, tid });
      await wait(250);
    }
  }
  check("filled to the cap", mine().length === MAX_ACTIVE_BOUNTIES, `${mine().length}/${MAX_ACTIVE_BOUNTIES}`);
  // a contract that isn't already held, to prove the cap (not a dup) blocks it
  let overflow: { region: BountyRegion; tid: string } | null = null;
  for (const region of BOUNTY_REGIONS) {
    for (const tid of rollBountyOffers(region, epoch)) {
      if (!mine().some((b) => b.tid === tid && b.region === region)) { overflow = { region, tid }; break; }
    }
    if (overflow) break;
  }
  if (overflow) {
    room.send("acceptBounty", overflow);
    await wait(300);
    check("accept beyond the cap refused", mine().length === MAX_ACTIVE_BOUNTIES);
  }

  // 6. claim an INCOMPLETE contract → refused, pays nothing
  const incomplete = mine().find((b) => b.tid !== target!.tid) ?? mine().find((b) => b.progress < bountyTemplate(b.tid)!.target);
  if (incomplete) {
    const g0 = gold.value() ?? 0, s0 = items.shards();
    room.send("claimBounty", { region: incomplete.region, tid: incomplete.tid });
    await wait(350);
    check("incomplete claim refused (still held)", mine().some((b) => b.tid === incomplete.tid && b.region === incomplete.region));
    check("incomplete claim paid nothing", (gold.value() ?? 0) === g0 && items.shards() === s0);
  }

  // 7. drive region-scoped gathers until the target bounty completes
  const tmpl = bountyTemplate(target.tid)!;
  const deadline = Date.now() + 150_000;
  let progress = () => mine().find((b) => b.tid === target!.tid && b.region === target!.region)?.progress ?? 0;
  while (progress() < tmpl.target && Date.now() < deadline) {
    // find a live in-region node of the right kind, nearest to us
    const me = room.state.players.get(room.sessionId);
    let node: any = null, best = Infinity;
    room.state.nodes.forEach((n: any) => {
      if (!n.alive || n.amount <= 0 || n.kind !== target!.kind) return;
      if (regionAt(w, h, n.gx, n.gy) !== target!.region) return;
      const d = Math.hypot(n.gx - me.x, n.gy - me.y);
      if (d < best) { best = d; node = n; }
    });
    if (!node) { await wait(1500); continue; } // wait for a regrow
    room.send("gather", { nodeId: node.id, speedMult: 4 });
    await wait(3500);
  }
  check("region-scoped gathers advanced the bounty", progress() > 0, `progress=${progress()}/${tmpl.target}`);
  check("bounty reached its target", progress() >= tmpl.target, `progress=${progress()}/${tmpl.target}`);

  // 8. turn it in → gold + shards paid once; double-claim pays nothing
  if (progress() >= tmpl.target) {
    bountyClaims = [];
    const g0 = gold.value() ?? 0, s0 = items.shards();
    room.send("claimBounty", { region: target.region, tid: target.tid });
    await wait(600);
    check("turn-in cleared the contract", !mine().some((b) => b.tid === target!.tid && b.region === target!.region));
    check("turn-in paid the gold reward", (gold.value() ?? 0) === g0 + tmpl.gold, `gold ${g0} -> ${gold.value()} (+${tmpl.gold})`);
    check("turn-in paid the bonus shards", items.shards() === s0 + tmpl.shards, `shards ${s0} -> ${items.shards()} (+${tmpl.shards})`);
    check("bountyClaimed message sent", bountyClaims.length === 1);
    // double-claim
    const g1 = gold.value() ?? 0;
    room.send("claimBounty", { region: target.region, tid: target.tid });
    await wait(350);
    check("double turn-in pays nothing", (gold.value() ?? 0) === g1);
  }

  // 9. abandon a remaining contract → removed
  const toAbandon = mine()[0];
  if (toAbandon) {
    room.send("abandonBounty", { region: toAbandon.region, tid: toAbandon.tid });
    await wait(350);
    check("abandon removed the contract", !mine().some((b) => b.tid === toAbandon.tid && b.region === toAbandon.region));
  }

  // 10. persistence: reconnect, the still-held contracts survive
  const held = mine().map((b) => `${b.region}/${b.tid}@${b.progress}`).sort().join(",");
  await room.leave();
  await wait(600);
  const room2 = await new Client(URL).joinOrCreate<any>("drift", { token });
  silence(room2);
  const b2 = trackBounties(room2);
  await wait(700);
  const held2 = (b2.value()?.bounties ?? []).map((b) => `${b.region}/${b.tid}@${b.progress}`).sort().join(",");
  check("accepted contracts persist across reconnect", held === held2, `${held} | ${held2}`);
  await room2.leave();

  finish();
}

function finish() {
  console.log(failures === 0 ? "\nALL PASS" : `\n${failures} FAILED`);
  process.exit(failures === 0 ? 0 : 1);
}
main().catch((e) => { console.error(e); process.exit(1); });
