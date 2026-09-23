// The auth tokens are httpOnly cookies on the API's host that this app can't
// read, so the UI keeps this non-secret "logged in" hint. It is a cookie on the
// frontend's own origin so src/proxy.ts can redirect before a page renders.
// The backend stays the source of truth: a 401 that can't be refreshed clears
// it (see api/http.ts).
export const SESSION_COOKIE = "tx_session";

// Matches the refresh token's lifetime; an outlived hint is cleared on the
// first failed refresh anyway.
const MAX_AGE_SECONDS = 10 * 24 * 60 * 60;

export function markSession() {
  if (typeof document === "undefined") return;
  document.cookie = `${SESSION_COOKIE}=1; path=/; max-age=${MAX_AGE_SECONDS}; samesite=lax`;
}

export function clearSession() {
  if (typeof document === "undefined") return;
  document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0; samesite=lax`;
  try {
    // Left behind by older builds - no longer used.
    localStorage.removeItem("authToken");
    localStorage.removeItem("isLoggedIn");
  } catch {}
}

export function hasSession(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.split("; ").some((c) => c === `${SESSION_COOKIE}=1`);
}

// Same idea for the admin panel: a non-secret hint beside the httpOnly admin
// cookie, living exactly as long as the admin token.
export const ADMIN_SESSION_COOKIE = "tx_admin";

export function markAdminSession(expiresAt: number) {
  if (typeof document === "undefined") return;
  const maxAge = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
  document.cookie = `${ADMIN_SESSION_COOKIE}=1; path=/; max-age=${maxAge}; samesite=lax`;
}

export function clearAdminSession() {
  if (typeof document === "undefined") return;
  document.cookie = `${ADMIN_SESSION_COOKIE}=; path=/; max-age=0; samesite=lax`;
  try {
    // Left behind by older builds - no longer used.
    localStorage.removeItem("adminToken");
  } catch {}
}
