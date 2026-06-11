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
    const res = await conn.getParsedTokenAccountsByOwner(new PublicKey(wallet), {
      mint: new PublicKey(MINT),
    });
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

import { Keypair, Transaction } from "@solana/web3.js";
import {
  createBurnCheckedInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";

const DECIMALS = 6;

let authority: Keypair | null | undefined; // undefined = not tried yet

function feePayer(): Keypair | null {
  if (authority !== undefined) return authority;
  try {
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
    const tx = new Transaction().add(
      createBurnCheckedInstruction(
        ata, mintPk, owner,
        BigInt(Math.round(amount * 10 ** DECIMALS)), DECIMALS,
      ),
    );
    tx.feePayer = payer.publicKey;
    tx.recentBlockhash = (await conn.getLatestBlockhash()).blockhash;
    tx.partialSign(payer);
    return { ok: true, tx: tx.serialize({ requireAllSignatures: false }).toString("base64") };
  } catch (e) {
    return { ok: false, reason: `Chain unreachable: ${(e as Error).message}`.slice(0, 120) };
  }
}

/** confirm a submitted burn on-chain: right mint, owner, and amount */
export async function verifyBurn(
  sig: string,
  wallet: string,
  minAmount: number,
): Promise<{ ok: boolean; reason?: string }> {
  if (!MINT) return { ok: false, reason: "No token mint configured" };
  conn ??= new Connection(RPC, { commitment: "confirmed", disableRetryOnRateLimit: true });
  // poll: wallets return the signature before the cluster confirms it. A
  // throttled/flaky RPC read (429s on public endpoints) is NOT terminal —
  // keep polling until the attempts run out.
  let lastError = "";
  for (let i = 0; i < 15; i++) {
    try {
      const tx = await conn.getParsedTransaction(sig, {
        commitment: "confirmed",
        maxSupportedTransactionVersion: 0,
      });
      if (tx) {
        if (tx.meta?.err) return { ok: false, reason: "The burn failed on-chain" };
        for (const ix of tx.transaction.message.instructions) {
          const parsed = (ix as { parsed?: { type?: string; info?: Record<string, unknown> } }).parsed;
          if (!parsed || (parsed.type !== "burnChecked" && parsed.type !== "burn")) continue;
          const info = parsed.info ?? {};
          const amt =
            (info.tokenAmount as { uiAmount?: number } | undefined)?.uiAmount ??
            Number(info.amount ?? 0) / 10 ** DECIMALS;
          if (
            info.mint === MINT &&
            (info.authority === wallet || info.owner === wallet) &&
            amt >= minAmount
          ) {
            cache.delete(wallet); // balance just changed
            return { ok: true };
          }
        }
        return { ok: false, reason: "No matching burn in that transaction" };
      }
    } catch (e) {
      lastError = `Chain unreachable: ${(e as Error).message}`.slice(0, 120);
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  return { ok: false, reason: lastError || "The chain never confirmed the burn" };
}
