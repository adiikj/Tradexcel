// Up/down colors for market charts: green for gains and red for losses, the
// convention traders expect. Green/red alone is hard to tell apart for
// red-green colorblind readers, so direction is never color-only: every change
// also carries a sign and a ▲/▼ glyph.
export const CHART_COLORS = {
  light: {
    up: "#16a34a", // green-600
    down: "#dc2626", // red-600
    text: "#374151", // gray-700
    muted: "#6b7280", // gray-500
    grid: "#f3f4f6", // gray-100
    border: "#e5e7eb", // gray-200
    reference: "#9ca3af", // gray-400
    surface: "#ffffff",
  },
  dark: {
    up: "#22c55e", // green-500
    down: "#ef4444", // red-500
    text: "#e5e7eb", // gray-200
    muted: "#9ca3af", // gray-400
    grid: "#1f2937", // gray-800
    border: "#374151", // gray-700
    reference: "#6b7280", // gray-500
    surface: "#111827", // gray-900
  },
} as const;

// Text classes for a signed change (text tokens a step darker/lighter than the
// mark colors so they pass text contrast).
export function changeTextClass(value: number | null | undefined): string {
  if (value == null || value === 0) return "text-gray-500 dark:text-gray-400";
  return value > 0 ? "text-green-700 dark:text-green-400" : "text-red-600 dark:text-red-400";
}

export function changeGlyph(value: number | null | undefined): string {
  if (value == null || value === 0) return "";
  return value > 0 ? "▲" : "▼";
}

// Diverging heat scale for % change: red <- neutral gray -> green, 7 bins.
// Each bin carries its own text color so tile labels keep contrast.
export const HEAT_BINS: { max: number; label: string; className: string }[] = [
  { max: -3, label: "≤ −3%", className: "bg-red-600 text-white dark:bg-red-500" },
  { max: -1.5, label: "−3 to −1.5%", className: "bg-red-400 text-gray-900 dark:bg-red-700 dark:text-white" },
  { max: -0.5, label: "−1.5 to −0.5%", className: "bg-red-200 text-gray-900 dark:bg-red-900 dark:text-white" },
  { max: 0.5, label: "−0.5 to +0.5%", className: "bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-white" },
  { max: 1.5, label: "+0.5 to +1.5%", className: "bg-green-200 text-gray-900 dark:bg-green-900 dark:text-white" },
  { max: 3, label: "+1.5 to +3%", className: "bg-green-400 text-gray-900 dark:bg-green-700 dark:text-white" },
  { max: Infinity, label: "≥ +3%", className: "bg-green-600 text-white dark:bg-green-500 dark:text-gray-900" },
];

export function heatBin(changePct: number | null): (typeof HEAT_BINS)[number] | null {
  if (changePct == null) return null;
  return HEAT_BINS.find((bin) => changePct <= bin.max) ?? HEAT_BINS[HEAT_BINS.length - 1];
}
