import { Suspense } from "react";
import type { Metadata } from "next";
import EnterOTP from "@/components/auth/EnterOTP";

export const metadata: Metadata = {
  title: "Verify your email",
  robots: { index: false },
};

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen pt-10 flex text-black items-center justify-center text-xl">
          Loading OTP verification...
        </div>
      }
    >
      <EnterOTP />
    </Suspense>
  );
}
