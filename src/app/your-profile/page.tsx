"use client";
import YourProfile from "@/components/dashboard/YourProfile";
import NoHeaderFooterLayout from "@/components/layout/NoHeaderFooterLayout";
import AuthRoute from "@/components/routes/AuthRoute";

export default function Page() {
  return (
    <AuthRoute>
      <NoHeaderFooterLayout>
        <YourProfile />
      </NoHeaderFooterLayout>
    </AuthRoute>
  );
}
