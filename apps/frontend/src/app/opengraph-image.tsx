import { ImageResponse } from "next/og";

// The default share image for every page that doesn't set its own
// (public profiles have theirs in u/[username]/opengraph-image.tsx).
export const alt = "Tradexcel: learn to trade the stock market with virtual money";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#F0F3F5", padding: 72, fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", fontSize: 34, fontWeight: 700, color: "#111827" }}>
          Trad<span style={{ color: "#2196F3" }}>excel</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 72, fontWeight: 700, color: "#111827", lineHeight: 1.1, maxWidth: 980 }}>
            Learn to trade the real stock market, risk-free
          </div>
          <div style={{ display: "flex", marginTop: 28, fontSize: 30, color: "#4B5563" }}>₹1,00,000 in virtual cash · 250+ NSE stocks · Weekly seasons</div>
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          {["Live NSE prices", "Contests and leagues", "Free forever"].map((t) => (
            <div key={t} style={{ display: "flex", background: "white", border: "2px solid #E5E7EB", borderRadius: 999, padding: "12px 24px", fontSize: 24, color: "#374151" }}>
              {t}
            </div>
          ))}
        </div>
      </div>
    ),
    size
  );
}
