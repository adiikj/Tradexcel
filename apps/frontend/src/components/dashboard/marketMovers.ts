// Ranks a stock universe by today's real price change and returns the top 5. Shared by TopGainers/TopLosers.

type StockMeta = { shortName: string; fullName: string; symbol: string };

const LABELS = Array.from({ length: 30 }, (_, i) => `Day ${i + 1}`);

// Curated large-cap symbols, to avoid firing one API call per symbol across the full catalog.
export const LIQUID_MOVERS_SYMBOLS = new Set([
  "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "ICICIBANK.NS", "INFY.NS", "SBIN.NS", "BHARTIARTL.NS", "ITC.NS",
  "LT.NS", "HCLTECH.NS", "KOTAKBANK.NS", "AXISBANK.NS", "BAJFINANCE.NS", "MARUTI.NS", "SUNPHARMA.NS", "TITAN.NS",
  "ASIANPAINT.NS", "WIPRO.NS", "NESTLEIND.NS", "HINDUNILVR.NS", "ULTRACEMCO.NS", "NTPC.NS", "POWERGRID.NS",
  "ONGC.NS", "COALINDIA.NS", "TATASTEEL.NS", "JSWSTEEL.NS", "ADANIENT.NS", "ADANIPORTS.NS", "TECHM.NS",
  "DRREDDY.NS", "CIPLA.NS", "DIVISLAB.NS", "BAJAJFINSV.NS", "HDFCLIFE.NS", "SBILIFE.NS", "GRASIM.NS",
  "EICHERMOT.NS", "M&M.NS", "BRITANNIA.NS", "INDUSINDBK.NS", "TATACONSUM.NS", "HEROMOTOCO.NS",
]);

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
      } catch (error) {
        return null;
      }
    })
  );

  const ranked = results.filter((stock): stock is NonNullable<typeof stock> => stock !== null);

  ranked.sort((a, b) => (direction === "gainers" ? b.signedChange - a.signedChange : a.signedChange - b.signedChange));

  return ranked.slice(0, 5);
}
