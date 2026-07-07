import axios from "axios";

// Separate from api.ts: uses its own adminToken so admin/user sessions never mix.
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
  symbols: string[];
  prize?: string;
  historicalStartDate?: string;
}) => {
  try {
    const response = await axios.post(`${BASE_URL}/admin/contests`, payload, { headers: adminAuthHeaders() });
    return response.data;
  } catch (error: any) {
    const message = error?.response?.data?.message || error.message || "Failed to create contest";
    throw new Error(message);
  }
};

// historicalStartDate is absent: a replay contest's schedule is fixed at creation.
export const adminUpdateContest = async (
  contestId: string,
  payload: {
    name: string;
    startAt: string;
    endAt: string;
    startingBalance?: number;
    symbols: string[];
    prize?: string;
  }
) => {
  try {
    const response = await axios.patch(`${BASE_URL}/admin/contests/${contestId}`, payload, {
      headers: adminAuthHeaders(),
    });
    return response.data;
  } catch (error: any) {
    const message = error?.response?.data?.message || error.message || "Failed to update contest";
    throw new Error(message);
  }
};

// Separate endpoint since a file upload needs multipart/form-data, not JSON.
export const adminUploadContestImage = async (contestId: string, file: File) => {
  try {
    const formData = new FormData();
    formData.append("image", file);
    const response = await axios.post(`${BASE_URL}/admin/contests/${contestId}/image`, formData, {
      headers: adminAuthHeaders(),
    });
    return response.data;
  } catch (error: any) {
    const message = error?.response?.data?.message || error.message || "Failed to upload contest image";
    throw new Error(message);
  }
};
