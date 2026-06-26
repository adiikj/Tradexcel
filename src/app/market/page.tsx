"use client";
import Market from "@/components/market/Market";
import NoHeaderFooterLayout from "@/components/layout/NoHeaderFooterLayout";
import AuthRoute from "@/components/routes/AuthRoute";

export default function Page() {
  return (
    <AuthRoute>
      <NoHeaderFooterLayout>
        <Market />
      </NoHeaderFooterLayout>
    </AuthRoute>
  );
}
