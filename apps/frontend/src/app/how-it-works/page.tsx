import type { Metadata } from "next";
import HowItWorks from "@/components/howItWorks/HowItWorks";
import MainLayout from "@/components/layout/HeaderFooterLayout";

export const metadata: Metadata = {
  title: "How it works",
  description: "Start with ₹1,00,000 in virtual cash, trade live NSE prices, and climb the leaderboard.",
};

export default function Page() {
  return (
    <MainLayout>
      <HowItWorks />
    </MainLayout>
  );
}
