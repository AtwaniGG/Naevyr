/* eslint-disable @typescript-eslint/no-explicit-any */
// DRIFTS wagering in the Pit, verified end-to-end on REAL devnet:
//   both fighters transfer their stake INTO escrow (verified on-chain) → fight →
//   the winner is PAID 90% of the pot OUT of escrow, the house keeps 10% · a
//   draw refunds each fighter their full stake · an unmatched poster who leaves
//   is refunded · a spent stake signature cannot be replayed.
// Self-hosted on port 2588 with a fresh escrow (no pre-funding — each duel is
// self-funding). Short DUEL_MS so the draw case doesn't take 90s.
// Run from repo root:  ./server/node_modules/.bin/tsx scripts/verify-pit-drifts.ts

import { spawn, execFileSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { Client, Room } from "colyseus.js";
import {
  Connection, Keypair, PublicKey, Transaction,
  SystemProgram, LAMPORTS_PER_SOL, sendAndConfirmTransaction,
} from "@solana/web3.js";
import nacl from "tweetnacl";
import { walletLinkMessage, DUEL_DRIFTS } from "../game/types";

const RPC = "https://api.devnet.solana.com";
const PORT = 2588;
const WS_URL = `ws://localhost:${PORT}`;
const DATA_DIR = `/tmp/naevyr-verify-pit-${Date.now()}`;
const SERVER_DIR = resolve(process.cwd(), "server");
const MINT_FILE = resolve(SERVER_DIR, ".data/devnet-mint.json");
const AUTH_FILE = resolve(SERVER_DIR, ".data/devnet-authority.json");
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

const STAKE = DUEL_DRIFTS.min;                                  // 20,000
const POT_TO_WINNER = Math.floor(STAKE * 2 * (1 - DUEL_DRIFTS.feePct)); // 36,000
const HOUSE_CUT = STAKE * 2 - POT_TO_WINNER;                    // 4,000
const DUEL_MS = 25_000; // long enough to pound to a decision, short enough to draw

let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` (${detail})` : ""}`);
  if (!ok) failures++;
}

// every type on() listens for must be registered here (colyseus.js routes only
// types that have an onMessage handler — these all funnel into `handlers`)
const MUTE = [
  "loot", "gatherStart", "relocate", "season", "chat", "driftfall", "profile",
  "caravanDepart", "spinResult", "walletNonce", "walletResult", "goldSync",
  "invSync", "tokenSync", "pitQueue", "duelHp", "mobSpawn", "mobDespawn",
  "questSync", "duelStakeQuote", "duelStart", "duelEnd", "duelPayout", "duelRefused",
];

interface Session {
  room: Room<any>;
  on: <T>(type: string, timeoutMs?: number) => Promise<T | null>;
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
  await wait(300);
  // link the wallet (sign-message), seed a token purse via first save
  room.send("save", { snapshot: { gold: 500, day: 0 } });
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
  return { room, on, kp, address: kp.publicKey.toBase58() };
}

/** ask the server for a deposit tx, sign it, submit, then commit the stake.
 *  Resolves with the stake signature so replay can be tested. */
async function stake(s: Session, conn: Connection, wager: number): Promise<string> {
  const qp = s.on<any>("duelStakeQuote", 30_000);
  s.room.send("duelStakeQuote", { wager });
  const q = await qp;
  if (!q?.ok || !q.tx) throw new Error(`no stake quote: ${q?.reason}`);
  const tx = Transaction.from(Buffer.from(q.tx, "base64"));
  tx.partialSign(s.kp);
  const sig = await conn.sendRawTransaction(tx.serialize());
  s.room.send("duelStake", { wager, sig });
  return sig;
}

/** wait until this session's own stake is broadcast as the waiting poster (the
 *  deposit verified on-chain and posted). Avoids leaving before the stake lands. */
async function awaitPosted(s: Session, timeoutMs = 40_000): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const m = await s.on<any>("pitQueue", Math.max(1000, deadline - Date.now()));
    if (m && m.sessionId === s.room.sessionId) return true;
  }
  return false;
}

async function main() {
  if (!existsSync(MINT_FILE)) {
    console.error("No devnet mint. Run create-devnet-mint.ts first.");
    process.exit(1);
  }
  const mint = JSON.parse(readFileSync(MINT_FILE, "utf8")).mint as string;

  const kpA = Keypair.generate();
  const kpB = Keypair.generate();
  const escrow = Keypair.generate();
  console.log("funding test wallets on devnet (2 mints)…");
  const mintTo = (addr: string, amt: string) =>
    execFileSync("./node_modules/.bin/tsx",
      ["scripts/create-devnet-mint.ts", "--mint-to", addr, amt],
      { cwd: SERVER_DIR, stdio: "pipe", timeout: 120_000 });
  mintTo(kpA.publicKey.toBase58(), "100000");
  mintTo(kpB.publicKey.toBase58(), "100000");
  // escrow starts EMPTY — duels must be self-funding (deposits cover the payout)

  // the buyer signs + pays their own deposit fee, so the fighters need a little
  // SOL — transfer it from the authority (the one SOL-funded account)
  const authority = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync(AUTH_FILE, "utf8"))));
  {
    const conn0 = new Connection(RPC, "confirmed");
    for (const to of [kpA.publicKey, kpB.publicKey]) {
      const tx = new Transaction().add(SystemProgram.transfer({
        fromPubkey: authority.publicKey, toPubkey: to, lamports: 0.05 * LAMPORTS_PER_SOL,
      }));
      await sendAndConfirmTransaction(conn0, tx, [authority]);
    }
    console.log("funded the fighters with devnet SOL for fees");
  }

  const server = spawn("./node_modules/.bin/tsx", ["src/index.ts"], {
    cwd: SERVER_DIR,
    env: {
      ...process.env, PORT: String(PORT), DRIFT_DATA_DIR: DATA_DIR,
      CARAVAN_FIRST_S: "9999", TOKEN_MINT: mint, DUEL_MS: String(DUEL_MS),
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
  check("isolated server boots (mint + escrow armed)", ready);
  if (!ready) return finish(server, 1);

  const conn = new Connection(RPC, "confirmed");

  try {
    const A = await join(`pit-a-${Date.now()}`, kpA);
    const B = await join(`pit-b-${Date.now()}`, kpB);

    // ── 1) A WIN: both stake 20k → A pounds B → winner paid 36k, house keeps 4k ──
    {
      const aBefore = await tokenBalance(conn, mint, kpA.publicKey);
      const bBefore = await tokenBalance(conn, mint, kpB.publicKey);

      await stake(A, conn, STAKE);            // A posts the stake
      check("A's stake posts to the ring", await awaitPosted(A));
      const started = B.on<any>("duelStart", 60_000);
      await stake(B, conn, STAKE);            // B meets it → duel starts
      const ds = await started;
      check("DRIFTS duel starts (both staked into escrow)",
        ds?.currency === "drifts" && ds?.wager === STAKE,
        ds ? `${ds.nameA} vs ${ds.nameB} @ ${ds.wager}◆` : "timed out");

      // A pounds B to a decision (server caps swings at ~1/s, rolls the damage)
      const payP = A.on<any>("duelPayout", 60_000);
      const ended = A.on<any>("duelEnd", 60_000);
      const hit = setInterval(() => A.room.send("duelHit", {}), 900);
      const de = await ended;
      clearInterval(hit);
      check("duel ends with A victorious", de?.winner === A.room.sessionId,
        de ? `winner=${de.winnerName} pot=${de.pot}◆ cur=${de.currency}` : "timed out");
      check("the pot the winner sees is 90% of the stakes", de?.pot === POT_TO_WINNER, `pot=${de?.pot}`);

      const pay = await payP;
      check("A is told the escrow paid out", pay?.drifts === POT_TO_WINNER && !pay?.refund && !pay?.pending,
        pay ? `${pay.drifts}◆ pending=${pay.pending}` : "no duelPayout");

      await wait(4000); // let the on-chain payout land
      const aAfter = await tokenBalance(conn, mint, kpA.publicKey);
      const bAfter = await tokenBalance(conn, mint, kpB.publicKey);
      const escBal = await tokenBalance(conn, mint, escrow.publicKey);
      check("winner's wallet netted +16k on-chain (-20k stake +36k payout)",
        Math.abs((aAfter - aBefore) - (POT_TO_WINNER - STAKE)) <= 1, `${aBefore} → ${aAfter}`);
      check("loser's wallet is down its 20k stake on-chain",
        Math.abs((bBefore - bAfter) - STAKE) <= 1, `${bBefore} → ${bAfter}`);
      check("the house's 10% (4k) sits in escrow", Math.abs(escBal - HOUSE_CUT) <= 1, `escrow=${escBal}`);
    }

    // ── 2) A DRAW: both stake, neither hits → timeout refunds each full stake ──
    {
      const aBefore = await tokenBalance(conn, mint, kpA.publicKey);
      const bBefore = await tokenBalance(conn, mint, kpB.publicKey);
      await stake(A, conn, STAKE);
      check("draw case: A's stake posts", await awaitPosted(A));
      const started = B.on<any>("duelStart", 60_000);
      const aRefund = A.on<any>("duelPayout", DUEL_MS + 30_000);
      const bRefund = B.on<any>("duelPayout", DUEL_MS + 30_000);
      await stake(B, conn, STAKE);
      const ds = await started;
      check("draw case: duel starts", ds?.currency === "drifts", ds ? "ok" : "timed out");
      const ended = A.on<any>("duelEnd", DUEL_MS + 30_000);
      const de = await ended;          // no hits → timeout draw
      check("no-hit duel times out to a draw", de?.winner === null, `winner=${de?.winner}`);
      const [ra, rb] = [await aRefund, await bRefund];
      check("both fighters are refunded their full stake (no cut on a draw)",
        ra?.refund === true && ra?.drifts === STAKE && rb?.refund === true && rb?.drifts === STAKE,
        `A=${ra?.drifts}◆ B=${rb?.drifts}◆`);
      await wait(4000);
      const aAfter = await tokenBalance(conn, mint, kpA.publicKey);
      const bAfter = await tokenBalance(conn, mint, kpB.publicKey);
      check("draw: both wallets restored on-chain (net ~0)",
        Math.abs(aAfter - aBefore) <= 1 && Math.abs(bAfter - bBefore) <= 1,
        `A ${aBefore}→${aAfter}, B ${bBefore}→${bAfter}`);
    }

    // ── 3) UNMATCHED LEAVE: a poster who steps out is refunded from escrow ──
    let leftoverSig = "";
    {
      const aBefore = await tokenBalance(conn, mint, kpA.publicKey);
      leftoverSig = await stake(A, conn, STAKE);
      const posted = await awaitPosted(A); // wait for the deposit to verify + post
      check("the lone DRIFTS stake posts to the ring", posted);
      const refundP = A.on<any>("duelPayout", 60_000);
      A.room.send("pitLeave", {});      // step out of the ring before anyone comes
      const ref = await refundP;
      check("an unmatched poster is refunded on leave",
        ref?.refund === true && ref?.drifts === STAKE, ref ? `${ref.drifts}◆` : "no refund");
      await wait(4000);
      const aAfter = await tokenBalance(conn, mint, kpA.publicKey);
      check("unmatched-leave wallet restored on-chain", Math.abs(aAfter - aBefore) <= 1,
        `${aBefore} → ${aAfter}`);
    }

    // ── 4) ANTI-REPLAY: the spent stake signature cannot be re-used ──
    {
      const refused = A.on<any>("duelRefused", 30_000);
      A.room.send("duelStake", { wager: STAKE, sig: leftoverSig });
      const r = await refused;
      check("a spent stake signature is rejected",
        String(r?.reason ?? "").toLowerCase().includes("already spent"), `reason=${r?.reason}`);
    }
  } catch (e) {
    check("no exception thrown", false, (e as Error).message);
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
  console.log(failures === 0 ? "\nDRIFTS Pit wagers verified end-to-end." : `\n${failures} pit checks FAILED.`);
  process.exit(code);
}

main();
