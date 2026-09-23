import type { Metadata } from "next";
import About from "@/components/about/About";
import MainLayout from "@/components/layout/HeaderFooterLayout";

export const metadata: Metadata = {
  title: "About",
  description: "The story behind Tradexcel, a gamified stock-trading simulator with virtual money.",
};

export default function Page() {
  return (
    <MainLayout>
      <About />
    </MainLayout>
  );
}
