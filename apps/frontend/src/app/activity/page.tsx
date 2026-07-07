"use client";
import ActivityFeed from "@/components/social/ActivityFeed";
import NoHeaderFooterLayout from "@/components/layout/NoHeaderFooterLayout";
import AuthRoute from "@/components/routes/AuthRoute";

export default function Page() {
  return (
    <AuthRoute>
      <NoHeaderFooterLayout>
        <ActivityFeed />
      </NoHeaderFooterLayout>
    </AuthRoute>
  );
}
