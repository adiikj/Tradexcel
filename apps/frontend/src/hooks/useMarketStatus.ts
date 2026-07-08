"use client";
import { useEffect, useState } from "react";
import { getSocket } from "../lib/socket";

export interface MarketStatus {
  open: boolean | null;
  nextOpenLabel: string | null;
}

// The server only pushes this on connect and on an actual open/close flip
// (see priceSocket.ts), so open: null just means "haven't heard yet."
export function useMarketStatus(): MarketStatus {
  const [status, setStatus] = useState<MarketStatus>({ open: null, nextOpenLabel: null });

  useEffect(() => {
    const socket = getSocket();
    const handleStatus = (payload: { open: boolean; nextOpenLabel: string | null }) =>
      setStatus({ open: payload.open, nextOpenLabel: payload.nextOpenLabel });
    socket.on("marketStatus", handleStatus);
    return () => {
      socket.off("marketStatus", handleStatus);
    };
  }, []);

  return status;
}
