import type { MetadataRoute } from "next";
import { SITE_URL } from "@tradexcel/shared";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || SITE_URL;

// Public marketing pages are crawlable; the signed-in app is not.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/portfolio", "/wallet", "/market", "/contest", "/leaderboard", "/activity", "/news", "/alerts", "/achievements", "/your-profile", "/faq", "/support", "/admin"],
    },
    sitemap: `${SITE}/sitemap.xml`,
  };
}
