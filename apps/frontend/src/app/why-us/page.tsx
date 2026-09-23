import type { Metadata } from "next";
import WhyUs from "@/components/whyUs/WhyUs";
import MainLayout from "@/components/layout/HeaderFooterLayout";

export const metadata: Metadata = {
  title: "Why Tradexcel",
  description: "Why Tradexcel is the risk-free way to learn trading with real market prices.",
};

export default function Page() {
  return (
    <MainLayout>
      <WhyUs />
    </MainLayout>
  );
}
