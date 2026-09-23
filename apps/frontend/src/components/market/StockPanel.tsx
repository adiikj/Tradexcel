"use client";
import { useState } from "react";
import type { Candle, ChartData, ChartRange } from "@tradexcel/shared";
import PriceChart, { type ChartMode } from "./PriceChart";
import { changeGlyph, changeTextClass } from "./marketColors";
import { formatInr } from "../../utils/format";
import type { MarketStock } from "../../types/market";

export const RANGES: ChartRange[] = ["1D", "5D", "1M", "6M", "1Y", "5Y"];

type StockPanelProps = {
  stock: MarketStock;
  chart: ChartData | null;
  // Today's session (1D) - source of the key stats whatever range is charted.
  session: ChartData | null;
  chartError: string;
  isChartLoading: boolean;
  range: ChartRange;
  onRangeChange: (range: ChartRange) => void;
  ownedQuantity: number;
  onBuy: () => void;
  onSell: () => void;
};

const compact = new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 2 });
const fmtVolume = (v: number | null | undefined) => (v == null ? "—" : compact.format(v));
const fmtPrice = (v: number | null | undefined) => (v == null ? "—" : formatInr(v));

function barLabel(candle: Candle, range: ChartRange, gmtOffset: number) {
  const date = new Date((candle.time + gmtOffset) * 1000);
  const opts: Intl.DateTimeFormatOptions =
    range === "1D" || range === "5D"
      ? { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "UTC" }
      : { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" };
  return date.toLocaleString("en-IN", opts);
}

function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-lg bg-gray-100 p-0.5 dark:bg-gray-800">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
            value === option.value
              ? "bg-white text-gray-900 shadow-sm dark:bg-gray-600 dark:text-white"
              : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="text-sm font-medium tabular-nums">{value}</dd>
    </div>
  );
}

// 52-week range as a track with a marker at the current price.
function RangeBar({ low, high, value }: { low: number | null; high: number | null; value: number | null }) {
  if (low == null || high == null || value == null || high <= low) return <span>—</span>;
  const pct = Math.min(100, Math.max(0, ((value - low) / (high - low)) * 100));
  return (
    <span className="flex items-center gap-2">
      <span className="tabular-nums">{formatInr(low)}</span>
      <span className="relative h-1 flex-1 min-w-12 rounded-full bg-gray-200 dark:bg-gray-700" aria-hidden="true">
        <span className="absolute top-1/2 h-3 w-1 -translate-y-1/2 rounded-full bg-gray-700 dark:bg-gray-200" style={{ left: `calc(${pct}% - 2px)` }} />
      </span>
      <span className="tabular-nums">{formatInr(high)}</span>
    </span>
  );
}

function StockPanel({
  stock,
  chart,
  session,
  chartError,
  isChartLoading,
  range,
  onRangeChange,
  ownedQuantity,
  onBuy,
  onSell,
}: StockPanelProps) {
  const [mode, setMode] = useState<ChartMode>("area");
  const [view, setView] = useState<"chart" | "table">("chart");
  const [hovered, setHovered] = useState<Candle | null>(null);

  const candles = chart?.candles ?? [];
  const lastBar = candles[candles.length - 1] ?? null;
  const shown = hovered ?? lastBar;
  const firstBar = candles[0] ?? null;

  // Change over the selected range (1D uses the previous close as the base).
  const base = range === "1D" ? (chart?.previousClose ?? firstBar?.open) : firstBar?.open;
  const rangeChange = lastBar && base ? lastBar.close - base : null;
  const rangeChangePct = rangeChange != null && base ? (rangeChange / base) * 100 : null;

  return (
    <section aria-labelledby="stock-heading" className="rounded-2xl bg-white p-4 md:p-6 shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800 dark:shadow-none">
      {/* Headline */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {stock.symbol.replace(/\.NS$/, "")} · {chart?.exchange === "NSI" ? "NSE" : (chart?.exchange ?? "NSE")}
          </p>
          <h2 id="stock-heading" className="text-lg md:text-xl font-semibold truncate">
            {stock.fullName}
          </h2>
          <p className="mt-1 flex flex-wrap items-baseline gap-x-3">
            <span className="text-3xl md:text-4xl font-semibold">{fmtPrice(stock.price)}</span>
            <span className={`text-sm md:text-base font-medium tabular-nums ${changeTextClass(stock.change)}`}>
              {changeGlyph(stock.change)} {stock.change != null ? `${stock.change >= 0 ? "+" : ""}${stock.change.toFixed(2)}` : "—"}
              {stock.changePct != null && ` (${stock.changePct >= 0 ? "+" : ""}${stock.changePct.toFixed(2)}%)`}
              <span className="text-gray-500 dark:text-gray-400 font-normal"> today</span>
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onBuy}
            disabled={stock.price == null}
            className="px-5 py-2 rounded-lg bg-teal-600 text-white font-medium hover:bg-teal-700 disabled:opacity-50 transition-colors"
          >
            Buy
          </button>
          <button
            type="button"
            onClick={onSell}
            disabled={ownedQuantity <= 0 || stock.price == null}
            className="px-5 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-40 transition-colors"
          >
            Sell
          </button>
        </div>
      </div>

      {/* Controls: one row above the chart */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Segmented label="Time range" options={RANGES.map((r) => ({ value: r, label: r }))} value={range} onChange={onRangeChange} />
        <Segmented
          label="Chart type"
          options={[
            { value: "area", label: "Line" },
            { value: "candles", label: "Candles" },
          ]}
          value={mode}
          onChange={setMode}
        />
        <Segmented
          label="View"
          options={[
            { value: "chart", label: "Chart" },
            { value: "table", label: "Table" },
          ]}
          value={view}
          onChange={setView}
        />
        {rangeChangePct != null && (
          <span className={`ml-auto text-sm tabular-nums ${changeTextClass(rangeChange)}`}>
            {changeGlyph(rangeChange)} {rangeChangePct >= 0 ? "+" : ""}
            {rangeChangePct.toFixed(2)}% <span className="text-gray-500 dark:text-gray-400">over {range}</span>
          </span>
        )}
      </div>

      {/* Crosshair readout: values lead, labels follow */}
      <div className="mt-3 min-h-5 flex flex-wrap gap-x-4 gap-y-1 text-xs tabular-nums" aria-live="off">
        {shown && chart ? (
          <>
            <span className="text-gray-500 dark:text-gray-400">{barLabel(shown, range, chart.gmtOffset)}</span>
            {(
              [
                ["O", shown.open],
                ["H", shown.high],
                ["L", shown.low],
                ["C", shown.close],
              ] as const
            ).map(([label, value]) => (
              <span key={label}>
                <span className="font-semibold">{formatInr(value)}</span>{" "}
                <span className="text-gray-500 dark:text-gray-400">{label}</span>
              </span>
            ))}
            <span>
              <span className="font-semibold">{fmtVolume(shown.volume)}</span> <span className="text-gray-500 dark:text-gray-400">Vol</span>
            </span>
          </>
        ) : null}
      </div>

      {/* Chart / table - the previous render stays (dimmed) while a range loads */}
      <div className={`mt-2 transition-opacity ${isChartLoading && chart ? "opacity-50" : ""}`} aria-busy={isChartLoading}>
        {chartError && !chart ? (
          <p className="h-[380px] md:h-[440px] flex items-center justify-center text-sm text-red-600 dark:text-red-400">{chartError}</p>
        ) : !chart ? (
          <div className="h-[380px] md:h-[440px] rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
        ) : candles.length === 0 ? (
          <p className="h-[380px] md:h-[440px] flex items-center justify-center text-sm text-gray-500">No trades in this range yet.</p>
        ) : view === "chart" ? (
          <PriceChart
            candles={candles}
            range={range}
            mode={mode}
            gmtOffset={chart.gmtOffset}
            previousClose={range === "1D" ? chart.previousClose : null}
            onHover={setHovered}
          />
        ) : (
          <div className="h-[380px] md:h-[440px] overflow-auto rounded-lg ring-1 ring-gray-200 dark:ring-gray-800">
            <table className="w-full text-sm tabular-nums">
              <caption className="sr-only">
                {stock.shortName} price bars, {range}
              </caption>
              <thead className="sticky top-0 bg-gray-50 text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                <tr>
                  {["Time", "Open", "High", "Low", "Close", "Volume"].map((h) => (
                    <th key={h} scope="col" className={`px-3 py-2 font-medium ${h === "Time" ? "text-left" : "text-right"}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...candles].reverse().map((k) => (
                  <tr key={k.time} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="px-3 py-1.5 text-left whitespace-nowrap">{barLabel(k, range, chart.gmtOffset)}</td>
                    <td className="px-3 py-1.5 text-right">{formatInr(k.open)}</td>
                    <td className="px-3 py-1.5 text-right">{formatInr(k.high)}</td>
                    <td className="px-3 py-1.5 text-right">{formatInr(k.low)}</td>
                    <td className={`px-3 py-1.5 text-right ${changeTextClass(k.close - k.open)}`}>{formatInr(k.close)}</td>
                    <td className="px-3 py-1.5 text-right">{fmtVolume(k.volume)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Key stats */}
      <dl className="mt-5 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-4 border-t border-gray-100 pt-4 dark:border-gray-800">
        <Stat label="Open" value={fmtPrice(session?.candles[0]?.open)} />
        <Stat label="Prev close" value={fmtPrice(session?.previousClose)} />
        <Stat label="Day range" value={session?.dayLow != null && session?.dayHigh != null ? `${formatInr(session.dayLow)} – ${formatInr(session.dayHigh)}` : "—"} />
        <Stat label="Volume" value={fmtVolume(session?.volume)} />
        <Stat label="You own" value={`${ownedQuantity} share${ownedQuantity === 1 ? "" : "s"}`} />
        <div className="col-span-2 sm:col-span-3 xl:col-span-2 min-w-0">
          <dt className="text-xs text-gray-500 dark:text-gray-400">52-week range</dt>
          <dd className="text-sm font-medium">
            <RangeBar low={session?.fiftyTwoWeekLow ?? null} high={session?.fiftyTwoWeekHigh ?? null} value={stock.price} />
          </dd>
        </div>
      </dl>
    </section>
  );
}

export default StockPanel;
