"use client";
import Wallet from "@/components/wallet/Wallet";
import NoHeaderFooterLayout from "@/components/layout/NoHeaderFooterLayout";
import AuthRoute from "@/components/routes/AuthRoute";

export default function Page() {
  return (
    <AuthRoute>
      <NoHeaderFooterLayout>
        <Wallet />
      </NoHeaderFooterLayout>
    </AuthRoute>
  );
}
