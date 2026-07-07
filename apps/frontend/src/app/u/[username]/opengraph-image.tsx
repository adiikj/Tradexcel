import { ImageResponse } from "next/og";

export const alt = "Tradexcel trading profile";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BASE_TRADE_URL = process.env.NEXT_PUBLIC_API_TRADE_URL;

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ display: "flex", fontSize: 40, fontWeight: 700 }}>{value}</div>
      <div style={{ display: "flex", fontSize: 18, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 2 }}>
        {label}
      </div>
    </div>
  );
}

export default async function Image({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;

  let profile: any = null;
  try {
    const res = await fetch(`${BASE_TRADE_URL}/users/${username}/profile`, { cache: "no-store" });
    if (res.ok) {
      profile = (await res.json())?.data ?? null;
    }
  } catch (error) {
    // Falls back to a generic card below.
  }

  const name = profile?.name ?? `@${username}`;
  const netWorth = Number(profile?.netWorth ?? 100000);
  const rank = profile?.rank;
  const streak = profile?.currentStreak ?? 0;
  const avatar = profile?.avatar;
  const formattedNetWorth = `Rs ${netWorth.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          position: "relative",
          background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 40 }}>
          {avatar ? (
            <img src={avatar} width={140} height={140} style={{ borderRadius: "50%", border: "4px solid #3b82f6" }} />
          ) : (
            <div style={{ display: "flex", width: 140, height: 140, borderRadius: "50%", background: "#3b82f6" }} />
          )}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 52, fontWeight: 700 }}>{name}</div>
            <div style={{ display: "flex", fontSize: 28, color: "#93c5fd" }}>@{username}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 56 }}>
          <Stat label="Net Worth" value={formattedNetWorth} />
          <Stat label="Rank" value={rank ? `#${rank}` : "Unranked"} />
          <Stat label="Streak" value={`${streak} days`} />
        </div>
        <div style={{ display: "flex", position: "absolute", bottom: 32, fontSize: 22, color: "#64748b" }}>
          Tradexcel
        </div>
      </div>
    ),
    { ...size }
  );
}
