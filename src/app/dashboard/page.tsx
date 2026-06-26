"use client";
import Dashboard from "@/components/dashboard/Dashboard";
import NoHeaderFooterLayout from "@/components/layout/NoHeaderFooterLayout";
import AuthRoute from "@/components/routes/AuthRoute";

export default function Page() {
  return (
    <AuthRoute>
      <NoHeaderFooterLayout>
        <Dashboard />
      </NoHeaderFooterLayout>
    </AuthRoute>
  );
}
