import type { Metadata } from "next";
import YourProfile from "@/components/dashboard/YourProfile";
import NoHeaderFooterLayout from "@/components/layout/NoHeaderFooterLayout";

export const metadata: Metadata = {
  title: "Your profile",
  description: "Manage your Tradexcel profile, avatar and credentials.",
  robots: { index: false },
};

export default function Page() {
  return (
    <NoHeaderFooterLayout>
      <YourProfile />
    </NoHeaderFooterLayout>
  );
}
