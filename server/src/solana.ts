import { Connection, PublicKey } from "@solana/web3.js";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Phase 5: devnet token plumbing. The server is the only side that talks RPC.
// Mint resolution: env (prod) → server/.data/devnet-mint.json (local dev,
// written by scripts/create-devnet-mint.ts) → unset = token features dormant
// and the game stays pure-gold (devnet-first stance: nothing touches mainnet).

const RPC = process.env.SOLANA_RPC ?? "https://api.devnet.solana.com";

function resolveMint(): string {
  const env = process.env.TOKEN_MINT ?? process.env.NEXT_PUBLIC_TOKEN_MINT;
  if (env) return env;
  try {
    const f = fileURLToPath(new URL("../.data/devnet-mint.json", import.meta.url));
    if (existsSync(f)) return JSON.parse(readFileSync(f, "utf8")).mint ?? "";
  } catch { /* fall through */ }
  return "";
}
const MINT = resolveMint();
const BALANCE_TTL_MS = 60_000;

let conn: Connection | null = null;
const cache = new Map<string, { bal: number; at: number }>();

/** web3.js has NO request timeout — a stalling RPC (devnet throttles by
 *  hanging, not just 429ing) would hang wallet links, profiles and gate
 *  joins forever. Every read gets a hard deadline instead. */
function withDeadline<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("rpc deadline")), ms),
    ),
  ]);
}

export function tokenMint(): string {
  return MINT;
}

/** UI-unit balance of the game token held by a wallet (0 when no mint set) */
export async function getTokenBalance(wallet: string, fresh = false): Promise<number> {
  if (!MINT) return 0;
  const hit = cache.get(wallet);
  // `fresh` bypasses the cache — the escrow solvency check before a payout MUST
  // see the real pool balance, not a 60s-stale figure (in-flight payouts).
  if (!fresh && hit && Date.now() - hit.at < BALANCE_TTL_MS) return hit.bal;
  try {
    conn ??= new Connection(RPC, { commitment: "confirmed", disableRetryOnRateLimit: true });
    // links, profiles and gate joins all wait on this — fail over to the
    // cached value fast rather than hold a door shut on a slow chain
    const res = await withDeadline(
      conn.getParsedTokenAccountsByOwner(new PublicKey(wallet), {
        mint: new PublicKey(MINT),
      }),
      8000, // mainnet reads can exceed 3.5s; a tight deadline returned a false 0
    );
    let bal = 0;
    for (const acc of res.value) {
      bal += acc.account.data.parsed?.info?.tokenAmount?.uiAmount ?? 0;
    }
    cache.set(wallet, { bal, at: Date.now() });
    return bal;
  } catch {
    // RPC hiccup: serve the stale value rather than flapping holder status
    return hit?.bal ?? 0;
  }
}

/** the token gate: holding ≥1 whole token */
export async function isHolder(wallet: string): Promise<boolean> {
  return (await getTokenBalance(wallet)) >= 1;
}

/**
 * Phase 6: the entry gate. Tokens required to step into the shared world
 * (`GATE_TOKENS` env; production wants 1000). 0 = open door, and a missing
 * mint always means an open door (token features dormant).
 */
export function gateTokens(): number {
  if (!MINT) return 0;
  const n = Number(process.env.GATE_TOKENS ?? 0);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

// ─── Phase 5: token burns ─────────────────────────────────────────────────────
// The server builds the burn tx and pays the fee with the devnet authority
// (players need zero SOL); the wallet only adds the burn signature. After the
// client submits, verifyBurn() checks the confirmed tx on-chain.
//
// Phase 6: the 50/50 fee-split rail. With TREASURY_ADDRESS set, every sink
// burns half (rounded UP) and transfers the other half (rounded DOWN) to the
// treasury — a receive-only wallet, no key on the server. Unset = 100% burn,
// exactly the old behavior, so dev and every verify suite run unchanged.

import { Keypair, Transaction } from "@solana/web3.js";
import {
  createAssociatedTokenAccountIdempotentInstruction,
  createBurnCheckedInstruction,
  createTransferCheckedInstruction,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";

const DECIMALS = 6;

// The mint may live on the classic SPL Token program (devnet mint, verify
// suites) OR on Token-2022 / Token Extensions (pump.fun's current default —
// the live DRIFTS mint). ATA derivation and every *Checked instruction must
// target the SAME program the mint belongs to, or the wrong account address is
// derived and the burn/transfer is rejected. Resolve it once from the mint's
// owner and thread it everywhere. (Balance reads filter by {mint}, which is
// program-agnostic, so they need no change.)
let _tokenProgram: PublicKey | undefined; // undefined = not resolved yet

async function tokenProgramId(c: Connection): Promise<PublicKey> {
  if (_tokenProgram) return _tokenProgram;
  if (!MINT) return TOKEN_PROGRAM_ID;
  try {
    const info = await withDeadline(c.getAccountInfo(new PublicKey(MINT)), 4000);
    _tokenProgram = info?.owner.equals(TOKEN_2022_PROGRAM_ID)
      ? TOKEN_2022_PROGRAM_ID
      : TOKEN_PROGRAM_ID;
  } catch {
    return TOKEN_PROGRAM_ID; // transient RPC failure: don't cache, retry next call
  }
  return _tokenProgram;
}

/** synchronous best-effort for the few sync ATA derivations; the boot warmup
 *  below populates this within ~1s, classic until then */
function cachedTokenProgram(): PublicKey {
  return _tokenProgram ?? TOKEN_PROGRAM_ID;
}

// warm the cache at boot so sync ATA derivations are correct from the first use
if (MINT) {
  void (async () => {
    try {
      conn ??= new Connection(RPC, { commitment: "confirmed", disableRetryOnRateLimit: true });
      await tokenProgramId(conn);
    } catch { /* resolved lazily on first instruction build */ }
  })();
}

let treasuryPk: PublicKey | null | undefined; // undefined = not parsed yet

/** the protocol-fee treasury (receive-only); null = fee split dormant */
export function treasuryAddress(): PublicKey | null {
  if (treasuryPk !== undefined) return treasuryPk;
  const raw = (process.env.TREASURY_ADDRESS ?? "").trim();
  try {
    treasuryPk = raw ? new PublicKey(raw) : null;
  } catch {
    console.error("TREASURY_ADDRESS is not a valid public key — fee split stays dormant");
    treasuryPk = null;
  }
  return treasuryPk;
}

/** how a sink cost divides: burn rounds UP so a player can never under-burn */
export function burnSplit(amount: number): { burn: number; treasury: number } {
  if (!treasuryAddress()) return { burn: amount, treasury: 0 };
  const burn = Math.ceil(amount / 2);
  return { burn, treasury: amount - burn };
}

let authority: Keypair | null | undefined; // undefined = not tried yet

function feePayer(): Keypair | null {
  if (authority !== undefined) return authority;
  // Prod (Railway/host) supplies the keypair as an env var holding the JSON
  // secret-key array — it must NEVER be baked into the image or committed.
  // Local dev falls back to the gitignored server/.data/devnet-authority.json.
  try {
    const fromEnv = process.env.AUTHORITY_KEYPAIR;
    if (fromEnv && fromEnv.trim()) {
      authority = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fromEnv)));
      return authority;
    }
    const f = fileURLToPath(new URL("../.data/devnet-authority.json", import.meta.url));
    authority = existsSync(f)
      ? Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync(f, "utf8"))))
      : null;
  } catch {
    authority = null;
  }
  return authority;
}

/** partial-signed burn tx (base64) for the wallet to countersign and submit */
export async function buildBurnTx(
  wallet: string,
  amount: number,
): Promise<{ ok: true; tx: string } | { ok: false; reason: string }> {
  if (!MINT) return { ok: false, reason: "No token mint configured" };
  // SINGLE-SIGNER: the player is the only signer AND the fee payer. A tx signed
  // by a third-party fee payer that moves the user's tokens is the exact shape
  // wallet scanners (Phantom/Blowfish) flag as a drainer; making the player the
  // sole signer clears that. Cost: the player pays the network fee (needs a
  // little SOL) — the server no longer touches the burn.
  try {
    conn ??= new Connection(RPC, { commitment: "confirmed", disableRetryOnRateLimit: true });
    const balance = await getTokenBalance(wallet);
    if (balance < amount) {
      return { ok: false, reason: `That rite burns ${amount} tokens; you hold ${balance}` };
    }
    const tp = await tokenProgramId(conn);
    const mintPk = new PublicKey(MINT);
    const owner = new PublicKey(wallet);
    const ata = getAssociatedTokenAddressSync(mintPk, owner, false, tp);
    const split = burnSplit(amount);
    const tx = new Transaction().add(
      createBurnCheckedInstruction(
        ata, mintPk, owner,
        BigInt(Math.round(split.burn * 10 ** DECIMALS)), DECIMALS, [], tp,
      ),
    );
    const treasury = treasuryAddress();
    if (treasury && split.treasury > 0) {
      const treasuryAta = getAssociatedTokenAddressSync(mintPk, treasury, false, tp);
      tx.add(
        // the player pays rent if the treasury ATA doesn't exist yet (no-op after)
        createAssociatedTokenAccountIdempotentInstruction(
          owner, treasuryAta, treasury, mintPk, tp,
        ),
        createTransferCheckedInstruction(
          ata, mintPk, treasuryAta, owner,
          BigInt(Math.round(split.treasury * 10 ** DECIMALS)), DECIMALS, [], tp,
        ),
      );
    }
    tx.feePayer = owner; // the player pays — sole signer
    tx.recentBlockhash = (await withDeadline(conn.getLatestBlockhash(), 8000)).blockhash;
    return { ok: true, tx: tx.serialize({ requireAllSignatures: false }).toString("base64") };
  } catch (e) {
    return { ok: false, reason: `Chain unreachable: ${(e as Error).message}`.slice(0, 120) };
  }
}

/** confirm a submitted burn on-chain: right mint, owner, and amount — and,
 *  when the fee split is live, the matching treasury transfer leg too.
 *  Thin wrapper: the split is just legs through the ONE shared verifier. */
export async function verifyBurn(
  sig: string,
  wallet: string,
  minAmount: number,
): Promise<{ ok: boolean; reason?: string }> {
  if (!MINT) return { ok: false, reason: "No token mint configured" };
  const split = burnSplit(minAmount);
  const treasury = treasuryAddress();
  const legs: TxLeg[] = [{ type: "burn", from: wallet, min: split.burn }];
  if (treasury && split.treasury > 0) {
    conn ??= new Connection(RPC, { commitment: "confirmed", disableRetryOnRateLimit: true });
    const tp = await tokenProgramId(conn);
    legs.push({
      type: "transfer",
      from: wallet,
      destAta: getAssociatedTokenAddressSync(new PublicKey(MINT), treasury, false, tp).toBase58(),
      min: split.treasury,
    });
  }
  return verifyTxLegs(sig, legs, "burn");
}

// ─── Phase 7: the Exchange escrow + the relic market ─────────────────────────
// The escrow is the Exchange's pool wallet: BUYING gold transfers DRIFTS into
// it (verified like a burn's transfer leg); SELLING gold pays out of it (the
// server signs — the only outbound key in the system, a managed secret).
// `ESCROW_KEYPAIR` (JSON secret-key array) arms both directions;
// `ESCROW_ADDRESS` (pubkey only) arms buy-gold only; neither = dormant.

let escrowKp: Keypair | null | undefined;
let escrowPk: PublicKey | null | undefined;

export function escrowKeypair(): Keypair | null {
  if (escrowKp !== undefined) return escrowKp;
  try {
    const raw = process.env.ESCROW_KEYPAIR;
    escrowKp = raw && raw.trim()
      ? Keypair.fromSecretKey(Uint8Array.from(JSON.parse(raw)))
      : null;
  } catch {
    console.error("ESCROW_KEYPAIR is malformed — the Exchange sell side stays closed");
    escrowKp = null;
  }
  return escrowKp;
}

export function escrowAddress(): PublicKey | null {
  if (escrowPk !== undefined) return escrowPk;
  const kp = escrowKeypair();
  if (kp) { escrowPk = kp.publicKey; return escrowPk; }
  const raw = (process.env.ESCROW_ADDRESS ?? "").trim();
  try {
    escrowPk = raw ? new PublicKey(raw) : null;
  } catch {
    console.error("ESCROW_ADDRESS is not a valid public key — the Exchange stays closed");
    escrowPk = null;
  }
  return escrowPk;
}

/** the Exchange pool: DRIFTS the escrow holds. Pass fresh=true for the solvency
 *  check right before a payout (a stale read can let the pool over-drain). */
export async function escrowBalance(fresh = false): Promise<number> {
  const pk = escrowAddress();
  return pk ? getTokenBalance(pk.toBase58(), fresh) : 0;
}

/** partial-signed tx: the wallet pays `amount` DRIFTS INTO the escrow pool */
export async function buildExchangeBuyTx(
  wallet: string,
  amount: number,
): Promise<{ ok: true; tx: string } | { ok: false; reason: string }> {
  if (!MINT) return { ok: false, reason: "No token mint configured" };
  const escrow = escrowAddress();
  if (!escrow) return { ok: false, reason: "The merchant's counter is closed" };
  try {
    conn ??= new Connection(RPC, { commitment: "confirmed", disableRetryOnRateLimit: true });
    const balance = await getTokenBalance(wallet);
    if (balance < amount) {
      return { ok: false, reason: `That trade costs ${amount} DRIFTS; you hold ${balance}` };
    }
    const tp = await tokenProgramId(conn);
    const mintPk = new PublicKey(MINT);
    const owner = new PublicKey(wallet);
    const ata = getAssociatedTokenAddressSync(mintPk, owner, false, tp);
    const escrowAtaAddr = getAssociatedTokenAddressSync(mintPk, escrow, false, tp);
    // single-signer: the buyer signs + pays (no third-party fee payer)
    const tx = new Transaction().add(
      createAssociatedTokenAccountIdempotentInstruction(owner, escrowAtaAddr, escrow, mintPk, tp),
      createTransferCheckedInstruction(
        ata, mintPk, escrowAtaAddr, owner,
        BigInt(Math.round(amount * 10 ** DECIMALS)), DECIMALS, [], tp,
      ),
    );
    tx.feePayer = owner;
    tx.recentBlockhash = (await withDeadline(conn.getLatestBlockhash(), 8000)).blockhash;
    return { ok: true, tx: tx.serialize({ requireAllSignatures: false }).toString("base64") };
  } catch (e) {
    return { ok: false, reason: `Chain unreachable: ${(e as Error).message}`.slice(0, 120) };
  }
}

/** partial-signed tx for a relic sale: buyer pays the seller (95%) and BURNS
 *  the market's tithe (5%). The authority pays fees + any ATA rent. */
export async function buildRelicTx(
  buyer: string,
  seller: string,
  price: number,
  feePct: number,
): Promise<{ ok: true; tx: string } | { ok: false; reason: string }> {
  if (!MINT) return { ok: false, reason: "No token mint configured" };
  try {
    conn ??= new Connection(RPC, { commitment: "confirmed", disableRetryOnRateLimit: true });
    const balance = await getTokenBalance(buyer);
    if (balance < price) {
      return { ok: false, reason: `That relic costs ${price} DRIFTS; you hold ${balance}` };
    }
    const fee = Math.ceil(price * feePct);
    const toSeller = price - fee;
    const tp = await tokenProgramId(conn);
    const mintPk = new PublicKey(MINT);
    const buyerPk = new PublicKey(buyer);
    const sellerPk = new PublicKey(seller);
    const buyerAta = getAssociatedTokenAddressSync(mintPk, buyerPk, false, tp);
    const sellerAta = getAssociatedTokenAddressSync(mintPk, sellerPk, false, tp);
    // single-signer: the buyer signs + pays (no third-party fee payer)
    const tx = new Transaction().add(
      createAssociatedTokenAccountIdempotentInstruction(buyerPk, sellerAta, sellerPk, mintPk, tp),
      createTransferCheckedInstruction(
        buyerAta, mintPk, sellerAta, buyerPk,
        BigInt(Math.round(toSeller * 10 ** DECIMALS)), DECIMALS, [], tp,
      ),
      createBurnCheckedInstruction(
        buyerAta, mintPk, buyerPk,
        BigInt(Math.round(fee * 10 ** DECIMALS)), DECIMALS, [], tp,
      ),
    );
    tx.feePayer = buyerPk;
    tx.recentBlockhash = (await withDeadline(conn.getLatestBlockhash(), 8000)).blockhash;
    return { ok: true, tx: tx.serialize({ requireAllSignatures: false }).toString("base64") };
  } catch (e) {
    return { ok: false, reason: `Chain unreachable: ${(e as Error).message}`.slice(0, 120) };
  }
}

/** what a confirmed tx must contain to count (legs are AND-ed) */
export interface TxLeg {
  type: "burn" | "transfer";
  /** the signer who pays the leg */
  from: string;
  /** required destination ATA (transfer legs) */
  destAta?: string;
  /** minimum UI amount */
  min: number;
}

/** poll a submitted tx and verify every leg — the ONE on-chain verifier
 *  (burns, treasury tithes, Exchange buys, relic settlements all route here).
 *  Every leg asserts the game MINT: the server only ever builds *Checked
 *  instructions, so a parsed leg without a mint field (a bare SPL transfer)
 *  is never legitimate and is rejected rather than trusted via its ATA. */
export async function verifyTxLegs(
  sig: string,
  legs: TxLeg[],
  noun: "trade" | "burn" = "trade",
): Promise<{ ok: boolean; reason?: string }> {
  if (!MINT) return { ok: false, reason: "No token mint configured" };
  conn ??= new Connection(RPC, { commitment: "confirmed", disableRetryOnRateLimit: true });
  let lastError = "";
  for (let i = 0; i < 15; i++) {
    try {
      const tx = await withDeadline(
        conn.getParsedTransaction(sig, { commitment: "confirmed", maxSupportedTransactionVersion: 0 }),
        6000,
      );
      if (tx) {
        if (tx.meta?.err) return { ok: false, reason: `The ${noun} failed on-chain` };
        const satisfied = legs.map(() => false);
        for (const ix of tx.transaction.message.instructions) {
          const parsed = (ix as { parsed?: { type?: string; info?: Record<string, unknown> } }).parsed;
          if (!parsed) continue;
          const info = parsed.info ?? {};
          if (info.mint !== MINT) continue; // wrong/absent mint: never ours
          const amt =
            (info.tokenAmount as { uiAmount?: number } | undefined)?.uiAmount ??
            Number(info.amount ?? 0) / 10 ** DECIMALS;
          legs.forEach((leg, li) => {
            if (satisfied[li]) return;
            const fromOk = info.authority === leg.from || info.owner === leg.from;
            if (leg.type === "burn") {
              if ((parsed.type === "burnChecked" || parsed.type === "burn") &&
                  fromOk && amt >= leg.min) satisfied[li] = true;
            } else {
              // the source MUST be the crediting wallet's own ATA — otherwise a
              // delegate could fund escrow from a third party's account and be
              // credited for tokens that were never theirs.
              const sourceOk = info.source === walletAta(leg.from);
              if (parsed.type === "transferChecked" &&
                  info.destination === leg.destAta && sourceOk && fromOk && amt >= leg.min) satisfied[li] = true;
            }
          });
        }
        if (satisfied.every(Boolean)) {
          legs.forEach((l) => cache.delete(l.from)); // balances changed
          return { ok: true };
        }
        return { ok: false, reason: `The transaction does not match the ${noun}` };
      }
    } catch (e) {
      lastError = `Chain unreachable: ${(e as Error).message}`.slice(0, 120);
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  return { ok: false, reason: lastError || `The chain never confirmed the ${noun}` };
}

/** the escrow's ATA address (verification target for buy-gold legs) */
export function escrowAta(): string {
  const escrow = escrowAddress();
  return escrow && MINT
    ? getAssociatedTokenAddressSync(new PublicKey(MINT), escrow, false, cachedTokenProgram()).toBase58()
    : "";
}

/** the outcome of an escrow payout. `refundable` tells the caller whether it
 *  is SAFE to credit the gold back: true only when nothing was broadcast (build
 *  failed) or the tx landed-and-reverted atomically (no tokens moved). An
 *  INDETERMINATE result (refundable:false) means the transfer may already be
 *  leaving escrow — the caller MUST NOT refund or it double-pays the pool. */
export type EscrowPayout =
  | { ok: true; sig: string }
  | { ok: false; refundable: boolean; sig?: string; reason: string };

/** SELL side: the escrow pays a player from the pool. Server-signed. The split
 *  between the build phase (nothing broadcast → refundable) and the send phase
 *  (may have hit the cluster even if the ack was lost → NOT refundable) is the
 *  whole point: a confirmation-poll timeout used to refund the gold while the
 *  DRIFTS still landed, draining the pool. Reconcile any indeterminate payout
 *  from its sig (recorded on exchange_log.last_sig) against the chain later. */
export async function payFromEscrow(
  wallet: string,
  amount: number,
): Promise<EscrowPayout> {
  if (!MINT) return { ok: false, refundable: true, reason: "No token mint configured" };
  const escrow = escrowKeypair();
  if (!escrow) return { ok: false, refundable: true, reason: "The merchant cannot pay out (no escrow key)" };
  // --- build phase: any failure here means nothing was broadcast (refundable) ---
  let tx: Transaction;
  let signers: Keypair[];
  const escrowKey = escrow.publicKey.toBase58();
  try {
    conn ??= new Connection(RPC, { commitment: "confirmed", disableRetryOnRateLimit: true });
    const tp = await tokenProgramId(conn);
    const mintPk = new PublicKey(MINT);
    const destPk = new PublicKey(wallet);
    const escrowAtaPk = getAssociatedTokenAddressSync(mintPk, escrow.publicKey, false, tp);
    const destAta = getAssociatedTokenAddressSync(mintPk, destPk, false, tp);
    // the authority pays the fee + any ATA rent (it is the one SOL-funded
    // account in the system); the escrow only signs the token transfer
    const payer = feePayer() ?? escrow;
    tx = new Transaction().add(
      createAssociatedTokenAccountIdempotentInstruction(payer.publicKey, destAta, destPk, mintPk, tp),
      createTransferCheckedInstruction(
        escrowAtaPk, mintPk, destAta, escrow.publicKey,
        BigInt(Math.round(amount * 10 ** DECIMALS)), DECIMALS, [], tp,
      ),
    );
    tx.feePayer = payer.publicKey;
    tx.recentBlockhash = (await withDeadline(conn.getLatestBlockhash(), 8000)).blockhash;
    signers = payer === escrow ? [escrow] : [payer, escrow];
  } catch (e) {
    return { ok: false, refundable: true, reason: `Chain unreachable: ${(e as Error).message}`.slice(0, 120) };
  }
  // --- send phase: once we attempt broadcast, any failure is INDETERMINATE.
  //     The tx may have reached the cluster even if the ack/poll was lost, so
  //     we never report it refundable — that was the double-pay drain. ---
  let sig: string;
  try {
    sig = await withDeadline(conn.sendTransaction(tx, signers), 10_000);
  } catch {
    return { ok: false, refundable: false, reason: "The payout was submitted but not acknowledged; check your wallet" };
  }
  for (let i = 0; i < 15; i++) {
    const st = await withDeadline(conn.getSignatureStatuses([sig]), 6000).catch(() => null);
    const s = st?.value?.[0];
    // landed-and-reverted: the instructions failed atomically, no tokens moved
    if (s?.err) return { ok: false, refundable: true, sig, reason: "The payout failed on-chain" };
    if (s?.confirmationStatus === "confirmed" || s?.confirmationStatus === "finalized") {
      cache.delete(wallet);
      cache.delete(escrowKey);
      return { ok: true, sig };
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  // broadcast but never observed confirming → unknown: do NOT refund
  return { ok: false, refundable: false, sig, reason: "The chain never confirmed the payout; check your wallet" };
}

/** a wallet's ATA for the game mint (verification target for transfer legs) */
export function walletAta(wallet: string): string {
  if (!MINT) return "";
  try {
    return getAssociatedTokenAddressSync(new PublicKey(MINT), new PublicKey(wallet), false, cachedTokenProgram()).toBase58();
  } catch {
    return "";
  }
}
