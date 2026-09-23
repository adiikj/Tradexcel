import type { Metadata } from "next";
import Achievements from "@/components/achievements/Achievements";
import NoHeaderFooterLayout from "@/components/layout/NoHeaderFooterLayout";

export const metadata: Metadata = {
  title: "Achievements",
  description: "Your earned badges and progress.",
  robots: { index: false },
};

export default function Page() {
  return (
    <NoHeaderFooterLayout>
      <Achievements />
    </NoHeaderFooterLayout>
  );
}
