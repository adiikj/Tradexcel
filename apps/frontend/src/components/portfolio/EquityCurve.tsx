"use client";
import { useEffect, useRef, useState } from "react";
import type { PortfolioAnalytics } from "@tradexcel/shared";
import { useTheme } from "../../context/ThemeContext";
import { CATEGORICAL } from "../ui/chartPalette";
import { formatInr } from "../../utils/format";

type Point = PortfolioAnalytics["equityCurve"][number];

const HEIGHT = 200;
const PAD = { top: 12, right: 92, bottom: 24, left: 44 };
const pct = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;

function dayLabel(date: string, i: number, last: number) {
  if (i === 0) return "Start";
  if (i === last) return "Now";
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-IN", { weekday: "short", timeZone: "UTC" });
}

// Round tick step (1, 2 or 5 × 10^n) giving about 4 gridlines.
function ticks(min: number, max: number): number[] {
  const span = Math.max(max - min, 0.5);
  const raw = span / 4;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map((m) => m * mag).find((s) => s >= raw)!;
  const out: number[] = [];
  for (let v = Math.floor(min / step) * step; v <= max + step / 2; v += step) out.push(Math.round(v * 100) / 100);
  return out;
}

// Your season return vs NIFTY 50, both as % since the season started - one
// unit, one axis. Two series: legend on top plus direct labels at the line
// ends; hover/focus shows a crosshair with both values.
function EquityCurve({ points, benchmarkName }: { points: Point[]; benchmarkName: string | null }) {
  const { darkMode } = useTheme();
  const palette = darkMode ? CATEGORICAL.dark : CATEGORICAL.light;
  const [you, bench] = [palette[0], palette[1]];
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const hasBench = points.some((p) => p.benchmarkPct != null);
  const values = points.flatMap((p) => [p.returnPct, ...(p.benchmarkPct != null ? [p.benchmarkPct] : [])]);
  const grid = ticks(Math.min(0, ...values), Math.max(0, ...values));
  const [lo, hi] = [grid[0], grid[grid.length - 1]];
  const plotW = Math.max(0, width - PAD.left - PAD.right);
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const last = points.length - 1;
  const x = (i: number) => PAD.left + (last > 0 ? (i / last) * plotW : plotW / 2);
  const y = (v: number) => PAD.top + ((hi - v) / (hi - lo || 1)) * plotH;
  const path = (vals: (number | null)[]) =>
    vals
      .map((v, i) => (v == null ? null : `${x(i)},${y(v)}`))
      .filter(Boolean)
      .map((p, i) => `${i ? "L" : "M"}${p}`)
      .join(" ");

  const onMove = (e: React.PointerEvent<SVGRectElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const rel = (e.clientX - box.left) / (box.width || 1);
    setActive(Math.max(0, Math.min(last, Math.round(rel * last))));
  };

  const shown = active != null ? points[active] : null;
  const end = points[last];

  return (
    <div>
      <ul className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400" aria-hidden="true">
        <li className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded-full" style={{ backgroundColor: you }} /> You
        </li>
        {hasBench && (
          <li className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded-full" style={{ backgroundColor: bench }} /> {benchmarkName}
          </li>
        )}
      </ul>

      <div ref={wrapRef} className="relative">
        {width > 0 && (
          <svg width={width} height={HEIGHT} role="img" aria-label={`Season return: you ${pct(end.returnPct)}${hasBench && end.benchmarkPct != null ? `, ${benchmarkName} ${pct(end.benchmarkPct)}` : ""}`}>
            {grid.map((t) => (
              <g key={t}>
                <line
                  x1={PAD.left}
                  x2={PAD.left + plotW}
                  y1={y(t)}
                  y2={y(t)}
                  className={t === 0 ? "stroke-gray-300 dark:stroke-gray-600" : "stroke-gray-100 dark:stroke-gray-800"}
                  strokeWidth={1}
                />
                <text x={PAD.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-gray-500 text-[10px] tabular-nums dark:fill-gray-400">
                  {t > 0 ? "+" : ""}
                  {t}%
                </text>
              </g>
            ))}
            {points.map((p, i) => (
              <text key={p.date + i} x={x(i)} y={HEIGHT - 6} textAnchor="middle" className="fill-gray-500 text-[10px] dark:fill-gray-400">
                {dayLabel(p.date, i, last)}
              </text>
            ))}

            {shown && <line x1={x(active!)} x2={x(active!)} y1={PAD.top} y2={PAD.top + plotH} className="stroke-gray-300 dark:stroke-gray-600" strokeDasharray="3 3" />}

            {hasBench && <path d={path(points.map((p) => p.benchmarkPct))} fill="none" stroke={bench} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />}
            <path d={path(points.map((p) => p.returnPct))} fill="none" stroke={you} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

            {/* Markers: the active point on hover, otherwise just the line ends */}
            {[active ?? last].map((i) => (
              <g key={i}>
                {hasBench && points[i].benchmarkPct != null && (
                  <circle cx={x(i)} cy={y(points[i].benchmarkPct!)} r={4} fill={bench} className="stroke-white dark:stroke-gray-900" strokeWidth={2} />
                )}
                <circle cx={x(i)} cy={y(points[i].returnPct)} r={4} fill={you} className="stroke-white dark:stroke-gray-900" strokeWidth={2} />
              </g>
            ))}

            {/* Direct labels at the right edge, nudged apart if they'd collide */}
            {(() => {
              const labels = [{ key: "you", v: end.returnPct, text: `You ${pct(end.returnPct)}` }];
              if (hasBench && end.benchmarkPct != null) labels.push({ key: "bench", v: end.benchmarkPct, text: `${(benchmarkName ?? "").split(" ")[0]} ${pct(end.benchmarkPct)}` });
              const ys = labels.map((l) => y(l.v));
              if (ys.length === 2 && Math.abs(ys[0] - ys[1]) < 12) {
                const mid = (ys[0] + ys[1]) / 2;
                const up = ys[0] <= ys[1] ? 0 : 1;
                ys[up] = mid - 6;
                ys[1 - up] = mid + 6;
              }
              return labels.map((l, i) => (
                <text key={l.key} x={PAD.left + plotW + 8} y={ys[i]} dy="0.32em" className="fill-gray-700 text-[10px] font-medium tabular-nums dark:fill-gray-200">
                  {l.text}
                </text>
              ));
            })()}

            <rect
              x={PAD.left}
              y={PAD.top}
              width={plotW}
              height={plotH}
              fill="transparent"
              onPointerMove={onMove}
              onPointerLeave={() => setActive(null)}
            />
          </svg>
        )}

        {shown && (
          <div
            className="pointer-events-none absolute top-0 z-10 w-max -translate-x-1/2 rounded-lg bg-white px-3 py-2 text-xs shadow-lg ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700"
            style={{ left: Math.min(Math.max(x(active!), 80), width - 80) }}
          >
            <p className="mb-1 font-medium">{dayLabel(shown.date, active!, last)}</p>
            <p className="flex items-center gap-1.5 tabular-nums">
              <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ backgroundColor: you }} />
              You {pct(shown.returnPct)} <span className="text-gray-500 dark:text-gray-400">({formatInr(shown.netWorth)})</span>
            </p>
            {shown.benchmarkPct != null && (
              <p className="flex items-center gap-1.5 tabular-nums">
                <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ backgroundColor: bench }} />
                {benchmarkName} {pct(shown.benchmarkPct)}
              </p>
            )}
          </div>
        )}
      </div>

      <table className="sr-only">
        <caption>Return since the season started</caption>
        <thead>
          <tr>
            <th scope="col">Day</th>
            <th scope="col">You</th>
            {hasBench && <th scope="col">{benchmarkName}</th>}
          </tr>
        </thead>
        <tbody>
          {points.map((p, i) => (
            <tr key={p.date + i}>
              <th scope="row">{dayLabel(p.date, i, last)}</th>
              <td>{pct(p.returnPct)}</td>
              {hasBench && <td>{p.benchmarkPct != null ? pct(p.benchmarkPct) : "—"}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default EquityCurve;
