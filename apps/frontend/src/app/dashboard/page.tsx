import type { Metadata } from "next";
import Dashboard from "@/components/dashboard/Dashboard";
import NoHeaderFooterLayout from "@/components/layout/NoHeaderFooterLayout";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your net worth, holdings and today's market movers.",
  robots: { index: false },
};

export default function Page() {
  return (
    <NoHeaderFooterLayout>
      <Dashboard />
    </NoHeaderFooterLayout>
  );
}
