import axios from "axios";

// Kept separate from api.ts deliberately — this is a personal/internal tool,
// not part of the regular user-facing app. It uses its own token storage key
// (adminToken) so an admin session never mixes with a regular user session
// in the same browser.
const BASE_URL = process.env.NEXT_PUBLIC_API_TRADE_URL;

const adminAuthHeaders = () => {
  const token = typeof window !== "undefined" ? localStorage.getItem("adminToken") : null;
  if (!token) {
    throw new Error("Admin session missing. Please log in again.");
  }
  return { Authorization: `Bearer ${token}` };
};

export const adminLogin = async (password: string) => {
  try {
    const response = await axios.post(`${BASE_URL}/admin/login`, { password });
    return response.data;
  } catch (error: any) {
    const message = error?.response?.data?.message || error.message || "Failed to log in";
    throw new Error(message);
  }
};

export const adminGetContests = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/admin/contests`, { headers: adminAuthHeaders() });
    return response.data;
  } catch (error: any) {
    const message = error?.response?.data?.message || error.message || "Failed to fetch contests";
    throw new Error(message);
  }
};

export const adminCreateContest = async (payload: {
  name: string;
  startAt: string;
  endAt: string;
  startingBalance?: number;
  prize?: string;
}) => {
  try {
    const response = await axios.post(`${BASE_URL}/admin/contests`, payload, { headers: adminAuthHeaders() });
    return response.data;
  } catch (error: any) {
    const message = error?.response?.data?.message || error.message || "Failed to create contest";
    throw new Error(message);
  }
};
