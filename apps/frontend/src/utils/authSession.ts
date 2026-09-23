import { login } from "../redux/authSlice";
import { followUser } from "../api/api";
import { markSession } from "./sessionFlag";
import type { AppDispatch } from "../redux/store";

export { clearSession, hasSession } from "./sessionFlag";

// Shared by SignIn, OTP verification, and Google login. The backend has
// already set the httpOnly auth cookies; this only records client-side state.
export function persistSession(dispatch: AppDispatch) {
  markSession();
  dispatch(login());

  if (typeof window !== "undefined") {
    const pendingFollow = localStorage.getItem("pendingFollow");
    if (pendingFollow) {
      localStorage.removeItem("pendingFollow");
      followUser(pendingFollow).catch(() => {});
    }
  }
}

// Where to go after logging in: the page the proxy bounced the user from
// (?next=...), restricted to same-app paths so it can't be an open redirect.
export function postLoginPath(): string {
  if (typeof window === "undefined") return "/dashboard";
  const next = new URLSearchParams(window.location.search).get("next");
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\")
    ? next
    : "/dashboard";
}
