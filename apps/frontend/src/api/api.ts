import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL; // Import the base URL from the environment variables
console.log(process.env.NEXT_PUBLIC_API_BASE_URL);
console.log("Backend URL:", BASE_URL); // Log to verify the URL is correct

const BASE_FINANCE_URL = process.env.NEXT_PUBLIC_API_FINANCE_URL; // Import the finance API URL
console.log(process.env.NEXT_PUBLIC_API_FINANCE_URL);
console.log("Finance API URL:", BASE_FINANCE_URL); // Log the finance API URL

const BASE_TRADE_URL = process.env.NEXT_PUBLIC_API_TRADE_URL; // Wallet/portfolio/transactions/trade API root

// Function to log in the user with either a password or a 4-digit PIN
export const loginUser = async (emailOrUsername: string, credential: string, mode: "password" | "pin") => {
  try {
    const response = await axios.post(
      `${BASE_URL}/login`,
      { emailOrUsername, [mode]: credential },
      {
        withCredentials: true, // Ensure cookies are sent/received for authentication
      }
    );

    return response.data; // Return server response data
  } catch (error) {
    // Log detailed error info for debugging
    console.error("Login API Error:", error.response || error.message);

    // Extract error message from server or fallback to a default message
    const message =
      error?.response?.data?.message ||
      error.message ||
      "An unexpected error occurred while logging in";

    throw new Error(message); // Re-throw error with user-friendly message
  }
};

// Function to register a user — creates the account directly and emails a
// one-time verification code (see verifyOTP).
export const registerUser = async ({ name, username, email, password, pin }) => {
  try {
    const response = await axios.post(`${BASE_URL}/register`, {
      name,
      username,
      email,
      password,
      pin,
    });
    return response.data; // Return success message for OTP sent
  } catch (error) {
    const message = error?.response?.data?.message || error.message || "Error registering user.";
    throw new Error(message); // More consistent error message handling
  }
};

// Verifies the one-time signup code. On success the backend also creates the
// wallet and logs the user in, returning accessToken/refreshToken directly.
export const verifyOTP = async (email: string, otp: string) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/verify-otp`,
      { email, otp },
      {
        withCredentials: true,
      }
    );

    return response.data;
  } catch (error) {
    const message =
      error?.response?.data?.message || error.message || "Error verifying OTP";
    console.error("OTP Verification failed:", message);
    throw new Error(message);
  }
};

// Google Sign-In — idToken comes from the Google Identity Services button on
// the client. Returning users log straight in; brand-new accounts get the
// same one-time OTP-email step as password signups (response.data is null
// and the caller should route to the OTP screen).
export const googleLogin = async (idToken: string) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/google`,
      { idToken },
      {
        withCredentials: true,
      }
    );

    return response.data;
  } catch (error) {
    const message = error?.response?.data?.message || error.message || "Error signing in with Google";
    throw new Error(message);
  }
};

// Function to log out the user
export const logoutUser = async (token) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/logout`,
      {}, // Empty body
      {
        headers: { Authorization: `Bearer ${token}` }, // Pass token as Bearer
        withCredentials: true, // Ensure cookies are included
      }
    );
    return response.data; // Return success message
  } catch (error) {
    const message = error?.response?.data?.message || error.message || "Error logging out";
    throw new Error(message); // More consistent error message handling
  }
};

// Function to get the logged-in user's profile
export const getUserName = async () => {
  try {
    const token = (typeof window !== 'undefined' ? localStorage.getItem("authToken") : null);

    if (!token) {
      throw new Error("Authentication token is missing. Please log in again.");
    }

    const response = await axios.get(`${BASE_URL}/name`, {
      withCredentials: true, // Send cookies if the backend uses them
      headers: {
        Authorization: `Bearer ${token}`, // Include the token in the request
      },
    });

    return response.data; // Successfully fetched profile data
  } catch (error) {
    console.error("Error fetching user name:", error); // Log detailed error for debugging
    const message =
      error?.response?.data?.message || error.message || "Failed to fetch user name";
    throw new Error(message); // Throw a user-friendly error message
  }
};

export const getUserProfile = async () => {
  try {
    const token = (typeof window !== 'undefined' ? localStorage.getItem("authToken") : null);

    if (!token) {
      throw new Error("Authentication token is missing. Please log in again.");
    }

    const response = await axios.get(`${BASE_URL}/profile`, {
      withCredentials: true, // Send cookies if the backend uses them
      headers: {
        Authorization: `Bearer ${token}`, // Include the token in the request
      },
    });

    return response.data; // Successfully fetched profile data
  } catch (error) {
    console.error("Error fetching user profile:", error); // Log detailed error for debugging
    const message =
      error?.response?.data?.message || error.message || "Failed to fetch user profile";
    throw new Error(message); // Throw a user-friendly error message
  }
}

export const updateUserProfile = async (formData) => {
  try {
    const token = (typeof window !== 'undefined' ? localStorage.getItem("authToken") : null);

    if (!token) {
      throw new Error("Authentication token is missing. Please log in again.");
    }

    const response = await axios.patch(`${BASE_URL}/update`, formData, {
      headers: {
        Authorization: `Bearer ${token}`, // Include the token in the request
      },
    });

    return response.data; // Successfully updated the profile
  } catch (error) {
    console.error("Error updating user profile:", error); // Log detailed error for debugging
    const message =
      error?.response?.data?.message || error.message || "Failed to update user profile";
    throw new Error(message); // Throw a user-friendly error message
  }
};

export const changePasswordAndPin = async (formData) => {
  try {
    const token = (typeof window !== 'undefined' ? localStorage.getItem("authToken") : null);

    if (!token) {
      throw new Error("Authentication token is missing. Please log in again.");
    }

    const response = await axios.patch(`${BASE_URL}/change-password-pin`, formData, {
      headers: {
        Authorization: `Bearer ${token}`, // Include the token in the request
      },
    });

    return response.data; // Successfully updated the password and pin
  } catch (error) {
    console.error("Error updating password and pin:", error); // Log detailed error for debugging
    const message =
      error?.response?.data?.message || error.message || "Failed to update password and pin";
    throw new Error(message); // Throw a user-friendly error message
  }
};

export const getAvatar = async () => {
  try {
    const token = (typeof window !== 'undefined' ? localStorage.getItem("authToken") : null);

    if (!token) {
      throw new Error("Authentication token is missing. Please log in again.");
    }

    const response = await axios.get(`${BASE_URL}/getavatar`, {
      headers: {
        Authorization: `Bearer ${token}`, // Include the token in the request
      },
    });

    return response.data; // Successfully fetched the avatar
  } catch (error) {
    console.error("Error fetching user avatar:", error); // Log detailed error for debugging
    const message =
      error?.response?.data?.message || error.message || "Failed to fetch user avatar";
    throw new Error(message); // Throw a user-friendly error message
  }
};

export const updateAvatar = async (formData) => {
  try {
    const token = (typeof window !== 'undefined' ? localStorage.getItem("authToken") : null);

    if (!token) {
      throw new Error("Authentication token is missing. Please log in again.");
    }

    // Sending formData directly without manually setting Content-Type
    const response = await axios.patch(`${BASE_URL}/updateavatar`, formData, {
      headers: {
        Authorization: `Bearer ${token}`, // Include the token in the request
        // No need to manually set Content-Type when sending formData
      },
    });

    return response.data; // Successfully updated the avatar
  } catch (error) {
    console.error("Error updating user avatar:", error); // Log detailed error for debugging
    const message =
      error?.response?.data?.message || error.message || "Failed to update user avatar";
    throw new Error(message); // Throw a user-friendly error message
  }
};

// Fetch stock data from the backend for a specific symbol
export const getStockData = async (symbol) => {
  try {
    // Construct the API URL for the stock symbol
    const url = `${BASE_FINANCE_URL}/stock/${symbol}`;

    // Make the request to the backend
    const response = await axios.get(url);

    // Handle unsuccessful response
    if (response.data.status !== 200) {
      console.error(`Error fetching stock data: ${response.data.message}`);
      return null;
    }

    const { currentPrice, stockPrices, percentageChange, todayChange } = response.data.data;


    return {
      currentPrice: currentPrice || 0,
      stockPrices: stockPrices || Array.from({ length: 30 }, () => currentPrice || 0),
      percentageChange: percentageChange, // Convert to number if not already
      todayChange: todayChange,           // Convert to number if not already
    };
  } catch (error) {
    console.error("Error fetching stock data:", error);
    throw new Error("Failed to fetch stock data");
  }
};

// Wallet / portfolio / transactions — the real trading-engine read endpoints.

export const getWallet = async () => {
  try {
    const token = (typeof window !== 'undefined' ? localStorage.getItem("authToken") : null);

    if (!token) {
      throw new Error("Authentication token is missing. Please log in again.");
    }

    const response = await axios.get(`${BASE_TRADE_URL}/wallet`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
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
      headers: {
        Authorization: `Bearer ${token}`,
      },
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
      headers: {
        Authorization: `Bearer ${token}`,
      },
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




