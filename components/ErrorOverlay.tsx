"use client";

import { useEffect, useState } from "react";

// TEMP DIAGNOSTIC: phones (esp. Phantom's in-app browser) have no console, so
// when a client-side exception fires we paint it on screen — message + stack —
// as selectable text the user can screenshot/copy. Remove once the mobile
// crash is diagnosed.
export default function ErrorOverlay() {
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const show = (label: string, e: unknown) => {
      const any = e as { message?: string; stack?: string; reason?: unknown };
      const reason = any?.reason as { message?: string; stack?: string } | undefined;
      const msg = reason?.message ?? any?.message ?? String(e);
      const stack = reason?.stack ?? any?.stack ?? "";
      setErr(`[${label}] ${msg}\n\n${stack}`);
    };
    const onError = (e: ErrorEvent) => show("error", e.error ?? e);
    const onRej = (e: PromiseRejectionEvent) => show("unhandledrejection", e);
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRej);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRej);
    };
  }, []);

  if (!err) return null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "rgba(10,8,16,0.97)",
        color: "#ff6b6b",
        font: "500 12px/1.5 ui-monospace, monospace",
        padding: "calc(env(safe-area-inset-top,0px) + 16px) 14px 16px",
        overflow: "auto",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        WebkitUserSelect: "text",
        userSelect: "text",
        pointerEvents: "auto",
      }}
    >
      <div style={{ color: "#e7c873", marginBottom: 10, fontWeight: 700 }}>
        client error (tap-hold to copy · screenshot this)
      </div>
      {err}
      <div style={{ marginTop: 16 }}>
        <button
          onClick={() => setErr(null)}
          style={{ background: "#2a2438", color: "#d8cfe0", border: 0, padding: "8px 14px", font: "600 13px ui-monospace" }}
        >
          dismiss
        </button>
      </div>
    </div>
  );
}
