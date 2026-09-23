import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, SESSION_COOKIE } from "./utils/sessionFlag";

// Redirects on the session hint before any HTML is sent, so protected pages
// never flash for logged-out visitors and logged-in users skip the landing and
// auth pages. Not a security boundary - the API authorizes every request.
const PROTECTED = [
  "/dashboard",
  "/portfolio",
  "/market",
  "/wallet",
  "/leaderboard",
  "/contest",
  "/alerts",
  "/achievements",
  "/activity",
  "/news",
  "/support",
  "/faq",
  "/your-profile",
];
const GUEST_ONLY = ["/", "/signin", "/signup"];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Admin panel: separate session hint (see api/adminApi.ts).
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const isAdmin = request.cookies.get(ADMIN_SESSION_COOKIE)?.value === "1";
    if (pathname === "/admin/login") {
      return isAdmin ? NextResponse.redirect(new URL("/admin/contests", request.url)) : NextResponse.next();
    }
    return isAdmin ? NextResponse.next() : NextResponse.redirect(new URL("/admin/login", request.url));
  }

  const loggedIn = request.cookies.get(SESSION_COOKIE)?.value === "1";

  if (!loggedIn && PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    const url = new URL("/signin", request.url);
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }

  if (loggedIn && GUEST_ONLY.includes(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/signin",
    "/signup",
    "/dashboard/:path*",
    "/portfolio/:path*",
    "/market/:path*",
    "/wallet/:path*",
    "/leaderboard/:path*",
    "/contest/:path*",
    "/alerts/:path*",
    "/achievements/:path*",
    "/activity/:path*",
    "/news/:path*",
    "/support/:path*",
    "/faq/:path*",
    "/your-profile/:path*",
    "/admin/:path*",
  ],
};
