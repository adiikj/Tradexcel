"use client";
import { useCallback, useState } from "react";
import Link from "next/link";
import { PiArrowLeft, PiArrowRight, PiFlagCheckered } from "react-icons/pi";
import { estimateCharges, STOCK_LIST, type PracticeState } from "@tradexcel/shared";
import Header from "../dashboard/Header";
import Vheader from "../dashboard/Vheader";
import { advancePractice, getPractice, practiceTrade } from "../../api/api";
import { useAsyncEffect } from "../../hooks/useAsyncEffect";
import { changeGlyph, changeTextClass } from "../market/marketColors";
import { formatInr } from "../../utils/format";
import { Card, StatTile } from "../ui/Panel";

const NAMES = new Map(STOCK_LIST.map((s) => [s.symbol, s.shortName]));
const name = (symbol: string) => NAMES.get(symbol) ?? symbol.replace(/\.NS$/, "");
const pct = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
const longDate = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

// One practice run: the day's closing prices, a trade panel, your positions,
// and a "Next day" button. When the last day passes, a results summary.
function PracticeRun({ id }: { id: string }) {
  const [run, setRun] = useState<PracticeState | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  const load = useCallback(
    async (isActive: () => boolean) => {
      try {
        const next = await getPractice(id);
        if (isActive()) setRun(next);
      } catch (err) {
        if (isActive()) setError(err instanceof Error ? err.message : "We couldn't load this practice run.");
      }
    },
    [id]
  );
  useAsyncEffect((isActive) => load(isActive), [load]);

  const act = async (fn: () => Promise<PracticeState>) => {
    try {
      setBusy(true);
      setError("");
      setRun(await fn());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  if (!run) {
    return (
      <Shell>
        {error ? (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">{error}</p>
        ) : (
          <div className="h-96 animate-pulse rounded-2xl bg-white dark:bg-gray-900" />
        )}
      </Shell>
    );
  }

  const finished = run.status === "FINISHED";
  const lastDay = run.day === run.totalDays;
  const stock = run.stocks.find((s) => s.symbol === selected) ?? null;
  const held = run.holdings.find((h) => h.symbol === selected)?.quantity ?? 0;
  const turnover = (stock?.price ?? 0) * (quantity || 0);
  const lead = run.basketReturnPct != null ? run.returnPct - run.basketReturnPct : null;

  return (
    <Shell>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/learn#practice" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
            <PiArrowLeft aria-hidden="true" className="h-4 w-4" /> Learn
          </Link>
          <h1 className="mt-1 text-2xl font-bold md:text-3xl">{run.scenario.title}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Day {run.day} of {run.totalDays} · {longDate(run.date)}
          </p>
        </div>
        {!finished && (
          <button
            type="button"
            onClick={() => act(() => advancePractice(run.id))}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {lastDay ? (
              <>
                <PiFlagCheckered aria-hidden="true" className="h-4 w-4" /> Finish run
              </>
            ) : (
              <>
                Next day <PiArrowRight aria-hidden="true" className="h-4 w-4" />
              </>
            )}
          </button>
        )}
      </div>

      <div
        role="progressbar"
        aria-label="Days played"
        aria-valuemin={1}
        aria-valuemax={run.totalDays}
        aria-valuenow={run.day}
        className="h-1.5 rounded-full bg-gray-200 dark:bg-gray-700"
      >
        <div className="h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" style={{ width: `${(run.day / run.totalDays) * 100}%` }} />
      </div>

      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">{error}</p>}

      {finished && (
        <div className="rounded-2xl bg-blue-50 p-5 dark:bg-blue-500/10">
          <p className="text-lg font-semibold">Run complete</p>
          <p className="mt-1 text-sm">
            You finished at <span className="font-semibold">{formatInr(run.netWorth)}</span> (
            <span className={`font-semibold ${changeTextClass(run.returnPct)}`}>{pct(run.returnPct)}</span>)
            {run.basketReturnPct != null && (
              <>
                . Buying the whole basket on day one and holding would have made{" "}
                <span className={`font-semibold ${changeTextClass(run.basketReturnPct)}`}>{pct(run.basketReturnPct)}</span>
              </>
            )}
            .
          </p>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">💡 {run.scenario.lesson}</p>
          <Link href="/learn#practice" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">
            Try another scenario <PiArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Net worth">{formatInr(run.netWorth)}</StatTile>
        <StatTile label="Your return">
          <span className={changeTextClass(run.returnPct)}>{pct(run.returnPct)}</span>
        </StatTile>
        <StatTile label="Basket, buy and hold" hint={lead != null ? `You're ${lead >= 0 ? "ahead" : "behind"} by ${Math.abs(lead).toFixed(2)} pts` : undefined}>
          {run.basketReturnPct != null ? <span className={changeTextClass(run.basketReturnPct)}>{pct(run.basketReturnPct)}</span> : "—"}
        </StatTile>
        <StatTile label="Cash">{formatInr(run.cash)}</StatTile>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Stocks" className="lg:col-span-2" action={<span className="text-xs text-gray-500 dark:text-gray-400">Closing prices · trades fill at the close</span>}>
          <table className="w-full text-sm">
            <caption className="sr-only">Stocks in this scenario with today&apos;s close and change</caption>
            <thead className="text-xs text-gray-500 dark:text-gray-400">
              <tr>
                <th scope="col" className="py-2 text-left font-medium">Stock</th>
                <th scope="col" className="py-2 text-right font-medium">Close</th>
                <th scope="col" className="py-2 text-right font-medium">Day</th>
                <th scope="col" className="py-2 text-right font-medium">Held</th>
              </tr>
            </thead>
            <tbody>
              {run.stocks.map((s) => {
                const qty = run.holdings.find((h) => h.symbol === s.symbol)?.quantity ?? 0;
                const isSelected = s.symbol === selected;
                return (
                  <tr key={s.symbol} className={`border-t border-gray-100 dark:border-gray-800 ${isSelected ? "bg-blue-50 dark:bg-blue-500/10" : ""}`}>
                    <td className="py-1.5">
                      <button
                        type="button"
                        disabled={finished || s.price == null}
                        onClick={() => {
                          setSelected(s.symbol);
                          setQuantity(1);
                        }}
                        aria-pressed={isSelected}
                        className="font-medium hover:underline disabled:no-underline disabled:opacity-60"
                      >
                        {name(s.symbol)}
                      </button>
                    </td>
                    <td className="py-1.5 text-right tabular-nums">{s.price != null ? formatInr(s.price) : "—"}</td>
                    <td className={`py-1.5 text-right text-xs tabular-nums ${changeTextClass(s.changePct)}`}>
                      {s.changePct != null ? `${changeGlyph(s.changePct)} ${pct(s.changePct)}` : "—"}
                    </td>
                    <td className="py-1.5 text-right tabular-nums">{qty || ""}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>

        <div className="space-y-4">
          {!finished && (
            <Card title={stock ? `Trade ${name(stock.symbol)}` : "Trade"}>
              {!stock || stock.price == null ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">Pick a stock from the list to buy or sell it at today&apos;s close.</p>
              ) : (
                <div className="space-y-3">
                  <label htmlFor="practice-qty" className="block text-sm text-gray-500 dark:text-gray-400">
                    Quantity {held > 0 && <span className="text-xs">(you hold {held})</span>}
                  </label>
                  <input
                    id="practice-qty"
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 0)}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatInr(turnover)} + about {formatInr(estimateCharges("BUY", turnover).total)} charges
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={busy || quantity < 1}
                      onClick={() => act(() => practiceTrade(run.id, "BUY", stock.symbol, quantity))}
                      className="rounded-md bg-green-600 py-2 text-sm font-semibold text-white hover:bg-green-500 disabled:opacity-50"
                    >
                      Buy
                    </button>
                    <button
                      type="button"
                      disabled={busy || quantity < 1 || quantity > held}
                      onClick={() => act(() => practiceTrade(run.id, "SELL", stock.symbol, quantity))}
                      className="rounded-md bg-red-600 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50"
                    >
                      Sell
                    </button>
                  </div>
                </div>
              )}
            </Card>
          )}

          <Card title="Your positions">
            {run.holdings.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">All cash. That&apos;s a position too.</p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {run.holdings.map((h) => (
                  <li key={h.symbol} className="flex items-baseline justify-between gap-3 py-2 text-sm">
                    <span>
                      <span className="font-medium">{name(h.symbol)}</span>{" "}
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {h.quantity} × {formatInr(h.avgBuyPrice)}
                      </span>
                    </span>
                    <span className={`tabular-nums ${changeTextClass(h.pnl)}`}>
                      {h.pnl >= 0 ? "+" : "−"}
                      {formatInr(Math.abs(h.pnl))}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {run.trades.length > 0 && (
            <Card title="Trades">
              <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-300">
                {run.trades.map((t) => (
                  <li key={t.id}>
                    Day {t.day}: {t.side === "BUY" ? "bought" : "sold"} {t.quantity} {name(t.symbol)} at {formatInr(t.price)}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 font-pop text-gray-900 transition-colors duration-300 dark:bg-gray-800 dark:text-white">
      <Header />
      <div className="flex">
        <Vheader />
        <main className="mb-20 min-w-0 flex-1 space-y-4 md:mb-0 px-5 py-6 md:px-8 md:py-8 lg:px-12 lg:py-10">{children}</main>
      </div>
    </div>
  );
}

export default PracticeRun;
