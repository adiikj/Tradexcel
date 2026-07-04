"use client";
import HowItWorks from "@/components/howItWorks/HowItWorks";
import MainLayout from "@/components/layout/HeaderFooterLayout";

export default function Page() {
  return (
    <MainLayout footerBgColor={undefined as any}>
      <HowItWorks />
    </MainLayout>
  );
}
