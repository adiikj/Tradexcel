"use client";
import Contest from "@/components/contest/Contest";
import NoHeaderFooterLayout from "@/components/layout/NoHeaderFooterLayout";
import AuthRoute from "@/components/routes/AuthRoute";

export default function Page() {
  return (
    <AuthRoute>
      <NoHeaderFooterLayout>
        <Contest />
      </NoHeaderFooterLayout>
    </AuthRoute>
  );
}
