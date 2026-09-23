import type { Metadata } from "next";
import News from "@/components/news/News";
import NoHeaderFooterLayout from "@/components/layout/NoHeaderFooterLayout";

export const metadata: Metadata = {
  title: "News",
  description: "Market news for the stocks you hold and watch.",
  robots: { index: false },
};

export default function Page() {
  return (
    <NoHeaderFooterLayout>
      <News />
    </NoHeaderFooterLayout>
  );
}
