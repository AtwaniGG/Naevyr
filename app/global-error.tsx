"use client";

// TEMP DIAGNOSTIC backstop: catches errors that escape app/error.tsx (e.g. in
// the root layout). Must render its own <html>/<body>. Remove once the mobile
// crash is diagnosed.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            background: "rgba(10,8,16,0.98)",
            color: "#ff6b6b",
            font: "500 12px/1.5 ui-monospace, monospace",
            padding: "48px 14px 16px",
            overflow: "auto",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            WebkitUserSelect: "text",
            userSelect: "text",
          }}
        >
          <div style={{ color: "#e7c873", marginBottom: 10, fontWeight: 700 }}>
            global error (screenshot this)
          </div>
          {`name: ${error.name}\nmessage: ${error.message}\ndigest: ${error.digest ?? "—"}\n\n${error.stack ?? "(no stack)"}`}
          <div style={{ marginTop: 16 }}>
            <button onClick={() => reset()} style={{ background: "#2a2438", color: "#d8cfe0", border: 0, padding: "8px 14px", font: "600 13px ui-monospace" }}>
              retry
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
