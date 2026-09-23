import type { Metadata } from "next";
import Support from "@/components/support/Support";
import NoHeaderFooterLayout from "@/components/layout/NoHeaderFooterLayout";

export const metadata: Metadata = {
  title: "Support",
  description: "Get help with your Tradexcel account.",
  robots: { index: false },
};

export default function Page() {
  return (
    <NoHeaderFooterLayout>
      <Support />
    </NoHeaderFooterLayout>
  );
}
