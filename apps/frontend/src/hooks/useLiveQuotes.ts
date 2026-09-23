"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { getSocket, peekSocket, subscribeSymbols } from "../lib/socket";

export interface LiveQuote {
  price: number;
  change: number | null;
  changePercent: number | null;
  timestamp: number;
}

// Connection status as an external store: subscribing opens the shared socket.
function subscribeConnection(onChange: () => void) {
  const socket = getSocket();
  socket.on("connect", onChange);
  socket.on("disconnect", onChange);
  return () => {
    socket.off("connect", onChange);
    socket.off("disconnect", onChange);
  };
}

const readConnected = () => peekSocket()?.connected ?? false;

// Subscribes to live price ticks for a set of symbols over the shared socket
// connection. Re-subscribes only when the actual symbol set changes (not on
// every render, since callers typically pass a freshly-mapped array).
export function useLiveQuotes(symbols: string[]) {
  const key = symbols.length ? [...new Set(symbols)].sort().join(",") : "";
  const [quotes, setQuotes] = useState<Record<string, LiveQuote>>({});
  const connected = useSyncExternalStore(subscribeConnection, readConnected, () => false);
  const subscribedRef = useRef<string[]>([]);


  useEffect(() => {
    if (!key) return;
    const symbolList = key.split(",");

    const socket = getSocket();
    subscribedRef.current = symbolList;
    const unsubscribe = subscribeSymbols(symbolList);

    const handlePrice = (tick: { symbol: string } & LiveQuote) => {
      if (!subscribedRef.current.includes(tick.symbol)) return;
      setQuotes((prev) => ({ ...prev, [tick.symbol]: tick }));
    };

    socket.on("price", handlePrice);

    return () => {
      unsubscribe();
      socket.off("price", handlePrice);
    };
  }, [key]);

  return { quotes, connected };
}
