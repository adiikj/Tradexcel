"use client";

// Last-resort boundary for errors in the root layout itself; it replaces the
// whole document, so it can't rely on the app's CSS or providers.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", display: "grid", placeItems: "center", minHeight: "100vh", margin: 0 }}>
        <div role="alert" style={{ textAlign: "center" }}>
          <h1>Tradexcel ran into a problem</h1>
          <p>Please try again.</p>
          <button onClick={reset} style={{ padding: "8px 20px", borderRadius: 8, border: 0, background: "#3b82f6", color: "#fff", cursor: "pointer" }}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
