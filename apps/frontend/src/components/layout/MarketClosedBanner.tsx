"use client";
import React from "react";
import { FiClock } from "react-icons/fi";
import { useMarketStatus } from "../../hooks/useMarketStatus";

interface MarketClosedBannerProps {
  darkMode?: boolean;
}

// Self-contained (reads market status itself) so it can be dropped into any
// page without threading state through. Renders nothing until we've actually
// heard "closed" from the server - stays silent while open or unknown.
function MarketClosedBanner({ darkMode }: MarketClosedBannerProps) {
  const { open, nextOpenLabel } = useMarketStatus();
  if (open !== false) return null;

  return (
    <div
      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs md:text-sm mb-4 ${
        darkMode ? "bg-amber-900/20 text-amber-300 border border-amber-900/40" : "bg-amber-50 text-amber-800 border border-amber-200"
      }`}
    >
      <FiClock className="shrink-0" />
      <span>
        Market's closed right now, showing prices from the last trading day.
        {nextOpenLabel && ` ${nextOpenLabel}.`}
      </span>
    </div>
  );
}

export default MarketClosedBanner;
