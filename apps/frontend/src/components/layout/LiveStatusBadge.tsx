"use client";
import React from "react";

interface LiveStatusBadgeProps {
  connected: boolean;
  marketOpen: boolean | null;
}

// Shown next to any "Live"-updating price/net-worth figure. Once the socket
// tells us the market's closed, no more ticks are coming (see priceSocket.ts's
// broadcast loop) - showing a pulsing "Live" dot forever would be misleading.
function LiveStatusBadge({ connected, marketOpen }: LiveStatusBadgeProps) {
  if (!connected) return null;

  if (marketOpen === false) {
    return (
      <span className="flex items-center gap-1.5 text-xs font-medium text-gray-400">
        <span className="w-2 h-2 rounded-full bg-gray-400" />
        Market Closed
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1.5 text-xs font-medium text-green-500">
      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
      Live
    </span>
  );
}

export default LiveStatusBadge;
