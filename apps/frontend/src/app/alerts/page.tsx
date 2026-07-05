"use client";
import PriceAlerts from "@/components/alerts/PriceAlerts";
import NoHeaderFooterLayout from "@/components/layout/NoHeaderFooterLayout";
import AuthRoute from "@/components/routes/AuthRoute";

export default function Page() {
  return (
    <AuthRoute>
      <NoHeaderFooterLayout>
        <PriceAlerts />
      </NoHeaderFooterLayout>
    </AuthRoute>
  );
}
