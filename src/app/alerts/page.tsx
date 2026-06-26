"use client";
import Alerts from "@/components/alerts/Alerts";
import NoHeaderFooterLayout from "@/components/layout/NoHeaderFooterLayout";
import AuthRoute from "@/components/routes/AuthRoute";

export default function Page() {
  return (
    <AuthRoute>
      <NoHeaderFooterLayout>
        <Alerts darkMode={false as any} />
      </NoHeaderFooterLayout>
    </AuthRoute>
  );
}
