// Wire types shared by the backend and frontend: the shapes the API actually
// sends over JSON. Prisma Decimal columns (prices, totals, balances) serialize
// as strings, so they are typed `Decimal` - convert with Number() where used.

export type Side = "BUY" | "SELL";

export type ContestStatus = "UPCOMING" | "LIVE" | "ENDED";

// A live price as returned by the backend's pricing service.
export interface Quote {
  symbol: string;
  price: number;
  previousClose: number | null;
  change: number | null;
  changePercent: number | null;
  currency: string | null;
  timestamp: number;
}

export type Decimal = string | number;

// Every endpoint wraps its payload the same way (backend utils/ApiResponse).
export type ApiResponse<T> = {
  status: number;
  message: string;
  data: T;
  sucess: boolean; // sic - spelled this way by the backend
};

export type Pagination = { page: number; limit: number; total: number; totalPages: number };

export type UserSummary = { id: string; name: string; username: string; avatar: string | null };

export type RankedUser = {
  userId: string;
  rank: number;
  name: string;
  username: string;
  avatar: string | null;
  netWorth: number;
  totalPnlPercent: number;
};

export type LeaderboardData = { leaderboard: RankedUser[]; currentUser: RankedUser | null; totalPlayers: number };

export type ContestChampion = {
  userId: string;
  user: UserSummary;
  contestId: string;
  contestName: string;
  prize: string | null;
  endAt: string;
  finalNetWorth: number | null;
};

export type WeeklyChampion = { weekStart: string; weekEnd: string; pnlPercent: number; user: UserSummary };

export type HallOfFameData = {
  topNetWorth: RankedUser[];
  contestChampions: ContestChampion[];
  weeklyChampions: WeeklyChampion[];
};

export type Badge = {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned?: boolean;
  earnedAt?: string | null;
};

export type AchievementsData = { badges: Badge[]; earnedCount: number; totalCount: number };

export type NotificationItem = {
  id: string;
  type: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
  actor: UserSummary | null;
};

export type NotificationsData = { notifications: NotificationItem[]; unreadCount: number };

export type PriceAlert = {
  id: string;
  symbol: string;
  targetPrice: Decimal;
  direction: "ABOVE" | "BELOW";
  triggered: boolean;
  triggeredAt: string | null;
  createdAt: string;
};

export type NewsArticle = {
  id: string;
  title: string;
  publisher: string;
  link: string;
  publishedAt: number;
  thumbnail: string | null;
  relatedTickers: string[];
};

export type NewsData = { articles: NewsArticle[]; personalized: boolean };

export type ListedUser = UserSummary & { isFollowing?: boolean };

export type ActivityItem =
  | {
      type: "trade";
      id: string;
      user: UserSummary;
      symbol: string;
      side: Side;
      quantity: number;
      price: Decimal;
      total: Decimal;
      timestamp: string;
    }
  | {
      type: "contest_result";
      id: string;
      user: UserSummary;
      contestId: string;
      contestName: string;
      finalRank: number | null;
      finalNetWorth: Decimal | null;
      timestamp: string;
    };

export type ActivityFeedData = { items: ActivityItem[]; pagination: Pagination };

export type PublicProfile = {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
  memberSince: string;
  netWorth: number;
  totalPnlPercent: number;
  rank: number | null;
  title: { name: string; icon: string };
  currentStreak: number;
  longestStreak: number;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
  isSelf: boolean;
  badges: Badge[];
  weeklyPerformance: { weekStart: string; weekEnd: string; startBalance: number; endNetWorth: number; pnlPercent: number }[];
};

export type Wallet = { id: string; userId: string; balance: Decimal; currency: string };

export type TransactionRecord = {
  id: string;
  symbol: string;
  side: Side;
  quantity: number;
  price: Decimal;
  total: Decimal;
  createdAt: string;
};

export type TransactionsData = { transactions: TransactionRecord[]; pagination: Pagination };

export type OwnProfile = UserSummary & {
  email: string;
  phoneNumber: string | null;
  dob: string | null;
  currentStreak: number;
  longestStreak: number;
  hasGoogleLogin: boolean;
  hasPassword: boolean;
  hasPin: boolean;
};

// Login-type endpoints: a session (user) or, for new accounts, the email that
// still needs OTP verification.
export type AuthData = { user?: UserSummary; email?: string };

export type PortfolioHolding = {
  id: string;
  symbol: string;
  quantity: number;
  avgBuyPrice: Decimal;
  currentPrice: number | null;
  currentValue: Decimal | null;
  investedValue: Decimal;
  unrealizedPnl: Decimal | null;
  unrealizedPnlPercent: Decimal | null;
  priceStale?: boolean;
};

export type PortfolioSummary = {
  totalInvested: Decimal;
  totalCurrentValue: Decimal;
  totalPnl: Decimal;
  walletBalance: Decimal;
  netWorth: Decimal;
};

export type PortfolioData = { holdings: PortfolioHolding[]; summary: PortfolioSummary };

export type Contest = {
  id: string;
  name: string;
  startAt: string;
  endAt: string;
  startingBalance: Decimal;
  symbols: string[];
  status: ContestStatus;
  prize: string | null;
  imageUrl: string | null;
  historicalStartDate: string | null;
  simulatedDate: string | null;
  inviteCode?: string | null;
  visibility: "PUBLIC" | "PRIVATE";
  isJoined?: boolean;
  isOwner?: boolean;
  createdAt: string;
  _count: { entries: number };
  todaysPrices?: Record<string, number>;
};

export type ContestStanding = {
  userId: string;
  name: string;
  username: string;
  avatar: string | null;
  netWorth: number;
  delta: number;
  rank: number;
};

export type ContestStandingsData = { status: ContestStatus; standings: ContestStanding[] };

export type ContestPortfolioData = {
  holdings: (Omit<PortfolioHolding, "id"> & { id: string; contestEntryId: string })[];
  summary: Omit<PortfolioSummary, "walletBalance"> & { balance: Decimal };
};

export type StockSnapshot = {
  currentPrice: number;
  stockPrices: number[];
  percentageChange: string | number;
  todayChange: string | number;
  dates: string[] | null;
};

// ---- Market charts (GET /finance/chart/:symbol?range=) ----

export type ChartRange = "1D" | "5D" | "1M" | "6M" | "1Y" | "5Y";

// One OHLCV bar; `time` is a UNIX timestamp in seconds (bar open).
export type Candle = { time: number; open: number; high: number; low: number; close: number; volume: number };

export type ChartData = {
  symbol: string;
  range: ChartRange;
  interval: string;
  currency: string | null;
  exchange: string | null;
  name: string | null;
  // Seconds east of UTC for the exchange (IST = 19800), to label bars in market time.
  gmtOffset: number;
  price: number | null;
  previousClose: number | null;
  dayHigh: number | null;
  dayLow: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  volume: number | null;
  candles: Candle[];
};
