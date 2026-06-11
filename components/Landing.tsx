"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ds";
import { useGate, gateUrl, signGateProof, type GateInfo } from "@/components/gate";
import { getGateWallet, getGateProof, setDoorName } from "@/game/state/persistence";

// The door itself (/play): runs the gate the moment you arrive — server check
// → wallet (if the door is warded with GATE_TOKENS) → name your wanderer →
// onEnter() mounts the game. No server → wander offline.

const SAVE_KEY = "driftlands-save-v1";

type Step = "checking" | "wallet" | "denied" | "name" | "offline";

/** the name on the existing save, if any */
function savedName(): string {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? String(JSON.parse(raw)?.cosmetics?.name ?? "") : "";
  } catch {
    return "";
  }
}

/** the name is sworn at the door: seeds a fresh save, renames a returning one.
 *  An empty field keeps the old name (or the default, Wanderer). */
function writeName(name: string) {
  const clean = name.trim().slice(0, 16);
  if (!clean) return;
  setDoorName(clean); // survives the server snapshot that lands after join
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const save = JSON.parse(raw);
      save.cosmetics = { ...(save.cosmetics ?? {}), name: clean };
      localStorage.setItem(SAVE_KEY, JSON.stringify(save));
      return;
    }
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({
        day: Math.floor(Date.now() / 86_400_000),
        gold: 0,
        cosmetics: { name: clean, dye: "stone", eye: "drift", aura: "", pet: "" },
        quests: [],
      }),
    );
  } catch {
    // storage blocked — the realm will call them Wanderer
  }
}

export default function Landing({ onEnter }: { onEnter: () => void }) {
  const { info, balance, busy, connect, disconnect } = useGate();
  const [step, setStep] = useState<Step>("checking");
  /** the door's own gate reading; the nav's (info) can time out on slow RPC days */
  const [door, setDoor] = useState<GateInfo | null>(null);
  const [name, setName] = useState("");
  /** returning wanderers get a welcome-back; the input only shows on request */
  const [renaming, setRenaming] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const started = useRef(false);

  // every entry passes the naming step: the name is sworn at the door and
  // can only be changed by leaving the realm and stepping back through
  const proceed = () => {
    setName(savedName());
    setRenaming(false);
    setStep("name");
  };

  // the gatekeeper studies you the moment you arrive
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void (async () => {
      let gate: GateInfo;
      try {
        gate = await (await fetch(gateUrl(), { signal: AbortSignal.timeout(2500) })).json();
      } catch {
        return setStep("offline"); // no shared world; the local sim still runs
      }
      setDoor(gate);
      if (gate.gate === 0) return proceed();
      // the door is token-locked: a previously cleared wallet may still pass,
      // but only if its stored ownership proof still verifies (the server
      // re-checks proofOk; a restart or expiry sends us back to re-sign)
      const known = getGateWallet();
      const proof = getGateProof();
      if (known && proof?.address === known) {
        try {
          const re: GateInfo = await (await fetch(gateUrl(known, proof), { signal: AbortSignal.timeout(4000) })).json();
          if (re.ok && re.proofOk) return proceed();
        } catch {
          // fall through to a fresh connect
        }
      }
      setStep("wallet");
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (step === "name") nameRef.current?.focus();
  }, [step, renaming]);

  const connectAtDoor = async () => {
    const g = await connect();
    if (!g?.ok) return setStep("denied"); // covers "too poor" and "no wallet answered"
    // the balance clears; now prove the wallet is yours (one signature,
    // good for the day's joins and reconnects)
    const address = getGateWallet();
    if (g.nonce && address) {
      const proof = await signGateProof(address, g.nonce);
      if (!proof) return setStep("denied"); // signing declined or unsupported
    }
    proceed();
  };

  const enterNamed = () => {
    writeName(name);
    onEnter();
  };

  return (
    <div
      className="flex items-center justify-center"
      style={{ minHeight: "calc(100vh - 54px)" }}
    >
      <div className="flex flex-col items-center" style={{ gap: 16, maxWidth: 620, padding: 24, textAlign: "center" }}>
        <div className="relative flex items-center justify-center" style={{ width: 640, maxWidth: "92vw", height: 160 }}>
          <div className="landing-plate absolute" style={{ maxWidth: "100%", backgroundPosition: "center" }} />
          <div className="drift-wordmark drift-wordmark-bleed relative" style={{ fontSize: 50, lineHeight: 1, letterSpacing: "0.04em" }}>
            DRIFTLANDS
          </div>
        </div>

        {step === "checking" && (
          <div style={{ font: "italic 400 13px/1.5 var(--font-ui)", color: "var(--text-secondary)" }}>
            The gatekeeper studies you…
          </div>
        )}

        {(step === "wallet" || step === "denied") && (
          <>
            <div className="landing-door" />
            {step === "wallet" ? (
              <>
                <div style={{ font: "400 13px/1.6 var(--font-ui)", color: "var(--text-secondary)", maxWidth: 420 }}>
                  The door is warded. Connect a wallet holding at least{" "}
                  <span style={{ color: "var(--drift-gold)" }}>
                    {(door ?? info)?.gate.toLocaleString() ?? "the required"}
                  </span>{" "}
                  DRIFTS to pass.
                </div>
                <Button size="lg" variant="gold" onClick={() => void connectAtDoor()} disabled={busy} style={{ minWidth: 230 }}>
                  {busy ? "Asking the chain…" : "Connect Wallet"}
                </Button>
              </>
            ) : (
              <>
                <div style={{ font: "400 13px/1.6 var(--font-ui)", color: "#dc2626", maxWidth: 420 }}>
                  {balance === null
                    ? "No Solana wallet answered. Install Phantom, then try again."
                    : balance >= ((door ?? info)?.gate ?? Infinity)
                      ? "The wallet would not sign. The gate takes proof, not promises."
                      : `The gate stays shut. This wallet holds ${balance.toLocaleString()} of the ${(door ?? info)?.gate.toLocaleString() ?? "required"} DRIFTS required.`}
                </div>
                <Button
                  size="md"
                  variant="ghost"
                  onClick={() => {
                    void disconnect(); // release the held wallet so the next connect can pick anew
                    setStep("wallet");
                  }}
                >
                  Try another wallet
                </Button>
              </>
            )}
          </>
        )}

        {step === "name" && (savedName() && !renaming ? (
          <>
            <div style={{ font: "400 13px/1.6 var(--font-ui)", color: "var(--text-secondary)" }}>
              The gate opens. Welcome back,{" "}
              <span style={{ color: "var(--drift-gold)" }}>{savedName()}</span>.
            </div>
            <Button size="lg" variant="gold" onClick={enterNamed} style={{ minWidth: 230 }} autoFocus>
              Step into the Drift
            </Button>
            <button
              onClick={() => {
                setName(savedName());
                setRenaming(true);
              }}
              style={{
                font: "400 11px/1 var(--font-ui)", color: "var(--text-muted)",
                background: "none", border: 0, cursor: "pointer",
                textDecoration: "underline", textUnderlineOffset: 3,
              }}
            >
              take a new name
            </button>
          </>
        ) : (
          <>
            <div style={{ font: "400 13px/1.6 var(--font-ui)", color: "var(--text-secondary)" }}>
              {savedName()
                ? "The old name burns away. What do they call you now?"
                : "The gate opens. What do they call you, wanderer?"}
            </div>
            <input
              ref={nameRef}
              value={name}
              maxLength={16}
              placeholder="Wanderer"
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && enterNamed()}
              className="drift-well"
              style={{
                width: 260, border: 0, outline: "none", padding: "10px 12px",
                font: "400 14px/1 var(--font-ui)", color: "var(--text-primary)",
                textAlign: "center",
              }}
            />
            <Button size="lg" variant="gold" onClick={enterNamed} style={{ minWidth: 230 }}>
              Step into the Drift
            </Button>
          </>
        ))}

        {step === "offline" && (
          <>
            <div style={{ font: "400 13px/1.6 var(--font-ui)", color: "var(--text-secondary)", maxWidth: 420 }}>
              No shared world answers. You can still wander the Driftlands
              alone; claims, markets and the town wait for the realm to return.
            </div>
            <Button size="lg" variant="ghost" onClick={proceed} style={{ minWidth: 230 }}>
              Wander offline
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
