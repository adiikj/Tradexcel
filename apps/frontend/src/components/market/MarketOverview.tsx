"use client";
import type { MarketStock } from "../../types/market";
import { changeGlyph, changeTextClass } from "./marketColors";
import { formatInr } from "../../utils/format";

type MarketOverviewProps = {
  stocks: MarketStock[];
  isLoading: boolean;
  onSelect: (symbol: string) => void;
};

const pct = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;

function Tile({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800 dark:shadow-none min-w-0">
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function MoverTile({ label, stock, onSelect }: { label: string; stock: MarketStock | undefined; onSelect: (s: string) => void }) {
  return (
    <Tile label={label}>
      {stock && stock.changePct != null ? (
        <button type="button" onClick={() => onSelect(stock.symbol)} className="block w-full text-left rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
          <span className="block text-lg font-semibold truncate">{stock.shortName}</span>
          <span className="flex items-baseline justify-between gap-2 text-sm">
            <span className="tabular-nums">{stock.price != null ? formatInr(stock.price) : "—"}</span>
            <span className={`font-medium tabular-nums ${changeTextClass(stock.changePct)}`}>
              {changeGlyph(stock.changePct)} {pct(stock.changePct)}
            </span>
          </span>
        </button>
      ) : (
        <span className="text-lg font-semibold">—</span>
      )}
    </Tile>
  );
}

// Headline numbers for the whole stock universe: breadth, average move and the
// day's biggest movers.
function MarketOverview({ stocks, isLoading, onSelect }: MarketOverviewProps) {
  const priced = stocks.filter((s) => s.changePct != null);
  const up = priced.filter((s) => (s.changePct as number) > 0).length;
  const down = priced.filter((s) => (s.changePct as number) < 0).length;
  const flat = priced.length - up - down;
  const avg = priced.length ? priced.reduce((sum, s) => sum + (s.changePct as number), 0) / priced.length : null;
  const sorted = [...priced].sort((a, b) => (b.changePct as number) - (a.changePct as number));
  const top = sorted[0];
  const bottom = sorted[sorted.length - 1];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-[92px] rounded-2xl bg-gray-100 dark:bg-gray-900 animate-pulse" />
        ))}
      </div>
    );
  }

  const total = priced.length || 1;
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <Tile label="Market breadth">
        <p className="text-lg font-semibold">
          <span className="text-teal-700 dark:text-teal-400">{up} up</span>
          <span className="text-gray-400"> · </span>
          <span className="text-red-600 dark:text-red-400">{down} down</span>
        </p>
        {/* Part-to-whole: one stacked bar, 2px gaps between segments. */}
        <div className="mt-2 flex h-2 gap-0.5" role="img" aria-label={`${up} advancing, ${flat} unchanged, ${down} declining`}>
          {up > 0 && <span className="rounded-l-full bg-teal-600" style={{ width: `${(up / total) * 100}%` }} />}
          {flat > 0 && <span className="bg-gray-300 dark:bg-gray-600" style={{ width: `${(flat / total) * 100}%` }} />}
          {down > 0 && <span className="rounded-r-full bg-red-600 dark:bg-red-500" style={{ width: `${(down / total) * 100}%` }} />}
        </div>
      </Tile>
      <Tile label="Average move">
        <p className={`text-2xl font-semibold ${changeTextClass(avg)}`}>
          {avg != null ? `${changeGlyph(avg)} ${pct(avg)}` : "—"}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">across {priced.length} stocks today</p>
      </Tile>
      <MoverTile label="Top gainer" stock={top && (top.changePct as number) > 0 ? top : undefined} onSelect={onSelect} />
      <MoverTile label="Top loser" stock={bottom && (bottom.changePct as number) < 0 ? bottom : undefined} onSelect={onSelect} />
    </div>
  );
}

export default MarketOverview;
