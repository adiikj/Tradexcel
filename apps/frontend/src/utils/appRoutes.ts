// Signed-in app pages. The proxy redirects logged-out visitors away from these,
// and the chat assistant only shows on them - one list so the two can't drift.
export const APP_PATHS = [
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

export function isAppPath(pathname: string): boolean {
  return APP_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
