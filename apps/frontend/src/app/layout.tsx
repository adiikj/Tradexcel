import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "../index.css";
import Providers from "./Providers";
import React from "react";

const description =
  "Tradexcel is a gamified stock-trading simulator. Trade real-time stock prices with virtual money, build your portfolio, and climb the leaderboard.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://tradexcel.app"),
  title: { default: "Tradexcel", template: "%s · Tradexcel" },
  description,
  openGraph: { siteName: "Tradexcel", type: "website", description },
  twitter: { card: "summary_large_image" },
};

// Applies the saved theme (dark by default) before the page paints.
const themeScript = `try{var d=localStorage.getItem("darkMode");document.documentElement.setAttribute("data-theme",d===null||d==="true"?"dark":"light")}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // data-theme is set by the script below before first paint (it must match
    // context/ThemeContext.tsx), so React is told not to fight over it.
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      {/* Browser extensions (e.g. ColorZilla) add attributes to <body> before hydration. */}
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
