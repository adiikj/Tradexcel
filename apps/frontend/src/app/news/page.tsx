"use client";
import News from "@/components/news/News";
import NoHeaderFooterLayout from "@/components/layout/NoHeaderFooterLayout";
import AuthRoute from "@/components/routes/AuthRoute";

export default function Page() {
  return (
    <AuthRoute>
      <NoHeaderFooterLayout>
        <News />
      </NoHeaderFooterLayout>
    </AuthRoute>
  );
}
