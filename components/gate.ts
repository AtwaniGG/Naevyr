"use client";

import { useEffect, useState } from "react";
import { getGateWallet, setGateWallet } from "@/game/state/persistence";

// Shared landing-site plumbing: the game server's HTTP face (/gate,
// /leaderboard) and the browser-wallet connect used by the nav and the door.

export interface GateInfo {
  gate: number;
  mint: string | null;
  balance: number | null;
  ok: boolean;
  online: number;
}

interface WalletProvider {
  connect?: () => Promise<{ publicKey?: { toString(): string } }>;
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

export function gateUrl(address?: string | null): string {
  return address ? `${httpBase()}/gate?address=${encodeURIComponent(address)}` : `${httpBase()}/gate`;
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
    fetch(gateUrl(stored), { signal: AbortSignal.timeout(2500) })
      .then((r) => r.json())
      .then((g: GateInfo) => {
        setInfo(g);
        if (stored) setBalance(g.balance);
      })
      .catch(() => setInfo(null));
  }, []);

  /** connect a wallet and check it at the door; null = no wallet answered */
  const connect = async (): Promise<GateInfo | null> => {
    if (busy) return null;
    setBusy(true);
    try {
      const provider = detectWallet();
      if (!provider?.connect) return null;
      const res = await provider.connect();
      const address = res?.publicKey?.toString() ?? provider.publicKey?.toString();
      if (!address) return null;
      const g: GateInfo = await (await fetch(gateUrl(address), { signal: AbortSignal.timeout(6000) })).json();
      setWallet(address);
      setBalance(g.balance);
      setGateWallet(address);
      return g;
    } catch {
      return null;
    } finally {
      setBusy(false);
    }
  };

  return { info, wallet, balance, busy, connect };
}
