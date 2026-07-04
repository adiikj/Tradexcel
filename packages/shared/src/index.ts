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
