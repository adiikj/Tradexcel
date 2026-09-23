import type { Metadata } from "next";
import NotFound from "@/components/error/NotFound";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false },
};

export default function NotFoundPage() {
  return <NotFound />;
}
