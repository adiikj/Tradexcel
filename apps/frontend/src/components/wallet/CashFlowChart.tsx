"use client";
import { formatInr } from "../../utils/format";

export type DayFlow = { key: string; label: string; inflow: number; outflow: number; isToday: boolean; isFuture: boolean };

const compact = new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 });

// This season's cash movement per day: sells bring cash in (above the line),
// buys spend it (below). One unit, one axis. Values show on hover/focus, and
// the totals row under the chart carries the same numbers as text.
function CashFlowChart({ days }: { days: DayFlow[] }) {
  const max = Math.max(1, ...days.flatMap((d) => [d.inflow, d.outflow]));
  const HALF = 72;
  const LABEL = 18;
  const ZERO = LABEL + HALF;

  return (
    <div>
      <div className="relative flex gap-2 overflow-hidden" style={{ height: 2 * ZERO }}>
        <div aria-hidden="true" className="absolute inset-x-0 border-t border-gray-300 dark:border-gray-700" style={{ top: ZERO }} />
        {days.map((day) => {
          const inH = day.inflow > 0 ? Math.max(3, (day.inflow / max) * HALF) : 0;
          const outH = day.outflow > 0 ? Math.max(3, (day.outflow / max) * HALF) : 0;
          return (
            <div
              key={day.key}
              tabIndex={day.isFuture ? -1 : 0}
              aria-label={`${day.label}: ${formatInr(day.inflow)} in, ${formatInr(day.outflow)} out`}
              className="group relative min-w-0 flex-1 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              {inH > 0 && (
                <>
                  <div className="absolute inset-x-1.5 rounded-t-[4px] bg-green-600" style={{ bottom: ZERO + 1, height: inH }} />
                  <span
                    className="absolute inset-x-0 text-center text-[10px] font-medium tabular-nums text-green-700 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 dark:text-green-400"
                    style={{ bottom: ZERO + 4 + inH }}
                  >
                    +{compact.format(day.inflow)}
                  </span>
                </>
              )}
              {outH > 0 && (
                <>
                  <div className="absolute inset-x-1.5 rounded-b-[4px] bg-red-600 dark:bg-red-500" style={{ top: ZERO + 1, height: outH }} />
                  <span
                    className="absolute inset-x-0 text-center text-[10px] font-medium tabular-nums text-red-600 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 dark:text-red-400"
                    style={{ top: ZERO + 4 + outH }}
                  >
                    −{compact.format(day.outflow)}
                  </span>
                </>
              )}
              {day.isToday && <span aria-hidden="true" className="absolute inset-0 -z-10 rounded-md bg-blue-50 dark:bg-blue-500/10" />}
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-2">
        {days.map((day) => (
          <span
            key={day.key}
            className={`min-w-0 flex-1 truncate text-center text-[11px] ${
              day.isToday ? "font-semibold text-blue-600 dark:text-blue-400" : day.isFuture ? "text-gray-300 dark:text-gray-600" : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {day.label}
          </span>
        ))}
      </div>
      <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="h-2.5 w-2.5 rounded-sm bg-green-600" /> Cash in (sells)
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="h-2.5 w-2.5 rounded-sm bg-red-600 dark:bg-red-500" /> Cash out (buys)
        </span>
      </p>
    </div>
  );
}

export default CashFlowChart;
