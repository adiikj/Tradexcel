// Tex's surfaces. The panel floats over any page, so in dark mode it uses a
// navy family (not the app's neutral greys, which it would blend into).
// Kept deliberately flat: one surface, hairline borders, colour only on the
// user's own messages and the send button.
export const TEX_GRADIENT = "bg-gradient-to-br from-blue-600 to-indigo-600";

// The whole panel: header, conversation and composer share one surface.
export const SURFACE = "bg-white dark:bg-[#172238]";
// Quote cards and other small raised pieces.
export const CARD = "border border-slate-200 bg-slate-50/60 dark:border-[#2c3d63] dark:bg-[#1e2c4a]";
export const BORDER = "border-slate-200 dark:border-[#2c3d63]";
// Chips and quiet buttons.
export const CHIP =
  "rounded-full border border-slate-200 px-2.5 py-1 text-[12.5px] text-slate-700 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50 dark:border-[#2c3d63] dark:text-slate-200 dark:hover:border-blue-400/50 dark:hover:bg-blue-400/10 dark:hover:text-blue-200";
