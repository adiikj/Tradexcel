"use client";
import React, { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import stockList from "../market/StockData.json";
import { searchPlayers } from "../../api/api";

type StockResult = { type: "stock"; symbol: string; shortName: string; fullName: string };
type PlayerResult = { type: "player"; id: string; username: string; name: string; avatar?: string };
type Result = StockResult | PlayerResult;

const MAX_STOCK_RESULTS = 5;
const MAX_PLAYER_RESULTS = 6;

const GlobalSearch = ({ darkMode }: { darkMode: boolean }) => {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [players, setPlayers] = useState<PlayerResult[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const desktopRef = useRef<HTMLDivElement>(null);
  const mobileRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const stockResults: StockResult[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return (stockList as any[])
      .filter(
        (s) =>
          s.shortName.toLowerCase().includes(q) ||
          s.fullName.toLowerCase().includes(q) ||
          s.symbol.toLowerCase().includes(q)
      )
      .slice(0, MAX_STOCK_RESULTS)
      .map((s) => ({ type: "stock" as const, symbol: s.symbol, shortName: s.shortName, fullName: s.fullName }));
  }, [query]);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setPlayers([]);
      return;
    }
    let cancelled = false;
    setLoadingPlayers(true);
    const timeout = setTimeout(() => {
      searchPlayers(q)
        .then((res) => {
          if (cancelled) return;
          const users = (res?.data?.users || []).slice(0, MAX_PLAYER_RESULTS);
          setPlayers(
            users.map((u: any) => ({ type: "player" as const, id: u.id, username: u.username, name: u.name, avatar: u.avatar }))
          );
        })
        .catch(() => {
          if (!cancelled) setPlayers([]);
        })
        .finally(() => {
          if (!cancelled) setLoadingPlayers(false);
        });
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [query]);

  const results: Result[] = [...stockResults, ...players];

  useEffect(() => {
    setActiveIndex(-1);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const insideDesktop = desktopRef.current?.contains(target);
      const insideMobile = mobileRef.current?.contains(target);
      if (!insideDesktop && !insideMobile) {
        setFocused(false);
        setMobileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const closeAndReset = () => {
    setFocused(false);
    setMobileOpen(false);
    setQuery("");
    setPlayers([]);
  };

  const selectResult = (result: Result) => {
    if (result.type === "stock") {
      router.push(`/market?symbol=${encodeURIComponent(result.symbol)}`);
    } else {
      router.push(`/u/${result.username}`);
    }
    closeAndReset();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      closeAndReset();
      inputRef.current?.blur();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      const target = activeIndex >= 0 ? results[activeIndex] : results[0];
      if (target) selectResult(target);
    }
  };

  const showDropdown = (focused || mobileOpen) && query.trim().length > 0;

  const searchIcon = (
    <svg
      className="w-4 h-4 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m1.35-5.65a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );

  const dropdown = showDropdown && (
    <div
      className={`absolute left-0 right-0 top-full mt-2 rounded-md shadow-lg z-20 max-h-80 overflow-y-auto ${
        darkMode ? "bg-gray-800 text-white" : "bg-white text-black"
      }`}
    >
      {results.length === 0 && !loadingPlayers ? (
        <p className="text-center text-gray-400 text-sm py-4">No results for "{query}"</p>
      ) : (
        <>
          {stockResults.length > 0 && (
            <div className="py-2">
              <p className="px-4 pb-1 text-xs uppercase tracking-wide text-gray-400">Stocks</p>
              {stockResults.map((s, i) => (
                <button
                  key={s.symbol}
                  onClick={() => selectResult(s)}
                  className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between ${
                    activeIndex === i
                      ? darkMode
                        ? "bg-gray-700"
                        : "bg-gray-100"
                      : darkMode
                      ? "hover:bg-gray-700"
                      : "hover:bg-gray-100"
                  }`}
                >
                  <span className="font-medium">{s.shortName}</span>
                  <span className="text-xs text-gray-400 truncate ml-2">{s.fullName}</span>
                </button>
              ))}
            </div>
          )}

          {(players.length > 0 || loadingPlayers) && (
            <div className={`py-2 ${stockResults.length > 0 ? (darkMode ? "border-t border-gray-700" : "border-t border-gray-200") : ""}`}>
              <p className="px-4 pb-1 text-xs uppercase tracking-wide text-gray-400">Players</p>
              {loadingPlayers && players.length === 0 && (
                <p className="px-4 py-2 text-sm text-gray-400">Searching...</p>
              )}
              {players.map((p, i) => {
                const idx = stockResults.length + i;
                return (
                  <button
                    key={p.id}
                    onClick={() => selectResult(p)}
                    className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${
                      activeIndex === idx
                        ? darkMode
                          ? "bg-gray-700"
                          : "bg-gray-100"
                        : darkMode
                        ? "hover:bg-gray-700"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    {p.avatar && (
                      <img src={p.avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
                    )}
                    <span className="font-medium">{p.name}</span>
                    <span className="text-xs text-gray-400">@{p.username}</span>
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop / tablet inline search */}
      <div ref={desktopRef} className="relative hidden sm:block flex-1 max-w-xs md:max-w-sm mx-2 md:mx-4">
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors duration-200 ${
            darkMode ? "bg-gray-800 text-gray-300" : "bg-gray-100 text-gray-500"
          }`}
        >
          {searchIcon}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search stocks or players..."
            className={`w-full bg-transparent outline-none text-sm ${darkMode ? "text-white placeholder-gray-400" : "text-black placeholder-gray-400"}`}
          />
        </div>
        {dropdown}
      </div>

      {/* Mobile icon-triggered search */}
      <div ref={mobileRef} className="relative sm:hidden">
        <button
          onClick={() => setMobileOpen((prev) => !prev)}
          className={`p-2 rounded-md ${darkMode ? "text-white" : "text-black"}`}
          aria-label="Search"
        >
          {searchIcon}
        </button>
        {mobileOpen && (
          <div
            className={`fixed left-2 right-2 top-14 rounded-md shadow-lg z-20 p-2 ${
              darkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
                darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-500"
              }`}
            >
              {searchIcon}
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search stocks or players..."
                className={`w-full bg-transparent outline-none text-sm ${darkMode ? "text-white placeholder-gray-400" : "text-black placeholder-gray-400"}`}
              />
            </div>
            <div className="relative">{dropdown}</div>
          </div>
        )}
      </div>
    </>
  );
};

export default GlobalSearch;
