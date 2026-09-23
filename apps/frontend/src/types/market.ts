// A stock as the Market page uses it: the listing from StockData.json plus the
// latest quote (overlaid with live ticks). Numbers are null when unavailable.
export type MarketStock = {
  symbol: string;
  shortName: string;
  fullName: string;
  price: number | null;
  change: number | null;
  changePct: number | null;
  // Last ~30 daily closes, for the watchlist sparkline.
  closes: number[];
};

// An entry of components/market/StockData.json.
export type StockListing = { symbol: string; shortName: string; fullName: string };

// What the stock chart cards render (Market list, dashboard movers).
export type StockCardData = {
  shortName: string;
  fullName: string;
  stockPrices: number[];
  labels: string[];
  percentageChange: string;
  price: string;
  todayChange: string;
};
