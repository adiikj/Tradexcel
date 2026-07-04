"use client";
import About from "@/components/about/About";
import MainLayout from "@/components/layout/HeaderFooterLayout";

export default function Page() {
  return (
    <MainLayout footerBgColor={undefined as any}>
      <About />
    </MainLayout>
  );
}
