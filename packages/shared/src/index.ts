export type Side = "BUY" | "SELL";

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface Holding {
  id: string;
  userId: string;
  symbol: string;
  quantity: number;
  avgBuyPrice: number;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  symbol: string;
  side: Side;
  quantity: number;
  price: number;
  total: number;
  createdAt: string;
}

export interface Quote {
  symbol: string;
  price: number;
  previousClose: number | null;
  change: number | null;
  changePercent: number | null;
  currency: string | null;
  timestamp: number;
}

export interface PortfolioHolding extends Holding {
  currentPrice: number | null;
  currentValue: number | null;
  investedValue: number;
  unrealizedPnl: number | null;
  unrealizedPnlPercent: number | null;
}

export interface PortfolioSummary {
  totalInvested: number;
  totalCurrentValue: number;
  totalPnl: number;
  walletBalance: number;
  netWorth: number;
}

export type ContestStatus = "UPCOMING" | "LIVE" | "ENDED";

export interface Contest {
  id: string;
  name: string;
  startAt: string;
  endAt: string;
  startingBalance: number;
  symbols: string[];
  status: ContestStatus;
  prize: string | null;
  imageUrl: string | null;
  // Presence means this is a "past event" replay contest - simulatedDate is
  // the historical trading date currently being revealed (null otherwise).
  historicalStartDate: string | null;
  simulatedDate: string | null;
  createdAt: string;
  _count?: { entries: number };
  // Detail responses only - today's tradable price per universe symbol,
  // sourced from either the historical close or a live quote.
  todaysPrices?: Record<string, number>;
}

export interface ContestStanding {
  userId: string;
  name: string;
  username: string;
  avatar: string;
  netWorth: number;
  delta: number;
  rank: number;
}

export interface ContestHolding {
  id: string;
  contestEntryId: string;
  symbol: string;
  quantity: number;
  avgBuyPrice: number;
  createdAt: string;
  updatedAt: string;
}

export interface ContestTransaction {
  id: string;
  contestEntryId: string;
  symbol: string;
  side: Side;
  quantity: number;
  price: number;
  total: number;
  createdAt: string;
}

export interface ContestPortfolioHolding extends ContestHolding {
  currentPrice: number | null;
  currentValue: number | null;
  investedValue: number;
  unrealizedPnl: number | null;
  unrealizedPnlPercent: number | null;
}

export interface ContestPortfolioSummary {
  totalInvested: number;
  totalCurrentValue: number;
  totalPnl: number;
  balance: number;
  netWorth: number;
}
