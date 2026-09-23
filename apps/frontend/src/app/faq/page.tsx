import type { Metadata } from "next";
import Faq from "@/components/faq/Faq";
import NoHeaderFooterLayout from "@/components/layout/NoHeaderFooterLayout";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers to common questions about Tradexcel.",
  robots: { index: false },
};

export default function Page() {
  return (
    <NoHeaderFooterLayout>
      <Faq />
    </NoHeaderFooterLayout>
  );
}
