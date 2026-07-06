// Ranks a stock universe by today's real price change and returns the top 5,
// instead of a fixed hardcoded list — shared by TopGainers and TopLosers.

type StockMeta = { shortName: string; fullName: string; symbol: string };

const LABELS = Array.from({ length: 30 }, (_, i) => `Day ${i + 1}`);

export async function rankMovers(
  universe: StockMeta[],
  getStockData: (symbol: string) => Promise<any>,
  direction: "gainers" | "losers"
) {
  // The stock list has a few duplicate symbols; keep one entry each.
  const seen = new Set<string>();
  const uniqueUniverse = universe.filter((stock) => {
    if (seen.has(stock.symbol)) return false;
    seen.add(stock.symbol);
    return true;
  });

  const results = await Promise.all(
    uniqueUniverse.map(async (stock) => {
      try {
        const data = await getStockData(stock.symbol);
        const magnitude = parseFloat(data.percentageChange) || 0;
        // percentageChange comes back unsigned from the backend; the sign
        // lives in todayChange (e.g. "+12.34" / "-5.67" / "NA").
        const isNegative = String(data.todayChange || "").trim().startsWith("-");
        const signedChange = isNegative ? -magnitude : magnitude;

        return {
          ...stock,
          price: `₹ ${data.currentPrice?.toFixed(2) || "N/A"}`,
          percentageChange: `${data.percentageChange || 0}%`,
          todayChange: `${data.todayChange || 0}`,
          stockPrices: data.stockPrices || Array(30).fill(0),
          labels: LABELS,
          signedChange,
        };
      } catch (error) {
        console.error(`Error fetching data for ${stock.symbol}:`, error);
        return null;
      }
    })
  );

  const ranked = results.filter((stock): stock is NonNullable<typeof stock> => stock !== null);

  ranked.sort((a, b) => (direction === "gainers" ? b.signedChange - a.signedChange : a.signedChange - b.signedChange));

  return ranked.slice(0, 5);
}
