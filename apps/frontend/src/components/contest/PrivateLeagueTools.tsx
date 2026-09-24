"use client";
import React, { useMemo, useState } from "react";
import { PiCheck, PiX } from "react-icons/pi";
import { STOCK_LIST as rawStockList } from "@tradexcel/shared";
import Modal from "../ui/Modal";

const DEFAULT_FORM = {
  name: "",
  startAt: "",
  endAt: "",
  startingBalance: "100000",
  prize: "",
};

const MAX_SYMBOLS = 50;

// The stock list has a few duplicate entries; dedupe by symbol (same approach as AdminContests.tsx).
const STOCK_UNIVERSE = Array.from(
  new Map((rawStockList as { shortName: string; fullName: string; symbol: string }[]).map((s) => [s.symbol, s])).values()
);
const SHORT_NAME = new Map(STOCK_UNIVERSE.map((s) => [s.symbol, s.shortName]));

const INPUT = "w-full rounded-xl bg-gray-100 px-3.5 py-2.5 text-sm outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 dark:bg-gray-800";
const LABEL = "mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-300";

function ModalHeader({ title, subtitle, onClose }: { title: string; subtitle: string; onClose: () => void }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
      >
        <PiX aria-hidden="true" className="h-5 w-5" />
      </button>
    </div>
  );
}

interface JoinPrivateContestModalProps {
  isJoining: boolean;
  onJoin: (inviteCode: string) => Promise<void>;
  onClose: () => void;
}

export function JoinPrivateContestModal({ isJoining, onJoin, onClose }: JoinPrivateContestModalProps) {
  const [inviteCode, setInviteCode] = useState("");

  return (
    <Modal onClose={onClose} label="Join a private league" className="rounded-2xl bg-white p-6 dark:bg-gray-900">
      <form
        className="text-gray-900 dark:text-white"
        onSubmit={async (e) => {
          e.preventDefault();
          if (inviteCode.trim()) await onJoin(inviteCode.trim().toUpperCase());
        }}
      >
        <ModalHeader title="Join a private league" subtitle="Enter the invite code a friend shared with you." onClose={onClose} />
        <label htmlFor="invite-code" className={LABEL}>
          Invite code
        </label>
        <input
          id="invite-code"
          autoFocus
          autoComplete="off"
          value={inviteCode}
          onChange={(event) => setInviteCode(event.target.value.toUpperCase())}
          placeholder="e.g. X7K2QP"
          className={`${INPUT} font-mono text-base tracking-widest`}
        />
        <button
          type="submit"
          disabled={isJoining || !inviteCode.trim()}
          className="mt-5 w-full rounded-xl bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isJoining ? "Joining…" : "Join league"}
        </button>
      </form>
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

  const set = (key: keyof typeof DEFAULT_FORM) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

  const endBeforeStart = Boolean(form.startAt && form.endAt && form.endAt <= form.startAt);
  const canSubmit = !isCreating && selectedSymbols.length > 0 && form.name.trim() && form.startAt && form.endAt && !endBeforeStart;

  return (
    <Modal onClose={onClose} label="Create a private league" maxWidth="max-w-2xl" className="rounded-2xl bg-white p-6 dark:bg-gray-900">
      <form
        className="text-gray-900 dark:text-white"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!canSubmit) return;
          await onCreate({
            name: form.name.trim(),
            startAt: form.startAt,
            endAt: form.endAt,
            startingBalance: form.startingBalance ? Number(form.startingBalance) : undefined,
            symbols: selectedSymbols,
            prize: form.prize.trim() || undefined,
          });
        }}
      >
        <ModalHeader title="Create a private league" subtitle="Pick the stocks and schedule, then share the invite code." onClose={onClose} />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label htmlFor="league-name" className={LABEL}>
              League name
            </label>
            <input id="league-name" value={form.name} onChange={set("name")} placeholder="Friday night traders" className={INPUT} />
          </div>
          <div>
            <label htmlFor="league-start" className={LABEL}>
              Starts
            </label>
            <input id="league-start" type="datetime-local" value={form.startAt} onChange={set("startAt")} className={INPUT} />
          </div>
          <div>
            <label htmlFor="league-end" className={LABEL}>
              Ends
            </label>
            <input
              id="league-end"
              type="datetime-local"
              value={form.endAt}
              min={form.startAt || undefined}
              onChange={set("endAt")}
              aria-invalid={endBeforeStart}
              aria-describedby={endBeforeStart ? "league-end-error" : undefined}
              className={`${INPUT} ${endBeforeStart ? "ring-2 ring-red-500" : ""}`}
            />
            {endBeforeStart && (
              <p id="league-end-error" className="mt-1 text-xs text-red-600 dark:text-red-400">
                The end must be after the start.
              </p>
            )}
          </div>
          <div>
            <label htmlFor="league-balance" className={LABEL}>
              Starting cash (₹)
            </label>
            <input id="league-balance" type="number" min={1} inputMode="numeric" value={form.startingBalance} onChange={set("startingBalance")} className={INPUT} />
          </div>
          <div>
            <label htmlFor="league-prize" className={LABEL}>
              Prize or stakes <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <input id="league-prize" value={form.prize} onChange={set("prize")} placeholder="Loser buys coffee" className={INPUT} />
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-1.5 flex items-baseline justify-between">
            <label htmlFor="league-stock-search" className="text-xs font-medium text-gray-600 dark:text-gray-300">
              Stocks players can trade
            </label>
            <span className="text-xs tabular-nums text-gray-500 dark:text-gray-400">
              {selectedSymbols.length}/{MAX_SYMBOLS}
            </span>
          </div>
          <input id="league-stock-search" value={symbolSearch} onChange={(event) => setSymbolSearch(event.target.value)} placeholder="Search stocks" className={INPUT} />

          {selectedSymbols.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {selectedSymbols.map((symbol) => (
                <span key={symbol} className="flex items-center gap-1 rounded-full bg-blue-100 py-0.5 pl-2.5 pr-1 text-xs font-medium text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                  {SHORT_NAME.get(symbol) ?? symbol}
                  <button type="button" onClick={() => toggleSymbol(symbol)} aria-label={`Remove ${SHORT_NAME.get(symbol) ?? symbol}`} className="rounded-full p-0.5 hover:bg-blue-200 dark:hover:bg-blue-500/30">
                    <PiX aria-hidden="true" className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <ul className="mt-2 max-h-48 divide-y divide-gray-100 overflow-y-auto rounded-xl ring-1 ring-gray-200 dark:divide-gray-800 dark:ring-gray-800">
            {filteredStocks.length === 0 ? (
              <li className="p-3 text-sm text-gray-500 dark:text-gray-400">No matches.</li>
            ) : (
              filteredStocks.map((stock) => {
                const checked = selectedSymbols.includes(stock.symbol);
                return (
                  <li key={stock.symbol}>
                    <label className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50 has-[:focus-visible]:bg-gray-50 dark:hover:bg-gray-800 dark:has-[:focus-visible]:bg-gray-800">
                      <input type="checkbox" checked={checked} onChange={() => toggleSymbol(stock.symbol)} className="sr-only" />
                      <span
                        aria-hidden="true"
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded ${checked ? "bg-blue-600 text-white" : "ring-1 ring-gray-300 dark:ring-gray-600"}`}
                      >
                        {checked && <PiCheck className="h-3 w-3" />}
                      </span>
                      <span className="font-medium">{stock.shortName}</span>
                      <span className="truncate text-gray-500 dark:text-gray-400">{stock.fullName}</span>
                    </label>
                  </li>
                );
              })
            )}
          </ul>
        </div>

        <button type="submit" disabled={!canSubmit} className="mt-6 w-full rounded-xl bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
          {isCreating ? "Creating…" : "Create league"}
        </button>
      </form>
    </Modal>
  );
}
