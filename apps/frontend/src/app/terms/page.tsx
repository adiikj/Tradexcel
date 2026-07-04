"use client";
import Terms from "@/components/legal/Terms";
import MainLayout from "@/components/layout/HeaderFooterLayout";

export default function Page() {
  return (
    <MainLayout footerBgColor={undefined as any}>
      <Terms />
    </MainLayout>
  );
}
