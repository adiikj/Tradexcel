"use client";
import { changeGlyph, changeTextClass } from "../market/marketColors";

export type WeekResult = { key: string; label: string; pnlPercent: number; current?: boolean };

const pct = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;

// Each week is its own season (balances reset every Monday), so results are
// compared as bars around 0% rather than drawn as one continuous line.
function WeeklyResults({ weeks }: { weeks: WeekResult[] }) {
  if (weeks.length === 0) {
    return <p className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">Your weekly results appear here after your first season ends.</p>;
  }

  const maxAbs = Math.max(1, ...weeks.map((w) => Math.abs(w.pnlPercent)));
  const completed = weeks.filter((w) => !w.current);
  const best = completed.length ? completed.reduce((a, b) => (b.pnlPercent > a.pnlPercent ? b : a)) : null;
  const worst = completed.length ? completed.reduce((a, b) => (b.pnlPercent < a.pnlPercent ? b : a)) : null;
  const HALF = 80; // px available for bars above and below the zero line
  const LABEL = 20; // room reserved for the value labels, so nothing overflows
  const ZERO = LABEL + HALF;
  // Phones show the last 5 seasons + this week; wider screens show them all.
  const hideOnPhone = (i: number) => (i < weeks.length - 6 ? "hidden sm:block" : "");

  return (
    <div>
      <div className="relative flex items-stretch gap-2 overflow-hidden" style={{ height: 2 * ZERO }}>
        {/* zero line */}
        <div aria-hidden="true" className="absolute inset-x-0 border-t border-gray-300 dark:border-gray-700" style={{ top: ZERO }} />
        {weeks.map((week, i) => {
          const h = Math.max(2, (Math.abs(week.pnlPercent) / maxAbs) * HALF);
          const up = week.pnlPercent >= 0;
          const labelled = week.current || week.key === best?.key || week.key === worst?.key;
          return (
            <div
              key={week.key}
              tabIndex={0}
              aria-label={`${week.label}: ${pct(week.pnlPercent)}`}
              className={`group relative min-w-0 flex-1 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${hideOnPhone(i)}`}
            >
              <div
                className={`absolute inset-x-1 rounded-[4px] transition-opacity group-hover:opacity-80 ${
                  up ? "bg-green-600" : "bg-red-600 dark:bg-red-500"
                } ${week.current ? "opacity-60" : ""}`}
                style={up ? { bottom: ZERO, height: h } : { top: ZERO, height: h }}
              />
              {/* Direct labels only on the extremes and the live week; the rest on hover/focus */}
              <span
                className={`absolute inset-x-0 text-center text-[11px] font-medium tabular-nums whitespace-nowrap transition-opacity ${
                  labelled ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
                } ${changeTextClass(week.pnlPercent)}`}
                style={up ? { bottom: ZERO + 4 + h } : { top: ZERO + 4 + h }}
              >
                {pct(week.pnlPercent)}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-2">
        {weeks.map((week, i) => (
          <span key={week.key} className={`min-w-0 flex-1 truncate text-center text-[11px] ${week.current ? "font-semibold" : "text-gray-500 dark:text-gray-400"} ${hideOnPhone(i)}`}>
            {week.label}
          </span>
        ))}
      </div>
      {best && worst && (
        <p className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
          <span>
            Best week{" "}
            <span className={`font-semibold ${changeTextClass(best.pnlPercent)}`}>
              {changeGlyph(best.pnlPercent)} {pct(best.pnlPercent)}
            </span>
          </span>
          <span>
            Worst week{" "}
            <span className={`font-semibold ${changeTextClass(worst.pnlPercent)}`}>
              {changeGlyph(worst.pnlPercent)} {pct(worst.pnlPercent)}
            </span>
          </span>
          <span>
            Weeks in profit <span className="font-semibold text-gray-900 dark:text-white">{completed.filter((w) => w.pnlPercent > 0).length}/{completed.length}</span>
          </span>
        </p>
      )}
    </div>
  );
}

export default WeeklyResults;
