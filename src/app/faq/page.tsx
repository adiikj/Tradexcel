"use client";
import Faq from "@/components/faq/Faq";
import NoHeaderFooterLayout from "@/components/layout/NoHeaderFooterLayout";
import AuthRoute from "@/components/routes/AuthRoute";

export default function Page() {
  return (
    <AuthRoute>
      <NoHeaderFooterLayout>
        <Faq />
      </NoHeaderFooterLayout>
    </AuthRoute>
  );
}
