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
    throw new Error(apiErrorMessage(error, "An unexpected error occurred while logging in"));
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
    throw new Error(apiErrorMessage(error, "Error registering user."));
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
    throw new Error(apiErrorMessage(error, "Error verifying OTP"));
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
    throw new Error(apiErrorMessage(error, "Error signing in with Google"));
  }
};

export const logoutUser = async () => {
  try {
    const response = await axios.post(
      `${BASE_URL}/logout`,
      {});
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "Error logging out"));
  }
};

export const getUserName = async () => {
  try {
    const response = await axios.get<ApiResponse<{ name: string }>>(`${BASE_URL}/name`);
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "Failed to fetch user name"));
  }
};

export const getUserProfile = async () => {
  try {
    const response = await axios.get<ApiResponse<OwnProfile>>(`${BASE_URL}/profile`);
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "Failed to fetch user profile"));
  }
}

export const updateUserProfile = async (formData: Record<string, unknown>) => {
  try {
    const response = await axios.patch(`${BASE_URL}/update`, formData);
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "Failed to update user profile"));
  }
};

export const changePasswordAndPin = async (formData: Record<string, string>) => {
  try {
    const response = await axios.patch(`${BASE_URL}/change-password-pin`, formData);
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "Failed to update password and pin"));
  }
};

export const getAvatar = async () => {
  try {
    const response = await axios.get<ApiResponse<{ avatar: string | null }>>(`${BASE_URL}/getavatar`);
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "Failed to fetch user avatar"));
  }
};

export const updateAvatar = async (formData: FormData) => {
  try {
    const response = await axios.patch(`${BASE_URL}/updateavatar`, formData);
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "Failed to update user avatar"));
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
    throw new Error(apiErrorMessage(error, "Failed to load chart"));
  }
};

export const getWallet = async () => {
  try {
    const response = await axios.get<ApiResponse<Wallet>>(`${BASE_TRADE_URL}/wallet`);
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "Failed to fetch wallet"));
  }
};

export const getPortfolio = async () => {
  try {
    const response = await axios.get<ApiResponse<PortfolioData>>(`${BASE_TRADE_URL}/portfolio`);
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "Failed to fetch portfolio"));
  }
};

export const getTransactions = async (page = 1, limit = 20) => {
  try {
    const response = await axios.get<ApiResponse<TransactionsData>>(`${BASE_TRADE_URL}/transactions`, {
      params: { page, limit },
    });
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "Failed to fetch transactions"));
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
    throw new Error(apiErrorMessage(error, "Failed to buy stock"));
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
    throw new Error(apiErrorMessage(error, "Failed to sell stock"));
  }
};

export const getLeaderboard = async (limit = 20) => {
  try {
    const response = await axios.get<ApiResponse<LeaderboardData>>(`${BASE_TRADE_URL}/leaderboard`, {
      params: { limit },
    });
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "Failed to fetch leaderboard"));
  }
};

export const getContests = async (scope: "public" | "private" = "public") => {
  try {
    const response = await axios.get<ApiResponse<Contest[]>>(`${BASE_TRADE_URL}/contests`, {
      params: { scope },
    });
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "Failed to fetch contests"));
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
    throw new Error(apiErrorMessage(error, "Failed to create private league"));
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
    throw new Error(apiErrorMessage(error, "Failed to join private league"));
  }
};

export const getContest = async (contestId: string) => {
  try {
    const response = await axios.get<ApiResponse<Contest>>(`${BASE_TRADE_URL}/contests/${contestId}`);
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "Failed to fetch contest"));
  }
};

export const joinContest = async (contestId: string) => {
  try {
    const response = await axios.post(`${BASE_TRADE_URL}/contests/${contestId}/join`);
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "Failed to join contest"));
  }
};

export const getContestStandings = async (contestId: string) => {
  try {
    const response = await axios.get<ApiResponse<ContestStandingsData>>(`${BASE_TRADE_URL}/contests/${contestId}/standings`);
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "Failed to fetch standings"));
  }
};

export const getContestPortfolio = async (contestId: string) => {
  try {
    const response = await axios.get<ApiResponse<ContestPortfolioData>>(`${BASE_TRADE_URL}/contests/${contestId}/portfolio`);
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "Failed to fetch contest portfolio"));
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
    throw new Error(apiErrorMessage(error, "Failed to buy stock in contest"));
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
    throw new Error(apiErrorMessage(error, "Failed to sell stock in contest"));
  }
};

export const getAlerts = async () => {
  try {
    const response = await axios.get<ApiResponse<PriceAlert[]>>(`${BASE_TRADE_URL}/alerts`);
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "Failed to fetch alerts"));
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
    throw new Error(apiErrorMessage(error, "Failed to create alert"));
  }
};

export const deleteAlert = async (alertId: string) => {
  try {
    const response = await axios.delete(`${BASE_TRADE_URL}/alerts/${alertId}`);
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "Failed to delete alert"));
  }
};

export const searchPlayers = async (query: string) => {
  try {
    const response = await axios.get<ApiResponse<{ users: UserSummary[] }>>(`${BASE_TRADE_URL}/social/search`, {
      params: { q: query },
    });
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "Failed to search players"));
  }
};

export const getPublicProfile = async (username: string) => {
  try {
    const response = await axios.get<ApiResponse<PublicProfile>>(`${BASE_TRADE_URL}/users/${username}/profile`);
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "Failed to fetch profile"));
  }
};

export const followUser = async (username: string) => {
  try {
    const response = await axios.post(`${BASE_TRADE_URL}/users/${username}/follow`);
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "Failed to follow user"));
  }
};

export const unfollowUser = async (username: string) => {
  try {
    const response = await axios.delete(`${BASE_TRADE_URL}/users/${username}/follow`);
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "Failed to unfollow user"));
  }
};

export const getFollowers = async (username: string) => {
  try {
    const response = await axios.get<ApiResponse<{ users: ListedUser[] }>>(`${BASE_TRADE_URL}/users/${username}/followers`);
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "Failed to fetch followers"));
  }
};

export const getFollowing = async (username: string) => {
  try {
    const response = await axios.get<ApiResponse<{ users: ListedUser[] }>>(`${BASE_TRADE_URL}/users/${username}/following`);
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "Failed to fetch following"));
  }
};

export const getActivityFeed = async (page = 1, limit = 20) => {
  try {
    const response = await axios.get<ApiResponse<ActivityFeedData>>(`${BASE_TRADE_URL}/social/activity`, {
      params: { page, limit },
    });
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "Failed to fetch activity feed"));
  }
};

export const getNotifications = async () => {
  try {
    const response = await axios.get<ApiResponse<NotificationsData>>(`${BASE_TRADE_URL}/notifications`);
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "Failed to fetch notifications"));
  }
};

export const markNotificationsRead = async () => {
  try {
    const response = await axios.post(`${BASE_TRADE_URL}/notifications/read-all`);
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "Failed to mark notifications read"));
  }
};

export const getNews = async () => {
  try {
    const response = await axios.get<ApiResponse<NewsData>>(`${BASE_TRADE_URL}/news`);
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "Failed to fetch news"));
  }
};

export const getFriendsLeaderboard = async (limit = 20) => {
  try {
    const response = await axios.get<ApiResponse<LeaderboardData>>(`${BASE_TRADE_URL}/leaderboard/friends`, {
      params: { limit },
    });
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "Failed to fetch friends leaderboard"));
  }
};

export const getAchievements = async () => {
  try {
    const response = await axios.get<ApiResponse<AchievementsData>>(`${BASE_TRADE_URL}/achievements`);
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "Failed to fetch achievements"));
  }
};

export const getHallOfFame = async () => {
  try {
    const response = await axios.get<ApiResponse<HallOfFameData>>(`${BASE_TRADE_URL}/hall-of-fame`);
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "Failed to fetch hall of fame"));
  }
};

export const sendContactMessage = async (name: string, email: string, message: string) => {
  try {
    const response = await axios.post(`${BASE_TRADE_URL}/contact`, { name, email, message });
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "Failed to send message"));
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
    throw new Error(apiErrorMessage(error, "Failed to send message"));
  }
};

