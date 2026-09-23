import type { Metadata } from "next";
import Contact from "@/components/contact/Contact";
import MainLayout from "@/components/layout/HeaderFooterLayout";

export const metadata: Metadata = {
  title: "Contact us",
  description: "Get in touch with the Tradexcel team.",
};

export default function Page() {
  return (
    <MainLayout>
      <Contact />
    </MainLayout>
  );
}
