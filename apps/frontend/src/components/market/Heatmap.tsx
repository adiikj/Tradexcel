"use client";
import { useState } from "react";
import type { MarketStock } from "../../types/market";
import { HEAT_BINS, heatBin } from "./marketColors";

type HeatmapProps = {
  stocks: MarketStock[];
  selectedSymbol: string | null;
  onSelect: (symbol: string) => void;
};

const MOVERS_SHOWN = 40;

// Every stock as a tile, colored on a diverging red-gray-green scale by today's
// % change. Each tile also prints its symbol and signed change, so color is
// never the only encoding; the watchlist is the table view of the same data.
function Heatmap({ stocks, selectedSymbol, onSelect }: HeatmapProps) {
  const [showAll, setShowAll] = useState(false);
  const byChange = (list: MarketStock[]) => [...list].sort((a, b) => (b.changePct ?? -Infinity) - (a.changePct ?? -Infinity));
  // Default view: the day's biggest moves in either direction, still laid out
  // strongest-gain to strongest-loss so the scale reads left to right.
  const tiles = showAll
    ? byChange(stocks)
    : byChange(
        [...stocks]
          .filter((s) => s.changePct != null)
          .sort((a, b) => Math.abs(b.changePct as number) - Math.abs(a.changePct as number))
          .slice(0, MOVERS_SHOWN)
      );

  return (
    <section aria-labelledby="heatmap-heading" className="rounded-2xl bg-white p-4 md:p-6 shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800 dark:shadow-none">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div>
          <h2 id="heatmap-heading" className="text-base font-semibold">Market heatmap</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Today&apos;s % change - {showAll ? `all ${stocks.length} stocks` : `the ${MOVERS_SHOWN} biggest moves`}
          </p>
        </div>
        <div role="group" aria-label="Heatmap scope" className="inline-flex rounded-lg bg-gray-100 p-0.5 dark:bg-gray-800">
          {[
            { value: false, label: "Biggest movers" },
            { value: true, label: `All stocks` },
          ].map((option) => (
            <button
              key={option.label}
              type="button"
              aria-pressed={showAll === option.value}
              onClick={() => setShowAll(option.value)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                showAll === option.value
                  ? "bg-white text-gray-900 shadow-sm dark:bg-gray-600 dark:text-white"
                  : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        {/* Scale legend */}
        <ol className="flex items-center gap-0.5 text-[10px]" aria-label="Color scale">
          {HEAT_BINS.map((bin, i) => (
            <li key={bin.label} className="flex flex-col items-center gap-1">
              <span className={`block h-3 w-8 ${bin.className} ${i === 0 ? "rounded-l" : ""} ${i === HEAT_BINS.length - 1 ? "rounded-r" : ""}`} title={bin.label} />
              {(i === 0 || i === 3 || i === HEAT_BINS.length - 1) && (
                <span className="text-gray-500 dark:text-gray-400 whitespace-nowrap">{i === 0 ? "−3%" : i === 3 ? "0" : "+3%"}</span>
              )}
            </li>
          ))}
        </ol>
      </div>

      <ul className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 xl:grid-cols-10 2xl:grid-cols-12 gap-0.5">
        {tiles.map((s) => {
          const bin = heatBin(s.changePct);
          const selected = s.symbol === selectedSymbol;
          return (
            <li key={s.symbol}>
              <button
                type="button"
                onClick={() => onSelect(s.symbol)}
                aria-current={selected ? "true" : undefined}
                aria-label={`${s.shortName}, ${s.changePct != null ? `${s.changePct >= 0 ? "up" : "down"} ${Math.abs(s.changePct).toFixed(2)}%` : "no data"}`}
                className={`w-full h-12 px-1 flex flex-col items-center justify-center rounded-sm transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:z-10 ${
                  bin ? bin.className : "bg-gray-100 text-gray-500 dark:bg-gray-800"
                } ${selected ? "ring-2 ring-gray-900 dark:ring-white z-10" : ""}`}
              >
                <span className="text-[11px] font-semibold leading-tight truncate max-w-full">{s.shortName}</span>
                <span className="text-[10px] leading-tight tabular-nums">
                  {s.changePct != null ? `${s.changePct >= 0 ? "+" : ""}${s.changePct.toFixed(2)}%` : "—"}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default Heatmap;
