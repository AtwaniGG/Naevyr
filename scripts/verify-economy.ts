/* eslint-disable @typescript-eslint/no-explicit-any */
// The DRIFTS economy expansion, verified end-to-end on REAL devnet:
//   Drift Wheel spin + Drift Cache (gacha, pity) · guild found/join/territory/
//   upkeep (burns + holding gate) · the Exchange both directions (buy gold =
//   transfer INTO escrow, verified; sell gold = escrow PAYS OUT on-chain,
//   capped) · the relic market (P2P prestige transfer + burned fee, ownership
//   actually moves) · guild banner perks live in schema.
// Self-hosted on port 2590 with a fresh treasury + a fresh FUNDED escrow.
// Run from repo root:  ./server/node_modules/.bin/tsx scripts/verify-economy.ts

import { spawn, execFileSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { Client, Room } from "colyseus.js";
import {
  Connection, Keypair, PublicKey, Transaction,
  SystemProgram, LAMPORTS_PER_SOL, sendAndConfirmTransaction,
} from "@solana/web3.js";
import nacl from "tweetnacl";
import { walletLinkMessage, EXCHANGE, RELIC_MARKET } from "../game/types";

const RPC = "https://api.devnet.solana.com";
const PORT = 2590;
const WS_URL = `ws://localhost:${PORT}`;
const DATA_DIR = `/tmp/naevyr-verify-economy-${Date.now()}`;
const SERVER_DIR = resolve(process.cwd(), "server");
const MINT_FILE = resolve(SERVER_DIR, ".data/devnet-mint.json");
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` (${detail})` : ""}`);
  if (!ok) failures++;
}

const MUTE = [
  "loot", "gatherStart", "relocate", "season", "chat", "driftfall", "profile",
  "caravanDepart", "ambush", "waveCleared", "caravanLost", "caravanArrived", "caravanPayout",
  "spinResult", "burnResult", "burnQuote", "walletNonce", "walletResult", "cleansing",
  "goldSync", "invSync", "donateResult", "claimResult", "claimPlaced",
  "driftSpinResult", "guildResult", "guildBanner", "exInfo", "exQuote", "exResult",
  "relicResult", "relicQuote", "relicSold", "prestigeResult", "founder",
];

interface Session {
  room: Room<any>;
  on: <T>(type: string, timeoutMs?: number) => Promise<T | null>;
  /** gather up to `count` messages of a type (resolves with what arrived) */
  collect: (type: string, count: number, timeoutMs?: number) => Promise<any[]>;
  kp: Keypair;
  address: string;
}

async function join(token: string, kp: Keypair): Promise<Session> {
  const room = await new Client(WS_URL).joinOrCreate<any>("drift", { token });
  const handlers = new Map<string, ((m: any) => void)[]>();
  for (const t of MUTE) room.onMessage(t, (m: any) => (handlers.get(t) ?? []).forEach((h) => h(m)));
  const on = <T,>(type: string, timeoutMs = 60_000): Promise<T | null> =>
    new Promise((res) => {
      const to = setTimeout(() => res(null), timeoutMs);
      handlers.set(type, [(m) => { clearTimeout(to); handlers.delete(type); res(m); }]);
    });
  const collect = (type: string, count: number, timeoutMs = 60_000): Promise<any[]> =>
    new Promise((res) => {
      const got: any[] = [];
      const done = () => { handlers.delete(type); res(got); };
      const to = setTimeout(done, timeoutMs);
      handlers.set(type, [(m) => {
        got.push(m);
        if (got.length >= count) { clearTimeout(to); done(); }
      }]);
    });
  await wait(300);
  // link the wallet (sign-message) + seed the purse via first save
  room.send("save", { snapshot: { gold: 800, day: 0 } });
  await wait(300);
  const np = on<{ nonce: string }>("walletNonce", 8000);
  room.send("walletNonce");
  const n = await np;
  const msg = new TextEncoder().encode(walletLinkMessage(kp.publicKey.toBase58(), n!.nonce));
  const sig = nacl.sign.detached(msg, kp.secretKey);
  const lr = on<any>("walletResult", 30_000);
  room.send("linkWallet", {
    address: kp.publicKey.toBase58(),
    signature: Array.from(sig, (b) => b.toString(16).padStart(2, "0")).join(""),
  });
  await lr;
  return { room, on, collect, kp, address: kp.publicKey.toBase58() };
}

async function main() {
  if (!existsSync(MINT_FILE)) {
    console.error("No devnet mint. Run create-devnet-mint.ts first.");
    process.exit(1);
  }
  const mint = JSON.parse(readFileSync(MINT_FILE, "utf8")).mint as string;

  const kpA = Keypair.generate(); // founder / spender
  const kpB = Keypair.generate(); // joiner / relic buyer
  const kpC = Keypair.generate(); // second relic buyer (race case)
  const treasury = Keypair.generate();
  const escrow = Keypair.generate();
  console.log("funding test wallets on devnet (4 mints)…");
  const mintTo = (addr: string, amt: string) =>
    execFileSync("./node_modules/.bin/tsx",
      ["scripts/create-devnet-mint.ts", "--mint-to", addr, amt],
      { cwd: SERVER_DIR, stdio: "pipe", timeout: 120_000 });
  mintTo(kpA.publicKey.toBase58(), "200000");
  mintTo(kpB.publicKey.toBase58(), "20000");
  mintTo(kpC.publicKey.toBase58(), "5000");
  mintTo(escrow.publicKey.toBase58(), "10000"); // the sell-side pool

  // burns are single-signer now (the player signs + pays their own fee), and
  // exBuy/relic legs are player-signed too — fund the signing wallets with a
  // little devnet SOL from the authority (the one SOL-funded account). Escrow
  // never signs from the client, so it needs none.
  {
    const conn0 = new Connection(RPC, "confirmed");
    const AUTH_FILE = resolve(SERVER_DIR, ".data/devnet-authority.json");
    const authority = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync(AUTH_FILE, "utf8"))));
    for (const to of [kpA.publicKey, kpB.publicKey, kpC.publicKey]) {
      const tx = new Transaction().add(SystemProgram.transfer({
        fromPubkey: authority.publicKey, toPubkey: to, lamports: 0.05 * LAMPORTS_PER_SOL,
      }));
      await sendAndConfirmTransaction(conn0, tx, [authority]);
    }
    console.log("funded the signing wallets with devnet SOL for fees");
  }

  const server = spawn("./node_modules/.bin/tsx", ["src/index.ts"], {
    cwd: SERVER_DIR,
    env: {
      ...process.env, PORT: String(PORT), DRIFT_DATA_DIR: DATA_DIR,
      CARAVAN_FIRST_S: "9999", TOKEN_MINT: mint,
      TREASURY_ADDRESS: treasury.publicKey.toBase58(),
      ESCROW_KEYPAIR: JSON.stringify(Array.from(escrow.secretKey)),
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const ready = await new Promise<boolean>((res) => {
    const to = setTimeout(() => res(false), 30_000);
    server.stdout.on("data", (d: Buffer) => { if (d.toString().includes("listening")) { clearTimeout(to); res(true); } });
    server.stderr.on("data", (d: Buffer) => process.stderr.write(`[server] ${d}`));
    server.on("exit", () => res(false));
  });
  check("isolated server boots (mint + treasury + escrow)", ready);
  if (!ready) return finish(server, 1);

  // escrow payouts ride the AUTHORITY's fee SOL — no airdrop needed
  const conn = new Connection(RPC, "confirmed");

  try {
    const A = await join(`eco-a-${Date.now()}`, kpA);
    const B = await join(`eco-b-${Date.now()}`, kpB);

    async function burnFor(s: Session, action: string): Promise<string | null> {
      const qp = s.on<any>("burnQuote", 30_000);
      s.room.send("burnQuote", { action });
      const q = await qp;
      if (!q?.ok || !q.tx) { console.log(`      …no quote for ${action}: ${q?.reason}`); return null; }
      const tx = Transaction.from(Buffer.from(q.tx, "base64"));
      tx.partialSign(s.kp);
      return await conn.sendRawTransaction(tx.serialize());
    }

    // 1) the Drift Wheel: one spin
    {
      const sig = await burnFor(A, "driftSpin");
      check("driftSpin burn submitted", !!sig, sig?.slice(0, 12));
      const rp = A.on<any>("driftSpinResult");
      A.room.send("driftSpin", { burnSig: sig });
      const r = await rp;
      check("Drift Wheel pays a prize", r?.ok === true && r?.prizes?.length === 1,
        r?.ok ? `${r.prizes[0].kind}${r.prizes[0].key ? `:${r.prizes[0].key}` : ""} pity=${r.pity}` : r?.reason);
    }

    // 2) a Drift Cache: three rolls, one message
    {
      const sig = await burnFor(A, "cache");
      check("cache burn submitted", !!sig, sig?.slice(0, 12));
      const rp = A.on<any>("driftSpinResult");
      A.room.send("cache", { burnSig: sig });
      const r = await rp;
      check("Drift Cache pays three prizes", r?.ok === true && r?.prizes?.length === 3,
        r?.ok ? r.prizes.map((p: any) => p.kind).join(",") : r?.reason);
    }

    // 3) guilds: found (holding-gated burn) → join → territory → upkeep
    {
      const sig = await burnFor(A, "guildFound");
      const rp = A.on<any>("guildResult");
      A.room.send("guildFound", { name: "Ashen Pact", tag: "ASH", burnSig: sig });
      const r = await rp;
      check("guild founded (holding + burn)", r?.ok === true && r?.tag === "ASH", r?.reason);

      const jp = B.on<any>("guildResult");
      B.room.send("guildJoin", { id: r?.id });
      const j = await jp;
      check("second wanderer joins", j?.ok === true, j?.reason);
      await wait(400);
      const gs = A.room.state.guilds.get(String(r?.id));
      check("guild synced in schema", gs?.tag === "ASH" && gs?.members === 2, `members=${gs?.members}`);

      const tSig = await burnFor(A, "guildTerritory");
      const tp = A.on<any>("guildResult");
      A.room.send("guildTerritory", { region: "Palewater", burnSig: tSig });
      const t = await tp;
      check("territory staked (48h banner)", t?.ok === true && t?.region === "Palewater", t?.reason);
      await wait(1300);
      const before = A.room.state.guilds.get(String(r?.id))?.regionSecsLeft ?? 0;
      check("banner clock runs in schema", before > 0 && before <= 48 * 3600, `secsLeft=${before}`);

      const uSig = await burnFor(B, "guildUpkeep"); // any member may feed it
      const up = B.on<any>("guildResult");
      B.room.send("guildUpkeep", { burnSig: uSig });
      const u = await up;
      await wait(1300);
      const after = A.room.state.guilds.get(String(r?.id))?.regionSecsLeft ?? 0;
      check("upkeep extends the banner +48h", u?.ok === true && after > before + 40 * 3600,
        `${before}s → ${after}s`);
    }

    // 4) the Exchange, buy side: DRIFTS transfer INTO escrow, gold credited
    {
      const ip = A.on<any>("exInfo");
      A.room.send("exInfo");
      const info = await ip;
      check("exInfo reports both counters open", info?.buyOpen === true && info?.sellOpen === true,
        `pool=${info?.pool}`);

      const goldBefore: number = A.room.state ? 0 : 0; // tracked via goldSync below
      const qp = A.on<any>("exQuote");
      A.room.send("exBuyQuote", { gold: 50 });
      const q = await qp;
      check("buy quote built", q?.ok === true && q?.cost === 50 * EXCHANGE.buyRate, q?.reason);
      const tx = Transaction.from(Buffer.from(q.tx, "base64"));
      tx.partialSign(kpA);
      const sig = await conn.sendRawTransaction(tx.serialize());
      const rp = A.on<any>("exResult", 90_000);
      A.room.send("exBuy", { gold: 50, sig });
      const r = await rp;
      check("bought 50g with DRIFTS (escrow leg verified)", r?.ok === true && r?.gold === 50,
        r?.reason ?? `cost=${r?.cost}`);
      void goldBefore;
    }

    // 5) the Exchange, sell side: the escrow PAYS OUT on-chain
    {
      const balBefore = await tokenBalance(conn, mint, kpA.publicKey);
      const rp = A.on<any>("exResult", 90_000);
      A.room.send("exSell", { gold: 50 });
      const r = await rp;
      check("sold 50g for DRIFTS (escrow payout)", r?.ok === true && r?.drifts === 50 * EXCHANGE.sellRate,
        r?.reason ?? `sig=${String(r?.sig).slice(0, 12)}`);
      if (r?.ok) {
        await wait(3000);
        const balAfter = await tokenBalance(conn, mint, kpA.publicKey);
        check("payout landed in the wallet on-chain", balAfter >= balBefore + 50 * EXCHANGE.sellRate - 1,
          `${balBefore} → ${balAfter}`);
      }
    }

    // 6) the relic market: A buys a prestige aura, lists it, B buys it P2P
    {
      const pSig = await burnFor(A, "prestigeAura");
      const pp = A.on<any>("prestigeResult");
      A.room.send("prestige", { key: "bonewisp", burnSig: pSig });
      const p = await pp;
      check("A owns a prestige relic", p?.ok === true, p?.reason);

      const lp = A.on<any>("relicResult");
      A.room.send("relicList", { key: "bonewisp", price: RELIC_MARKET.minPrice });
      const l = await lp;
      check("relic listed", l?.ok === true && l?.listed === true, l?.reason);

      const qp = B.on<any>("relicQuote");
      B.room.send("relicQuote", { id: l?.id });
      const q = await qp;
      check("relic quote built for B", q?.ok === true && !!q?.tx, q?.reason);
      const tx = Transaction.from(Buffer.from(q.tx, "base64"));
      tx.partialSign(kpB);
      const sig = await conn.sendRawTransaction(tx.serialize());
      const soldP = A.on<any>("relicSold", 90_000);
      const rp = B.on<any>("relicResult", 90_000);
      B.room.send("relicBuy", { id: l?.id, sig });
      const r = await rp;
      check("B bought the relic (transfer + fee burn verified)", r?.ok === true && r?.key === "bonewisp", r?.reason);
      const sold = await soldP;
      check("A was paid and notified", sold?.key === "bonewisp" && sold?.net === RELIC_MARKET.minPrice - Math.ceil(RELIC_MARKET.minPrice * RELIC_MARKET.feePct),
        `net=${sold?.net}`);

      // ownership REALLY moved: B may wear it, A may not
      B.room.send("identity", { aura: "bonewisp" });
      A.room.send("identity", { aura: "bonewisp" });
      await wait(600);
      const bState = B.room.state.players.get(B.room.sessionId);
      const aState = A.room.state.players.get(A.room.sessionId);
      check("buyer may wear the relic", bState?.aura === "bonewisp", `aura=${bState?.aura}`);
      check("seller may NOT wear it anymore", aState?.aura !== "bonewisp", `aura=${aState?.aura}`);
    }

    // 7) ADVERSARIAL RACES: the locks must hold under concurrent intents
    {
      // 7a) double-exSell from one session: the per-token exTrading lock must
      // refuse the second while the first is mid-payout (no cap/pool race).
      // Wait out the exSell rate window (2/30s, step 5 spent one) so the
      // limiter cannot silently drop the second send and mask the lock.
      console.log("      …waiting out the exSell rate window (31s)");
      await wait(31_000);
      const balBefore = await tokenBalance(conn, mint, kpA.publicKey);
      const both = A.collect("exResult", 2, 90_000);
      A.room.send("exSell", { gold: 50 });
      A.room.send("exSell", { gold: 50 });
      const results = await both;
      const oks = results.filter((r) => r?.ok === true);
      const refusals = results.filter((r) => r?.ok === false);
      check("concurrent double-exSell: exactly one payout", oks.length === 1 && refusals.length === 1,
        `got=${results.length} ok=${oks.length} refused=${refusals.length}`);
      check("double-exSell: the lock refused the second (not a silent drop)",
        String(refusals[0]?.reason ?? "").includes("still counting"),
        `reason=${refusals[0]?.reason}`);
      if (oks.length === 1) {
        await wait(3000);
        const balAfter = await tokenBalance(conn, mint, kpA.publicKey);
        const paid = balAfter - balBefore;
        check("double-exSell: the pool paid exactly once on-chain",
          paid >= 50 * EXCHANGE.sellRate - 1 && paid < 2 * 50 * EXCHANGE.sellRate,
          `${balBefore} → ${balAfter}`);
      }

      // 7b) the relic RESERVATION (#3): while buyer B holds a quote on a listing,
      // a second buyer C is refused AT THE COUNTER — they can't pay against a
      // listing that's about to be gone (the old failure: pay on-chain, get
      // nothing). The relicSettling lock remains as defense-in-depth.
      const C = await join(`eco-c-${Date.now()}`, kpC);
      const pSig = await burnFor(A, "prestigeAura");
      const pp = A.on<any>("prestigeResult");
      A.room.send("prestige", { key: "ashen_crown", burnSig: pSig });
      const p = await pp;
      check("A owns a second prestige relic", p?.ok === true, p?.reason);
      const lp = A.on<any>("relicResult");
      A.room.send("relicList", { key: "ashen_crown", price: RELIC_MARKET.minPrice });
      const l = await lp;
      check("race relic listed", l?.ok === true && l?.listed === true, l?.reason);

      // B quotes first → reserves the listing + gets a payable tx
      const qpB = B.on<any>("relicQuote", 30_000);
      B.room.send("relicQuote", { id: l?.id });
      const qB = await qpB;
      check("B's quote reserves the listing", qB?.ok === true && !!qB?.tx, qB?.reason);
      // C quotes the SAME listing while B holds it → refused at the counter
      const qpC = C.on<any>("relicQuote", 30_000);
      C.room.send("relicQuote", { id: l?.id });
      const qC = await qpC;
      check("a second buyer is refused while it's reserved (no pay-and-lose)",
        qC?.ok === false && /stall/i.test(String(qC?.reason)), `reason=${qC?.reason}`);

      // B completes the purchase on their reserved quote
      const txB = Transaction.from(Buffer.from(qB.tx, "base64"));
      txB.partialSign(kpB);
      const sigB = await conn.sendRawTransaction(txB.serialize());
      const rpB = B.on<any>("relicResult", 90_000);
      B.room.send("relicBuy", { id: l?.id, sig: sigB });
      const rB = await rpB;
      check("the reserving buyer settles exactly once", rB?.ok === true && rB?.bought === true, rB?.reason);
      // ownership moved: B wears it, the seller cannot
      B.room.send("identity", { aura: "ashen_crown" });
      A.room.send("identity", { aura: "ashen_crown" });
      await wait(600);
      const wState = B.room.state.players.get(B.room.sessionId);
      const aState2 = A.room.state.players.get(A.room.sessionId);
      check("race winner may wear the relic", wState?.aura === "ashen_crown", `aura=${wState?.aura}`);
      check("seller stripped exactly once", aState2?.aura !== "ashen_crown", `aura=${aState2?.aura}`);
      C.room.leave();

      // 7c) CROSS-WALLET pool drain (#1): two DIFFERENT wallets sell at once
      // against a pool that only covers ONE payout. The per-token exTrading lock
      // does NOT serialize them — only the global escrow lock + a FRESH balance
      // read stops both from passing the solvency check and over-draining. Runs
      // LAST (it drains the pool + adds devnet load) and re-seeds the pool to a
      // known size so the 1-fits-2-don't math is deterministic.
      {
        const auth = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(
          readFileSync(resolve(SERVER_DIR, ".data/devnet-authority.json"), "utf8"))));
        mintTo(escrow.publicKey.toBase58(), "9000"); // top the pool to a known floor
        const kpD = Keypair.generate();
        const kpE = Keypair.generate();
        mintTo(kpD.publicKey.toBase58(), "200"); // base tier (cap 200g/day)
        mintTo(kpE.publicKey.toBase58(), "200");
        for (const to of [kpD.publicKey, kpE.publicKey]) {
          const tx = new Transaction().add(SystemProgram.transfer({
            fromPubkey: auth.publicKey, toPubkey: to, lamports: 0.03 * LAMPORTS_PER_SOL,
          }));
          await sendAndConfirmTransaction(conn, tx, [auth]);
        }
        const D = await join(`eco-d-${Date.now()}`, kpD);
        const E = await join(`eco-e-${Date.now()}`, kpE);
        D.room.send("save", { snapshot: { gold: 5000, day: 0 } });
        E.room.send("save", { snapshot: { gold: 5000, day: 0 } });
        await wait(800);
        const pool = await tokenBalance(conn, mint, escrow.publicKey);
        // pick G so ONE payout fits but TWO don't, within the per-wallet daily
        // sell cap (this test is cross-wallet, so each wallet's own cap applies)
        const G = Math.min(EXCHANGE.sellCapPerDay[""], Math.floor(pool / EXCHANGE.sellRate));
        const oneFits = G * EXCHANGE.sellRate <= pool;
        const twoFit = 2 * G * EXCHANGE.sellRate <= pool;
        if (G >= EXCHANGE.minTrade && oneFits && !twoFit) {
          const before = await tokenBalance(conn, mint, escrow.publicKey);
          const rpD = D.on<any>("exResult", 90_000);
          const rpE = E.on<any>("exResult", 90_000);
          D.room.send("exSell", { gold: G });
          E.room.send("exSell", { gold: G });
          const [rD, rE] = await Promise.all([rpD, rpE]);
          const ok = [rD, rE].filter((r) => r?.ok === true);
          const lightR = [rD, rE].filter((r) => r?.ok === false);
          check("cross-wallet drain: exactly one sell clears the pool",
            ok.length === 1 && lightR.length === 1,
            `ok=${ok.length} refused=${lightR.length} reason=${lightR[0]?.reason}`);
          check("cross-wallet drain: the loser is told the purse is light (not over-drained)",
            /light|purse/i.test(String(lightR[0]?.reason)), `reason=${lightR[0]?.reason}`);
          await wait(3500);
          const after = await tokenBalance(conn, mint, escrow.publicKey);
          check("cross-wallet drain: pool fell by exactly ONE payout (never negative)",
            after >= 0 && Math.abs((before - after) - G * EXCHANGE.sellRate) <= 1,
            `pool ${before} → ${after}, one payout=${G * EXCHANGE.sellRate}`);
        } else {
          check("cross-wallet drain: pool sized for a clean 1-fits-2-don't test", false,
            `pool=${pool} G=${G} oneFits=${oneFits} twoFit=${twoFit} (adjust escrow seed)`);
        }
        D.room.leave();
        E.room.leave();
      }
    }

    A.room.leave();
    B.room.leave();
  } catch (e) {
    console.error("THROW", e);
    failures++;
  }
  finish(server, failures === 0 ? 0 : 1);
}

async function tokenBalance(conn: Connection, mint: string, owner: PublicKey): Promise<number> {
  try {
    const res = await conn.getParsedTokenAccountsByOwner(owner, { mint: new PublicKey(mint) });
    let bal = 0;
    for (const a of res.value) bal += a.account.data.parsed?.info?.tokenAmount?.uiAmount ?? 0;
    return bal;
  } catch {
    return -1;
  }
}

function finish(server: ReturnType<typeof spawn>, code: number) {
  server.kill();
  try { rmSync(DATA_DIR, { recursive: true, force: true }); } catch {}
  console.log(failures === 0 ? "\nThe DRIFTS economy verified end-to-end." : `\n${failures} economy checks FAILED.`);
  process.exit(code);
}

main();
