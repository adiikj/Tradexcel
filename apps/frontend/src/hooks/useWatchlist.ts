"use client";
import { useCallback, useRef, useState } from "react";
import toast from "react-hot-toast";
import { addToWatchlist, getWatchlist, removeFromWatchlist } from "../api/api";
import { useAsyncEffect } from "./useAsyncEffect";

// The player's starred stocks. Toggles apply instantly and roll back if the
// server refuses (e.g. the 50-stock limit).
export function useWatchlist() {
  const [symbols, setSymbolsState] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  // Mirrors `symbols` so toggle can read the current list synchronously.
  const current = useRef<string[]>([]);
  const setSymbols = useCallback((next: string[]) => {
    current.current = next;
    setSymbolsState(next);
  }, []);

  const load = useCallback(
    async (isActive: () => boolean) => {
      try {
        const list = await getWatchlist();
        if (isActive()) setSymbols(list ?? []);
      } catch {
        // Stars just show as empty; the rest of the page still works.
      } finally {
        if (isActive()) setLoaded(true);
      }
    },
    [setSymbols]
  );

  useAsyncEffect((isActive) => load(isActive), [load]);

  const toggle = useCallback(
    async (symbol: string) => {
      const watched = current.current.includes(symbol);
      const without = (list: string[]) => list.filter((s) => s !== symbol);
      setSymbols(watched ? without(current.current) : [...current.current, symbol]);
      try {
        setSymbols(await (watched ? removeFromWatchlist(symbol) : addToWatchlist(symbol)));
      } catch (err) {
        setSymbols(watched ? [...without(current.current), symbol] : without(current.current));
        toast.error(err instanceof Error ? err.message : "We couldn't update your watchlist.");
      }
    },
    [setSymbols]
  );

  return { symbols, loaded, toggle };
}
