"use client";
import AdminContests from "@/components/admin/AdminContests";
import AdminRoute from "@/components/admin/AdminRoute";
import NoHeaderFooterLayout from "@/components/layout/NoHeaderFooterLayout";

export default function Page() {
  return (
    <AdminRoute>
      <NoHeaderFooterLayout>
        <AdminContests />
      </NoHeaderFooterLayout>
    </AdminRoute>
  );
}
