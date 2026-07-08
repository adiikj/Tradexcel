"use client";
import { useEffect, useRef, useState } from "react";
import { getSocket, subscribeSymbols } from "../lib/socket";

export interface LiveQuote {
  price: number;
  change: number | null;
  changePercent: number | null;
  timestamp: number;
}

// Subscribes to live price ticks for a set of symbols over the shared socket
// connection. Re-subscribes only when the actual symbol set changes (not on
// every render, since callers typically pass a freshly-mapped array).
export function useLiveQuotes(symbols: string[]) {
  const key = symbols.length ? [...new Set(symbols)].sort().join(",") : "";
  const [quotes, setQuotes] = useState<Record<string, LiveQuote>>({});
  const [connected, setConnected] = useState(false);
  const subscribedRef = useRef<string[]>([]);

  useEffect(() => {
    const socket = getSocket();
    setConnected(socket.connected);

    const handleConnect = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, []);

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
