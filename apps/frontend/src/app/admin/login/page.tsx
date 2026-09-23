import type { Metadata } from "next";
import AdminLogin from "@/components/admin/AdminLogin";
import NoHeaderFooterLayout from "@/components/layout/NoHeaderFooterLayout";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false },
};

export default function Page() {
  return (
    <NoHeaderFooterLayout>
      <AdminLogin />
    </NoHeaderFooterLayout>
  );
}
