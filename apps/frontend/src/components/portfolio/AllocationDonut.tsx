"use client";
import { useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import { CATEGORICAL, NEUTRAL } from "../ui/chartPalette";
import { formatInr } from "../../utils/format";

export type Slice = { key: string; label: string; value: number; kind: "holding" | "other" | "cash" };

const R = 64;
const STROKE = 20;
const C = 2 * Math.PI * R;
const GAP = 2; // px of surface between segments

// Holdings take slots 1-4 in order, "Other" takes slot 5, cash is neutral.
export function colorSlices(slices: Slice[], darkMode: boolean) {
  const palette = darkMode ? CATEGORICAL.dark : CATEGORICAL.light;
  const neutral = darkMode ? NEUTRAL.dark : NEUTRAL.light;
  return slices.map((slice, i) => {
    const slot = slices.slice(0, i).filter((s) => s.kind === "holding").length;
    return { ...slice, color: slice.kind === "cash" ? neutral : slice.kind === "other" ? palette[4] : palette[slot] };
  });
}

// Part-to-whole of net worth: up to 4 holdings, "Other", and cash (≤ 6
// segments). The legend lists every slice with its value and share, so color
// is never the only way to read it. With legend={false} the caller must show
// those numbers itself (the dashboard's holdings list does).
function AllocationDonut({ slices, total, legend = true }: { slices: Slice[]; total: number; legend?: boolean }) {
  const { darkMode } = useTheme();
  const [hovered, setHovered] = useState<string | null>(null);
  const colored = colorSlices(slices, darkMode);

  const lengths = colored.map((slice) => (total > 0 ? (slice.value / total) * C : 0));
  const arcs = colored.map((slice, i) => ({
    ...slice,
    dash: Math.max(0, lengths[i] - GAP),
    offset: lengths.slice(0, i).reduce((sum, l) => sum + l, 0),
  }));

  const focus = colored.find((s) => s.key === hovered);
  const investedShare = total > 0 ? ((total - (slices.find((s) => s.kind === "cash")?.value ?? 0)) / total) * 100 : 0;

  return (
    <div className={legend ? "flex flex-col sm:flex-row lg:flex-col items-center gap-6" : "flex justify-center"}>
      <div className="relative shrink-0">
        <svg width="168" height="168" viewBox="0 0 168 168" aria-hidden="true" className="-rotate-90">
          <circle cx="84" cy="84" r={R} fill="none" strokeWidth={STROKE} className="stroke-gray-100 dark:stroke-gray-800" />
          {arcs.map((arc) => (
            <circle
              key={arc.key}
              cx="84"
              cy="84"
              r={R}
              fill="none"
              stroke={arc.color}
              strokeWidth={hovered === arc.key ? STROKE + 4 : STROKE}
              strokeDasharray={`${arc.dash} ${C - arc.dash}`}
              strokeDashoffset={-arc.offset}
              className="transition-[stroke-width] duration-150"
              opacity={hovered && hovered !== arc.key ? 0.45 : 1}
              onMouseEnter={() => setHovered(arc.key)}
              onMouseLeave={() => setHovered(null)}
            />
          ))}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          {focus ? (
            <>
              <span className="text-xl font-semibold">{((focus.value / total) * 100).toFixed(1)}%</span>
              <span className="max-w-[6.5rem] truncate text-xs text-gray-500 dark:text-gray-400">{focus.label}</span>
            </>
          ) : (
            <>
              <span className="text-xl font-semibold">{investedShare.toFixed(0)}%</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">invested</span>
            </>
          )}
        </div>
      </div>

      {legend && (
      <ul className="w-full min-w-0 space-y-1.5">
        {colored.map((slice) => (
          <li
            key={slice.key}
            onMouseEnter={() => setHovered(slice.key)}
            onMouseLeave={() => setHovered(null)}
            className={`flex items-center gap-2 rounded-lg px-2 py-1 text-sm transition-colors ${hovered === slice.key ? "bg-gray-100 dark:bg-gray-800" : ""}`}
          >
            <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: slice.color }} />
            <span className="min-w-0 flex-1 truncate">{slice.label}</span>
            <span className="tabular-nums text-gray-500 dark:text-gray-400">{formatInr(slice.value)}</span>
            <span className="w-12 text-right font-medium tabular-nums">{total > 0 ? ((slice.value / total) * 100).toFixed(1) : "0.0"}%</span>
          </li>
        ))}
      </ul>
      )}
    </div>
  );
}

export default AllocationDonut;
