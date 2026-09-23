import { Suspense } from "react";
import type { Metadata } from "next";
import Market from "@/components/market/Market";
import NoHeaderFooterLayout from "@/components/layout/NoHeaderFooterLayout";

export const metadata: Metadata = {
  title: "Market",
  description: "Browse live NSE stock prices and place trades.",
  robots: { index: false },
};

export default function Page() {
  return (
    <NoHeaderFooterLayout>
      <Suspense>
        <Market />
      </Suspense>
    </NoHeaderFooterLayout>
  );
}
