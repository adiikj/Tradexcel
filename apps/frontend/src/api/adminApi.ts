import axios from "axios";
import { apiErrorMessage } from "./http";
import { clearAdminSession } from "../utils/sessionFlag";

// Separate from api.ts so admin and user sessions never mix: the admin JWT is
// an httpOnly cookie scoped to /api/v1/admin, and this instance has no
// user-token refresh logic - an admin 401 just ends the admin session.
const BASE_URL = process.env.NEXT_PUBLIC_API_TRADE_URL;
const adminHttp = axios.create({ withCredentials: true });

adminHttp.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      clearAdminSession();
      // Expired mid-session: back to the admin login (full reload resets the panel).
      if (typeof window !== "undefined" && window.location.pathname.startsWith("/admin/contests")) {
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.assign("/admin/login");
      }
    }
    return Promise.reject(error);
  }
);

export const adminLogin = async (password: string) => {
  try {
    const response = await adminHttp.post<{ data: { expiresAt: number } }>(`${BASE_URL}/admin/login`, { password });
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "We couldn't sign you in. Please try again."));
  }
};

export const adminLogout = async () => {
  try {
    await adminHttp.post(`${BASE_URL}/admin/logout`);
  } finally {
    clearAdminSession();
  }
};

export const adminGetContests = async () => {
  try {
    const response = await adminHttp.get(`${BASE_URL}/admin/contests`);
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "We couldn't load contests. Please try again."));
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
    const response = await adminHttp.post(`${BASE_URL}/admin/contests`, payload);
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "We couldn't create the contest. Please try again."));
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
    const response = await adminHttp.patch(`${BASE_URL}/admin/contests/${contestId}`, payload);
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "We couldn't update the contest. Please try again."));
  }
};

// Separate endpoint since a file upload needs multipart/form-data, not JSON.
export const adminUploadContestImage = async (contestId: string, file: File) => {
  try {
    const formData = new FormData();
    formData.append("image", file);
    const response = await adminHttp.post(`${BASE_URL}/admin/contests/${contestId}/image`, formData);
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "We couldn't upload that image. Please try again."));
  }
};
