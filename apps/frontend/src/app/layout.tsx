import type { Metadata } from "next";
import "../index.css";
import Providers from "./Providers";
import React from "react";

export const metadata: Metadata = {
  title: "Tradexcel",
  description:
    "Tradexcel is a gamified stock-trading simulator. Trade real-time stock prices with virtual money, build your portfolio, and climb the leaderboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
