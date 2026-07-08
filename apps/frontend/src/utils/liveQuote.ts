import type { LiveQuote } from "../hooks/useLiveQuotes";

// Converts a raw WS tick into the same {currentPrice, percentageChange,
// todayChange} shape the REST batch endpoint returns (bare numeric/signed
// strings, no display formatting), so overlay code can treat both sources
// identically regardless of which one a piece of state started from.
export function tickToStockFields(tick: LiveQuote) {
  return {
    currentPrice: tick.price,
    percentageChange: tick.changePercent !== null ? Math.abs(tick.changePercent).toFixed(2) : "N/A",
    todayChange: tick.change !== null ? `${tick.change >= 0 ? "+" : ""}${tick.change.toFixed(2)}` : "N/A",
  };
}
