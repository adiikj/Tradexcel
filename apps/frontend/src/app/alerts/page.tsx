import type { Metadata } from "next";
import PriceAlerts from "@/components/alerts/PriceAlerts";
import NoHeaderFooterLayout from "@/components/layout/NoHeaderFooterLayout";

export const metadata: Metadata = {
  title: "Price alerts",
  description: "Get notified when a stock hits your target price.",
  robots: { index: false },
};

export default function Page() {
  return (
    <NoHeaderFooterLayout>
      <PriceAlerts />
    </NoHeaderFooterLayout>
  );
}
