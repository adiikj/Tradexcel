"use client";
import Leaderboard from "@/components/leaderboard/Leaderboard";
import NoHeaderFooterLayout from "@/components/layout/NoHeaderFooterLayout";
import AuthRoute from "@/components/routes/AuthRoute";

export default function Page() {
  return (
    <AuthRoute>
      <NoHeaderFooterLayout>
        <Leaderboard />
      </NoHeaderFooterLayout>
    </AuthRoute>
  );
}
