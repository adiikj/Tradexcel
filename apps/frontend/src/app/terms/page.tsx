import type { Metadata } from "next";
import Terms from "@/components/legal/Terms";
import MainLayout from "@/components/layout/HeaderFooterLayout";

export const metadata: Metadata = {
  title: "Terms of service",
  description: "The terms that govern your use of Tradexcel.",
};

export default function Page() {
  return (
    <MainLayout>
      <Terms />
    </MainLayout>
  );
}
