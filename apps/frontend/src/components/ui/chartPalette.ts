// Categorical series colors (dataviz reference palette, validated for
// colorblind separation on adjacent marks in both themes). Assign in slot
// order, never cycled; past the last slot, fold into "Other".
export const CATEGORICAL = {
  light: ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#4a3aa7", "#e34948"],
  dark: ["#3987e5", "#d95926", "#199e70", "#c98500", "#d55181", "#008300", "#9085e9", "#e66767"],
} as const;

// Non-series parts of a whole (e.g. cash) stay neutral gray.
export const NEUTRAL = { light: "#9ca3af", dark: "#6b7280" } as const;
