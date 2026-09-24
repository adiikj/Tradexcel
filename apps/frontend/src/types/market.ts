// A stock as the Market page uses it: the shared stock listing plus the
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

// An entry of the shared stock list (@tradexcel/shared STOCK_LIST).
export type { StockListing } from "@tradexcel/shared";
