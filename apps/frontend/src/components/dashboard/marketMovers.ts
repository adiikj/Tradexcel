// Ranks a stock universe by today's real price change and returns the top 5. Shared by TopGainers/TopLosers.

type StockMeta = { shortName: string; fullName: string; symbol: string };

const LABELS = Array.from({ length: 30 }, (_, i) => `Day ${i + 1}`);

// Pure function over already-fetched per-symbol data (REST batch response,
// optionally overlaid with live ticks) so callers can re-rank reactively on
// every price update instead of re-fetching.
export function rankFromData(
  universe: StockMeta[],
  dataMap: Record<string, any>,
  direction: "gainers" | "losers"
) {
  // The stock list has a few duplicate symbols; keep one entry each.
  const seen = new Set<string>();
  const uniqueUniverse = universe.filter((stock) => {
    if (seen.has(stock.symbol)) return false;
    seen.add(stock.symbol);
    return true;
  });

  const ranked = uniqueUniverse
    .map((stock) => {
      const data = dataMap[stock.symbol];
      if (!data) return null;

      const magnitude = parseFloat(data.percentageChange) || 0;
      // percentageChange is unsigned; the sign lives in todayChange.
      const isNegative = String(data.todayChange || "").trim().startsWith("-");
      const signedChange = isNegative ? -magnitude : magnitude;

      return {
        ...stock,
        price: `₹ ${data.currentPrice?.toFixed(2) || "N/A"}`,
        percentageChange: `${data.percentageChange || 0}%`,
        todayChange: `${data.todayChange || 0}`,
        stockPrices: data.stockPrices || Array(30).fill(0),
        labels: data.dates || LABELS,
        signedChange,
      };
    })
    .filter((stock): stock is NonNullable<typeof stock> => stock !== null)
    // On a lopsided market day, "top 5 by rank" can include stocks moving the
    // wrong direction (e.g. a red stock in the gainers list because it's just
    // less red than the rest). Only ever show stocks actually matching this
    // direction - fewer than 5 (or zero) is correct when the market is skewed.
    .filter((stock) => (direction === "gainers" ? stock.signedChange > 0 : stock.signedChange < 0));

  ranked.sort((a, b) => (direction === "gainers" ? b.signedChange - a.signedChange : a.signedChange - b.signedChange));

  return ranked.slice(0, 5);
}
