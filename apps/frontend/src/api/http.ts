import axios from "axios";
import { clearSession, hasSession } from "../utils/sessionFlag";

// Auth lives in httpOnly cookies set by the backend (never readable here), so
// every request just needs withCredentials. When the access token expires the
// backend answers 401; we then refresh once via the refresh-token cookie and
// replay the original request.
const http = axios.create({ withCredentials: true });

const REFRESH_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/refresh-token`;
const NO_REFRESH = ["/login", "/register", "/google", "/verify-otp", "/refresh-token", "/logout"];

// Shared so a burst of parallel 401s triggers a single refresh call.
let refreshing: Promise<void> | null = null;

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const url: string = original?.url || "";
    if (
      error.response?.status !== 401 ||
      original?._retried ||
      NO_REFRESH.some((path) => url.endsWith(path))
    ) {
      return Promise.reject(error);
    }

    original._retried = true;
    try {
      refreshing ??= axios
        .post(REFRESH_URL, undefined, { withCredentials: true })
        .then(() => undefined)
        .finally(() => {
          refreshing = null;
        });
      await refreshing;
    } catch {
      // Refresh token missing/expired: the session is over.
      const wasLoggedIn = hasSession();
      clearSession();
      if (wasLoggedIn && typeof window !== "undefined" && window.location.pathname !== "/signin") {
        // Full reload on purpose: runs outside React (no router) and resets app state.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.assign("/signin");
      }
      return Promise.reject(error);
    }
    return http(original);
  }
);

export default http;

// The backend's `{ message }` for a failed request, else the error's own
// message, else `fallback`.
export function apiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const message = (error.response?.data as { message?: unknown } | undefined)?.message;
    if (typeof message === "string" && message) return message;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
