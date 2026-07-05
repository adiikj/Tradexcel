import Cookies from "js-cookie";
import { login } from "../redux/authSlice";

// Shared by SignIn, OTP verification, and Google login — all three end up
// with the same access token and need to persist it the same way.
export function persistSession(dispatch: any, accessToken: string) {
  Cookies.set("accessToken", accessToken, { secure: true, sameSite: "lax" });
  if (typeof window !== "undefined") {
    localStorage.setItem("authToken", accessToken);
  }
  dispatch(login(accessToken));
}
