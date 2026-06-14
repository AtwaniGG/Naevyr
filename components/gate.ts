"use client";

import { useEffect, useState } from "react";
import { getGateWallet, getGateProof, setGateWallet, setGateProof, type GateProof } from "@/game/state/persistence";
import { gateMessage } from "@/game/types";
import { viewport } from "@/game/state/viewport";

/** Phantom universal link: opens the current page inside Phantom's in-app
 *  browser, where window.solana is injected. Mobile browsers (Safari/Chrome)
 *  have no wallet to talk to otherwise, so a bare connect() silently fails. */
function openInPhantom(): boolean {
  if (typeof window === "undefined") return false;
  const url = encodeURIComponent(window.location.href);
  const ref = encodeURIComponent(window.location.origin);
  window.location.href = `https://phantom.app/ul/browse/${url}?ref=${ref}`;
  return true;
}

// Shared landing-site plumbing: the game server's HTTP face (/gate,
// /leaderboard) and the browser-wallet connect used by the nav and the door.

export interface GateInfo {
  gate: number;
  mint: string | null;
  balance: number | null;
  ok: boolean;
  online: number;
  /** the door hands any connected wallet a nonce to sign (ownership proof →
   *  auto-link on join); a warded gate also enforces the balance */
  nonce?: string;
  /** verdict on a stored proof passed back via gateUrl(addr, proof) */
  proofOk?: boolean;
}

interface WalletProvider {
  connect?: () => Promise<{ publicKey?: { toString(): string } }>;
  disconnect?: () => Promise<void>;
  signMessage?: (msg: Uint8Array, enc: string) => Promise<{ signature?: Uint8Array } | Uint8Array>;
  on?: (event: string, handler: (arg: unknown) => void) => void;
  removeListener?: (event: string, handler: (arg: unknown) => void) => void;
  publicKey?: { toString(): string } | null;
}

export function detectWallet(): WalletProvider | undefined {
  const w = window as unknown as Record<string, WalletProvider | { solana?: WalletProvider } | undefined>;
  return (
    (w.phantom as { solana?: WalletProvider } | undefined)?.solana ??
    (w.solana as WalletProvider | undefined) ??
    (w.solflare as WalletProvider | undefined) ??
    (w.backpack as WalletProvider | undefined)
  );
}

export function httpBase(): string {
  return (process.env.NEXT_PUBLIC_GAME_SERVER ?? "ws://localhost:2567").replace(/^ws/, "http");
}

export function gateUrl(address?: string | null, proof?: GateProof | null): string {
  if (!address) return `${httpBase()}/gate`;
  let url = `${httpBase()}/gate?address=${encodeURIComponent(address)}`;
  if (proof && proof.address === address) {
    url += `&nonce=${encodeURIComponent(proof.nonce)}&sig=${encodeURIComponent(proof.sig)}`;
  }
  return url;
}

/** sign the gate nonce with the connected wallet and store the proof for the
 *  joins to come; null = the wallet declined (or cannot sign messages) */
export async function signGateProof(address: string, nonce: string): Promise<GateProof | null> {
  const provider = detectWallet();
  if (!provider?.signMessage) return null;
  try {
    const message = new TextEncoder().encode(gateMessage(address, nonce));
    const result = await provider.signMessage(message, "utf8");
    const sig: Uint8Array =
      (result as { signature?: Uint8Array }).signature ?? (result as Uint8Array);
    const hex = Array.from(sig, (b) => b.toString(16).padStart(2, "0")).join("");
    const proof: GateProof = { address, nonce, sig: hex };
    setGateProof(proof);
    return proof;
  } catch {
    return null;
  }
}

export const shortAddr = (a: string) => `${a.slice(0, 4)}…${a.slice(-4)}`;

/** wallet + door state shared by the nav and the home-page gate flow */
export function useGate() {
  const [info, setInfo] = useState<GateInfo | null>(null);
  const [wallet, setWallet] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const stored = getGateWallet();
    setWallet(stored);
    // with an address attached the server does an RPC balance read (up to ~3.5s)
    fetch(gateUrl(stored), { signal: AbortSignal.timeout(stored ? 6000 : 2500) })
      .then((r) => r.json())
      .then((g: GateInfo) => {
        setInfo(g);
        if (stored) setBalance(g.balance);
      })
      .catch(() => setInfo(null));

    // switching accounts inside the wallet extension re-checks the door live
    const provider = detectWallet();
    const onAccountChanged = (pk: unknown) => {
      const address = (pk as { toString(): string } | null)?.toString?.() ?? null;
      if (!address) {
        // the new account hasn't approved this site yet; wait for a fresh connect
        setWallet(null);
        setBalance(null);
        setGateWallet(null);
        setGateProof(null);
        return;
      }
      setWallet(address);
      setGateWallet(address);
      setGateProof(null); // the old account's signature proves nothing here
      fetch(gateUrl(address), { signal: AbortSignal.timeout(6000) })
        .then((r) => r.json())
        .then((g: GateInfo) => setBalance(g.balance))
        .catch(() => setBalance(null));
    };
    provider?.on?.("accountChanged", onAccountChanged);
    return () => provider?.removeListener?.("accountChanged", onAccountChanged);
  }, []);

  /** connect a wallet and check it at the door; null = no wallet answered */
  const connect = async (): Promise<GateInfo | null> => {
    if (busy) return null;
    setBusy(true);
    try {
      const provider = detectWallet();
      if (!provider?.connect) {
        // no injected wallet on a phone → bounce into Phantom's in-app browser
        // (a desktop without an extension just gets nothing, as before)
        if (viewport.isTouch) openInPhantom();
        return null;
      }
      const res = await provider.connect();
      const address = res?.publicKey?.toString() ?? provider.publicKey?.toString();
      if (!address) return null;
      const g: GateInfo = await (await fetch(gateUrl(address), { signal: AbortSignal.timeout(6000) })).json();
      setWallet(address);
      setBalance(g.balance);
      setGateWallet(address);
      // sign an ownership proof ONCE at connect (even on an open gate) so the
      // wallet auto-links on join — no separate in-game link step. Reuse a
      // stored proof for this address if it's still valid.
      if (g.nonce) {
        const stored = getGateProof();
        if (!stored || stored.address !== address) {
          await signGateProof(address, g.nonce).catch(() => null);
        }
      }
      return g;
    } catch {
      return null;
    } finally {
      setBusy(false);
    }
  };

  /** unbind the wallet: forget the cleared address, drop the chip, release the provider */
  const disconnect = async () => {
    setWallet(null);
    setBalance(null);
    setGateWallet(null);
    setGateProof(null);
    try {
      await detectWallet()?.disconnect?.();
    } catch {
      // the provider may not support disconnect; forgetting locally is enough
    }
  };

  return { info, wallet, balance, busy, connect, disconnect };
}

// ---- the public scarcity counter (GET /stats) ---------------------------------

export interface BurnStats {
  /** DRIFTS burned forever, lifetime */
  burned: number;
  /** DRIFTS tithed to the treasury (the protocol fee that funds development) */
  treasury: number;
  /** verified burns, lifetime */
  count: number;
  bySink: Record<string, number>;
}

/** burn totals off the game server; null while loading/offline. With a wallet
 *  address the totals are THAT wallet's own burns (a personal chip); with no
 *  address they are the realm-wide public scarcity counter (every DRIFTS ever
 *  burned, by anyone). null while loading or when no server answers. */
export function useBurnStats(address?: string | null): BurnStats | null {
  const [stats, setStats] = useState<BurnStats | null>(null);
  useEffect(() => {
    let dead = false;
    const q = address ? `?address=${encodeURIComponent(address)}` : "";
    fetch(`${httpBase()}/stats${q}`, { signal: AbortSignal.timeout(5000) })
      .then((r) => r.json())
      .then((s: BurnStats) => { if (!dead) setStats(s); })
      .catch(() => {});
    return () => { dead = true; };
  }, [address]);
  return stats;
}
