"use client";
import Contact from "@/components/contact/Contact";
import MainLayout from "@/components/layout/HeaderFooterLayout";

export default function Page() {
  return (
    <MainLayout footerBgColor={undefined as any}>
      <Contact />
    </MainLayout>
  );
}
