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
  total: Decimal; // price x quantity, before charges
  charges: Decimal; // added to a buy's cost, taken from a sale's proceeds
  note: string | null; // trade-journal entry
  createdAt: string;
};

// GET /portfolio/analytics - the current season. Plain numbers, not Decimals.
export type ClosedTrade = {
  transactionId: string;
  symbol: string;
  quantity: number;
  avgBuyPrice: number;
  sellPrice: number;
  pnl: number; // net of buy and sell charges
  pnlPercent: number;
  closedAt: string;
  note: string | null;
};

export type PortfolioAnalytics = {
  seasonStart: string;
  startBalance: number;
  netWorth: number;
  returnPct: number;
  benchmark: { name: string; returnPct: number } | null;
  // Season start, each weekday's close, then now. Dates are IST (YYYY-MM-DD).
  equityCurve: { date: string; netWorth: number; returnPct: number; benchmarkPct: number | null }[];
  allocation: { sector: string; value: number }[];
  trades: {
    realizedPnl: number;
    chargesPaid: number;
    closedTrades: number;
    wins: number;
    winRate: number | null;
    best: ClosedTrade | null;
    worst: ClosedTrade | null;
    recent: ClosedTrade[];
  };
};

// GET /learn/quests
export type Quest = {
  id: string;
  title: string;
  lesson: string;
  cta: { label: string; href: string };
  texQuestion: string | null; // a question to ask Tex to learn more
  completedAt: string | null;
};

// Practice runs (backend services/practice.ts)
export type PracticeScenario = {
  id: string;
  title: string;
  period: string;
  blurb: string;
  lesson: string;
  days: number;
  symbols: string[];
};

export type PracticeState = {
  id: string;
  scenario: PracticeScenario;
  status: "ACTIVE" | "FINISHED";
  day: number; // 1-based
  totalDays: number;
  date: string; // YYYY-MM-DD, the historical trading day
  cash: number;
  netWorth: number;
  returnPct: number;
  // Equal-weight buy-and-hold of the whole basket since day 1.
  basketReturnPct: number | null;
  stocks: { symbol: string; price: number | null; changePct: number | null }[];
  holdings: { symbol: string; quantity: number; avgBuyPrice: number; price: number; value: number; pnl: number }[];
  trades: { id: string; symbol: string; side: Side; quantity: number; price: number; charges: number; day: number }[];
};

export type PracticeHistoryItem = { id: string; scenarioId: string; title: string; returnPct: number; finishedAt: string };

export type LearnData = {
  quests: Quest[];
  scenarios: PracticeScenario[];
  activePracticeId: string | null;
  history: PracticeHistoryItem[];
};

// GET/POST /predictions - the daily NIFTY 50 call.
export type PredictionData = {
  date: string; // YYYY-MM-DD, the IST trading day the call is about
  pick: "UP" | "DOWN" | null;
  crowd: { up: number; down: number };
  stats: { calls: number; correct: number; currentStreak: number; bestStreak: number };
  recent: { date: string; direction: "UP" | "DOWN"; correct: boolean | null }[];
};

export type TransactionsData = { transactions: TransactionRecord[]; pagination: Pagination };

// A main-wallet order waiting to fill (backend services/queuedOrders.ts): a
// market order placed while the market was closed, or a limit / stop-loss order
// waiting for its price.
export type QueuedOrderStatus = "PENDING" | "FILLED" | "CANCELLED" | "FAILED";

export type OrderType = "MARKET" | "LIMIT" | "STOP";

export type QueuedOrder = {
  id: string;
  symbol: string;
  side: Side;
  quantity: number;
  quotedPrice: Decimal;
  orderType: OrderType;
  // LIMIT: the worst price you'll accept. STOP: the price that triggers a market order.
  triggerPrice: Decimal | null;
  status: QueuedOrderStatus;
  failureReason: string | null;
  resolvedAt: string | null;
  createdAt: string;
};

// POST /trade/buy|sell answers 202 with this when the order didn't fill right
// away (market closed, or a limit / stop-loss order waiting for its price).
export type QueuedTradeData = { queued: true; order: QueuedOrder };

export type OwnProfile = UserSummary & {
  email: string;
  phoneNumber: string | null;
  dob: string | null;
  currentStreak: number;
  longestStreak: number;
  hasGoogleLogin: boolean;
  hasPassword: boolean;
  hasPin: boolean;
  weeklyRecapEmails: boolean;
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
  // Optional rules (backend services/contestRules.ts)
  maxHoldings?: number | null;
  maxPositionPercent?: number | null;
  maxEntries?: number | null;
  isDuel?: boolean;
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

// ---- chat assistant (POST /api/v1/chat) ----
export type ChatReplyKind =
  | "answer" // a knowledge-base card
  | "clarify" // not sure which card: "did you mean…?" with suggestions
  | "data" // answered from live data (prices, your portfolio, ...)
  | "fallback" // off-topic
  | "guardrail"; // declined (advice, predictions, credentials, ...)

export type ChatQuote = {
  symbol: string;
  name: string;
  price: number;
  change: number | null;
  changePercent: number | null;
};

export type ChatReply = {
  kind: ChatReplyKind;
  intent: string;
  // Markdown subset: **bold**, lists and line breaks.
  text: string;
  links: { label: string; href: string }[];
  // Follow-up questions the widget can offer as one-tap chips.
  suggestions: string[];
  cardId: string | null;
  // Present for price and holding answers, so the widget can render quote cards.
  quotes?: ChatQuote[];
  confidence: number;
};

export * from "./stocks.js";
export * from "./charges.js";
export * from "./sectors.js";
