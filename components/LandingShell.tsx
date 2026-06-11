"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ds";
import { useGate, shortAddr } from "@/components/gate";

// The landing site's chrome: one fixed nav across every page (Kintara-style),
// wordmark left, section links, socials, balance chip, Connect. Pages render
// inside on the void backdrop; the home page layers its hero art underneath.

const NAV: { href: string; label: string; icon: number }[] = [
  { href: "/dashboard", label: "Dashboard", icon: 0 },
  { href: "/updates", label: "Updates", icon: 1 },
  { href: "/events", label: "Events", icon: 2 },
  { href: "/how-to-play", label: "How to Play", icon: 3 },
  { href: "/leaderboard", label: "Leaderboard", icon: 4 },
  { href: "/codex", label: "Index", icon: 5 },
  { href: "/docs", label: "Docs", icon: 3 },
];

export default function LandingShell({
  children,
  hero = false,
}: {
  children: React.ReactNode;
  hero?: boolean;
}) {
  const path = usePathname();
  const { info, wallet, balance, busy, connect } = useGate();

  return (
    <div
      className="relative min-h-screen w-screen"
      style={{ background: "#0a0810", color: "var(--text-primary)", overflowX: "hidden" }}
    >
      {hero ? (
        <>
          <div className="landing-hero" style={{ position: "fixed" }} />
          <div
            className="fixed inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(120% 90% at 50% 42%, transparent 40%, rgba(10,8,16,0.78) 100%)," +
                "linear-gradient(180deg, rgba(10,8,16,0.85) 0%, transparent 18%, transparent 72%, rgba(10,8,16,0.9) 100%)",
            }}
          />
        </>
      ) : (
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(900px 600px at 25% 10%, rgba(124,58,237,0.10), transparent 60%)," +
              "radial-gradient(700px 500px at 80% 90%, rgba(168,85,247,0.07), transparent 65%)",
          }}
        />
      )}

      {/* ---- nav -------------------------------------------------------------- */}
      <div
        className="sticky flex items-center"
        style={{
          top: 0, zIndex: 40, gap: 0, padding: "10px 18px",
          background: "rgba(10, 8, 16, 0.86)",
          borderBottom: "1px solid rgba(124, 58, 237, 0.25)",
          backdropFilter: "blur(3px)",
          overflowX: "auto",
        }}
      >
        <Link href="/" style={{ textDecoration: "none", flexShrink: 0 }}>
          <span className="drift-wordmark" style={{ fontSize: 20, lineHeight: 1, marginRight: 16, whiteSpace: "nowrap" }}>
            DRIFTLANDS
          </span>
        </Link>
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className={`landing-nav-link${path === n.href ? " active" : ""}`}
            style={{ textDecoration: "none", whiteSpace: "nowrap" }}
          >
            <span className="landing-icon" style={{ "--icon-index": n.icon } as React.CSSProperties} />
            {n.label}
          </Link>
        ))}
        <span style={{ flex: 1 }} />
        <span style={{ display: "inline-flex", gap: 10, margin: "0 12px", flexShrink: 0 }}>
          {[
            { i: 6, t: "Discord · the hall is being raised" },
            { i: 7, t: "Telegram · the herald is not yet posted" },
            { i: 8, t: "X · the crier sleeps" },
          ].map((s) => (
            <span
              key={s.i}
              className="landing-icon"
              title={s.t}
              style={{ "--icon-index": s.i, opacity: 0.75, cursor: "help" } as React.CSSProperties}
            />
          ))}
        </span>
        {wallet && balance !== null && (
          <span
            className="drift-num"
            style={{
              font: "600 12px/1 var(--font-ui)", color: "var(--drift-gold)",
              padding: "7px 10px", whiteSpace: "nowrap", flexShrink: 0,
              background: "rgba(231, 200, 115, 0.08)",
            }}
            title={`${wallet} holds ${balance.toLocaleString()} tokens`}
          >
            {balance.toLocaleString()} ◆
          </span>
        )}
        <Button
          size="sm"
          variant={wallet ? "gold" : "primary"}
          onClick={() => void connect()}
          disabled={busy}
          style={{ marginLeft: 8, whiteSpace: "nowrap", flexShrink: 0 }}
          title={wallet ?? undefined}
        >
          {wallet ? `Connected · ${shortAddr(wallet)}` : "Connect Wallet"}
        </Button>
      </div>

      <div className="relative" style={{ zIndex: 5 }}>{children}</div>

      {!hero && (
        <div
          className="relative"
          style={{
            zIndex: 5, textAlign: "center", padding: "28px 0 22px",
            font: "400 10.5px/1.5 var(--font-ui)", color: "var(--text-muted)",
          }}
        >
          Driftlands · a realm at the edge of the Drift · devnet build, tokens hold no monetary value
          {info && info.gate > 0 && <> · the door is warded: {info.gate.toLocaleString()} tokens</>}
        </div>
      )}
    </div>
  );
}

/** shared page scaffolding: kicker + title + content column */
export function PageFrame({
  kicker,
  title,
  children,
  wide = false,
}: {
  kicker: string;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div style={{ maxWidth: wide ? 1080 : 860, margin: "0 auto", padding: "36px 22px 20px" }}>
      <div style={{ font: "700 11px/1 var(--font-ui)", color: "var(--drift-core, #a855f7)", letterSpacing: "0.14em", textTransform: "uppercase" }}>
        {kicker}
      </div>
      <h1
        className="drift-wordmark"
        style={{ fontSize: 34, lineHeight: 1.1, margin: "8px 0 22px" }}
      >
        {title}
      </h1>
      {children}
    </div>
  );
}
