import { Suspense } from "react";
import type { Metadata } from "next";
import Portfolio from "@/components/portfolio/Portfolio";
import NoHeaderFooterLayout from "@/components/layout/NoHeaderFooterLayout";

export const metadata: Metadata = {
  title: "Portfolio",
  description: "Your holdings, P&L and performance over time.",
  robots: { index: false },
};

export default function Page() {
  return (
    <NoHeaderFooterLayout>
      <Suspense>
        <Portfolio />
      </Suspense>
    </NoHeaderFooterLayout>
  );
}
