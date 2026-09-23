import type { Metadata } from "next";
import SignUp from "@/components/auth/SignUp";
import MainLayout from "@/components/layout/HeaderFooterLayout";

export const metadata: Metadata = {
  title: "Create your account",
  description: "Sign up for Tradexcel and get ₹1,00,000 in virtual cash to start trading.",
};

export default function Page() {
  return (
    <MainLayout>
      <SignUp />
    </MainLayout>
  );
}
