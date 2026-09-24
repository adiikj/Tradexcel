import type { Metadata } from "next";
import ForgotPassword from "@/components/auth/ForgotPassword";
import MainLayout from "@/components/layout/HeaderFooterLayout";

export const metadata: Metadata = {
  title: "Reset your password",
  description: "Reset your Tradexcel password or PIN.",
  robots: { index: false },
};

export default function Page() {
  return (
    <MainLayout>
      <ForgotPassword />
    </MainLayout>
  );
}
