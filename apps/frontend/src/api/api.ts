import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const BASE_FINANCE_URL = process.env.NEXT_PUBLIC_API_FINANCE_URL;
const BASE_TRADE_URL = process.env.NEXT_PUBLIC_API_TRADE_URL;

export const loginUser = async (emailOrUsername: string, credential: string, mode: "password" | "pin") => {
  try {
    const response = await axios.post(
      `${BASE_URL}/login`,
      { emailOrUsername, [mode]: credential },
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    const message =
      error?.response?.data?.message ||
      error.message ||
      "An unexpected error occurred while logging in";
    throw new Error(message);
  }
};

export const registerUser = async ({ name, username, email, password, pin }) => {
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
    const message = error?.response?.data?.message || error.message || "Error registering user.";
    throw new Error(message);
  }
};

// On success the backend also creates the wallet and logs the user in.
export const verifyOTP = async (email: string, otp: string) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/verify-otp`,
      { email, otp },
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    const message = error?.response?.data?.message || error.message || "Error verifying OTP";
    throw new Error(message);
  }
};

export const googleLogin = async (idToken: string) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/google`,
      { idToken },
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    const message = error?.response?.data?.message || error.message || "Error signing in with Google";
    throw new Error(message);
  }
};

export const logoutUser = async (token) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/logout`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    const message = error?.response?.data?.message || error.message || "Error logging out";
    throw new Error(message);
  }
};

export const getUserName = async () => {
  try {
    const token = (typeof window !== 'undefined' ? localStorage.getItem("authToken") : null);
    if (!token) {
      throw new Error("Authentication token is missing. Please log in again.");
    }

    const response = await axios.get(`${BASE_URL}/name`, {
      withCredentials: true,
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    const message = error?.response?.data?.message || error.message || "Failed to fetch user name";
    throw new Error(message);
  }
};

export const getUserProfile = async () => {
  try {
    const token = (typeof window !== 'undefined' ? localStorage.getItem("authToken") : null);
    if (!token) {
      throw new Error("Authentication token is missing. Please log in again.");
    }

    const response = await axios.get(`${BASE_URL}/profile`, {
      withCredentials: true,
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    const message = error?.response?.data?.message || error.message || "Failed to fetch user profile";
    throw new Error(message);
  }
}

export const updateUserProfile = async (formData) => {
  try {
    const token = (typeof window !== 'undefined' ? localStorage.getItem("authToken") : null);
    if (!token) {
      throw new Error("Authentication token is missing. Please log in again.");
    }

    const response = await axios.patch(`${BASE_URL}/update`, formData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    const message = error?.response?.data?.message || error.message || "Failed to update user profile";
    throw new Error(message);
  }
};

export const changePasswordAndPin = async (formData) => {
  try {
    const token = (typeof window !== 'undefined' ? localStorage.getItem("authToken") : null);
    if (!token) {
      throw new Error("Authentication token is missing. Please log in again.");
    }

    const response = await axios.patch(`${BASE_URL}/change-password-pin`, formData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    const message = error?.response?.data?.message || error.message || "Failed to update password and pin";
    throw new Error(message);
  }
};

export const getAvatar = async () => {
  try {
    const token = (typeof window !== 'undefined' ? localStorage.getItem("authToken") : null);
    if (!token) {
      throw new Error("Authentication token is missing. Please log in again.");
    }

    const response = await axios.get(`${BASE_URL}/getavatar`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    const message = error?.response?.data?.message || error.message || "Failed to fetch user avatar";
    throw new Error(message);
  }
};

export const updateAvatar = async (formData) => {
  try {
    const token = (typeof window !== 'undefined' ? localStorage.getItem("authToken") : null);
    if (!token) {
      throw new Error("Authentication token is missing. Please log in again.");
    }

    const response = await axios.patch(`${BASE_URL}/updateavatar`, formData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    const message = error?.response?.data?.message || error.message || "Failed to update user avatar";
    throw new Error(message);
  }
};

export const getStockData = async (symbol) => {
  try {
    const url = `${BASE_FINANCE_URL}/stock/${symbol}`;
    const response = await axios.get(url);

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
  } catch (error) {
    throw new Error("Failed to fetch stock data");
  }
};

// Batched equivalent of getStockData - one request for many symbols. Returns
// a symbol -> data map; symbols the backend couldn't resolve map to null.
export const getBatchStockData = async (symbols: string[]) => {
  try {
    const url = `${BASE_FINANCE_URL}/quotes`;
    const response = await axios.get(url, { params: { symbols: symbols.join(",") } });

    if (response.data.status !== 200) {
      return {};
    }

    const raw = response.data.data || {};
    const result: Record<string, any> = {};
    for (const symbol of Object.keys(raw)) {
      const stock = raw[symbol];
      if (!stock) {
        result[symbol] = null;
        continue;
      }
      result[symbol] = {
        currentPrice: stock.currentPrice || 0,
        stockPrices: stock.stockPrices || Array.from({ length: 30 }, () => stock.currentPrice || 0),
        percentageChange: stock.percentageChange,
        todayChange: stock.todayChange,
        dates: stock.dates || null,
      };
    }
    return result;
  } catch (error) {
    throw new Error("Failed to fetch batch stock data");
  }
};

export const getWallet = async () => {
  try {
    const token = (typeof window !== 'undefined' ? localStorage.getItem("authToken") : null);
    if (!token) {
      throw new Error("Authentication token is missing. Please log in again.");
    }

    const response = await axios.get(`${BASE_TRADE_URL}/wallet`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    const message = error?.response?.data?.message || error.message || "Failed to fetch wallet";
    throw new Error(message);
  }
};

export const getPortfolio = async () => {
  try {
    const token = (typeof window !== 'undefined' ? localStorage.getItem("authToken") : null);
    if (!token) {
      throw new Error("Authentication token is missing. Please log in again.");
    }

    const response = await axios.get(`${BASE_TRADE_URL}/portfolio`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    const message = error?.response?.data?.message || error.message || "Failed to fetch portfolio";
    throw new Error(message);
  }
};

export const getTransactions = async (page = 1, limit = 20) => {
  try {
    const token = (typeof window !== 'undefined' ? localStorage.getItem("authToken") : null);
    if (!token) {
      throw new Error("Authentication token is missing. Please log in again.");
    }

    const response = await axios.get(`${BASE_TRADE_URL}/transactions`, {
      params: { page, limit },
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    const message = error?.response?.data?.message || error.message || "Failed to fetch transactions";
    throw new Error(message);
  }
};

export const buyStock = async (symbol: string, quantity: number) => {
  try {
    const token = (typeof window !== 'undefined' ? localStorage.getItem("authToken") : null);
    if (!token) {
      throw new Error("Authentication token is missing. Please log in again.");
    }

    const response = await axios.post(
      `${BASE_TRADE_URL}/trade/buy`,
      { symbol, quantity },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    const message = error?.response?.data?.message || error.message || "Failed to buy stock";
    throw new Error(message);
  }
};

export const sellStock = async (symbol: string, quantity: number) => {
  try {
    const token = (typeof window !== 'undefined' ? localStorage.getItem("authToken") : null);
    if (!token) {
      throw new Error("Authentication token is missing. Please log in again.");
    }

    const response = await axios.post(
      `${BASE_TRADE_URL}/trade/sell`,
      { symbol, quantity },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    const message = error?.response?.data?.message || error.message || "Failed to sell stock";
    throw new Error(message);
  }
};

export const getLeaderboard = async (limit = 20) => {
  try {
    const token = (typeof window !== 'undefined' ? localStorage.getItem("authToken") : null);
    if (!token) {
      throw new Error("Authentication token is missing. Please log in again.");
    }

    const response = await axios.get(`${BASE_TRADE_URL}/leaderboard`, {
      params: { limit },
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    const message = error?.response?.data?.message || error.message || "Failed to fetch leaderboard";
    throw new Error(message);
  }
};

const authHeaders = () => {
  const token = (typeof window !== 'undefined' ? localStorage.getItem("authToken") : null);
  if (!token) {
    throw new Error("Authentication token is missing. Please log in again.");
  }
  return { Authorization: `Bearer ${token}` };
};

// Like authHeaders, but for endpoints that work for logged-out visitors too
// (e.g. a shared profile link) - sends the token if present, omits it otherwise.
const optionalAuthHeaders = () => {
  const token = (typeof window !== 'undefined' ? localStorage.getItem("authToken") : null);
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getContests = async () => {
  try {
    const response = await axios.get(`${BASE_TRADE_URL}/contests`, { headers: authHeaders() });
    return response.data;
  } catch (error) {
    const message = error?.response?.data?.message || error.message || "Failed to fetch contests";
    throw new Error(message);
  }
};

export const getContest = async (contestId: string) => {
  try {
    const response = await axios.get(`${BASE_TRADE_URL}/contests/${contestId}`, { headers: authHeaders() });
    return response.data;
  } catch (error) {
    const message = error?.response?.data?.message || error.message || "Failed to fetch contest";
    throw new Error(message);
  }
};

export const joinContest = async (contestId: string) => {
  try {
    const response = await axios.post(`${BASE_TRADE_URL}/contests/${contestId}/join`, {}, { headers: authHeaders() });
    return response.data;
  } catch (error) {
    const message = error?.response?.data?.message || error.message || "Failed to join contest";
    throw new Error(message);
  }
};

export const getContestStandings = async (contestId: string) => {
  try {
    const response = await axios.get(`${BASE_TRADE_URL}/contests/${contestId}/standings`, { headers: authHeaders() });
    return response.data;
  } catch (error) {
    const message = error?.response?.data?.message || error.message || "Failed to fetch standings";
    throw new Error(message);
  }
};

export const getContestPortfolio = async (contestId: string) => {
  try {
    const response = await axios.get(`${BASE_TRADE_URL}/contests/${contestId}/portfolio`, { headers: authHeaders() });
    return response.data;
  } catch (error) {
    const message = error?.response?.data?.message || error.message || "Failed to fetch contest portfolio";
    throw new Error(message);
  }
};

export const buyContestStock = async (contestId: string, symbol: string, quantity: number) => {
  try {
    const response = await axios.post(
      `${BASE_TRADE_URL}/contests/${contestId}/trade/buy`,
      { symbol, quantity },
      { headers: authHeaders() }
    );
    return response.data;
  } catch (error) {
    const message = error?.response?.data?.message || error.message || "Failed to buy stock in contest";
    throw new Error(message);
  }
};

export const sellContestStock = async (contestId: string, symbol: string, quantity: number) => {
  try {
    const response = await axios.post(
      `${BASE_TRADE_URL}/contests/${contestId}/trade/sell`,
      { symbol, quantity },
      { headers: authHeaders() }
    );
    return response.data;
  } catch (error) {
    const message = error?.response?.data?.message || error.message || "Failed to sell stock in contest";
    throw new Error(message);
  }
};

export const getAlerts = async () => {
  try {
    const response = await axios.get(`${BASE_TRADE_URL}/alerts`, { headers: authHeaders() });
    return response.data;
  } catch (error) {
    const message = error?.response?.data?.message || error.message || "Failed to fetch alerts";
    throw new Error(message);
  }
};

export const createAlert = async (symbol: string, targetPrice: number, direction: "ABOVE" | "BELOW") => {
  try {
    const response = await axios.post(
      `${BASE_TRADE_URL}/alerts`,
      { symbol, targetPrice, direction },
      { headers: authHeaders() }
    );
    return response.data;
  } catch (error) {
    const message = error?.response?.data?.message || error.message || "Failed to create alert";
    throw new Error(message);
  }
};

export const deleteAlert = async (alertId: string) => {
  try {
    const response = await axios.delete(`${BASE_TRADE_URL}/alerts/${alertId}`, { headers: authHeaders() });
    return response.data;
  } catch (error) {
    const message = error?.response?.data?.message || error.message || "Failed to delete alert";
    throw new Error(message);
  }
};

export const searchPlayers = async (query: string) => {
  try {
    const response = await axios.get(`${BASE_TRADE_URL}/social/search`, {
      params: { q: query },
      headers: optionalAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    const message = error?.response?.data?.message || error.message || "Failed to search players";
    throw new Error(message);
  }
};

export const getPublicProfile = async (username: string) => {
  try {
    const response = await axios.get(`${BASE_TRADE_URL}/users/${username}/profile`, {
      headers: optionalAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    const message = error?.response?.data?.message || error.message || "Failed to fetch profile";
    throw new Error(message);
  }
};

export const followUser = async (username: string) => {
  try {
    const response = await axios.post(`${BASE_TRADE_URL}/users/${username}/follow`, {}, { headers: authHeaders() });
    return response.data;
  } catch (error) {
    const message = error?.response?.data?.message || error.message || "Failed to follow user";
    throw new Error(message);
  }
};

export const unfollowUser = async (username: string) => {
  try {
    const response = await axios.delete(`${BASE_TRADE_URL}/users/${username}/follow`, { headers: authHeaders() });
    return response.data;
  } catch (error) {
    const message = error?.response?.data?.message || error.message || "Failed to unfollow user";
    throw new Error(message);
  }
};

export const getFollowers = async (username: string) => {
  try {
    const response = await axios.get(`${BASE_TRADE_URL}/users/${username}/followers`, { headers: authHeaders() });
    return response.data;
  } catch (error) {
    const message = error?.response?.data?.message || error.message || "Failed to fetch followers";
    throw new Error(message);
  }
};

export const getFollowing = async (username: string) => {
  try {
    const response = await axios.get(`${BASE_TRADE_URL}/users/${username}/following`, { headers: authHeaders() });
    return response.data;
  } catch (error) {
    const message = error?.response?.data?.message || error.message || "Failed to fetch following";
    throw new Error(message);
  }
};

export const getActivityFeed = async (page = 1, limit = 20) => {
  try {
    const response = await axios.get(`${BASE_TRADE_URL}/social/activity`, {
      params: { page, limit },
      headers: authHeaders(),
    });
    return response.data;
  } catch (error) {
    const message = error?.response?.data?.message || error.message || "Failed to fetch activity feed";
    throw new Error(message);
  }
};

export const getNotifications = async () => {
  try {
    const response = await axios.get(`${BASE_TRADE_URL}/notifications`, { headers: authHeaders() });
    return response.data;
  } catch (error) {
    const message = error?.response?.data?.message || error.message || "Failed to fetch notifications";
    throw new Error(message);
  }
};

export const markNotificationsRead = async () => {
  try {
    const response = await axios.post(`${BASE_TRADE_URL}/notifications/read-all`, {}, { headers: authHeaders() });
    return response.data;
  } catch (error) {
    const message = error?.response?.data?.message || error.message || "Failed to mark notifications read";
    throw new Error(message);
  }
};

export const getNews = async () => {
  try {
    const response = await axios.get(`${BASE_TRADE_URL}/news`, { headers: authHeaders() });
    return response.data;
  } catch (error) {
    const message = error?.response?.data?.message || error.message || "Failed to fetch news";
    throw new Error(message);
  }
};

export const getFriendsLeaderboard = async (limit = 20) => {
  try {
    const response = await axios.get(`${BASE_TRADE_URL}/leaderboard/friends`, {
      params: { limit },
      headers: authHeaders(),
    });
    return response.data;
  } catch (error) {
    const message = error?.response?.data?.message || error.message || "Failed to fetch friends leaderboard";
    throw new Error(message);
  }
};
