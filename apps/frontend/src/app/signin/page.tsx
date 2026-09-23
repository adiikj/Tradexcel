import type { Metadata } from "next";
import SignIn from "@/components/auth/SignIn";
import MainLayout from "@/components/layout/HeaderFooterLayout";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Tradexcel account.",
};

export default function Page() {
  return (
    <MainLayout>
      <SignIn />
    </MainLayout>
  );
}
