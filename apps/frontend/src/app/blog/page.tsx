"use client";
import Blog from "@/components/blog/Blog";
import MainLayout from "@/components/layout/HeaderFooterLayout";

export default function Page() {
  return (
    <MainLayout footerBgColor={undefined as any}>
      <Blog />
    </MainLayout>
  );
}
