"use client";
import { useCallback, useState } from "react";
import type { ClosedTrade, PortfolioAnalytics } from "@tradexcel/shared";
import { STOCK_LIST as stockList } from "@tradexcel/shared";
import { getPortfolioAnalytics } from "../../api/api";
import { useAsyncEffect } from "../../hooks/useAsyncEffect";
import { useTheme } from "../../context/ThemeContext";
import { CATEGORICAL, NEUTRAL } from "../ui/chartPalette";
import { changeTextClass } from "../market/marketColors";
import { formatInr } from "../../utils/format";
import { Card } from "../ui/Panel";
import EquityCurve from "./EquityCurve";
import NoteEditor from "./NoteEditor";

const NAMES = new Map(stockList.map((s) => [s.symbol, s.shortName]));
const name = (symbol: string) => NAMES.get(symbol) ?? symbol.replace(/\.NS$/, "");
const pct = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
const signedInr = (v: number) => `${v >= 0 ? "+" : "−"}${formatInr(Math.abs(v))}`;

function TradeLine({ label, trade }: { label: string; trade: ClosedTrade | null }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <dt className="text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="min-w-0 truncate text-right">
        {trade ? (
          <>
            <span className="font-medium">{name(trade.symbol)}</span>{" "}
            <span className={`tabular-nums ${changeTextClass(trade.pnl)}`}>{signedInr(trade.pnl)}</span>
          </>
        ) : (
          "—"
        )}
      </dd>
    </div>
  );
}

// Sector exposure as horizontal bars: magnitude in one hue, cash in neutral.
// Every bar carries its value and share as text.
function SectorBars({ allocation }: { allocation: PortfolioAnalytics["allocation"] }) {
  const { darkMode } = useTheme();
  const total = allocation.reduce((s, a) => s + a.value, 0);
  const max = Math.max(1, ...allocation.map((a) => a.value));
  if (total <= 0) return <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">Nothing here yet.</p>;
  return (
    <ul className="space-y-2.5">
      {allocation.map((a) => (
        <li key={a.sector}>
          <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
            <span className="truncate">{a.sector}</span>
            <span className="shrink-0 tabular-nums text-gray-500 dark:text-gray-400">
              {formatInr(a.value)} · <span className="font-medium text-gray-900 dark:text-white">{((a.value / total) * 100).toFixed(1)}%</span>
            </span>
          </div>
          <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800">
            <div
              className="h-2 rounded-full"
              style={{
                width: `${Math.max(2, (a.value / max) * 100)}%`,
                backgroundColor: a.sector === "Cash" ? (darkMode ? NEUTRAL.dark : NEUTRAL.light) : darkMode ? CATEGORICAL.dark[0] : CATEGORICAL.light[0],
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

// This season's performance beyond the headline numbers: return vs NIFTY 50,
// realized P&L and win rate from closed trades, sector exposure, and a trade
// journal. Reloads whenever `refreshKey` changes (after a trade).
function SeasonAnalytics({ refreshKey }: { refreshKey: number }) {
  const [data, setData] = useState<PortfolioAnalytics | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async (isActive: () => boolean) => {
    try {
      const next = await getPortfolioAnalytics();
      if (isActive()) {
        setData(next);
        setError("");
      }
    } catch (err) {
      if (isActive()) setError(err instanceof Error ? err.message : "We couldn't load your season analytics.");
    }
  }, []);

  useAsyncEffect((isActive) => load(isActive), [load, refreshKey]);

  if (!data) {
    return error ? (
      <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">{error}</p>
    ) : (
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="h-72 animate-pulse rounded-2xl bg-white dark:bg-gray-900 lg:col-span-2" />
        <div className="h-72 animate-pulse rounded-2xl bg-white dark:bg-gray-900" />
      </div>
    );
  }

  const { trades, benchmark } = data;
  const lead = benchmark ? data.returnPct - benchmark.returnPct : null;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-3">
        <Card
          title={benchmark ? `This season vs ${benchmark.name}` : "This season"}
          className="lg:col-span-2"
          action={
            lead != null ? (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {lead >= 0 ? "Beating" : "Trailing"} the index by{" "}
                <span className={`font-semibold ${changeTextClass(lead)}`}>{Math.abs(lead).toFixed(2)} pts</span>
              </span>
            ) : undefined
          }
        >
          <EquityCurve points={data.equityCurve} benchmarkName={benchmark?.name ?? null} />
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Net worth is recorded at each day&apos;s close.</p>
        </Card>

        <Card title="Trading stats">
          <dl className="space-y-3">
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-sm text-gray-500 dark:text-gray-400">Realized P&amp;L</dt>
              <dd className={`text-xl font-semibold tabular-nums ${changeTextClass(trades.realizedPnl)}`}>{signedInr(trades.realizedPnl)}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <dt className="text-gray-500 dark:text-gray-400">Win rate</dt>
              <dd className="tabular-nums">
                {trades.winRate != null ? (
                  <>
                    <span className="font-medium">{trades.winRate}%</span>{" "}
                    <span className="text-gray-500 dark:text-gray-400">
                      ({trades.wins} of {trades.closedTrades} sales)
                    </span>
                  </>
                ) : (
                  "No sales yet"
                )}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <dt className="text-gray-500 dark:text-gray-400">Charges paid</dt>
              <dd className="tabular-nums">{formatInr(trades.chargesPaid)}</dd>
            </div>
            <div className="space-y-2 border-t border-gray-100 pt-3 dark:border-gray-800">
              <TradeLine label="Best trade" trade={trades.best} />
              <TradeLine label="Worst trade" trade={trades.worst} />
            </div>
          </dl>
          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">P&amp;L on sales, after charges on both the buy and the sale.</p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Sector exposure">
          <SectorBars allocation={data.allocation} />
        </Card>
        <Card title="Trade journal" className="lg:col-span-2" action={<span className="text-xs text-gray-500 dark:text-gray-400">Your sales this season</span>}>
          {trades.recent.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">When you sell, each trade shows up here with its P&amp;L. Add a note on why you made it.</p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {trades.recent.map((t) => (
                <li key={t.transactionId} className="py-2.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="min-w-0 truncate text-sm">
                      <span className="font-medium">{name(t.symbol)}</span>{" "}
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {t.quantity} × {formatInr(t.avgBuyPrice)} → {formatInr(t.sellPrice)}
                      </span>
                    </span>
                    <span className={`shrink-0 text-sm font-medium tabular-nums ${changeTextClass(t.pnl)}`}>
                      {signedInr(t.pnl)} <span className="text-xs">({pct(t.pnlPercent)})</span>
                    </span>
                  </div>
                  <NoteEditor transactionId={t.transactionId} note={t.note} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

export default SeasonAnalytics;
