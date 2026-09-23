import type { Metadata } from "next";
import Wallet from "@/components/wallet/Wallet";
import NoHeaderFooterLayout from "@/components/layout/NoHeaderFooterLayout";

export const metadata: Metadata = {
  title: "Wallet",
  description: "Your virtual cash balance and transaction history.",
  robots: { index: false },
};

export default function Page() {
  return (
    <NoHeaderFooterLayout>
      <Wallet />
    </NoHeaderFooterLayout>
  );
}
