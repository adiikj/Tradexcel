import type { Metadata } from "next";
import Leaderboard from "@/components/leaderboard/Leaderboard";
import NoHeaderFooterLayout from "@/components/layout/NoHeaderFooterLayout";

export const metadata: Metadata = {
  title: "Leaderboard",
  description: "See how your portfolio ranks against other players.",
  robots: { index: false },
};

export default function Page() {
  return (
    <NoHeaderFooterLayout>
      <Leaderboard />
    </NoHeaderFooterLayout>
  );
}
