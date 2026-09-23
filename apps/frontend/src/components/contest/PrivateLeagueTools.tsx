"use client";
import React, { useMemo, useState } from "react";
import rawStockList from "../market/StockData.json";
import Modal from "../ui/Modal";

const DEFAULT_FORM = {
  name: "",
  startAt: "",
  endAt: "",
  startingBalance: "100000",
  prize: "",
};

const MAX_SYMBOLS = 50;

// StockData.json has a few duplicate entries; dedupe by symbol (same approach as AdminContests.tsx).
const STOCK_UNIVERSE = Array.from(
  new Map((rawStockList as { shortName: string; fullName: string; symbol: string }[]).map((s) => [s.symbol, s])).values()
);

interface JoinPrivateContestModalProps {
  isJoining: boolean;
  onJoin: (inviteCode: string) => Promise<void>;
  onClose: () => void;
}

export function JoinPrivateContestModal({ isJoining, onJoin, onClose }: JoinPrivateContestModalProps) {
  const [inviteCode, setInviteCode] = useState("");

  return (
    <Modal onClose={onClose} label="Join a private contest" className={`rounded-2xl p-6 bg-white dark:bg-gray-900`}>
      <div className="text-black dark:text-white">
        <div className="flex justify-between items-start mb-2">
          <h2 className="text-base font-bold">Join a private contest</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-200 text-xl leading-none">&times;</button>
        </div>
        <p className="text-sm text-gray-400 mb-4">Paste a room code from a friend to join their private leaderboard.</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input aria-label="Invite code"
            autoFocus
            value={inviteCode}
            onChange={(event) => setInviteCode(event.target.value.toUpperCase())}
            placeholder="Enter invite code"
            className={`flex-1 rounded-lg px-4 py-3 outline-none border bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700`}
          />
          <button
            disabled={isJoining || !inviteCode.trim()}
            onClick={async () => {
              await onJoin(inviteCode.trim().toUpperCase());
            }}
            className="px-5 py-3 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
          >
            {isJoining ? "Joining..." : "Join"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

interface CreatePrivateContestModalProps {
  isCreating: boolean;
  onCreate: (payload: {
    name: string;
    startAt: string;
    endAt: string;
    startingBalance?: number;
    symbols: string[];
    prize?: string;
  }) => Promise<void>;
  onClose: () => void;
}

export function CreatePrivateContestModal({ isCreating, onCreate, onClose }: CreatePrivateContestModalProps) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [symbolSearch, setSymbolSearch] = useState("");
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>([]);

  const filteredStocks = useMemo(() => {
    const query = symbolSearch.trim().toLowerCase();
    if (!query) return STOCK_UNIVERSE.slice(0, 30);
    return STOCK_UNIVERSE.filter(
      (s) => s.shortName.toLowerCase().includes(query) || s.fullName.toLowerCase().includes(query)
    ).slice(0, 30);
  }, [symbolSearch]);

  const toggleSymbol = (symbol: string) => {
    setSelectedSymbols((current) => {
      if (current.includes(symbol)) return current.filter((s) => s !== symbol);
      if (current.length >= MAX_SYMBOLS) return current;
      return [...current, symbol];
    });
  };

  return (
    <Modal onClose={onClose} label="Create a private contest" maxWidth="max-w-2xl" className={`rounded-2xl p-6 bg-white dark:bg-gray-900`}>
      <div className="text-black dark:text-white">
        <div className="flex justify-between items-start mb-2">
          <h2 className="text-base font-bold">Create a private contest</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-200 text-xl leading-none">&times;</button>
        </div>
        <p className="text-sm text-gray-400 mb-4">Start a room, share the invite code, and compete in a members-only contest.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input aria-label="Contest name"
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            placeholder="Contest name"
            className={`rounded-lg px-4 py-3 outline-none border bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700`}
          />
          <input aria-label="Prize or stakes"
            value={form.prize}
            onChange={(event) => setForm((current) => ({ ...current, prize: event.target.value }))}
            placeholder="Prize or stakes (optional)"
            className={`rounded-lg px-4 py-3 outline-none border bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700`}
          />
          <input aria-label="Starts at"
            type="datetime-local"
            value={form.startAt}
            onChange={(event) => setForm((current) => ({ ...current, startAt: event.target.value }))}
            className={`rounded-lg px-4 py-3 outline-none border bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700`}
          />
          <input aria-label="Ends at"
            type="datetime-local"
            value={form.endAt}
            onChange={(event) => setForm((current) => ({ ...current, endAt: event.target.value }))}
            className={`rounded-lg px-4 py-3 outline-none border bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700`}
          />
          <input aria-label="Starting balance"
            value={form.startingBalance}
            onChange={(event) => setForm((current) => ({ ...current, startingBalance: event.target.value }))}
            placeholder="Starting balance"
            className={`rounded-lg px-4 py-3 outline-none border bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700`}
          />
        </div>

        <div className="mt-3">
          <label htmlFor="private-league-tools-stock-universe-selected" className="text-xs uppercase tracking-wide text-gray-400">
            Stock universe ({selectedSymbols.length}/{MAX_SYMBOLS} selected)
          </label>
          <input
            id="private-league-tools-stock-universe-selected"
            value={symbolSearch}
            onChange={(event) => setSymbolSearch(event.target.value)}
            placeholder="Search stocks to add..."
            className={`w-full mt-1.5 rounded-lg px-4 py-2.5 outline-none border bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700`}
          />
          <div className={`mt-2 max-h-40 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700`}>
            {filteredStocks.length === 0 ? (
              <p className="text-sm text-gray-400 p-3">No matches.</p>
            ) : (
              filteredStocks.map((stock) => {
                const checked = selectedSymbols.includes(stock.symbol);
                return (
                  <label
                    key={stock.symbol}
                    className={`flex items-center gap-2 px-3 py-2 text-sm cursor-pointer ${
                      "hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    <input type="checkbox" checked={checked} onChange={() => toggleSymbol(stock.symbol)} />
                    <span className="font-medium">{stock.shortName}</span>
                    <span className="text-gray-400 truncate">{stock.fullName}</span>
                  </label>
                );
              })
            )}
          </div>
          {selectedSymbols.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {selectedSymbols.map((symbol) => (
                <span
                  key={symbol}
                  className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${
                    "bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                  }`}
                >
                  {symbol}
                  <button type="button" onClick={() => toggleSymbol(symbol)} aria-label={`Remove ${symbol}`} className="text-gray-400 hover:text-red-500">
                    &times;
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <button
          disabled={isCreating || selectedSymbols.length === 0 || !form.name.trim() || !form.startAt || !form.endAt}
          onClick={async () => {
            await onCreate({
              name: form.name.trim(),
              startAt: form.startAt,
              endAt: form.endAt,
              startingBalance: form.startingBalance ? Number(form.startingBalance) : undefined,
              symbols: selectedSymbols,
              prize: form.prize.trim() || undefined,
            });
          }}
          className="mt-4 w-full py-3 rounded-lg bg-green-600 text-white hover:bg-green-500 disabled:opacity-50"
        >
          {isCreating ? "Creating..." : "Create private contest"}
        </button>
      </div>
    </Modal>
  );
}
