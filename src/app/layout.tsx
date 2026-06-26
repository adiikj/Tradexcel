import type { Metadata } from "next";
import "../index.css";
import Providers from "./Providers";
import React from "react";

export const metadata: Metadata = {
  title: "TradeXcel",
  description: "TradeXcel Application",
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
