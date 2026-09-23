import type { Metadata } from "next";
import ActivityFeed from "@/components/social/ActivityFeed";
import NoHeaderFooterLayout from "@/components/layout/NoHeaderFooterLayout";

export const metadata: Metadata = {
  title: "Activity",
  description: "Trades and milestones from players you follow.",
  robots: { index: false },
};

export default function Page() {
  return (
    <NoHeaderFooterLayout>
      <ActivityFeed />
    </NoHeaderFooterLayout>
  );
}
