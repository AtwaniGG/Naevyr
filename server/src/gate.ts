// The entry gate's ownership proof (Phase 6 hardening). The /gate endpoint
// issues a nonce bound to a wallet address; the wallet signs the canonical
// gateMessage; onAuth verifies the ed25519 signature before the balance check,
// so a join can no longer claim a holder's address it does not own.
//
// Nonces are STATELESS: `expiryMs.hmac(address|expiryMs)` under a per-boot
// secret. Nothing to store or prune; a server restart invalidates outstanding
// proofs and the landing quietly re-signs (it re-checks proofOk at the door).

import { createHmac, randomBytes } from "node:crypto";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { gateMessage } from "@/game/types";

const SECRET = randomBytes(32);
const TTL_MS = 12 * 60 * 60 * 1000; // sign once at the door, reconnect all day

function hmac(payload: string): string {
  return createHmac("sha256", SECRET).update(payload).digest("hex").slice(0, 32);
}

/** a nonce the given wallet may sign to prove itself at the gate */
export function issueGateNonce(address: string): string {
  const exp = Date.now() + TTL_MS;
  return `${exp.toString(36)}.${hmac(`${address}|${exp}`)}`;
}

/** true when nonce is ours, unexpired, bound to address, and the signature
 *  over gateMessage(address, nonce) verifies against the address's key */
export function verifyGateProof(address: string, nonce: string, sigHex: string): boolean {
  const dot = nonce.indexOf(".");
  if (dot < 0) return false;
  const exp = parseInt(nonce.slice(0, dot), 36);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  if (nonce.slice(dot + 1) !== hmac(`${address}|${exp}`)) return false;
  if (!/^[0-9a-f]{128}$/i.test(sigHex)) return false;
  let pubkey: Uint8Array;
  try {
    pubkey = bs58.decode(address);
  } catch {
    return false;
  }
  if (pubkey.length !== 32) return false;
  const message = new TextEncoder().encode(gateMessage(address, nonce));
  const signature = Uint8Array.from(Buffer.from(sigHex, "hex"));
  return nacl.sign.detached.verify(message, signature, pubkey);
}
