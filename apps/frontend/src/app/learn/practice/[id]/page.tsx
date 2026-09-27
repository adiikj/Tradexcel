import type { Metadata } from "next";
import PracticeRun from "@/components/learn/PracticeRun";
import NoHeaderFooterLayout from "@/components/layout/NoHeaderFooterLayout";

export const metadata: Metadata = {
  title: "Practice run",
  robots: { index: false },
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <NoHeaderFooterLayout>
      <PracticeRun id={id} />
    </NoHeaderFooterLayout>
  );
}
