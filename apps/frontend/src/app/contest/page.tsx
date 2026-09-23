import type { Metadata } from "next";
import Contest from "@/components/contest/Contest";
import NoHeaderFooterLayout from "@/components/layout/NoHeaderFooterLayout";

export const metadata: Metadata = {
  title: "Contests",
  description: "Join public contests or create private leagues.",
  robots: { index: false },
};

export default function Page() {
  return (
    <NoHeaderFooterLayout>
      <Contest />
    </NoHeaderFooterLayout>
  );
}
