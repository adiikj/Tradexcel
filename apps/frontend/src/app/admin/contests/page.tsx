import type { Metadata } from "next";
import AdminContests from "@/components/admin/AdminContests";
import NoHeaderFooterLayout from "@/components/layout/NoHeaderFooterLayout";

export const metadata: Metadata = {
  title: "Admin - Contests",
};

export default function Page() {
  return (
    <NoHeaderFooterLayout>
      <AdminContests />
    </NoHeaderFooterLayout>
  );
}
