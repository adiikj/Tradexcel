import type { Metadata } from "next";
import Learn from "@/components/learn/Learn";
import NoHeaderFooterLayout from "@/components/layout/NoHeaderFooterLayout";

export const metadata: Metadata = {
  title: "Learn",
  description: "Quests that teach the basics, and replays of real market moments to practise on.",
  robots: { index: false },
};

export default function Page() {
  return (
    <NoHeaderFooterLayout>
      <Learn />
    </NoHeaderFooterLayout>
  );
}
