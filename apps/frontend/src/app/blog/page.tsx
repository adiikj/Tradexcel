import type { Metadata } from "next";
import Blog from "@/components/blog/Blog";
import MainLayout from "@/components/layout/HeaderFooterLayout";

export const metadata: Metadata = {
  title: "Blog",
  description: "Guides and articles on investing, trading basics and getting the most out of Tradexcel.",
};

export default function Page() {
  return (
    <MainLayout>
      <Blog />
    </MainLayout>
  );
}
