import type { Metadata } from "next";
import Privacy from "@/components/legal/Privacy";
import MainLayout from "@/components/layout/HeaderFooterLayout";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "How Tradexcel collects, uses and protects your data.",
};

export default function Page() {
  return (
    <MainLayout>
      <Privacy />
    </MainLayout>
  );
}
