"use client";
import Achievements from "@/components/achievements/Achievements";
import NoHeaderFooterLayout from "@/components/layout/NoHeaderFooterLayout";
import AuthRoute from "@/components/routes/AuthRoute";

export default function Page() {
  return (
    <AuthRoute>
      <NoHeaderFooterLayout>
        <Achievements />
      </NoHeaderFooterLayout>
    </AuthRoute>
  );
}
