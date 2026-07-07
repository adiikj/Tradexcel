import Cookies from "js-cookie";
import { login } from "../redux/authSlice";
import { followUser } from "../api/api";

// Shared by SignIn, OTP verification, and Google login.
export function persistSession(dispatch: any, accessToken: string) {
  Cookies.set("accessToken", accessToken, { secure: true, sameSite: "lax" });
  if (typeof window !== "undefined") {
    localStorage.setItem("authToken", accessToken);
  }
  dispatch(login(accessToken));

  if (typeof window !== "undefined") {
    const pendingFollow = localStorage.getItem("pendingFollow");
    if (pendingFollow) {
      localStorage.removeItem("pendingFollow");
      followUser(pendingFollow).catch(() => {});
    }
  }
}
