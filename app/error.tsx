"use client";

// TEMP DIAGNOSTIC: Next's default production error page hides the real message
// ("a client-side exception has occurred"). This boundary catches render errors
// in the page tree and shows the actual message + stack + digest as selectable
// text so the mobile crash can be screenshotted. Remove once diagnosed.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "rgba(10,8,16,0.98)",
        color: "#ff6b6b",
        font: "500 12px/1.5 ui-monospace, monospace",
        padding: "calc(env(safe-area-inset-top,0px) + 16px) 14px 16px",
        overflow: "auto",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        WebkitUserSelect: "text",
        userSelect: "text",
      }}
    >
      <div style={{ color: "#e7c873", marginBottom: 10, fontWeight: 700 }}>
        render error (screenshot this · tap-hold to copy)
      </div>
      {`name: ${error.name}\nmessage: ${error.message}\ndigest: ${error.digest ?? "—"}\n\n${error.stack ?? "(no stack)"}`}
      <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
        <button
          onClick={() => reset()}
          style={{ background: "#2a2438", color: "#d8cfe0", border: 0, padding: "8px 14px", font: "600 13px ui-monospace" }}
        >
          retry
        </button>
        <button
          onClick={() => { window.location.href = "/"; }}
          style={{ background: "#2a2438", color: "#d8cfe0", border: 0, padding: "8px 14px", font: "600 13px ui-monospace" }}
        >
          home
        </button>
      </div>
    </div>
  );
}
