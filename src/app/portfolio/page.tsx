"use client";
import Portfolio from "@/components/portfolio/Portfolio";
import NoHeaderFooterLayout from "@/components/layout/NoHeaderFooterLayout";
import AuthRoute from "@/components/routes/AuthRoute";

export default function Page() {
  return (
    <AuthRoute>
      <NoHeaderFooterLayout>
        <Portfolio />
      </NoHeaderFooterLayout>
    </AuthRoute>
  );
}
