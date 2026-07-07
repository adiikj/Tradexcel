"use client";
import Support from "@/components/support/Support";
import NoHeaderFooterLayout from "@/components/layout/NoHeaderFooterLayout";
import AuthRoute from "@/components/routes/AuthRoute";

export default function Page() {
  return (
    <AuthRoute>
      <NoHeaderFooterLayout>
        <Support />
      </NoHeaderFooterLayout>
    </AuthRoute>
  );
}
