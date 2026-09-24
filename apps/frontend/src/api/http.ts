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

// Wording that only makes sense to developers never reaches the screen.
const TECHNICAL = /status code \d{3}|\b(error|status) [45]\d\d\b|network error|internal server error|^timeout of|econn|jwt|token|cannot read|undefined|null/i;

export const MESSAGES = {
  offline: "We can't reach Tradexcel right now. Check your connection and try again.",
  timeout: "That took too long. Please try again.",
  signIn: "Please sign in again to continue.",
  forbidden: "You don't have access to that.",
  tooMany: "You're doing that too often. Please wait a moment and try again.",
  server: "Something went wrong on our side. Please try again in a moment.",
} as const;

function statusMessage(status: number, fallback: string): string {
  if (status === 401) return MESSAGES.signIn;
  if (status === 403) return MESSAGES.forbidden;
  if (status === 429) return MESSAGES.tooMany;
  if (status >= 500) return MESSAGES.server;
  return fallback;
}

// A plain-language message for a failed request: the backend's own `message`
// (written for users), else one chosen by what went wrong, else `fallback`.
// Status codes, library text ("Network Error") and code crashes never show.
export function apiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const message = (error.response?.data as { message?: unknown } | undefined)?.message;
    if (typeof message === "string" && message.trim() && !TECHNICAL.test(message)) return message;
    if (!error.response) return error.code === "ECONNABORTED" ? MESSAGES.timeout : MESSAGES.offline;
    return statusMessage(error.response.status, fallback);
  }
  // api.ts rethrows as plain Errors carrying the message above. Anything else
  // (TypeError, SyntaxError, ...) is a bug, not something to show users.
  if (error instanceof Error && error.name === "Error" && error.message.trim() && !TECHNICAL.test(error.message)) return error.message;
  return fallback;
}
