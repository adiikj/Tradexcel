import Home from "@/components/landingPage/Home";
import MainLayout from "@/components/layout/HeaderFooterLayout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "Tradexcel · Learn to trade the stock market with virtual money" },
  description:
    "Trade 250+ real NSE stocks at live prices with ₹1,00,000 of virtual cash. Compete in weekly seasons, contests and private leagues, with zero real-money risk.",
  alternates: { canonical: "/" },
};

// Logged-in visitors are redirected to /dashboard by src/proxy.ts.
export default function Page() {
  return (
    <MainLayout>
      <Home />
    </MainLayout>
  );
}
