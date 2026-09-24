// Shared instance: sends the httpOnly auth cookies and refreshes on 401.
import axios, { apiErrorMessage } from './http';
import type {
  ApiResponse,
  ChartData,
  ChartRange,
  StockSnapshot,
  AchievementsData,
  ActivityFeedData,
  AuthData,
  Contest,
  ContestPortfolioData,
  ContestStandingsData,
  HallOfFameData,
  LeaderboardData,
  ListedUser,
  NewsData,
  NotificationsData,
  OwnProfile,
  PortfolioData,
  PriceAlert,
  PublicProfile,
  QueuedOrder,
  TransactionsData,
  UserSummary,
  Wallet,
} from '@tradexcel/shared';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const BASE_FINANCE_URL = process.env.NEXT_PUBLIC_API_FINANCE_URL;
const BASE_TRADE_URL = process.env.NEXT_PUBLIC_API_TRADE_URL;

export const loginUser = async (emailOrUsername: string, credential: string, mode: "password" | "pin") => {
  try {
    const response = await axios.post<ApiResponse<AuthData>>(
      `${BASE_URL}/login`,
      { emailOrUsername, [mode]: credential }
    );
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "We couldn't sign you in. Please try again."));
  }
};

export const registerUser = async ({
  name,
  username,
  email,
  password,
  pin,
}: {
  name: string;
  username: string;
  email: string;
  password: string;
  pin: string;
}) => {
  try {
    const response = await axios.post(`${BASE_URL}/register`, {
      name,
      username,
      email,
      password,
      pin,
    });
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "We couldn't create your account. Please try again."));
  }
};

// On success the backend also creates the wallet and logs the user in.
export const verifyOTP = async (email: string, otp: string) => {
  try {
    const response = await axios.post<ApiResponse<AuthData>>(
      `${BASE_URL}/verify-otp`,
      { email, otp }
    );
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "We couldn't check that code. Please try again."));
  }
};

export const googleLogin = async (idToken: string) => {
  try {
    const response = await axios.post<ApiResponse<AuthData>>(
      `${BASE_URL}/google`,
      { idToken }
    );
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "Google sign-in didn't work. Please try again."));
  }
};

export const logoutUser = async () => {
  try {
    const response = await axios.post(
      `${BASE_URL}/logout`,
      {});
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "We couldn't sign you out. Please try again."));
  }
};

export const getUserName = async () => {
  try {
    const response = await axios.get<ApiResponse<{ name: string }>>(`${BASE_URL}/name`);
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "We couldn't load your name. Please try again."));
  }
};

export const getUserProfile = async () => {
  try {
    const response = await axios.get<ApiResponse<OwnProfile>>(`${BASE_URL}/profile`);
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "We couldn't load your profile. Please try again."));
  }
}

export const updateUserProfile = async (formData: Record<string, unknown>) => {
  try {
    const response = await axios.patch(`${BASE_URL}/update`, formData);
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "We couldn't save your profile. Please try again."));
  }
};

export const forgotPassword = async (email: string) => {
  try {
    const response = await axios.post<ApiResponse<null>>(`${BASE_URL}/forgot-password`, { email });
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "We couldn't send a reset code. Please try again."));
  }
};

export const resetPassword = async (data: { email: string; code: string; newPassword?: string; newPin?: string }) => {
  try {
    const response = await axios.post<ApiResponse<null>>(`${BASE_URL}/reset-password`, data);
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "We couldn't reset your details. Please try again."));
  }
};

export const changePasswordAndPin = async (formData: Record<string, string>) => {
  try {
    const response = await axios.patch(`${BASE_URL}/change-password-pin`, formData);
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "We couldn't update your sign-in details. Please try again."));
  }
};

export const getAvatar = async () => {
  try {
    const response = await axios.get<ApiResponse<{ avatar: string | null }>>(`${BASE_URL}/getavatar`);
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "We couldn't load your photo. Please try again."));
  }
};

export const updateAvatar = async (formData: FormData) => {
  try {
    const response = await axios.patch(`${BASE_URL}/updateavatar`, formData);
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "We couldn't update your photo. Please try again."));
  }
};

export const getStockData = async (symbol: string) => {
  try {
    const url = `${BASE_FINANCE_URL}/stock/${symbol}`;
    const response = await axios.get<ApiResponse<Partial<StockSnapshot>>>(url);

    if (response.data.status !== 200) {
      return null;
    }

    const { currentPrice, stockPrices, percentageChange, todayChange, dates } = response.data.data;

    return {
      currentPrice: currentPrice || 0,
      stockPrices: stockPrices || Array.from({ length: 30 }, () => currentPrice || 0),
      percentageChange,
      todayChange,
      dates: dates || null,
    };
  } catch {
    throw new Error("Failed to fetch stock data");
  }
};

// Batched equivalent of getStockData - one request for many symbols. Returns
// a symbol -> data map; symbols the backend couldn't resolve map to null.
export const getBatchStockData = async (symbols: string[]) => {
  try {
    const url = `${BASE_FINANCE_URL}/quotes`;
    const response = await axios.get<ApiResponse<Record<string, Partial<StockSnapshot> | null>>>(url, {
      params: { symbols: symbols.join(",") },
    });

    if (response.data.status !== 200) {
      return {};
    }

    const raw = response.data.data || {};
    const result: Record<string, StockSnapshot | null> = {};
    for (const symbol of Object.keys(raw)) {
      const stock = raw[symbol];
      if (!stock) {
        result[symbol] = null;
        continue;
      }
      result[symbol] = {
        currentPrice: stock.currentPrice || 0,
        stockPrices: stock.stockPrices || Array.from({ length: 30 }, () => stock.currentPrice || 0),
        percentageChange: stock.percentageChange ?? "N/A",
        todayChange: stock.todayChange ?? "N/A",
        dates: stock.dates || null,
      };
    }
    return result;
  } catch {
    throw new Error("Failed to fetch batch stock data");
  }
};

export const getChart = async (symbol: string, range: ChartRange) => {
  try {
    const response = await axios.get<ApiResponse<ChartData>>(`${BASE_FINANCE_URL}/chart/${encodeURIComponent(symbol)}`, {
      params: { range },
    });
    return response.data.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "We couldn't load this chart. Please try again."));
  }
};

export const getWallet = async () => {
  try {
    const response = await axios.get<ApiResponse<Wallet>>(`${BASE_TRADE_URL}/wallet`);
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "We couldn't load your wallet. Please try again."));
  }
};

export const getPortfolio = async () => {
  try {
    const response = await axios.get<ApiResponse<PortfolioData>>(`${BASE_TRADE_URL}/portfolio`);
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "We couldn't load your portfolio. Please try again."));
  }
};

export const getTransactions = async (page = 1, limit = 20) => {
  try {
    const response = await axios.get<ApiResponse<TransactionsData>>(`${BASE_TRADE_URL}/transactions`, {
      params: { page, limit },
    });
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "We couldn't load your transactions. Please try again."));
  }
};

export const buyStock = async (symbol: string, quantity: number) => {
  try {
    const response = await axios.post(
      `${BASE_TRADE_URL}/trade/buy`,
      { symbol, quantity }
    );
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "We couldn't complete that purchase. Please try again."));
  }
};

export const sellStock = async (symbol: string, quantity: number) => {
  try {
    const response = await axios.post(
      `${BASE_TRADE_URL}/trade/sell`,
      { symbol, quantity }
    );
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "We couldn't complete that sale. Please try again."));
  }
};

export const getQueuedOrders = async () => {
  try {
    const response = await axios.get<ApiResponse<QueuedOrder[]>>(`${BASE_TRADE_URL}/trade/orders`);
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "We couldn't load your queued orders. Please try again."));
  }
};

export const cancelQueuedOrder = async (orderId: string) => {
  try {
    const response = await axios.delete<ApiResponse<null>>(`${BASE_TRADE_URL}/trade/orders/${encodeURIComponent(orderId)}`);
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "We couldn't cancel that order. Please try again."));
  }
};

export const getLeaderboard = async (limit = 20) => {
  try {
    const response = await axios.get<ApiResponse<LeaderboardData>>(`${BASE_TRADE_URL}/leaderboard`, {
      params: { limit },
    });
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "We couldn't load the leaderboard. Please try again."));
  }
};

export const getContests = async (scope: "public" | "private" = "public") => {
  try {
    const response = await axios.get<ApiResponse<Contest[]>>(`${BASE_TRADE_URL}/contests`, {
      params: { scope },
    });
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "We couldn't load contests. Please try again."));
  }
};

export const createPrivateContest = async (payload: {
  name: string;
  startAt: string;
  endAt: string;
  startingBalance?: number;
  symbols: string[];
  prize?: string;
}) => {
  try {
    const response = await axios.post<ApiResponse<Contest>>(`${BASE_TRADE_URL}/contests/private`, payload);
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "We couldn't create your league. Please try again."));
  }
};

export const joinPrivateContest = async (inviteCode: string) => {
  try {
    const response = await axios.post<ApiResponse<{ entry: { id: string }; contest: Contest }>>(
      `${BASE_TRADE_URL}/contests/private/join`,
      { inviteCode }
    );
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "We couldn't join that league. Check the code and try again."));
  }
};

export const getContest = async (contestId: string) => {
  try {
    const response = await axios.get<ApiResponse<Contest>>(`${BASE_TRADE_URL}/contests/${contestId}`);
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "We couldn't load this contest. Please try again."));
  }
};

export const joinContest = async (contestId: string) => {
  try {
    const response = await axios.post(`${BASE_TRADE_URL}/contests/${contestId}/join`);
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "We couldn't join this contest. Please try again."));
  }
};

export const getContestStandings = async (contestId: string) => {
  try {
    const response = await axios.get<ApiResponse<ContestStandingsData>>(`${BASE_TRADE_URL}/contests/${contestId}/standings`);
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "We couldn't load the standings. Please try again."));
  }
};

export const getContestPortfolio = async (contestId: string) => {
  try {
    const response = await axios.get<ApiResponse<ContestPortfolioData>>(`${BASE_TRADE_URL}/contests/${contestId}/portfolio`);
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "We couldn't load your contest portfolio. Please try again."));
  }
};

export const buyContestStock = async (contestId: string, symbol: string, quantity: number) => {
  try {
    const response = await axios.post(
      `${BASE_TRADE_URL}/contests/${contestId}/trade/buy`,
      { symbol, quantity }
    );
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "We couldn't complete that purchase. Please try again."));
  }
};

export const sellContestStock = async (contestId: string, symbol: string, quantity: number) => {
  try {
    const response = await axios.post(
      `${BASE_TRADE_URL}/contests/${contestId}/trade/sell`,
      { symbol, quantity }
    );
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "We couldn't complete that sale. Please try again."));
  }
};

export const getAlerts = async () => {
  try {
    const response = await axios.get<ApiResponse<PriceAlert[]>>(`${BASE_TRADE_URL}/alerts`);
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "We couldn't load your alerts. Please try again."));
  }
};

export const createAlert = async (symbol: string, targetPrice: number, direction: "ABOVE" | "BELOW") => {
  try {
    const response = await axios.post<ApiResponse<PriceAlert>>(
      `${BASE_TRADE_URL}/alerts`,
      { symbol, targetPrice, direction }
    );
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "We couldn't create that alert. Please try again."));
  }
};

export const deleteAlert = async (alertId: string) => {
  try {
    const response = await axios.delete(`${BASE_TRADE_URL}/alerts/${alertId}`);
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "We couldn't delete that alert. Please try again."));
  }
};

export const searchPlayers = async (query: string) => {
  try {
    const response = await axios.get<ApiResponse<{ users: UserSummary[] }>>(`${BASE_TRADE_URL}/social/search`, {
      params: { q: query },
    });
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "We couldn't search right now. Please try again."));
  }
};

export const getPublicProfile = async (username: string) => {
  try {
    const response = await axios.get<ApiResponse<PublicProfile>>(`${BASE_TRADE_URL}/users/${username}/profile`);
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "We couldn't load this profile. Please try again."));
  }
};

export const followUser = async (username: string) => {
  try {
    const response = await axios.post(`${BASE_TRADE_URL}/users/${username}/follow`);
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "We couldn't follow this trader. Please try again."));
  }
};

export const unfollowUser = async (username: string) => {
  try {
    const response = await axios.delete(`${BASE_TRADE_URL}/users/${username}/follow`);
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "We couldn't unfollow this trader. Please try again."));
  }
};

export const getFollowers = async (username: string) => {
  try {
    const response = await axios.get<ApiResponse<{ users: ListedUser[] }>>(`${BASE_TRADE_URL}/users/${username}/followers`);
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "We couldn't load followers. Please try again."));
  }
};

export const getFollowing = async (username: string) => {
  try {
    const response = await axios.get<ApiResponse<{ users: ListedUser[] }>>(`${BASE_TRADE_URL}/users/${username}/following`);
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "We couldn't load this list. Please try again."));
  }
};

export const getActivityFeed = async (page = 1, limit = 20) => {
  try {
    const response = await axios.get<ApiResponse<ActivityFeedData>>(`${BASE_TRADE_URL}/social/activity`, {
      params: { page, limit },
    });
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "We couldn't load recent activity. Please try again."));
  }
};

export const getNotifications = async () => {
  try {
    const response = await axios.get<ApiResponse<NotificationsData>>(`${BASE_TRADE_URL}/notifications`);
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "We couldn't load your notifications. Please try again."));
  }
};

export const markNotificationsRead = async () => {
  try {
    const response = await axios.post(`${BASE_TRADE_URL}/notifications/read-all`);
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "We couldn't update your notifications. Please try again."));
  }
};

export const getNews = async () => {
  try {
    const response = await axios.get<ApiResponse<NewsData>>(`${BASE_TRADE_URL}/news`);
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "We couldn't load the news. Please try again."));
  }
};

export const getFriendsLeaderboard = async (limit = 20) => {
  try {
    const response = await axios.get<ApiResponse<LeaderboardData>>(`${BASE_TRADE_URL}/leaderboard/friends`, {
      params: { limit },
    });
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "We couldn't load the leaderboard. Please try again."));
  }
};

export const getAchievements = async () => {
  try {
    const response = await axios.get<ApiResponse<AchievementsData>>(`${BASE_TRADE_URL}/achievements`);
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "We couldn't load your achievements. Please try again."));
  }
};

export const getHallOfFame = async () => {
  try {
    const response = await axios.get<ApiResponse<HallOfFameData>>(`${BASE_TRADE_URL}/hall-of-fame`);
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "We couldn't load past champions. Please try again."));
  }
};

export const sendContactMessage = async (name: string, email: string, message: string) => {
  try {
    const response = await axios.post(`${BASE_TRADE_URL}/contact`, { name, email, message });
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "We couldn't send your message. Please try again."));
  }
};

export const sendSupportMessage = async (subject: string, message: string) => {
  try {
    const response = await axios.post(
      `${BASE_TRADE_URL}/support`,
      { subject, message }
    );
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "We couldn't send your message. Please try again."));
  }
};

