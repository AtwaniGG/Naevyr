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
export async function getTokenBalance(wallet: string): Promise<number> {
  if (!MINT) return 0;
  const hit = cache.get(wallet);
  if (hit && Date.now() - hit.at < BALANCE_TTL_MS) return hit.bal;
  try {
    conn ??= new Connection(RPC, { commitment: "confirmed", disableRetryOnRateLimit: true });
    // links, profiles and gate joins all wait on this — fail over to the
    // cached value fast rather than hold a door shut on a slow chain
    const res = await withDeadline(
      conn.getParsedTokenAccountsByOwner(new PublicKey(wallet), {
        mint: new PublicKey(MINT),
      }),
      3500,
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
} from "@solana/spl-token";

const DECIMALS = 6;

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
  const payer = feePayer();
  if (!payer) return { ok: false, reason: "The forge that takes tokens is cold (no authority key)" };
  try {
    conn ??= new Connection(RPC, { commitment: "confirmed", disableRetryOnRateLimit: true });
    const balance = await getTokenBalance(wallet);
    if (balance < amount) {
      return { ok: false, reason: `That rite burns ${amount} tokens; you hold ${balance}` };
    }
    const mintPk = new PublicKey(MINT);
    const owner = new PublicKey(wallet);
    const ata = getAssociatedTokenAddressSync(mintPk, owner);
    const split = burnSplit(amount);
    const tx = new Transaction().add(
      createBurnCheckedInstruction(
        ata, mintPk, owner,
        BigInt(Math.round(split.burn * 10 ** DECIMALS)), DECIMALS,
      ),
    );
    const treasury = treasuryAddress();
    if (treasury && split.treasury > 0) {
      const treasuryAta = getAssociatedTokenAddressSync(mintPk, treasury);
      tx.add(
        // authority pays rent if the treasury ATA doesn't exist yet (no-op after)
        createAssociatedTokenAccountIdempotentInstruction(
          payer.publicKey, treasuryAta, treasury, mintPk,
        ),
        createTransferCheckedInstruction(
          ata, mintPk, treasuryAta, owner,
          BigInt(Math.round(split.treasury * 10 ** DECIMALS)), DECIMALS,
        ),
      );
    }
    tx.feePayer = payer.publicKey;
    tx.recentBlockhash = (await withDeadline(conn.getLatestBlockhash(), 8000)).blockhash;
    tx.partialSign(payer);
    return { ok: true, tx: tx.serialize({ requireAllSignatures: false }).toString("base64") };
  } catch (e) {
    return { ok: false, reason: `Chain unreachable: ${(e as Error).message}`.slice(0, 120) };
  }
}

/** confirm a submitted burn on-chain: right mint, owner, and amount — and,
 *  when the fee split is live, the matching treasury transfer leg too */
export async function verifyBurn(
  sig: string,
  wallet: string,
  minAmount: number,
): Promise<{ ok: boolean; reason?: string }> {
  if (!MINT) return { ok: false, reason: "No token mint configured" };
  conn ??= new Connection(RPC, { commitment: "confirmed", disableRetryOnRateLimit: true });
  const split = burnSplit(minAmount);
  const treasury = treasuryAddress();
  const treasuryAta = treasury
    ? getAssociatedTokenAddressSync(new PublicKey(MINT), treasury).toBase58()
    : "";
  // poll: wallets return the signature before the cluster confirms it. A
  // throttled/flaky RPC read (429s on public endpoints) is NOT terminal —
  // keep polling until the attempts run out.
  let lastError = "";
  for (let i = 0; i < 15; i++) {
    try {
      const tx = await withDeadline(
        conn.getParsedTransaction(sig, {
          commitment: "confirmed",
          maxSupportedTransactionVersion: 0,
        }),
        6000,
      );
      if (tx) {
        if (tx.meta?.err) return { ok: false, reason: "The burn failed on-chain" };
        let burnOk = false, feeOk = !treasury || split.treasury <= 0;
        for (const ix of tx.transaction.message.instructions) {
          const parsed = (ix as { parsed?: { type?: string; info?: Record<string, unknown> } }).parsed;
          if (!parsed) continue;
          const info = parsed.info ?? {};
          const amt =
            (info.tokenAmount as { uiAmount?: number } | undefined)?.uiAmount ??
            Number(info.amount ?? 0) / 10 ** DECIMALS;
          if (
            (parsed.type === "burnChecked" || parsed.type === "burn") &&
            info.mint === MINT &&
            (info.authority === wallet || info.owner === wallet) &&
            amt >= split.burn
          ) burnOk = true;
          if (
            !feeOk &&
            (parsed.type === "transferChecked" || parsed.type === "transfer") &&
            (info.mint === MINT || parsed.type === "transfer") &&
            info.destination === treasuryAta &&
            (info.authority === wallet || info.owner === wallet) &&
            amt >= split.treasury
          ) feeOk = true;
        }
        if (burnOk && feeOk) {
          cache.delete(wallet); // balance just changed
          return { ok: true };
        }
        return {
          ok: false,
          reason: burnOk ? "The treasury tithe is missing from that transaction"
                         : "No matching burn in that transaction",
        };
      }
    } catch (e) {
      lastError = `Chain unreachable: ${(e as Error).message}`.slice(0, 120);
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  return { ok: false, reason: lastError || "The chain never confirmed the burn" };
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

/** the Exchange pool: DRIFTS the escrow holds (60s cache via getTokenBalance) */
export async function escrowBalance(): Promise<number> {
  const pk = escrowAddress();
  return pk ? getTokenBalance(pk.toBase58()) : 0;
}

/** partial-signed tx: the wallet pays `amount` DRIFTS INTO the escrow pool */
export async function buildExchangeBuyTx(
  wallet: string,
  amount: number,
): Promise<{ ok: true; tx: string } | { ok: false; reason: string }> {
  if (!MINT) return { ok: false, reason: "No token mint configured" };
  const escrow = escrowAddress();
  if (!escrow) return { ok: false, reason: "The merchant's counter is closed" };
  const payer = feePayer();
  if (!payer) return { ok: false, reason: "The forge that takes tokens is cold (no authority key)" };
  try {
    conn ??= new Connection(RPC, { commitment: "confirmed", disableRetryOnRateLimit: true });
    const balance = await getTokenBalance(wallet);
    if (balance < amount) {
      return { ok: false, reason: `That trade costs ${amount} DRIFTS; you hold ${balance}` };
    }
    const mintPk = new PublicKey(MINT);
    const owner = new PublicKey(wallet);
    const ata = getAssociatedTokenAddressSync(mintPk, owner);
    const escrowAta = getAssociatedTokenAddressSync(mintPk, escrow);
    const tx = new Transaction().add(
      createAssociatedTokenAccountIdempotentInstruction(payer.publicKey, escrowAta, escrow, mintPk),
      createTransferCheckedInstruction(
        ata, mintPk, escrowAta, owner,
        BigInt(Math.round(amount * 10 ** DECIMALS)), DECIMALS,
      ),
    );
    tx.feePayer = payer.publicKey;
    tx.recentBlockhash = (await withDeadline(conn.getLatestBlockhash(), 8000)).blockhash;
    tx.partialSign(payer);
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
  const payer = feePayer();
  if (!payer) return { ok: false, reason: "The forge that takes tokens is cold (no authority key)" };
  try {
    conn ??= new Connection(RPC, { commitment: "confirmed", disableRetryOnRateLimit: true });
    const balance = await getTokenBalance(buyer);
    if (balance < price) {
      return { ok: false, reason: `That relic costs ${price} DRIFTS; you hold ${balance}` };
    }
    const fee = Math.ceil(price * feePct);
    const toSeller = price - fee;
    const mintPk = new PublicKey(MINT);
    const buyerPk = new PublicKey(buyer);
    const sellerPk = new PublicKey(seller);
    const buyerAta = getAssociatedTokenAddressSync(mintPk, buyerPk);
    const sellerAta = getAssociatedTokenAddressSync(mintPk, sellerPk);
    const tx = new Transaction().add(
      createAssociatedTokenAccountIdempotentInstruction(payer.publicKey, sellerAta, sellerPk, mintPk),
      createTransferCheckedInstruction(
        buyerAta, mintPk, sellerAta, buyerPk,
        BigInt(Math.round(toSeller * 10 ** DECIMALS)), DECIMALS,
      ),
      createBurnCheckedInstruction(
        buyerAta, mintPk, buyerPk,
        BigInt(Math.round(fee * 10 ** DECIMALS)), DECIMALS,
      ),
    );
    tx.feePayer = payer.publicKey;
    tx.recentBlockhash = (await withDeadline(conn.getLatestBlockhash(), 8000)).blockhash;
    tx.partialSign(payer);
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

/** poll a submitted tx and verify every leg (same trust model as verifyBurn) */
export async function verifyTxLegs(
  sig: string,
  legs: TxLeg[],
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
        if (tx.meta?.err) return { ok: false, reason: "The trade failed on-chain" };
        const satisfied = legs.map(() => false);
        for (const ix of tx.transaction.message.instructions) {
          const parsed = (ix as { parsed?: { type?: string; info?: Record<string, unknown> } }).parsed;
          if (!parsed) continue;
          const info = parsed.info ?? {};
          const amt =
            (info.tokenAmount as { uiAmount?: number } | undefined)?.uiAmount ??
            Number(info.amount ?? 0) / 10 ** DECIMALS;
          legs.forEach((leg, li) => {
            if (satisfied[li]) return;
            const fromOk = info.authority === leg.from || info.owner === leg.from;
            if (leg.type === "burn") {
              if ((parsed.type === "burnChecked" || parsed.type === "burn") &&
                  info.mint === MINT && fromOk && amt >= leg.min) satisfied[li] = true;
            } else {
              if ((parsed.type === "transferChecked" || parsed.type === "transfer") &&
                  (info.mint === MINT || parsed.type === "transfer") &&
                  info.destination === leg.destAta && fromOk && amt >= leg.min) satisfied[li] = true;
            }
          });
        }
        if (satisfied.every(Boolean)) {
          legs.forEach((l) => cache.delete(l.from)); // balances changed
          return { ok: true };
        }
        return { ok: false, reason: "The transaction does not match the trade" };
      }
    } catch (e) {
      lastError = `Chain unreachable: ${(e as Error).message}`.slice(0, 120);
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  return { ok: false, reason: lastError || "The chain never confirmed the trade" };
}

/** the escrow's ATA address (verification target for buy-gold legs) */
export function escrowAta(): string {
  const escrow = escrowAddress();
  return escrow && MINT
    ? getAssociatedTokenAddressSync(new PublicKey(MINT), escrow).toBase58()
    : "";
}

/** SELL side: the escrow pays a player from the pool. Server-signed — the
 *  caller must have already debited the gold (refund on failure). */
export async function payFromEscrow(
  wallet: string,
  amount: number,
): Promise<{ ok: true; sig: string } | { ok: false; reason: string }> {
  if (!MINT) return { ok: false, reason: "No token mint configured" };
  const escrow = escrowKeypair();
  if (!escrow) return { ok: false, reason: "The merchant cannot pay out (no escrow key)" };
  try {
    conn ??= new Connection(RPC, { commitment: "confirmed", disableRetryOnRateLimit: true });
    const mintPk = new PublicKey(MINT);
    const destPk = new PublicKey(wallet);
    const escrowAtaPk = getAssociatedTokenAddressSync(mintPk, escrow.publicKey);
    const destAta = getAssociatedTokenAddressSync(mintPk, destPk);
    // the authority pays the fee + any ATA rent (it is the one SOL-funded
    // account in the system); the escrow only signs the token transfer
    const payer = feePayer() ?? escrow;
    const tx = new Transaction().add(
      createAssociatedTokenAccountIdempotentInstruction(payer.publicKey, destAta, destPk, mintPk),
      createTransferCheckedInstruction(
        escrowAtaPk, mintPk, destAta, escrow.publicKey,
        BigInt(Math.round(amount * 10 ** DECIMALS)), DECIMALS,
      ),
    );
    tx.feePayer = payer.publicKey;
    tx.recentBlockhash = (await withDeadline(conn.getLatestBlockhash(), 8000)).blockhash;
    const signers = payer === escrow ? [escrow] : [payer, escrow];
    const sig = await withDeadline(conn.sendTransaction(tx, signers), 10_000);
    // poll to confirmed (bounded) — the payout row is only written after this
    for (let i = 0; i < 15; i++) {
      const st = await withDeadline(conn.getSignatureStatuses([sig]), 6000).catch(() => null);
      const s = st?.value?.[0];
      if (s?.err) return { ok: false, reason: "The payout failed on-chain" };
      if (s?.confirmationStatus === "confirmed" || s?.confirmationStatus === "finalized") {
        cache.delete(wallet);
        cache.delete(escrow.publicKey.toBase58());
        return { ok: true, sig };
      }
      await new Promise((r) => setTimeout(r, 2000));
    }
    return { ok: false, reason: "The chain never confirmed the payout" };
  } catch (e) {
    return { ok: false, reason: `Chain unreachable: ${(e as Error).message}`.slice(0, 120) };
  }
}

/** a wallet's ATA for the game mint (verification target for transfer legs) */
export function walletAta(wallet: string): string {
  if (!MINT) return "";
  try {
    return getAssociatedTokenAddressSync(new PublicKey(MINT), new PublicKey(wallet)).toBase58();
  } catch {
    return "";
  }
}
