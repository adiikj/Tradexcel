"use client";
import React, { Suspense } from 'react';
import EnterOTP from "@/components/auth/EnterOTP";

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen pt-10 flex text-black items-center justify-center text-xl">Loading OTP verification...</div>}>
      <EnterOTP />
    </Suspense>
  );
}
