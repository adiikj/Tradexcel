"use client";
import SignIn from "@/components/auth/SignIn";
import MainLayout from "@/components/layout/HeaderFooterLayout";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Page() {
  const router = useRouter();
  useEffect(() => {
    if (Cookies.get("accessToken")) router.push("/dashboard");
  }, [router]);

  return (
    <MainLayout footerBgColor={undefined as any}>
        <SignIn />
      </MainLayout>
  );
}
